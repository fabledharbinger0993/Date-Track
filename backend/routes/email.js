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
 * Account management (supports multiple accounts per user)
 */
router.get('/accounts', emailController.listAccounts);
router.delete('/accounts/:accountId', emailController.disconnectAccount);
router.post('/accounts/:accountId/primary', emailController.setPrimaryAccount);

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
 * Importance labeling (fyxer-like feature)
 */
router.post('/labels/create', emailController.createImportanceLabels);
router.post('/organize', emailController.organizeByImportance);
router.post('/label', emailController.applyImportanceLabel);

/**
 * Status
 */
router.get('/status', emailController.getStatus);

module.exports = router;
