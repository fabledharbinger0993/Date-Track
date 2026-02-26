/**
 * OpenClaw AI Service - Local, lightweight AI for event parsing
 * OpenClaw runs as a separate server process and provides HTTP API
 */

const axios = require('axios');

class OpenClawService {
  constructor() {
    this.baseUrl = process.env.OPENCLAW_URL || 'http://localhost:7777';
    this.enabled = false;
    
    // Check if OpenClaw server is running
    this.checkAvailability();
  }
  
  async checkAvailability() {
    try {
      // Ping OpenClaw server health endpoint
      const response = await axios.get(`${this.baseUrl}/health`, {
        timeout: 2000
      });
      
      if (response.status === 200) {
        this.enabled = true;
        console.log(`✓ OpenClaw AI server running at ${this.baseUrl}`);
        console.log('  Fast, lightweight local AI for event parsing');
      }
    } catch (error) {
      console.warn('⚠ OpenClaw server not running.');
      console.warn(`  Start server: wsl ~/openclaw/start.sh`);
      console.warn('  Or set OPENCLAW_URL in .env');
      console.warn('  Falling back to Ollama or chrono-node');
      this.enabled = false;
    }
  }
  
  /**
   * Parse event from natural language using OpenClaw
   * @param {string} text - User input like "Dentist tomorrow at 2pm"
   * @returns {Promise<Object>} - Parsed event data
   */
  async parseEvent(text) {
    if (!this.enabled) {
      throw new Error('OpenClaw not available');
    }
    
    try {
      const prompt = `Parse this into a calendar event JSON with fields: title, date (YYYY-MM-DD), time (HH:MM), location, description.

Text: "${text}"

Return only the JSON object:`;
      
      // Call OpenClaw API - adjust endpoint based on actual API
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.3,
        stop: ['\n\n']
      }, {
        timeout: 10000
      });
      
      // Extract JSON from response
      const result = response.data.text || response.data.response || response.data;
      const jsonMatch = typeof result === 'string' ? result.match(/\{[\s\S]*\}/) : null;
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          aiParsed: true,
          engine: 'openclaw',
          confidence: 'medium'
        };
      }
      
      throw new Error('No valid JSON in OpenClaw response');
      
    } catch (error) {
      console.error('OpenClaw parsing failed:', error.message);
      throw error;
    }
  }
      const jsonMatch = response.text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          ...parsed,
          aiParsed: true,
          engine: 'openclaw',
          confidence: 'high'
        };
      }
      
      throw new Error('No valid JSON in response');
      
    } catch (error) {
      console.error('OpenClaw parsing error:', error.message);
      throw error;
    }
  }
  
  /**
   * Scan events for conflicts and patterns
   * @param {Array} events - List of events
   * @returns {Promise<Object>} - Analysis
   */
  async scanEvents(events) {
    if (!this.enabled) {
      throw new Error('OpenClaw not available');
    }
    
    try {
      const eventSummary = events.slice(0, 30).map(e => 
        `- ${e.title} on ${e.date} at ${e.time || 'all day'}`
      ).join('\n');
      
      const prompt = `Analyze these calendar events. List any conflicts (overlapping times), unusual patterns, and give 2-3 suggestions.\n\nEvents:\n${eventSummary}\n\nAnalysis:`;
      
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        prompt: prompt,
        max_tokens: 300,
        temperature: 0.5
      }, {
        timeout: 15000
      });
      
      const result = response.data.text || response.data.response || response.data;
      
      return {
        analysis: typeof result === 'string' ? result.trim() : JSON.stringify(result),
        scanned: events.length,
        engine: 'openclaw',
        aiGenerated: true
      };
      
    } catch (error) {
      console.error('OpenClaw scan error:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate conversational reply
   * @param {string} message - User's message
   * @param {Object} context - Context (events, date, etc.)
   * @returns {Promise<string>} - AI reply
   */
  async chat(message, context = {}) {
    if (!this.enabled) {
      throw new Error('OpenClaw not available');
    }
    
    try {
      let contextStr = 'You are a helpful calendar assistant. Keep responses brief (2-3 sentences).';
      
      if (context.upcomingEvents) {
        contextStr += `\nUpcoming: ${context.upcomingEvents.map(e => e.title).join(', ')}`;
      }
      if (context.todayEvents) {
        contextStr += `\nToday: ${context.todayEvents.length} events`;
      }
      
      const prompt = `${contextStr}\n\nUser: ${message}\nAssistant:`;
      
      const response = await axios.post(`${this.baseUrl}/api/generate`, {
        prompt: prompt,
        max_tokens: 100,
        temperature: 0.7,
        stop: ['\nUser:', '\n\n']
      }, {
        timeout: 10000
      });
      
      const result = response.data.text || response.data.response || response.data;
      return typeof result === 'string' ? result.trim() : JSON.stringify(result);
      
    } catch (error) {
      console.error('OpenClaw chat error:', error.message);
      throw error;
    }
  }
  
  /**
   * Check if OpenClaw is ready
   * @returns {boolean}
   */
  isAvailable() {
    return this.enabled;
  }
  
  /**
   * Get status info
   * @returns {Object}
   */
  getStatus() {
    return {
      enabled: this.enabled,
      engine: 'OpenClaw',
      url: this.baseUrl,
      local: true,
      cost: 0,
      note: 'Optional - Falls back to Ollama automatically'
    };
  }
}

// Singleton
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new OpenClawService();
    }
    return instance;
  },
  OpenClawService
};
