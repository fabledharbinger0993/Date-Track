/**
 * OpenClaw AI Service - Local, lightweight AI for event parsing
 * OpenClaw is a small local LLM that runs without heavy infrastructure
 */

class OpenClawService {
  constructor() {
    this.enabled = false;
    this.openClaw = null;
    
    // Try to load OpenClaw
    this.initialize();
  }
  
  async initialize() {
    try {
      // Try to import OpenClaw (adjust based on actual module name)
      // Common patterns: 'openclaw', '@openclaw/core', 'openclaw-js'
      this.openClaw = require('openclaw');
      this.enabled = true;
      console.log('✓ OpenClaw AI initialized (local, lightweight)');
    } catch (error) {
      console.warn('⚠ OpenClaw not found. Install with: npm install openclaw');
      console.warn('  Falling back to Ollama or chrono-node');
    }
  }
  
  /**
   * Parse event from natural language using OpenClaw
   * @param {string} text - User input like "Dentist tomorrow at 2pm"
   * @returns {Promise<Object>} - Parsed event data
   */
  async parseEvent(text) {
    if (!this.enabled || !this.openClaw) {
      throw new Error('OpenClaw not available');
    }
    
    try {
      // OpenClaw API call - adjust based on actual API
      const prompt = `Parse this into a calendar event JSON with fields: title, date (YYYY-MM-DD), time (HH:MM), location, description.\n\nText: "${text}"\n\nJSON:`;
      
      // Assuming OpenClaw has a generate or complete method
      const response = await this.openClaw.generate({
        prompt: prompt,
        max_tokens: 150,
        temperature: 0.3,
        stop: ['\n\n', 'User:', 'Text:']
      });
      
      // Extract JSON from response
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
    if (!this.enabled || !this.openClaw) {
      throw new Error('OpenClaw not available');
    }
    
    try {
      const eventSummary = events.slice(0, 30).map(e => 
        `- ${e.title} on ${e.date} at ${e.time || 'all day'}`
      ).join('\n');
      
      const prompt = `Analyze these calendar events. List any conflicts (overlapping times), unusual patterns, and give 2-3 suggestions.\n\nEvents:\n${eventSummary}\n\nAnalysis:`;
      
      const response = await this.openClaw.generate({
        prompt: prompt,
        max_tokens: 300,
        temperature: 0.5
      });
      
      return {
        analysis: response.text.trim(),
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
    if (!this.enabled || !this.openClaw) {
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
      
      const response = await this.openClaw.generate({
        prompt: prompt,
        max_tokens: 100,
        temperature: 0.7,
        stop: ['\nUser:', '\n\n']
      });
      
      return response.text.trim();
      
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
    return this.enabled && this.openClaw !== null;
  }
  
  /**
   * Get status info
   * @returns {Object}
   */
  getStatus() {
    return {
      enabled: this.enabled,
      engine: 'OpenClaw',
      version: this.openClaw?.version || 'unknown',
      local: true,
      cost: 0
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
