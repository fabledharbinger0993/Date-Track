/**
 * MCP (Model Context Protocol) Service Manager
 * Initializes and manages MCP server connections for enhanced AI context
 */

const { spawn } = require('child_process');
const mcpConfig = require('../config/mcp');

class MCPService {
  constructor() {
    this.servers = new Map();
    this.status = new Map();
    this.retryTimers = new Map();
  }

  /**
   * Initialize all enabled MCP servers
   */
  async initialize() {
    console.log('🔌 Initializing MCP (Model Context Protocol) servers...');
    
    const enabledServers = Object.entries(mcpConfig.servers)
      .filter(([_, config]) => config.enabled);

    if (enabledServers.length === 0) {
      console.log('ℹ️  No MCP servers enabled. Skipping MCP initialization.');
      return;
    }

    const results = await Promise.allSettled(
      enabledServers.map(([name, config]) => this.startServer(name, config))
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✓ MCP initialization complete: ${successful} started, ${failed} failed`);

    // Start health check monitoring
    if (mcpConfig.settings.healthCheckInterval > 0) {
      this.startHealthChecks();
    }
  }

  /**
   * Start a single MCP server
   * @param {string} name - Server name
   * @param {object} config - Server configuration
   */
  async startServer(name, config) {
    return new Promise((resolve, reject) => {
      try {
        console.log(`  Starting MCP server: ${name}...`);

        // Check if server requires authentication
        if (config.requiresAuth && !this.hasRequiredAuth(config)) {
          console.log(`  ⚠ Skipping ${name}: Missing authentication credentials`);
          this.status.set(name, { status: 'disabled', reason: 'missing_auth' });
          resolve({ name, status: 'skipped' });
          return;
        }

        const process = spawn(config.command, config.args, {
          env: { ...process.env, ...config.env },
          stdio: ['pipe', 'pipe', 'pipe']
        });

        // Store process reference
        this.servers.set(name, {
          process,
          config,
          startTime: Date.now()
        });

        // Handle stdout
        process.stdout.on('data', (data) => {
          if (mcpConfig.settings.logLevel === 'debug') {
            console.log(`[MCP:${name}] ${data.toString().trim()}`);
          }
        });

        // Handle stderr
        process.stderr.on('data', (data) => {
          const message = data.toString().trim();
          if (message && !message.includes('ExperimentalWarning')) {
            console.error(`[MCP:${name}] ${message}`);
          }
        });

        // Handle process errors
        process.on('error', (error) => {
          console.error(`✗ MCP server ${name} error:`, error.message);
          this.status.set(name, { status: 'error', error: error.message });
          this.scheduleRestart(name, config);
        });

        // Handle process exit
        process.on('exit', (code, signal) => {
          if (code !== 0 && code !== null) {
            console.error(`✗ MCP server ${name} exited with code ${code}`);
            this.status.set(name, { status: 'stopped', exitCode: code });
            this.scheduleRestart(name, config);
          }
        });

        // Give it a moment to start
        setTimeout(() => {
          if (!process.killed) {
            console.log(`  ✓ ${name} started (${config.description})`);
            this.status.set(name, { status: 'running', startTime: Date.now() });
            resolve({ name, status: 'running' });
          } else {
            reject(new Error(`Failed to start ${name}`));
          }
        }, 2000);

      } catch (error) {
        console.error(`✗ Failed to start MCP server ${name}:`, error.message);
        this.status.set(name, { status: 'failed', error: error.message });
        reject(error);
      }
    });
  }

  /**
   * Check if server has required authentication
   * @param {object} config - Server configuration
   * @returns {boolean}
   */
  hasRequiredAuth(config) {
    if (!config.env) return true;

    const requiredKeys = Object.keys(config.env).filter(key => 
      key.includes('CLIENT_ID') || 
      key.includes('CLIENT_SECRET') || 
      key.includes('TOKEN') ||
      key.includes('KEY')
    );

    return requiredKeys.every(key => config.env[key]);
  }

  /**
   * Schedule server restart after failure
   * @param {string} name - Server name
   * @param {object} config - Server configuration
   */
  scheduleRestart(name, config) {
    const existingTimer = this.retryTimers.get(name);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      console.log(`↻ Attempting to restart MCP server: ${name}`);
      this.startServer(name, config).catch(err => {
        console.error(`Failed to restart ${name}:`, err.message);
      });
    }, mcpConfig.settings.retryDelay);

    this.retryTimers.set(name, timer);
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks() {
    setInterval(() => {
      for (const [name, server] of this.servers.entries()) {
        const status = this.status.get(name);
        
        if (status?.status === 'running') {
          // Check if process is still alive
          if (server.process.killed || server.process.exitCode !== null) {
            console.warn(`⚠ MCP server ${name} is no longer running`);
            this.status.set(name, { status: 'stopped' });
            this.scheduleRestart(name, server.config);
          }
        }
      }
    }, mcpConfig.settings.healthCheckInterval);
  }

  /**
   * Get status of all MCP servers
   * @returns {object}
   */
  getStatus() {
    const status = {};
    for (const [name, state] of this.status.entries()) {
      status[name] = {
        ...state,
        config: mcpConfig.servers[name]?.description || 'No description'
      };
    }
    return status;
  }

  /**
   * Stop a specific MCP server
   * @param {string} name - Server name
   */
  async stopServer(name) {
    const server = this.servers.get(name);
    if (!server) {
      throw new Error(`MCP server ${name} not found`);
    }

    return new Promise((resolve) => {
      if (server.process.killed) {
        resolve();
        return;
      }

      server.process.once('exit', () => {
        this.servers.delete(name);
        this.status.set(name, { status: 'stopped' });
        console.log(`✓ MCP server ${name} stopped`);
        resolve();
      });

      server.process.kill('SIGTERM');

      // Force kill after 5 seconds if not stopped
      setTimeout(() => {
        if (!server.process.killed) {
          server.process.kill('SIGKILL');
        }
      }, 5000);
    });
  }

  /**
   * Stop all MCP servers
   */
  async shutdown() {
    console.log('🔌 Shutting down MCP servers...');
    
    // Clear retry timers
    for (const timer of this.retryTimers.values()) {
      clearTimeout(timer);
    }

    // Stop all servers
    const shutdownPromises = Array.from(this.servers.keys()).map(name => 
      this.stopServer(name).catch(err => {
        console.error(`Error stopping ${name}:`, err.message);
      })
    );

    await Promise.all(shutdownPromises);
    console.log('✓ All MCP servers shut down');
  }

  /**
   * Restart a specific MCP server
   * @param {string} name - Server name
   */
  async restartServer(name) {
    const config = mcpConfig.servers[name];
    if (!config) {
      throw new Error(`MCP server ${name} not found in configuration`);
    }

    await this.stopServer(name);
    await this.startServer(name, config);
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new MCPService();
    }
    return instance;
  }
};
