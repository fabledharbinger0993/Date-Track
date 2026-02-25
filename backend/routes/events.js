const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { optionalAuth } = require('../middleware/authMiddleware');

// GET /api/events - list all events
router.get('/', eventsController.getEvents);

// POST /api/events/parse - parse natural language event input
router.post('/parse', eventsController.parseEvent);

// POST /api/events - create a new event (attaches session user when logged in)
router.post('/', optionalAuth, eventsController.createEvent);

// PUT /api/events/:id - update an event by id
router.put('/:id', optionalAuth, eventsController.updateEvent);

// DELETE /api/events/:id - delete an event by id (attaches session user when logged in)
router.delete('/:id', optionalAuth, eventsController.deleteEvent);

module.exports = router;
