/**
 * AI Service using Azure OpenAI
 * Provides intelligent event parsing and natural language understanding
 */

const axios = require('axios');

class AIService {
  constructor() {
    this.endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.apiKey = process.env.AZURE_OPENAI_KEY;
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
    this.enabled = !!(this.endpoint && this.apiKey);

    if (!this.enabled) {
      console.warn('Azure OpenAI not configured. AI features will use basic parsing.');
    }
  }

  /**
   * Parse event from natural language using AI
   * @param {string} text - User input text
   * @returns {Promise<Object>} - Parsed event data
   */
  async parseEvent(text) {
    if (!this.enabled) {
      return this.fallbackParse(text);
    }

    try {
      const prompt = this.buildEventParsingPrompt(text);
      const response = await this.callOpenAI(prompt);
      
      return JSON.parse(response);
    } catch (error) {
      console.error('AI parsing error:', error);
      return this.fallbackParse(text);
    }
  }

  /**
   * Validate event and provide suggestions
   * @param {Object} event - Event object
   * @param {Array} existingEvents - Existing events
   * @returns {Promise<Object>} - Validation results with AI suggestions
   */
  async validateEvent(event, existingEvents) {
    if (!this.enabled) {
      return this.fallbackValidate(event, existingEvents);
    }

    try {
      const prompt = this.buildValidationPrompt(event, existingEvents);
      const response = await this.callOpenAI(prompt);
      
      return JSON.parse(response);
    } catch (error) {
      console.error('AI validation error:', error);
      return this.fallbackValidate(event, existingEvents);
    }
  }

  /**
   * Generate event suggestions based on context
   * @param {string} query - User query
   * @param {Object} context - Calendar context
   * @returns {Promise<Array>} - Suggested events
   */
  async getSuggestions(query, context = {}) {
    if (!this.enabled) {
      return [];
    }

    try {
      const prompt = `Based on this query: "${query}"
      
Current context:
- Today: ${new Date().toDateString()}
- Upcoming events: ${context.upcomingEvents?.length || 0}

Suggest relevant events or actions. Return as JSON array of suggestions.
Example: [{"type": "event", "title": "...", "date": "...", "suggestion": "..."}]`;

      const response = await this.callOpenAI(prompt, { maxTokens: 500 });
      return JSON.parse(response);
    } catch (error) {
      console.error('AI suggestions error:', error);
      return [];
    }
  }

  /**
   * Call Azure OpenAI API
   */
  async callOpenAI(prompt, options = {}) {
    const {
      maxTokens = 1000,
      temperature = 0.3,
      responseFormat = 'json_object'
    } = options;

    const url = `${this.endpoint}/openai/deployments/${this.deploymentName}/chat/completions?api-version=2024-02-01`;

    const response = await axios.post(
      url,
      {
        messages: [
          {
            role: 'system',
            content: 'You are a helpful calendar assistant that understands natural language and helps parse event details accurately. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
        response_format: { type: responseFormat }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey
        },
        timeout: 10000
      }
    );

    return response.data.choices[0].message.content;
  }

  /**
   * Build event parsing prompt
   */
  buildEventParsingPrompt(text) {
    return `Parse this event description into structured data: "${text}"

Extract and return JSON with these fields:
{
  "title": "event title",
  "date": "YYYY-MM-DD",
  "startTime": "HH:MM" or "",
  "endTime": "HH:MM" or "",
  "location": "location" or "",
  "description": "any additional details",
  "attendees": ["email@example.com"],
  "isAllDay": true/false,
  "recurring": "none|daily|weekly|monthly|yearly",
  "category": "meeting|appointment|personal|work|other",
  "confidence": 0.0-1.0
}

Use context clues to infer missing information. If the date is relative (tomorrow, next week), calculate the actual date from today: ${new Date().toDateString()}.`;
  }

  /**
   * Build validation prompt
   */
  buildValidationPrompt(event, existingEvents) {
    const conflicts = existingEvents.filter(e => 
      e.date === event.date && 
      e.startTime && event.startTime &&
      this.timesOverlap(e, event)
    );

    return `Validate this event and provide suggestions:

Event: ${JSON.stringify(event, null, 2)}

Conflicts: ${conflicts.length > 0 ? JSON.stringify(conflicts, null, 2) : 'None'}

Return JSON:
{
  "isValid": true/false,
  "conflicts": ["description of conflicts"],
  "warnings": ["unusual patterns or concerns"],
  "suggestions": ["helpful recommendations"],
  "missingDetails": ["what's missing"],
  "confidence": 0.0-1.0
}

Consider:
- Time appropriateness (business hours, event type)
- Missing critical info (location for in-person, attendees for meetings)
- Schedule conflicts
- Timezone issues`;
  }

  /**
   * Fallback parsing (uses chrono-node)
   */
  fallbackParse(text) {
    const { parseEventText } = require('./eventParser');
    return parseEventText(text);
  }

  /**
   * Fallback validation
   */
  fallbackValidate(event, existingEvents) {
    const { validateEvent } = require('./eventParser');
    return validateEvent(event, existingEvents);
  }

  /**
   * Helper: Check if times overlap
   */
  timesOverlap(event1, event2) {
    if (!event1.startTime || !event2.startTime) return false;
    
    const start1 = this.timeToMinutes(event1.startTime);
    const end1 = this.timeToMinutes(event1.endTime || event1.startTime);
    const start2 = this.timeToMinutes(event2.startTime);
    const end2 = this.timeToMinutes(event2.endTime || event2.startTime);
    
    return start1 < end2 && end1 > start2;
  }

  timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

// Singleton instance
const aiService = new AIService();

module.exports = aiService;
