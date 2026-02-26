/**
 * Calinvite AI Service using Ollama (Free, Local, Private)
 * Provides intelligent event parsing, organization, and simple conversational replies
 */

const { Ollama, ResponseError } = require('ollama');
const eventParser = require('../utils/eventParser');

class OllamaService {
  constructor() {
    this.model = process.env.OLLAMA_MODEL || 'phi'; // RECOMMENDED for offline-first
    this.enabled = false;
    
    // Initialize Ollama client with optional cloud support
    const isCloudModel = this.model.includes('-cloud');
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
      headers: process.env.OLLAMA_API_KEY ? {
        'Authorization': `Bearer ${process.env.OLLAMA_API_KEY}`
      } : {}
    });
    
    // Model recommendations by use case
    this.recommendedModels = {
      'phi': { size: '2.3GB', ram: '3GB', speed: 'fast', offline: true },
      'tinyllama': { size: '637MB', ram: '1GB', speed: 'very fast', offline: true },
      'qwen2:1.5b': { size: '934MB', ram: '2GB', speed: 'fast', offline: true },
      'mistral': { size: '4GB', ram: '5GB', speed: 'medium', offline: true },
      'gpt-oss:120b-cloud': { size: 'cloud', ram: 'N/A', speed: 'medium', offline: false },
      'deepseek-v3.1:671b-cloud': { size: 'cloud', ram: 'N/A', speed: 'slow', offline: false },
    };
    
    // Check if Ollama is available
    this.checkAvailability();
  }
  
  async checkAvailability() {
    try {
      const models = await this.ollama.list();
      this.enabled = models.models.some(m => m.name.startsWith(this.model));
      
      if (this.enabled) {
        const modelInfo = this.recommendedModels[this.model] || {};
        console.log(`✓ Ollama AI enabled with model: ${this.model}`);
        console.log(`  Size: ${modelInfo.size || 'unknown'} | RAM: ${modelInfo.ram || 'unknown'} | Offline: ${modelInfo.offline ? 'Yes' : 'No'}`);
      } else {
        console.warn(`⚠ Ollama model '${this.model}' not found.`);
        console.warn(`  Install with: ollama pull ${this.model}`);
        console.warn(`  Recommended for offline-first: phi (2.3GB) or tinyllama (637MB)`);
      }
    } catch (error) {
      if (error instanceof ResponseError) {
        console.warn(`⚠ Ollama error (${error.status_code}): ${error.error}`);
        if (error.status_code === 404) {
          console.warn(`  Model '${this.model}' not found. Pull it with: ollama pull ${this.model}`);
        }
      } else {
        console.warn('⚠ Ollama not running. AI features will use fallback parsing.');
        console.warn('  Start Ollama: ollama serve');
        console.warn('  Download: https://ollama.com/download');
      }
    }
  }
  
  /**
   * Generate text using Ollama (lower-level API)
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - AI response
   */
  async generate(prompt, options = {}) {
    try {
      const response = await this.ollama.generate({
        model: this.model,
        prompt: prompt,
        stream: false,
        format: options.format || undefined, // 'json' for JSON responses
        keep_alive: options.keep_alive || '5m', // Keep model loaded for 5 minutes
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 500,
        }
      });
      
      return response.response.trim();
    } catch (error) {
      if (error instanceof ResponseError) {
        console.error(`Ollama error (${error.status_code}): ${error.error}`);
        if (error.status_code === 404) {
          // Model not found, try to pull it
          console.log(`Attempting to pull model ${this.model}...`);
          await this.ollama.pull({ model: this.model });
          // Retry the request
          return this.generate(prompt, options);
        }
      } else {
        console.error('Ollama generation error:', error.message);
      }
      throw error;
    }
  }
  
  /**
   * Chat with Ollama (higher-level conversational API)
   * @param {Array} messages - Array of {role, content} messages
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - AI response
   */
  async chat(messages, options = {}) {
    try {
      const response = await this.ollama.chat({
        model: this.model,
        messages: messages,
        stream: false,
        format: options.format || undefined, // 'json' for JSON responses
        keep_alive: options.keep_alive || '5m', // Keep model loaded for 5 minutes
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 500,
        }
      });
      
      return response.message.content.trim();
    } catch (error) {
      if (error instanceof ResponseError) {
        console.error(`Ollama error (${error.status_code}): ${error.error}`);
        if (error.status_code === 404) {
          // Model not found, try to pull it
          console.log(`Attempting to pull model ${this.model}...`);
          await this.ollama.pull({ model: this.model });
          // Retry the request
          return this.chat(messages, options);
        }
      } else {
        console.error('Ollama chat error:', error.message);
      }
      throw error;
    }
  }
  
  /**
   * Parse event from natural language
   * Example: "Dentist tomorrow at 2pm" -> { title: "Dentist", date: "2026-02-26", time: "14:00" }
   * @param {string} text - User input
   * @returns {Promise<Object>} - Parsed event
   */
  async parseEvent(text) {
    if (!this.enabled) {
      return eventParser.parseEventText(text);
    }
    
    try {
      // Simplified prompt optimized for small models (phi, tinyllama)
      const prompt = `Parse event: "${text}"
Return JSON:
{"title":"name","date":"YYYY-MM-DD","time":"HH:MM"}`;
      
      // Use JSON format enforcement and lower temperature for more focused responses
      const response = await this.generate(prompt, { 
        temperature: 0.2, 
        max_tokens: 100,
        format: 'json', // Enforce JSON output
        keep_alive: '10m' // Keep model loaded longer for quick successive parses
      });
      
      // With format: 'json', response should already be valid JSON
      const parsed = JSON.parse(response);
      
      // Add confidence and AI flag
      return {
        ...parsed,
        aiParsed: true,
        confidence: 'high'
      };
      
    } catch (error) {
      console.error('AI parsing failed, using fallback:', error.message);
      return eventParser.parseEventText(text);
    }
  }
  
  /**
   * Scan events and detect patterns, conflicts, and anomalies
   * @param {Array} events - List of events
   * @returns {Promise<Object>} - Analysis results
   */
  async scanEvents(events) {
    if (!this.enabled) {
      return this.fallbackScan(events);
    }
    
    try {
      // Prepare event summary for AI
      const eventSummary = events.slice(0, 50).map(e => 
        `- ${e.title} on ${e.date} at ${e.time || 'all day'}`
      ).join('\n');
      
      const prompt = `Analyze these calendar events and identify:
1. Scheduling conflicts (overlapping times)
2. Unusual patterns (e.g., meetings at odd hours, back-to-back events)
3. Suggestions for better organization

Events:
${eventSummary}

Provide a brief analysis in this format:
CONFLICTS: [list any overlaps]
PATTERNS: [identify any unusual patterns]
SUGGESTIONS: [give 2-3 helpful suggestions]

Keep responses concise and actionable.`;

      const response = await this.generate(prompt, { temperature: 0.5, max_tokens: 400 });
      
      return {
        analysis: response,
        scanned: events.length,
        aiGenerated: true
      };
      
    } catch (error) {
      console.error('Event scanning failed:', error.message);
      return this.fallbackScan(events);
    }
  }
  
  /**
   * Organize events into smart categories
   * @param {Array} events - List of events
   * @returns {Promise<Object>} - Organized events by category
   */
  async organizeEvents(events) {
    if (!this.enabled) {
      return this.fallbackOrganize(events);
    }
    
    try {
      const eventTitles = events.slice(0, 30).map(e => e.title).join(', ');
      
      const prompt = `Categorize these events into groups. Return a JSON object where keys are category names and values are arrays of event titles.

Events: ${eventTitles}

Categories: Work, Personal, Health, Social, Family, Education, Other`;

      const response = await this.generate(prompt, { 
        temperature: 0.4, 
        max_tokens: 300,
        format: 'json', // Enforce JSON output
        keep_alive: '10m'
      });
      
      // With format: 'json', response should already be valid JSON
      const categories = JSON.parse(response);
      return {
        categories,
        aiOrganized: true
      };
      
    } catch (error) {
      console.error('Event organization failed:', error.message);
      return this.fallbackOrganize(events);
    }
  }
  
  /**
   * Generate a simple conversational reply
   * @param {string} userMessage - User's question or statement
   * @param {Object} context - Context (e.g., recent events, user stats)
   * @returns {Promise<string>} - AI response
   */
  async generateReply(userMessage, context = {}) {
    if (!this.enabled) {
      return this.fallbackReply(userMessage);
    }
    
    try {
      let contextStr = '';
      if (context.upcomingEvents) {
        contextStr += `\nUpcoming events: ${context.upcomingEvents.map(e => e.title).join(', ')}`;
      }
      if (context.todayEvents) {
        contextStr += `\nToday: ${context.todayEvents.length} events`;
      }
      
      const prompt = `You are a helpful calendar assistant. Keep responses brief and friendly (2-3 sentences max).
${contextStr}

User: ${userMessage}
Assistant:`;

      const response = await this.generate(prompt, { temperature: 0.7, max_tokens: 150 });
      
      return response;
      
    } catch (error) {
      console.error('Reply generation failed:', error.message);
      return this.fallbackReply(userMessage);
    }
  }
  
  /**
   * Stream a chat response (for long-running operations)
   * @param {Array} messages - Array of {role, content} messages
   * @param {Function} onChunk - Callback for each chunk
   * @param {Object} options - Additional options
   * @returns {Promise<string>} - Complete response
   */
  async chatStream(messages, onChunk, options = {}) {
    if (!this.enabled) {
      throw new Error('Ollama streaming not available');
    }
    
    try {
      const stream = await this.ollama.chat({
        model: this.model,
        messages: messages,
        stream: true,
        keep_alive: options.keep_alive || '5m',
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 500,
        }
      });
      
      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.message.content;
        fullResponse += content;
        if (onChunk) {
          onChunk(content);
        }
      }
      
      return fullResponse.trim();
    } catch (error) {
      if (error instanceof ResponseError) {
        console.error(`Ollama streaming error (${error.status_code}): ${error.error}`);
      } else {
        console.error('Ollama streaming error:', error.message);
      }
      throw error;
    }
  }
  
  /**
   * Generate embeddings for text (useful for semantic search)
   * @param {string|Array<string>} input - Text or array of texts to embed
   * @param {Object} options - Additional options
   * @returns {Promise<Array>} - Embedding vector(s)
   */
  async embed(input, options = {}) {
    if (!this.enabled) {
      throw new Error('Ollama embeddings not available');
    }
    
    try {
      const response = await this.ollama.embed({
        model: this.model,
        input: input,
        truncate: options.truncate || true,
        keep_alive: options.keep_alive || '5m'
      });
      
      return response.embeddings;
    } catch (error) {
      if (error instanceof ResponseError) {
        console.error(`Ollama embedding error (${error.status_code}): ${error.error}`);
      } else {
        console.error('Ollama embedding error:', error.message);
      }
      throw error;
    }
  }
  
  /**
   * Abort all streaming requests
   */
  abort() {
    if (this.ollama) {
      this.ollama.abort();
    }
  }
  
  // Fallback methods when AI is not available
  
  fallbackScan(events) {
    const conflicts = [];
    
    // Simple conflict detection
    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        if (events[i].date === events[j].date && 
            events[i].time === events[j].time) {
          conflicts.push(`${events[i].title} and ${events[j].title} overlap`);
        }
      }
    }
    
    return {
      analysis: conflicts.length > 0 
        ? `Found ${conflicts.length} conflicts: ${conflicts.join('; ')}`
        : 'No scheduling conflicts detected.',
      scanned: events.length,
      aiGenerated: false
    };
  }
  
  fallbackOrganize(events) {
    // Simple keyword-based categorization
    const categories = {
      Work: [],
      Personal: [],
      Health: [],
      Social: [],
      Other: []
    };
    
    const workKeywords = ['meeting', 'work', 'standup', 'call', 'presentation', 'deadline'];
    const healthKeywords = ['doctor', 'dentist', 'gym', 'workout', 'therapy', 'appointment'];
    const socialKeywords = ['dinner', 'party', 'hangout', 'coffee', 'drinks', 'lunch'];
    
    events.forEach(event => {
      const title = event.title.toLowerCase();
      
      if (workKeywords.some(kw => title.includes(kw))) {
        categories.Work.push(event.title);
      } else if (healthKeywords.some(kw => title.includes(kw))) {
        categories.Health.push(event.title);
      } else if (socialKeywords.some(kw => title.includes(kw))) {
        categories.Social.push(event.title);
      } else {
        categories.Other.push(event.title);
      }
    });
    
    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });
    
    return {
      categories,
      aiOrganized: false
    };
  }
  
  fallbackReply(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('how many') || message.includes('what') && message.includes('today')) {
      return "I can help you check your schedule! Try asking specific questions about your events.";
    }
    if (message.includes('free') || message.includes('available')) {
      return "I can help you find free time slots. What day are you looking at?";
    }
    if (message.includes('busy') || message.includes('schedule')) {
      return "Let me know what time period you're curious about and I'll check your calendar.";
    }
    
    return "I'm your calendar assistant. I can help you add events, check your schedule, and find conflicts.";
  }
}

// Singleton instance
let instance = null;

module.exports = {
  getInstance: () => {
    if (!instance) {
      instance = new OllamaService();
    }
    return instance;
  },
  OllamaService
};
