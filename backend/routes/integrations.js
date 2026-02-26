const express = require('express');
const router = express.Router();
const integrationController = require('../controllers/integrationController');

// Facebook Events Integration
router.post('/facebook/import', integrationController.importFacebookEvents);
router.post('/facebook/import/:eventId', integrationController.importFacebookEvent);

// Canva Design Integration
router.post('/canva/attach', integrationController.attachCanvaDesign);
router.post('/canva/validate', integrationController.validateCanva);

// Generic Image/Flyer Attachment
router.post('/image/attach', integrationController.attachImage);

module.exports = router;
