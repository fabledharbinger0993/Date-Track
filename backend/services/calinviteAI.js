/**
 * Unified AI Service - Calinvite
 * Tries local AI engines in order: Ollama (primary) → OpenClaw (optional) → chrono-node (fallback)
 * 
 * Ollama is the recommended engine with 7 models and advanced features.
 * OpenClaw is optional and will be used if available.
 * chrono-node is the reliable fallback that always works.
 */

const { getInstance: getOpenClawService } = require('./openClawService');
const { getInstance: getOllamaService } = require('./ollamaService');
const eventParser = require('../utils/eventParser');

class CalinviteAI {
  constructor() {
    this.openClaw = getOpenClawService();
    this.ollama = getOllamaService();
    
    // Determine which engine is available
    this.detectEngines();
  }
  
  detectEngines() {
    const engines = [];
    
    if (this.ollama.enabled) {
      engines.push('Ollama (primary)');
    }
    if (this.openClaw.isAvailable()) {
      engines.push('OpenClaw (optional)');
    }
    engines.push('chrono-node (fallback)');
    
    console.log(`🤖 AI Engines: ${engines.join(' → ')}`);
    
    if (!this.ollama.enabled && !this.openClaw.isAvailable()) {
      console.warn('⚠️  No AI engines available - using chrono-node only');
      console.warn('   Install Ollama for better parsing: https://ollama.com');
    }
  }
  
  /**
   * Parse event - tries engines in order (Ollama preferred)
   * @param {string} text - Natural language input
   * @returns {Promise<Object>} - Parsed event
   */
  async parseEvent(text) {
    // Try Ollama first (most reliable, feature-rich)
    if (this.ollama.enabled) {
      try {
        const result = await this.ollama.parseEvent(text);
        return result;
      } catch (error) {
        console.warn('Ollama parse failed, trying OpenClaw...');
      }
    }
    
    // Try OpenClaw second (optional, lightweight)
    if (this.openClaw.isAvailable()) {
      try {
        const result = await this.openClaw.parseEvent(text);
        return result;
      } catch (error) {
        console.warn('OpenClaw parse failed, using fallback...');
      }
    }
    
    // Fallback to chrono-node (always works, basic parsing)
    console.log('Using chrono-node fallback parser');
    return eventParser.parseEventText(text);
  }
  
  /**
   * Scan events for conflicts/patterns
   * @param {Array} events - Events to analyze
   * @returns {Promise<Object>} - Analysis
   */
  async scanEvents(events) {
    // Try Ollama first (primary engine)
    if (this.ollama.enabled) {
      try {
        return await this.ollama.scanEvents(events);
      } catch (error) {
        console.warn('Ollama scan failed, trying OpenClaw...');
      }
    }
    
    // Try OpenClaw (optional engine)
    if (this.openClaw.isAvailable()) {
      try {
        return await this.openClaw.scanEvents(events);
      } catch (error) {
        console.warn('OpenClaw scan failed, using fallback...');
      }
    }
    
    // Fallback scan
    return this.fallbackScan(events);
  }
  
  /**
   * Organize events into categories
   * @param {Array} events - Events to organize
   * @returns {Promise<Object>} - Organized categories
   */
  async organizeEvents(events) {
    // Try Ollama first (primary engine)
    if (this.ollama.enabled) {
      try {
        return await this.ollama.organizeEvents(events);
      } catch (error) {
        console.warn('Ollama organize failed, trying OpenClaw...');
      }
    }
    
    // Try OpenClaw (optional engine) - may not have organize method yet
    if (this.openClaw.isAvailable()) {
      try {
        if (this.openClaw.organizeEvents) {
          return await this.openClaw.organizeEvents(events);
        }
      } catch (error) {
        console.warn('OpenClaw organize failed, using fallback...');
      }
    }
    
    return this.fallbackOrganize(events);
  }
  
  /**
   * Chat with AI assistant
   * @param {string} message - User message
   * @param {Object} context - Context
   * @returns {Promise<string>} - AI reply
   */
  async chat(message, context = {}) {
    // Try Ollama first (primary engine)
    if (this.ollama.enabled) {
      try {
        return await this.ollama.generateReply(message, context);
      } catch (error) {
        console.warn('Ollama chat failed, trying OpenClaw...');
      }
    }
    
    // Try OpenClaw (optional engine)
    if (this.openClaw.isAvailable()) {
      try {
        return await this.openClaw.chat(message, context);
      } catch (error) {
        console.warn('OpenClaw chat failed, using fallback...');
      }
    }
    
    return this.fallbackReply(message);
  }
  
  /**
   * Get AI status
   * @returns {Object}
   */
  getStatus() {
    const status = {
      engines: [],
      primary: null,
      fallback: 'chrono-node'
    };
    
    // Ollama is primary engine
    if (this.ollama.enabled) {
      status.engines.push({
        enabled: true,
        engine: 'Ollama',
        model: this.ollama.model,
        local: true,
        cost: 0
      });
      status.primary = 'Ollama';
    }
    
    // OpenClaw is optional secondary engine
    if (this.openClaw.isAvailable()) {
      status.engines.push(this.openClaw.getStatus());
      
      if (!status.primary) {
        status.primary = 'OpenClaw';
      }
    }
    
    if (!status.primary) {
      status.primary = 'chrono-node (fallback only)';
    }
    
    return status;
  }
  
  // Fallback methods
  
  fallbackScan(events) {
    const conflicts = [];
    
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        if (events[i].date === events[j].date && events[i].time === events[j].time) {
          conflicts.push(`${events[i].title} and ${events[j].title}`);
        }
      }
    }
    
    return {
      analysis: conflicts.length > 0 
        ? `Found ${conflicts.length} time conflicts: ${conflicts.join('; ')}`
        : 'No scheduling conflicts detected.',
      scanned: events.length,
      engine: 'fallback',
      aiGenerated: false
    };
  }
  
  fallbackOrganize(events) {
    const categories = {
      Work: [],
      Personal: [],
      Health: [],
      Social: [],
      Other: []
    };
    
    const workKw = ['meeting', 'work', 'standup', 'call', 'presentation'];
    const healthKw = ['doctor', 'dentist', 'gym', 'workout', 'therapy'];
    const socialKw = ['dinner', 'party', 'hangout', 'coffee', 'drinks'];
    
    events.forEach(event => {
      const title = event.title.toLowerCase();
      
      if (workKw.some(kw => title.includes(kw))) {
        categories.Work.push(event.title);
      } else if (healthKw.some(kw => title.includes(kw))) {
        categories.Health.push(event.title);
      } else if (socialKw.some(kw => title.includes(kw))) {
        categories.Social.push(event.title);
      } else {
        categories.Other.push(event.title);
      }
    });
    
    // Remove empty
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) delete categories[key];
    });
    
    return {
      categories,
      engine: 'fallback',
      aiOrganized: false
    };
  }
  
  fallbackReply(message) {
    const msg = message.toLowerCase();
    
    if (msg.includes('how many') || (msg.includes('what') && msg.includes('today'))) {
      return "I can help you check your schedule! Try asking specific questions.";
    }
    if (msg.includes('free') || msg.includes('available')) {
      return "I can help you find free time. What day are you looking at?";
    }
    
    return "I'm your calendar assistant. Ask me about your schedule!";
  }
}

// Singleton
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new CalinviteAI();
    }
    return instance;
  },
  CalinviteAI
};
