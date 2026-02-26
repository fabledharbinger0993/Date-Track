/**
 * Email Routes - Email Crawler Agent API
 */

const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

/**
 * Connect email accounts
 */
router.post('/connect/gmail', emailController.connectGmail);
router.post('/connect/imap', emailController.connectIMAP);

/**
 * Scan and retrieve emails
 */
router.get('/scan', emailController.scanInbox);
router.get('/urgent', emailController.getUrgent);

/**
 * Email actions
 */
router.post('/:messageId/quarantine', emailController.quarantine);
router.post('/auto-process', emailController.autoProcess);

/**
 * Status
 */
router.get('/status', emailController.getStatus);

module.exports = router;
