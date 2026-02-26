/**
 * Email Controller - API endpoints for Email Crawler Agent
 */

const { getInstance: getEmailAgent } = require('../services/emailCrawlerAgent');

/**
 * Connect Gmail account
 * POST /api/email/connect/gmail
 * Body: { accessToken }
 */
exports.connectGmail = async (req, res) => {
  try {
    const { accessToken } = req.body;
    const userId = req.user?.id || req.session.userId || 'demo_user';
    
    if (!accessToken) {
      return res.status(400).json({ error: 'accessToken required' });
    }
    
    const emailAgent = getEmailAgent();
    const result = await emailAgent.connectGmail(userId, accessToken);
    
    res.json({
      success: true,
      connection: result,
      message: 'Gmail connected successfully'
    });
  } catch (error) {
    console.error('Connect Gmail error:', error);
    res.status(500).json({ 
      error: 'Failed to connect Gmail',
      details: error.message 
    });
  }
};

/**
 * Connect IMAP email (Outlook, Yahoo, etc.)
 * POST /api/email/connect/imap
 * Body: { email, password, host, port, tls }
 */
exports.connectIMAP = async (req, res) => {
  try {
    const { email, password, host, port, tls } = req.body;
    const userId = req.user?.id || req.session.userId || 'demo_user';
    
    if (!email || !password || !host) {
      return res.status(400).json({ 
        error: 'email, password, and host are required' 
      });
    }
    
    const emailAgent = getEmailAgent();
    const result = await emailAgent.connectIMAP(userId, {
      user: email,
      password,
      host,
      port: port || 993,
      tls: tls !== false
    });
    
    res.json({
      success: true,
      connection: result,
      message: `Connected to ${host} successfully`
    });
  } catch (error) {
    console.error('Connect IMAP error:', error);
    res.status(500).json({ 
      error: 'Failed to connect email',
      details: error.message 
    });
  }
};

/**
 * Scan inbox
 * GET /api/email/scan?limit=50&unreadOnly=true
 */
exports.scanInbox = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId || 'demo_user';
    const limit = parseInt(req.query.limit) || 50;
    const unreadOnly = req.query.unreadOnly !== 'false';
    
    const emailAgent = getEmailAgent();
    const emails = await emailAgent.scanInbox(userId, { limit, unreadOnly });
    
    // Separate by category
    const categorized = {
      urgent: emails.filter(e => e.isUrgent && !e.isSpam),
      spam: emails.filter(e => e.isSpam),
      calendarEvents: emails.filter(e => e.hasCalendarEvent && !e.isSpam),
      other: emails.filter(e => !e.isUrgent && !e.isSpam && !e.hasCalendarEvent)
    };
    
    res.json({
      success: true,
      total: emails.length,
      categorized,
      summary: {
        urgent: categorized.urgent.length,
        spam: categorized.spam.length,
        calendarEvents: categorized.calendarEvents.length,
        other: categorized.other.length
      }
    });
  } catch (error) {
    console.error('Scan inbox error:', error);
    res.status(500).json({ 
      error: 'Failed to scan inbox',
      details: error.message 
    });
  }
};

/**
 * Get urgent emails only
 * GET /api/email/urgent
 */
exports.getUrgent = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId || 'demo_user';
    
    const emailAgent = getEmailAgent();
    const urgentEmails = await emailAgent.getUrgentEmails(userId);
    
    res.json({
      success: true,
      count: urgentEmails.length,
      emails: urgentEmails
    });
  } catch (error) {
    console.error('Get urgent emails error:', error);
    res.status(500).json({ 
      error: 'Failed to get urgent emails',
      details: error.message 
    });
  }
};

/**
 * Quarantine spam email
 * POST /api/email/:messageId/quarantine
 */
exports.quarantine = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user?.id || req.session.userId || 'demo_user';
    
    const emailAgent = getEmailAgent();
    const result = await emailAgent.quarantineEmail(userId, messageId);
    
    res.json({
      success: true,
      result,
      message: 'Email quarantined'
    });
  } catch (error) {
    console.error('Quarantine email error:', error);
    res.status(500).json({ 
      error: 'Failed to quarantine email',
      details: error.message 
    });
  }
};

/**
 * Get email connection status
 * GET /api/email/status
 */
exports.getStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId || 'demo_user';
    
    const emailAgent = getEmailAgent();
    const status = emailAgent.getStatus(userId);
    
    res.json({
      success: true,
      status
    });
  } catch (error) {
    console.error('Get status error:', error);
    res.status(500).json({ 
      error: 'Failed to get status',
      details: error.message 
    });
  }
};

/**
 * Auto-process inbox (scan + quarantine spam + alert urgent)
 * POST /api/email/auto-process
 */
exports.autoProcess = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId || 'demo_user';
    const emailAgent = getEmailAgent();
    
    // Scan inbox
    const emails = await emailAgent.scanInbox(userId, { unreadOnly: true });
    
    // Quarantine spam
    const spamEmails = emails.filter(e => e.isSpam);
    for (const spam of spamEmails) {
      await emailAgent.quarantineEmail(userId, spam.id);
    }
    
    // Get urgent emails
    const urgent = emails.filter(e => e.isUrgent && !e.isSpam);
    
    // Get calendar events
    const calendarEvents = emails.filter(e => e.hasCalendarEvent && !e.isSpam);
    
    res.json({
      success: true,
      processed: emails.length,
      actions: {
        quarantined: spamEmails.length,
        urgentAlerts: urgent.length,
        calendarEventsFound: calendarEvents.length
      },
      urgent: urgent.map(e => ({
        id: e.id,
        subject: e.subject,
        from: e.from,
        snippet: e.snippet,
        importance: e.importance || 3
      })),
      calendarEvents: calendarEvents.map(e => ({
        id: e.id,
        subject: e.subject,
        extractedEvent: e.extractedEvent
      }))
    });
  } catch (error) {
    console.error('Auto-process error:', error);
    res.status(500).json({ 
      error: 'Failed to auto-process inbox',
      details: error.message 
    });
  }
};

/**
 * Create importance labels (Gmail only)
 * POST /api/email/labels/create
 */
exports.createImportanceLabels = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId || 'demo_user';
    
    const emailAgent = getEmailAgent();
    const result = await emailAgent.createImportanceLabels(userId);
    
    res.json({
      success: true,
      labels: result.labels,
      message: result.message
    });
  } catch (error) {
    console.error('Create labels error:', error);
    res.status(500).json({ 
      error: 'Failed to create importance labels',
      details: error.message 
    });
  }
};

/**
 * Organize inbox by importance (scan and auto-label)
 * POST /api/email/organize
 * Body: { maxEmails: 50, unreadOnly: false }
 */
exports.organizeByImportance = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId || 'demo_user';
    const { maxEmails = 50, unreadOnly = false } = req.body;
    
    const emailAgent = getEmailAgent();
    const result = await emailAgent.organizeByImportance(userId, { maxEmails, unreadOnly });
    
    res.json({
      success: true,
      results: result.results,
      message: result.message
    });
  } catch (error) {
    console.error('Organize by importance error:', error);
    res.status(500).json({ 
      error: 'Failed to organize emails by importance',
      details: error.message 
    });
  }
};

/**
 * Apply importance label to specific email
 * POST /api/email/label
 * Body: { messageId, importance: 1-5 }
 */
exports.applyImportanceLabel = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId || 'demo_user';
    const { messageId, importance, accountId } = req.body;
    
    if (!messageId || !importance || importance < 1 || importance > 5) {
      return res.status(400).json({ 
        error: 'messageId and importance (1-5) are required' 
      });
    }
    
    const emailAgent = getEmailAgent();
    const result = await emailAgent.applyImportanceLabel(userId, messageId, importance, accountId);
    
    res.json({
      success: true,
      result,
      message: `Applied importance level ${importance} to email`
    });
  } catch (error) {
    console.error('Apply label error:', error);
    res.status(500).json({ 
      error: 'Failed to apply importance label',
      details: error.message 
    });
  }
};

/**
 * List all connected email accounts
 * GET /api/email/accounts
 */
exports.listAccounts = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId || 'demo_user';
    
    const emailAgent = getEmailAgent();
    const accounts = emailAgent.listAccounts(userId);
    
    res.json({
      success: true,
      accounts,
      totalAccounts: accounts.length,
      maxAccounts: emailAgent.maxAccountsPerUser,
      message: `Found ${accounts.length} connected email account(s)`
    });
  } catch (error) {
    console.error('List accounts error:', error);
    res.status(500).json({ 
      error: 'Failed to list accounts',
      details: error.message 
    });
  }
};

/**
 * Disconnect specific email account
 * DELETE /api/email/accounts/:accountId
 */
exports.disconnectAccount = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId || 'demo_user';
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }
    
    const emailAgent = getEmailAgent();
    const success = emailAgent.disconnectAccount(userId, accountId);
    
    if (!success) {
      return res.status(404).json({ 
        error: 'Account not found',
        accountId 
      });
    }
    
    res.json({
      success: true,
      accountId,
      message: `Disconnected account: ${accountId}`
    });
  } catch (error) {
    console.error('Disconnect account error:', error);
    res.status(500).json({ 
      error: 'Failed to disconnect account',
      details: error.message 
    });
  }
};

/**
 * Set primary email account
 * POST /api/email/accounts/:accountId/primary
 */
exports.setPrimaryAccount = async (req, res) => {
  try {
    const userId = req.user?.id || req.session.userId || 'demo_user';
    const { accountId } = req.params;
    
    if (!accountId) {
      return res.status(400).json({ error: 'accountId is required' });
    }
    
    const emailAgent = getEmailAgent();
    const success = emailAgent.setPrimaryAccount(userId, accountId);
    
    if (!success) {
      return res.status(404).json({ 
        error: 'Account not found',
        accountId 
      });
    }
    
    res.json({
      success: true,
      accountId,
      message: `Set primary account: ${accountId}`
    });
  } catch (error) {
    console.error('Set primary account error:', error);
    res.status(500).json({ 
      error: 'Failed to set primary account',
      details: error.message 
    });
  }
};
