// AI Assistant Controller - Simple scanning, organizing, and conversational AI
const { getInstance: getOllamaService } = require('../services/ollamaService');

// In-memory storage (replace with database later)
let events = [];

const aiController = {
  /**
   * POST /api/ai/scan
   * Scan all events for conflicts, patterns, anomalies
   */
  async scanEvents(req, res) {
    try {
      const ollamaService = getOllamaService();
      
      // Get user's events (filtered by userId when auth is implemented)
      const userEvents = events.filter(e => !e.deleted);
      
      if (userEvents.length === 0) {
        return res.json({
          analysis: "You don't have any events yet. Add some events to get AI insights!",
          scanned: 0
        });
      }
      
      const result = await ollamaService.scanEvents(userEvents);
      
      res.json(result);
    } catch (error) {
      console.error('Scan error:', error);
      res.status(500).json({ 
        error: 'Failed to scan events',
        message: error.message 
      });
    }
  },
  
  /**
   * POST /api/ai/organize
   * Organize events into smart categories
   */
  async organizeEvents(req, res) {
    try {
      const ollamaService = getOllamaService();
      
      const userEvents = events.filter(e => !e.deleted);
      
      if (userEvents.length === 0) {
        return res.json({
          categories: {},
          message: "No events to organize yet."
        });
      }
      
      const result = await ollamaService.organizeEvents(userEvents);
      
      res.json(result);
    } catch (error) {
      console.error('Organize error:', error);
      res.status(500).json({ 
        error: 'Failed to organize events',
        message: error.message 
      });
    }
  },
  
  /**
   * POST /api/ai/chat
   * Simple conversational interface
   * Body: { message: "What's on my schedule today?" }
   */
  async chat(req, res) {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      const ollamaService = getOllamaService();
      
      // Build context
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      
      const todayEvents = events.filter(e => e.date === today && !e.deleted);
      const upcomingEvents = events
        .filter(e => new Date(e.date) >= now && !e.deleted)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 5);
      
      const context = {
        todayEvents,
        upcomingEvents,
        totalEvents: events.filter(e => !e.deleted).length
      };
      
      const reply = await ollamaService.generateReply(message, context);
      
      res.json({ 
        reply,
        context: {
          todayCount: todayEvents.length,
          upcomingCount: upcomingEvents.length
        }
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        error: 'Failed to generate reply',
        message: error.message 
      });
    }
  },
  
  /**
   * GET /api/ai/status
   * Check if Ollama AI is available
   */
  async getStatus(req, res) {
    try {
      const ollamaService = getOllamaService();
      
      res.json({
        enabled: ollamaService.enabled,
        model: ollamaService.model,
        library: 'ollama-js v0.6.3',
        host: ollamaService.ollama.config.host,
        message: ollamaService.enabled 
          ? `AI assistant ready with ${ollamaService.model}!` 
          : 'AI assistant unavailable. Install Ollama: https://ollama.com'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = aiController;
