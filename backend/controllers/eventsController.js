// In-memory event store (replace with a database in production)
let events = [
  {
    id: '1',
    title: 'Team Standup',
    date: new Date().toISOString().slice(0, 10),
    source: 'local',
    description: 'Daily team standup meeting',
  },
  {
    id: '2',
    title: 'Project Review',
    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    source: 'local',
    description: 'Monthly project review session',
  },
  {
    id: '3',
    title: 'Release Day',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    source: 'local',
    description: 'Version 1.0 release',
  },
];

const getEvents = (req, res) => {
  res.json(events);
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const createEvent = (req, res) => {
  const { title, date, description } = req.body;

  if (!title || !date) {
    return res.status(400).json({ success: false, message: 'title and date are required' });
  }

  if (!DATE_RE.test(date) || isNaN(Date.parse(date))) {
    return res.status(400).json({ success: false, message: 'date must be a valid YYYY-MM-DD string' });
  }

  const newEvent = {
    id: crypto.randomUUID(),
    title,
    date,
    description: description || '',
    source: 'local',
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

module.exports = { getEvents, createEvent, deleteEvent };
