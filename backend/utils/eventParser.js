/**
 * Natural language event parser
 * Extracts event details from plain text input
 */

const chrono = require('chrono-node');

/**
 * Parse natural language text into event data
 * @param {string} text - User input text
 * @returns {Object} - Parsed event object
 */
function parseEventText(text) {
  const event = {
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: '',
    attendees: [],
    reminders: ['15min'],
    recurring: 'none',
    timezone: 'UTC',
    color: '#3b82f6',
    isAllDay: false,
    visibility: 'default',
    availability: 'busy',
  };

  // Parse dates and times using chrono-node
  const parsed = chrono.parse(text, new Date(), { forwardDate: true });
  
  if (parsed.length > 0) {
    const firstDate = parsed[0];
    const start = firstDate.start;
    
    // Extract date
    event.date = formatDate(start.date());
    
    // Extract time if specified
    if (start.isCertain('hour')) {
      event.startTime = formatTime(start.date());
      event.isAllDay = false;
      
      // Check for end time
      if (firstDate.end && firstDate.end.isCertain('hour')) {
        event.endTime = formatTime(firstDate.end.date());
      } else {
        // Default 1 hour duration
        const endDate = new Date(start.date());
        endDate.setHours(endDate.getHours() + 1);
        event.endTime = formatTime(endDate);
      }
    } else {
      event.isAllDay = true;
    }
  }

  // Extract attendees (email patterns or "with X")
  const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  const emails = text.match(emailPattern);
  if (emails) {
    event.attendees = emails;
  }

  // Extract "with X" patterns for attendees
  const withPattern = /\b(?:with|invite|attendees?|guests?):?\s+([^,.;]+)/gi;
  let match;
  while ((match = withPattern.exec(text)) !== null) {
    const names = match[1].trim();
    if (names && !emails?.includes(names)) {
      // Store as name for now, could be enhanced to lookup email
      event.description += (event.description ? ' | ' : '') + `With: ${names}`;
    }
  }

  // Extract location (at/in/@ patterns)
  const locationPattern = /\b(?:at|in|@|location:?)\s+([^,.;]+?)(?:\s+(?:on|at|with|for|from|to|$))/i;
  const locationMatch = text.match(locationPattern);
  if (locationMatch) {
    event.location = locationMatch[1].trim();
  }

  // Extract title (what's left after removing time/location/attendees)
  let titleText = text;
  
  // Remove parsed date/time text
  if (parsed.length > 0) {
    titleText = titleText.replace(parsed[0].text, '').trim();
  }
  
  // Remove location
  if (locationMatch) {
    titleText = titleText.replace(locationMatch[0], '').trim();
  }
  
  // Remove attendee patterns
  titleText = titleText.replace(/\b(?:with|invite|attendees?|guests?):?\s+[^,.;]+/gi, '').trim();
  
  // Remove email addresses
  titleText = titleText.replace(emailPattern, '').trim();
  
  // Clean up extra whitespace and punctuation
  titleText = titleText.replace(/\s+/g, ' ').replace(/^[,;:\s]+|[,;:\s]+$/g, '').trim();
  
  // Capitalize first letter
  event.title = titleText.charAt(0).toUpperCase() + titleText.slice(1) || 'Untitled Event';

  // Detect recurring patterns
  if (/\bevery\s+(?:day|daily)/i.test(text)) {
    event.recurring = 'daily';
  } else if (/\bevery\s+(?:week|weekly|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i.test(text)) {
    event.recurring = 'weekly';
  } else if (/\bevery\s+(?:month|monthly)/i.test(text)) {
    event.recurring = 'monthly';
  } else if (/\bevery\s+(?:year|yearly|annual)/i.test(text)) {
    event.recurring = 'yearly';
  } else if (/\bevery\s+(?:weekday|workday)/i.test(text)) {
    event.recurring = 'weekdays';
  }

  return event;
}

/**
 * Validate parsed event and check for conflicts
 * @param {Object} event - Parsed event
 * @param {Array} existingEvents - All existing events
 * @returns {Object} - Validation results
 */
function validateEvent(event, existingEvents) {
  const validation = {
    conflicts: [],
    warnings: [],
    missingDetails: [],
    parsedEvent: event,
  };

  // Check for schedule conflicts
  if (!event.isAllDay && event.startTime) {
    const conflicts = findConflicts(event, existingEvents);
    validation.conflicts = conflicts;
  }

  // Check for unusual times
  if (event.startTime) {
    const hour = parseInt(event.startTime.split(':')[0], 10);
    
    // Dentist/doctor typically 8am-5pm
    if (/dentist|doctor|medical|appointment|checkup/i.test(event.title)) {
      if (hour < 7 || hour > 18) {
        validation.warnings.push(
          `⏰ ${event.title} is scheduled for ${event.startTime}. Medical appointments are usually during business hours (8am-6pm).`
        );
      }
    }
    
    // Business meetings typically 9am-6pm
    if (/meeting|conference|standup|review/i.test(event.title)) {
      if (hour < 8 || hour > 19) {
        validation.warnings.push(
          `⏰ ${event.title} is scheduled for ${event.startTime}. Business meetings are typically during working hours.`
        );
      }
    }
    
    // Very early or very late events
    if (hour < 6) {
      validation.warnings.push(
        `🌙 Event scheduled very early (${event.startTime}). Did you mean PM?`
      );
    }
    if (hour > 22) {
      validation.warnings.push(
        `🌙 Event scheduled very late (${event.startTime}). Is this correct?`
      );
    }
  }

  // Check for missing details
  if (!event.location && /meeting|lunch|dinner|coffee|appointment/i.test(event.title)) {
    validation.missingDetails.push('📍 Location - Where will this take place?');
  }

  if (event.attendees.length === 0 && /meeting|lunch|dinner|with|invite/i.test(event.title)) {
    validation.missingDetails.push('👥 Attendees - Who else is involved?');
  }

  if (!event.description || event.description.length < 10) {
    validation.missingDetails.push('📝 Description - Add notes or additional details?');
  }

  if (event.isAllDay && /meeting|call|appointment/i.test(event.title)) {
    validation.warnings.push(
      '⏱️ This looks like a timed event, but no specific time was detected. Consider adding a time.'
    );
  }

  return validation;
}

/**
 * Find conflicting events
 */
function findConflicts(newEvent, existingEvents) {
  if (newEvent.isAllDay || !newEvent.startTime) {
    return [];
  }

  const conflicts = [];
  const newStart = parseDateTime(newEvent.date, newEvent.startTime);
  const newEnd = parseDateTime(newEvent.date, newEvent.endTime || newEvent.startTime);

  for (const existing of existingEvents) {
    if (existing.isAllDay || !existing.startTime || existing.date !== newEvent.date) {
      continue;
    }

    const existingStart = parseDateTime(existing.date, existing.startTime);
    const existingEnd = parseDateTime(existing.date, existing.endTime || existing.startTime);

    // Check for overlap
    if (newStart < existingEnd && newEnd > existingStart) {
      conflicts.push({
        id: existing.id,
        title: existing.title,
        date: existing.date,
        startTime: existing.startTime,
        endTime: existing.endTime,
      });
    }
  }

  return conflicts;
}

/**
 * Helper functions
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatTime(date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function parseDateTime(date, time) {
  return new Date(`${date}T${time}:00`);
}

module.exports = {
  parseEventText,
  validateEvent,
  findConflicts,
};
