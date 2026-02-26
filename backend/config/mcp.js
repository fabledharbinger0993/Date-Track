/**
 * Model Context Protocol (MCP) Server Configuration
 * Connects external services for enhanced AI context and integrations
 */

module.exports = {
  servers: {
    // PostgreSQL MCP Server - Direct database access
    postgres: {
      enabled: true,
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-postgres',
        process.env.DATABASE_URL || 'postgresql://datetrack:development@db:5432/datetrack'
      ],
      env: {
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://datetrack:development@db:5432/datetrack',
      },
      description: 'Database access for event queries and management'
    },

    // Filesystem MCP Server - File operations for exports/imports
    filesystem: {
      enabled: true,
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        process.env.MCP_FILESYSTEM_PATH || '/app/data'
      ],
      env: {
        ALLOWED_DIRECTORIES: process.env.MCP_FILESYSTEM_PATH || '/app/data'
      },
      description: 'File access for .ics import/export and backups'
    },

    // Google Calendar MCP Server - Direct calendar API access
    googleCalendar: {
      enabled: !!process.env.GOOGLE_CLIENT_ID,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-google-calendar'],
      env: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      },
      description: 'Google Calendar integration for event sync',
      requiresAuth: true
    },

    // Gmail MCP Server - Email parsing for event extraction
    gmail: {
      enabled: !!process.env.GOOGLE_CLIENT_ID,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-gmail'],
      env: {
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
      },
      description: 'Gmail access for email-based event extraction',
      requiresAuth: true
    },

    // Microsoft Graph MCP Server - Outlook calendar and email
    microsoftGraph: {
      enabled: !!process.env.MICROSOFT_CLIENT_ID,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-microsoft-graph'],
      env: {
        MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID,
        MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET,
      },
      description: 'Microsoft Outlook calendar and email integration',
      requiresAuth: true
    },

    // Slack MCP Server - Notifications and reminders (optional)
    slack: {
      enabled: !!process.env.SLACK_BOT_TOKEN,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-slack'],
      env: {
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
        SLACK_TEAM_ID: process.env.SLACK_TEAM_ID,
      },
      description: 'Slack notifications for event reminders',
      requiresAuth: true
    },

    // GitHub MCP Server - Development workflow integration (optional)
    github: {
      enabled: !!process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-github'],
      env: {
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
      },
      description: 'GitHub integration for project deadlines and milestones',
      requiresAuth: true
    }
  },

  // Global MCP settings
  settings: {
    autoStart: true,
    retryAttempts: 3,
    retryDelay: 5000,
    healthCheckInterval: 60000, // 1 minute
    logLevel: process.env.MCP_LOG_LEVEL || 'info'
  }
};
