const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Google OAuth
router.get('/google', authController.initiateGoogleAuth);
router.get('/callback/google', authController.handleCallback);

// Microsoft OAuth
router.get('/microsoft', authController.initiateMicrosoftAuth);
router.get('/callback/microsoft', authController.handleCallback);

// Apple OAuth
router.get('/apple', authController.initiateAppleAuth);
router.get('/callback/apple', authController.handleCallback);

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

module.exports = router;
