// In-memory event store (replace with a database in production)
let events = [
  {
    id: '1',
    title: 'Team Standup',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '09:30',
    source: 'local',
    description: 'Daily team standup meeting',
    location: '',
    attendees: [],
    reminders: ['15min'],
    recurring: 'daily',
    recurringEndDate: '',
    timezone: 'America/New_York',
    color: '#3b82f6',
    isAllDay: false,
    visibility: 'default',
    availability: 'busy',
    rsvps: [],
  },
  {
    id: '2',
    title: 'Project Review',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    startTime: '14:00',
    endTime: '15:00',
    source: 'local',
    description: 'Monthly project review session',
    location: 'Conference Room A',
    attendees: [],
    reminders: ['1hour', '1day'],
    recurring: 'monthly',
    recurringEndDate: '',
    timezone: 'America/New_York',
    color: '#10b981',
    isAllDay: false,
    visibility: 'default',
    availability: 'busy',
    rsvps: [],
  },
  {
    id: '3',
    title: 'Release Day',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    source: 'local',
    description: 'Version 1.0 release',
    location: '',
    attendees: [],
    reminders: ['1week', '1day'],
    recurring: 'none',
    recurringEndDate: '',
    timezone: 'America/New_York',
    color: '#f59e0b',
    isAllDay: true,
    visibility: 'public',
    availability: 'busy',
    rsvps: [],
  },
];

const getEvents = (req, res) => {
  res.json(events);
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

const createEvent = (req, res) => {
  const {
    title,
    date,
    description,
    startTime,
    endTime,
    location,
    attendees,
    reminders,
    recurring,
    recurringEndDate,
    timezone,
    color,
    isAllDay,
    visibility,
    availability,
    designs,
    attachments,
  } = req.body;

  if (!title || !date) {
    return res.status(400).json({ success: false, message: 'title and date are required' });
  }

  if (!DATE_RE.test(date) || isNaN(Date.parse(date))) {
    return res.status(400).json({ success: false, message: 'date must be a valid YYYY-MM-DD string' });
  }

  if (startTime && !TIME_RE.test(startTime)) {
    return res.status(400).json({ success: false, message: 'startTime must be in HH:MM format' });
  }

  if (endTime && !TIME_RE.test(endTime)) {
    return res.status(400).json({ success: false, message: 'endTime must be in HH:MM format' });
  }

  const newEvent = {
    id: crypto.randomUUID(),
    title,
    date,
    description: description || '',
    startTime: startTime || '',
    endTime: endTime || '',
    location: location || '',
    attendees: Array.isArray(attendees) ? attendees : [],
    reminders: Array.isArray(reminders) ? reminders : ['15min'],
    recurring: recurring || 'none',
    recurringEndDate: recurringEndDate || '',
    timezone: timezone || 'UTC',
    color: color || '#3b82f6',
    isAllDay: Boolean(isAllDay),
    visibility: visibility || 'default',
    availability: availability || 'busy',
    designs: Array.isArray(designs) ? designs : [],
    attachments: Array.isArray(attachments) ? attachments : [],
    source: 'local',
    rsvps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  events.push(newEvent);
  res.status(201).json(newEvent);
};

const deleteEvent = (req, res) => {
  const { id } = req.params;
  const index = events.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: `Event with id ${id} not found` });
  }

  events.splice(index, 1);
  res.json({ success: true, message: `Event ${id} deleted` });
};

const { parseEventText, validateEvent } = require('../utils/eventParser');

const parseEvent = (req, res) => {
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ success: false, message: 'text is required' });
  }

  try {
    // Parse the natural language input
    const parsedEvent = parseEventText(text);
    
    // Validate against existing events
    const validation = validateEvent(parsedEvent, events);
    
    res.json({
      success: true,
      event: parsedEvent,
      validation,
    });
  } catch (error) {
    console.error('Parse error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to parse event text',
      error: error.message,
    });
  }
};

const updateEvent = (req, res) => {
  const { id } = req.params;
  const index = events.findIndex((e) => e.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: `Event with id ${id} not found` });
  }

  const {
    title,
    date,
    description,
    startTime,
    endTime,
    location,
    attendees,
    reminders,
    recurring,
    recurringEndDate,
    timezone,
    color,
    isAllDay,
    visibility,
    availability,
  } = req.body;

  if (date && (!DATE_RE.test(date) || isNaN(Date.parse(date)))) {
    return res.status(400).json({ success: false, message: 'date must be a valid YYYY-MM-DD string' });
  }

  if (startTime && !TIME_RE.test(startTime)) {
    return res.status(400).json({ success: false, message: 'startTime must be in HH:MM format' });
  }

  if (endTime && !TIME_RE.test(endTime)) {
    return res.status(400).json({ success: false, message: 'endTime must be in HH:MM format' });
  }

  // Update only provided fields
  const updatedEvent = {
    ...events[index],
    ...(title !== undefined && { title }),
    ...(date !== undefined && { date }),
    ...(description !== undefined && { description }),
    ...(startTime !== undefined && { startTime }),
    ...(endTime !== undefined && { endTime }),
    ...(location !== undefined && { location }),
    ...(attendees !== undefined && { attendees: Array.isArray(attendees) ? attendees : [] }),
    ...(reminders !== undefined && { reminders: Array.isArray(reminders) ? reminders : [] }),
    ...(recurring !== undefined && { recurring }),
    ...(recurringEndDate !== undefined && { recurringEndDate }),
    ...(timezone !== undefined && { timezone }),
    ...(color !== undefined && { color }),
    ...(isAllDay !== undefined && { isAllDay: Boolean(isAllDay) }),
    ...(visibility !== undefined && { visibility }),
    ...(availability !== undefined && { availability }),
    updatedAt: new Date().toISOString(),
  };

  events[index] = updatedEvent;
  res.json(updatedEvent);
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent, parseEvent };
