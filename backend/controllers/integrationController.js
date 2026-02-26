/**
 * Integration Controller
 * Handles Facebook Events import and Canva design attachments
 */

const { fetchFacebookEvents, fetchFacebookEvent } = require('../utils/facebookSync');
const { createDesignAttachment, validateCanvaDesign, createImageAttachment } = require('../utils/canvaIntegration');

// In-memory store for OAuth tokens (should be database in production)
const userTokens = new Map();

/**
 * Import events from Facebook
 */
const importFacebookEvents = async (req, res) => {
  const { accessToken } = req.body;
  
  if (!accessToken) {
    return res.status(400).json({ success: false, message: 'Facebook access token required' });
  }
  
  try {
    const facebookEvents = await fetchFacebookEvents(accessToken);
    
    res.json({
      success: true,
      count: facebookEvents.length,
      events: facebookEvents,
      message: `Found ${facebookEvents.length} Facebook events`,
    });
  } catch (error) {
    console.error('Facebook import error:', error);
    res.status(500).json({
      success: false,
      message: error.message ||'Failed to import Facebook events',
    });
  }
};

/**
 * Import a single Facebook event by ID
 */
const importFacebookEvent = async (req, res) => {
  const { eventId } = req.params;
  const { accessToken } = req.body;
  
  if (!accessToken) {
    return res.status(400).json({ success: false, message: 'Facebook access token required' });
  }
  
  if (!eventId) {
    return res.status(400).json({ success: false, message: 'Event ID required' });
  }
  
  try {
    const event = await fetchFacebookEvent(eventId, accessToken);
    
    res.json({
      success: true,
      event,
    });
  } catch (error) {
    console.error('Facebook event fetch error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch Facebook event',
    });
  }
};

/**
 * Attach Canva design to event
 */
const attachCanvaDesign = (req, res) => {
  const { url, title, description } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, message: 'Canva URL required' });
  }
  
  try {
    const design = createDesignAttachment(url, { title, description });
    
    res.json({
      success: true,
      design,
      message: 'Canva design attached successfully',
    });
  } catch (error) {
    console.error('Canva attachment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Invalid Canva URL',
    });
  }
};

/**
 * Attach image/flyer to event
 */
const attachImage = (req, res) => {
  const { url, title, description } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, message: 'Image URL required' });
  }
  
  try {
    const image = createImageAttachment(url, { title, description });
    
    res.json({
      success: true,
      image,
      message: 'Image attached successfully',
    });
  } catch (error) {
    console.error('Image attachment error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to attach image',
    });
  }
};

/**
 * Validate Canva design URL
 */
const validateCanva = (req, res) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ success: false, message: 'URL required' });
  }
  
  const isValid = validateCanvaDesign({ url });
  
  res.json({
    success: true,
    valid: isValid,
    message: isValid ? 'Valid Canva URL' : 'Invalid Canva URL',
  });
};

module.exports = {
  importFacebookEvents,
  importFacebookEvent,
  attachCanvaDesign,
  attachImage,
  validateCanva,
};
