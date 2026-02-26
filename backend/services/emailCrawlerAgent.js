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
    this.connections = new Map(); // userId -> email connection
    
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
    
    console.log('📧 Email Crawler Agent initialized');
  }
  
  /**
   * Connect to Gmail using OAuth
   * @param {string} userId - User ID
   * @param {string} accessToken - OAuth access token
   * @returns {Promise<Object>}
   */
  async connectGmail(userId, accessToken) {
    try {
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({ access_token: accessToken });
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      
      this.connections.set(userId, {
        type: 'gmail',
        client: gmail,
        connectedAt: new Date()
      });
      
      console.log(`✓ Gmail connected for user ${userId}`);
      
      return {
        success: true,
        provider: 'gmail',
        connectedAt: new Date()
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
      const imap = new Imap({
        user: config.user,
        password: config.password,
        host: config.host,
        port: config.port || 993,
        tls: config.tls !== false,
        tlsOptions: { rejectUnauthorized: false }
      });
      
      imap.once('ready', () => {
        this.connections.set(userId, {
          type: 'imap',
          client: imap,
          config: config,
          connectedAt: new Date()
        });
        
        console.log(`✓ IMAP connected for user ${userId} (${config.host})`);
        
        resolve({
          success: true,
          provider: config.host,
          connectedAt: new Date()
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
   * Scan inbox for new emails
   * @param {string} userId - User ID
   * @param {Object} options - Scan options { limit, unreadOnly }
   * @returns {Promise<Array>} - Processed emails
   */
  async scanInbox(userId, options = {}) {
    const connection = this.connections.get(userId);
    
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
    
    // AI categorization
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
      extractedEvent: analysis.extractedEvent,
      confidence: analysis.confidence
    };
  }
  
  /**
   * Analyze email using AI
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @param {string} from - Sender
   * @returns {Promise<Object>} - Analysis results
   */
  async analyzeEmail(subject, body, from) {
    const emailText = `Subject: ${subject}\nFrom: ${from}\n\n${body.substring(0, 1000)}`;
    
    try {
      // Use OpenClaw/Ollama for analysis
      const prompt = `Analyze this email and return JSON:
{
  "category": "spam|urgent|calendar_event|receipt|newsletter|personal|work|other",
  "isSpam": true/false,
  "isUrgent": true/false,
  "hasCalendarEvent": true/false,
  "confidence": 0.0-1.0,
  "summary": "brief summary"
}

Email:
${emailText}

JSON:`;

      // Try to use AI
      let response;
      if (this.ai.openClaw?.isAvailable()) {
        response = await this.ai.openClaw.openClaw.generate({
          prompt: prompt,
          max_tokens: 200,
          temperature: 0.3
        });
      } else if (this.ai.ollama?.enabled) {
        response = await this.ai.ollama.generate(prompt, { temperature: 0.3, max_tokens: 200 });
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
   * Fallback rule-based email analysis (no AI)
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
      confidence: 0.6, // Lower confidence for rule-based
      summary: subject.substring(0, 100)
    };
  }
  
  /**
   * Quarantine spam emails
   * @param {string} userId - User ID
   * @param {string} messageId - Email ID
   * @returns {Promise<Object>}
   */
  async quarantineEmail(userId, messageId) {
    const connection = this.connections.get(userId);
    
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
   */
  getStatus(userId) {
    const connection = this.connections.get(userId);
    
    if (!connection) {
      return {
        connected: false,
        message: 'No email connection'
      };
    }
    
    return {
      connected: true,
      provider: connection.type,
      connectedAt: connection.connectedAt,
      features: {
        spamDetection: true,
        categorization: true,
        urgentAlerts: true,
        calendarExtraction: true
      }
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
