const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');

// GET /api/events - list all events
router.get('/', eventsController.getEvents);

// POST /api/events - create a new event
router.post('/', eventsController.createEvent);

// DELETE /api/events/:id - delete an event by id
router.delete('/:id', eventsController.deleteEvent);

module.exports = router;
