// AI Assistant Routes
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
// const { authenticateShortcut } = require('../middleware/shortcutsAuth');

// All routes can optionally use authentication when implemented
// For now, they're open (add auth middleware later)

/**
 * GET /api/ai/status
 * Check if Ollama AI is available and running
 */
router.get('/status', aiController.getStatus);

/**
 * POST /api/ai/scan
 * Scan all events for conflicts, patterns, and anomalies
 * 
 * Response:
 * {
 *   "analysis": "Found 2 conflicts: Meeting and Dentist overlap...",
 *   "scanned": 15,
 *   "aiGenerated": true
 * }
 */
router.post('/scan', aiController.scanEvents);

/**
 * POST /api/ai/organize
 * Organize events into smart categories
 * 
 * Response:
 * {
 *   "categories": {
 *     "Work": ["Team Meeting", "Code Review"],
 *     "Health": ["Dentist", "Gym"],
 *     "Social": ["Dinner with friends"]
 *   },
 *   "aiOrganized": true
 * }
 */
router.post('/organize', aiController.organizeEvents);

/**
 * POST /api/ai/chat
 * Simple conversational interface with calendar assistant
 * 
 * Body: { "message": "What's on my schedule today?" }
 * 
 * Response:
 * {
 *   "reply": "You have 3 events today: Team standup at 9am, Lunch with Sarah at noon, and Dentist at 2pm.",
 *   "context": {
 *     "todayCount": 3,
 *     "upcomingCount": 8
 *   }
 * }
 */
router.post('/chat', aiController.chat);

module.exports = router;
