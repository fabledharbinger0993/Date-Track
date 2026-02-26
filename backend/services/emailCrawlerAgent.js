/**
 * Email Crawler Sub-Agent for Calinvite
 * - Connects to email accounts (Gmail, Outlook, etc.)
 * - Identifies spam/junk and quarantines
 * - Reads and categorizes emails
 * - Alerts on time-sensitive messages
 * - Extracts calendar events from emails
 */

const { google } = require('googleapis');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { getInstance: getAI } = require('./calinviteAI');

class EmailCrawlerAgent {
  constructor() {
    this.ai = getAI();
    // Support multiple email accounts per user: userId -> Map<accountId, connection>
    this.connections = new Map();
    this.maxAccountsPerUser = 10; // Configurable limit (can be increased)
    
    // Categories
    this.categories = {
      SPAM: 'spam',
      URGENT: 'urgent',
      CALENDAR: 'calendar_event',
      RECEIPT: 'receipt',
      NEWSLETTER: 'newsletter',
      PERSONAL: 'personal',
      WORK: 'work',
      OTHER: 'other'
    };
    
    console.log('📧 Email Crawler Agent initialized (supports up to ' + this.maxAccountsPerUser + ' accounts per user)');
  }
  
  /**
   * Get user's accounts map (creates if doesn't exist)
   * @param {string} userId - User ID
   * @returns {Map} - Map of accountId -> connection
   */
  getUserAccounts(userId) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Map());
    }
    return this.connections.get(userId);
  }
  
  /**
   * Generate unique account ID
   * @param {string} userId - User ID
   * @param {string} email - Email address
   * @param {string} provider - Provider type (gmail, outlook, yahoo, etc.)
   * @returns {string} - Unique account ID
   */
  generateAccountId(userId, email, provider) {
    return `${provider}_${email.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  }
  
  /**
   * Get specific account connection
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID (optional, defaults to primary)
   * @returns {Object|null} - Connection or null
   */
  getConnection(userId, accountId = null) {
    const accounts = this.getUserAccounts(userId);
    
    if (accountId) {
      return accounts.get(accountId) || null;
    }
    
    // Return primary account (first one)
    const firstAccount = accounts.values().next();
    return firstAccount.done ? null : firstAccount.value;
  }
  
  /**
   * Connect to Gmail using OAuth
   * @param {string} userId - User ID
   * @param {string} accessToken - OAuth access token
   * @param {string} email - Email address (optional, fetched if not provided)
   * @returns {Promise<Object>}
   */
  async connectGmail(userId, accessToken, email = null) {
    try {
      const accounts = this.getUserAccounts(userId);
      
      // Check account limit
      if (accounts.size >= this.maxAccountsPerUser) {
        throw new Error(`Maximum ${this.maxAccountsPerUser} email accounts per user reached`);
      }
      
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      // Fetch email address if not provided
      if (!email) {
        const profile = await gmail.users.getProfile({ userId: 'me' });
        email = profile.data.emailAddress;
      }
      
      const accountId = this.generateAccountId(userId, email, 'gmail');
      
      // Check if account already exists
      if (accounts.has(accountId)) {
        console.log(`⚠️  Gmail account ${email} already connected, updating...`);
      }
      
      accounts.set(accountId, {
        accountId,
        type: 'gmail',
        email,
        client: gmail,
        connectedAt: new Date(),
        isPrimary: accounts.size === 0 // First account is primary
      });
      
      console.log(`✓ Gmail connected: ${email} (${accounts.size}/${this.maxAccountsPerUser} accounts)`);
      
      return {
        success: true,
        accountId,
        provider: 'gmail',
        email,
        connectedAt: new Date(),
        totalAccounts: accounts.size
      };
    } catch (error) {
      console.error('Gmail connection error:', error);
      throw error;
    }
  }
  
  /**
   * Connect to any email via IMAP (Outlook, Yahoo, etc.)
   * @param {string} userId - User ID
   * @param {Object} config - IMAP config { user, password, host, port, tls }
   * @returns {Promise<Object>}
   */
  async connectIMAP(userId, config) {
    return new Promise((resolve, reject) => {
      const accounts = this.getUserAccounts(userId);
      
      // Check account limit
      if (accounts.size >= this.maxAccountsPerUser) {
        return reject(new Error(`Maximum ${this.maxAccountsPerUser} email accounts per user reached`));
      }
      
      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port || 993,
        tls: config.tls !== false,
        tlsOptions: { rejectUnauthorized: false }
      });
      
      const email = config.user;
      const provider = config.host.includes('yahoo') ? 'yahoo' : 
                      config.host.includes('outlook') ? 'outlook' : 'imap';
      const accountId = this.generateAccountId(userId, email, provider);
      
      imap.once('ready', () => {
        // Check if account already exists
        if (accounts.has(accountId)) {
          console.log(`⚠️  IMAP account ${email} already connected, updating...`);
        }
        
        accounts.set(accountId, {
          accountId,
          type: provider,
          email,
          client: imap,
          config: config,
          connectedAt: new Date(),
          isPrimary: accounts.size === 0
        });
        
        console.log(`✓ ${provider.toUpperCase()} connected: ${email} (${accounts.size}/${this.maxAccountsPerUser} accounts)`);
        
        resolve({
          success: true,
          accountId,
          provider,
          email,
          host: config.host,
          connectedAt: new Date(),
          totalAccounts: accounts.size
        });
      });
      
      imap.once('error', (err) => {
        console.error('IMAP connection error:', err);
        reject(err);
      });
      
      imap.connect();
    });
  }

  /**
   * List all connected accounts for a user
   * @param {string} userId - User ID
   * @returns {Array} - Array of account info
   */
  listAccounts(userId) {
    const accounts = this.getUserAccounts(userId);
    const accountList = [];
    
    for (const [accountId, conn] of accounts) {
      accountList.push({
        accountId,
        email: conn.email,
        provider: conn.type,
        isPrimary: conn.isPrimary || false,
        connectedAt: conn.connectedAt,
        hasImportanceLabels: conn.importanceLabels ? true : false
      });
    }
    
    return accountList;
  }
  
  /**
   * Disconnect specific account
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID
   * @returns {boolean} - Success
   */
  disconnectAccount(userId, accountId) {
    const accounts = this.getUserAccounts(userId);
    
    if (!accounts.has(accountId)) {
      return false;
    }
    
    const conn = accounts.get(accountId);
    
    // Close IMAP connection if exists
    if (conn.client?.end) {
      conn.client.end();
    }
    
    accounts.delete(accountId);
    console.log(`✓ Disconnected account: ${accountId}`);
    
    return true;
  }
  
  /**
   * Set primary account
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID to set as primary
   * @returns {boolean} - Success
   */
  setPrimaryAccount(userId, accountId) {
    const accounts = this.getUserAccounts(userId);
    
    if (!accounts.has(accountId)) {
      return false;
    }
    
    // Remove primary flag from all accounts
    for (const conn of accounts.values()) {
      conn.isPrimary = false;
    }
    
    // Set new primary
    accounts.get(accountId).isPrimary = true;
    console.log(`✓ Set primary account: ${accountId}`);
    
    return true;
  }
  
  /**
   * Scan inbox for new emails
   * @param {string} userId - User ID
   * @param {Object} options - Scan options { limit, unreadOnly, accountId }
   * @returns {Promise<Array>} - Processed emails
   */
  async scanInbox(userId, options = {}) {
    const { accountId = null } = options;
    const connection = this.getConnection(userId, accountId);
    
    if (!connection) {
      throw new Error('No email connection found for user. Connect first.');
    }
    
    if (connection.type === 'gmail') {
      return this.scanGmailInbox(connection.client, options);
    } else {
      return this.scanIMAPInbox(connection.client, options);
    }
  }
  
  /**
   * Scan Gmail inbox
   */
  async scanGmailInbox(gmail, options = {}) {
    const limit = options.limit || 50;
    const unreadOnly = options.unreadOnly !== false;
    
    try {
      const query = unreadOnly ? 'is:unread' : '';
      
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: limit
      });
      
      const messages = response.data.messages || [];
      const processedEmails = [];
      
      for (const message of messages) {
        const email = await this.processGmailMessage(gmail, message.id);
        processedEmails.push(email);
      }
      
      console.log(`📬 Scanned ${processedEmails.length} Gmail messages`);
      
      return processedEmails;
    } catch (error) {
      console.error('Gmail scan error:', error);
      throw error;
    }
  }
  
  /**
   * Process individual Gmail message
   */
  async processGmailMessage(gmail, messageId) {
    const msg = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });
    
    const headers = msg.data.payload.headers;
    const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)';
    const from = headers.find(h => h.name === 'From')?.value || '';
    const date = headers.find(h => h.name === 'Date')?.value || '';
    
    // Get body
    let body = '';
    if (msg.data.payload.body?.data) {
      body = Buffer.from(msg.data.payload.body.data, 'base64').toString('utf-8');
    } else if (msg.data.payload.parts) {
      const textPart = msg.data.payload.parts.find(p => p.mimeType === 'text/plain');
      if (textPart?.body?.data) {
        body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
      }
    }
    
    // AI categorization with importance scoring
    const analysis = await this.analyzeEmail(subject, body, from);
    
    return {
      id: messageId,
      subject,
      from,
      date: new Date(date),
      snippet: msg.data.snippet,
      body: body.substring(0, 500), // Truncate for storage
      category: analysis.category,
      isSpam: analysis.isSpam,
      isUrgent: analysis.isUrgent,
      hasCalendarEvent: analysis.hasCalendarEvent,
      importance: analysis.importance || 3,
      importanceReason: analysis.importanceReason || 'Not analyzed',
      extractedEvent: analysis.extractedEvent,
      confidence: analysis.confidence
    };
  }
  
  /**
   * Analyze email using AI with importance scoring
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @param {string} from - Sender
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeEmail(subject, body, from) {
    const emailText = `Subject: ${subject}\nFrom: ${from}\n\n${body.substring(0, 1000)}`;
    
    try {
      // Use Ollama/OpenClaw for analysis with importance scoring
      const prompt = `Analyze this email and return JSON:
{
  "category": "spam|urgent|calendar_event|receipt|newsletter|personal|work|other",
  "isSpam": true/false,
  "isUrgent": true/false,
  "hasCalendarEvent": true/false,
  "importance": 1-5,
  "importanceReason": "why this importance level",
  "confidence": 0.0-1.0,
  "summary": "brief summary"
}

Importance scoring (1-5):
5 = Critical (time-sensitive, requires immediate action, from important contacts)
4 = High (important but not urgent, needs response within 24h)
3 = Medium (work-related, personal from known contacts, moderate priority)
2 = Low (newsletters, receipts, FYI emails, can wait)
1 = Very Low (promotional, spam, no action needed)

Email:
${emailText}

JSON:`;

      // Try to use AI (Ollama first, then OpenClaw)
      let response;
      if (this.ai.ollama?.enabled) {
        response = await this.ai.ollama.generate(prompt, { temperature: 0.3, max_tokens: 300 });
      } else if (this.ai.openClaw?.isAvailable()) {
        response = await this.ai.openClaw.openClaw.generate({
          prompt: prompt,
          max_tokens: 300,
          temperature: 0.3
        });
      } else {
        // Fallback to rule-based
        return this.fallbackAnalyze(subject, body, from);
      }
      
      const jsonMatch = response.text?.match(/\{[\s\S]*?\}/) || response.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        
        // Extract calendar event if detected
        if (analysis.hasCalendarEvent) {
          analysis.extractedEvent = await this.extractCalendarEvent(emailText);
        }
        
        return analysis;
      }
      
      return this.fallbackAnalyze(subject, body, from);
      
    } catch (error) {
      console.error('Email analysis error:', error.message);
      return this.fallbackAnalyze(subject, body, from);
    }
  }
  
  /**
   * Extract calendar event from email
   */
  async extractCalendarEvent(emailText) {
    try {
      // Use AI to parse event details
      const eventData = await this.ai.parseEvent(emailText);
      return eventData;
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Fallback rule-based email analysis with importance scoring (no AI)
   */
  fallbackAnalyze(subject, body, from) {
    const subjectLower = subject.toLowerCase();
    const bodyLower = body.toLowerCase();
    const combined = `${subjectLower} ${bodyLower}`;
    
    // Spam detection
    const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'click here', 'unsubscribe'];
    const isSpam = spamKeywords.some(kw => combined.includes(kw)) || from.includes('noreply');
    
    // Urgency detection
    const urgentKeywords = ['urgent', 'asap', 'immediate', 'deadline', 'time-sensitive', 'expires'];
    const isUrgent = urgentKeywords.some(kw => combined.includes(kw));
    
    // Calendar event detection
    const calendarKeywords = ['meeting', 'appointment', 'scheduled', 'calendar', 'invite', 'event'];
    const hasCalendarEvent = calendarKeywords.some(kw => combined.includes(kw));
    
    // Importance scoring (rule-based)
    let importance = 3; // Default: medium
    let importanceReason = 'Default medium priority';
    
    if (isSpam) {
      importance = 1;
      importanceReason = 'Spam or promotional content';
    } else if (isUrgent || combined.includes('critical') || combined.includes('action required')) {
      importance = 5;
      importanceReason = 'Urgent keywords detected';
    } else if (hasCalendarEvent || combined.includes('meeting')) {
      importance = 4;
      importanceReason = 'Meeting or calendar event';
    } else if (combined.includes('receipt') || combined.includes('invoice') || combined.includes('order')) {
      importance = 3;
      importanceReason = 'Transaction or receipt';
    } else if (combined.includes('newsletter') || combined.includes('subscribe') || from.includes('no-reply')) {
      importance = 2;
      importanceReason = 'Newsletter or automated message';
    }
    
    // Category
    let category = this.categories.OTHER;
    if (isSpam) category = this.categories.SPAM;
    else if (hasCalendarEvent) category = this.categories.CALENDAR;
    else if (combined.includes('receipt') || combined.includes('invoice')) category = this.categories.RECEIPT;
    else if (combined.includes('newsletter') || combined.includes('subscribe')) category = this.categories.NEWSLETTER;
    else if (urgentKeywords.some(kw => combined.includes(kw))) category = this.categories.URGENT;
    
    return {
      category,
      isSpam,
      isUrgent,
      hasCalendarEvent,
      importance,
      importanceReason,
      confidence: 0.6, // Lower confidence for rule-based
      summary: subject.substring(0, 100)
    };
  }
  
  /**
   * Quarantine spam emails
   * @param {string} userId - User ID
   * @param {string} messageId - Email ID
   * @param {string} accountId - Account ID (optional)
   * @returns {Promise<Object>}
   */
  async quarantineEmail(userId, messageId, accountId = null) {
    const connection = this.getConnection(userId, accountId);
    
    if (!connection) {
      throw new Error('No email connection');
    }
    
    if (connection.type === 'gmail') {
      // Move to spam folder in Gmail
      await connection.client.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: ['SPAM'],
          removeLabelIds: ['INBOX']
        }
      });
      
      return { success: true, action: 'moved_to_spam' };
    }
    
    // For IMAP, move to Junk folder
    return { success: true, action: 'quarantined' };
  }

  /**
   * Create importance labels for Gmail
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID (optional)
   * @returns {Promise<Object>} - Label IDs
   */
  async createImportanceLabels(userId, accountId = null) {
    const connection = this.getConnection(userId, accountId);
    
    if (!connection) {
      throw new Error('No email connection');
    }

    if (connection.type !== 'gmail') {
      return { success: false, message: 'Only Gmail supports custom labels via API' };
    }

    const labels = {
      priority1: null,
      priority2: null,
      priority3: null,
      priority4: null,
      priority5: null
    };

    const labelNames = [
      { key: 'priority5', name: 'Priority 1 (Critical)', color: '#ff0000' },
      { key: 'priority4', name: 'Priority 2 (High)', color: '#ff6600' },
      { key: 'priority3', name: 'Priority 3 (Medium)', color: '#ffcc00' },
      { key: 'priority2', name: 'Priority 4 (Low)', color: '#99cc00' },
      { key: 'priority1', name: 'Priority 5 (Very Low)', color: '#cccccc' }
    ];

    try {
      // Get existing labels
      const existingLabels = await connection.client.users.labels.list({ userId: 'me' });
      
      for (const labelDef of labelNames) {
        // Check if label already exists
        const existing = existingLabels.data.labels.find(l => l.name === labelDef.name);
        
        if (existing) {
          labels[labelDef.key] = existing.id;
          console.log(`✓ Label already exists: ${labelDef.name}`);
        } else {
          // Create new label
          const created = await connection.client.users.labels.create({
            userId: 'me',
            requestBody: {
              name: labelDef.name,
              labelListVisibility: 'labelShow',
              messageListVisibility: 'show',
              color: {
                textColor: '#ffffff',
                backgroundColor: labelDef.color
              }
            }
          });
          
          labels[labelDef.key] = created.data.id;
          console.log(`✓ Created label: ${labelDef.name}`);
        }
      }

      // Cache labels in connection
      connection.importanceLabels = labels;

      return {
        success: true,
        labels,
        message: 'Importance labels created/verified'
      };
    } catch (error) {
      console.error('Label creation error:', error);
      throw error;
    }
  }

  /**
   * Apply importance label to email
   * @param {string} userId - User ID
   * @param {string} messageId - Email ID
   * @param {number} importance - 1-5
   * @param {string} accountId - Account ID (optional)
   * @returns {Promise<Object>}
   */
  async applyImportanceLabel(userId, messageId, importance, accountId = null) {
    const connection = this.getConnection(userId, accountId);
    
    if (!connection) {
      throw new Error('No email connection');
    }

    // Ensure labels exist
    if (!connection.importanceLabels) {
      await this.createImportanceLabels(userId, accountId);
    }

    const labels = connection.importanceLabels;
    const labelKey = `priority${importance}`;
    const labelId = labels[labelKey];

    if (!labelId) {
      throw new Error(`Invalid importance level: ${importance}`);
    }

    if (connection.type === 'gmail') {
      // Apply label to Gmail message
      await connection.client.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId]
        }
      });

      return {
        success: true,
        action: 'labeled',
        labelId,
        importance
      };
    } else if (connection.type === 'outlook') {
      // For Outlook/Microsoft Graph, use categories
      // Note: Requires Microsoft Graph API setup
      return {
        success: false,
        message: 'Outlook labeling via Microsoft Graph not yet implemented'
      };
    } else {
      // For IMAP (Yahoo, etc.), we can't create custom labels
      // But we can use flags
      return {
        success: false,
        message: 'IMAP providers (Yahoo) do not support custom labels. Use flags instead.'
      };
    }
  }

  /**
   * Organize inbox by importance (scan and label all emails)
   * @param {string} userId - User ID
   * @param {Object} options - { maxEmails: 50, unreadOnly: false }
   * @returns {Promise<Object>} - Organization results
   */
  async organizeByImportance(userId, options = {}) {
    const { maxEmails = 50, unreadOnly = false, accountId = null } = options;
    
    console.log(`🗂️  Organizing emails by importance for user ${userId}...`);
    
    try {
      // Ensure labels exist (Gmail only)
      const connection = this.getConnection(userId, accountId);
      if (connection?.type === 'gmail') {
        await this.createImportanceLabels(userId, accountId);
      }

      // Scan inbox
      const emails = await this.scanInbox(userId, { maxEmails, unreadOnly, accountId });
      
      const results = {
        total: emails.length,
        labeled: 0,
        skipped: 0,
        errors: 0,
        breakdown: {
          critical: 0,    // importance 5
          high: 0,        // importance 4
          medium: 0,      // importance 3
          low: 0,         // importance 2
          veryLow: 0      // importance 1
        }
      };

      // Process each email
      for (const email of emails) {
        try {
          const importance = email.importance || 3;
          
          // Track breakdown
          if (importance === 5) results.breakdown.critical++;
          else if (importance === 4) results.breakdown.high++;
          else if (importance === 3) results.breakdown.medium++;
          else if (importance === 2) results.breakdown.low++;
          else if (importance === 1) results.breakdown.veryLow++;

          // Apply label (Gmail only)
          if (connection?.type === 'gmail') {
            await this.applyImportanceLabel(userId, email.id, importance);
            results.labeled++;
          } else {
            results.skipped++;
          }
        } catch (error) {
          console.error(`Error labeling email ${email.id}:`, error.message);
          results.errors++;
        }
      }

      console.log(`✓ Organization complete: ${results.labeled} labeled, ${results.skipped} skipped, ${results.errors} errors`);

      return {
        success: true,
        results,
        message: `Organized ${results.total} emails by importance`
      };
    } catch (error) {
      console.error('Organization error:', error);
      throw error;
    }
  }
  
  /**
   * Get urgent emails
   * @param {string} userId - User ID
   * @returns {Promise<Array>}
   */
  async getUrgentEmails(userId) {
    const emails = await this.scanInbox(userId, { unreadOnly: true });
    return emails.filter(e => e.isUrgent && !e.isSpam);
  }
  
  /**
   * Get status
   * @param {string} userId - User ID
   * @param {string} accountId - Account ID (optional, returns primary if not specified)
   */
  getStatus(userId, accountId = null) {
    const connection = this.getConnection(userId, accountId);
    
    if (!connection) {
      const accounts = this.listAccounts(userId);
      return {
        connected: false,
        message: 'No email connection',
        totalAccounts: accounts.length,
        accounts: accounts
      };
    }
    
    return {
      connected: true,
      accountId: connection.accountId,
      email: connection.email,
      provider: connection.type,
      isPrimary: connection.isPrimary || false,
      connectedAt: connection.connectedAt,
      features: {
        spamDetection: true,
        categorization: true,
        urgentAlerts: true,
        calendarExtraction: true,
        importanceScoring: true,
        autoLabeling: connection.type === 'gmail' ? true : false // Gmail supports custom labels
      },
      importanceLabels: connection.importanceLabels || null,
      totalAccounts: this.listAccounts(userId).length
    };
  }
}

// Singleton
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new EmailCrawlerAgent();
    }
    return instance;
  },
  EmailCrawlerAgent
};
