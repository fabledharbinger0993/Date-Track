/**
 * Canva Integration
 * Embed and manage Canva designs for events
 */

/**
 * Parse Canva share URL and extract design ID
 * @param {string} url - Canva share URL
 * @returns {Object} - Parsed Canva info
 */
function parseCanvaUrl(url) {
  // Canva URLs typically look like:
  // https://www.canva.com/design/DAF...../view
  // https://www.canva.com/design/DAF...../edit
  
  const regex = /canva\.com\/design\/([A-Za-z0-9_-]+)/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('Invalid Canva URL');
  }
  
  return {
    designId: match[1],
    url: url,
    embedUrl: `https://www.canva.com/design/${match[1]}/view?embed`,
    type: 'canva-design',
  };
}

/**
 * Generate embed code for Canva design
 * @param {string} url - Canva share URL
 * @param {Object} options - Embed options
 * @returns {string} - HTML embed code
 */
function generateCanvaEmbed(url, options = {}) {
  const { width = '100%', height = '600px' } = options;
  
  try {
    const parsed = parseCanvaUrl(url);
    
    return `<iframe src="${parsed.embedUrl}" 
      width="${width}" 
      height="${height}" 
      frameborder="0" 
      allowfullscreen
      allow="fullscreen">
    </iframe>`;
  } catch (error) {
    throw new Error('Failed to generate Canva embed code');
  }
}

/**
 * Extract Canva design thumbnail
 * @param {string} url - Canva share URL
 * @returns {string} - Thumbnail URL (placeholder for now)
 */
function getCanvaThumbnail(url) {
  try {
    const parsed = parseCanvaUrl(url);
    // Note: Actual thumbnail extraction would require Canva API access
    // For now, return a placeholder or the embed URL
    return `https://www.canva.com/design/${parsed.designId}/view`;
  } catch (error) {
    return null;
  }
}

/**
 * Validate Canva design attachment
 * @param {Object} design - Design object
 * @returns {boolean} - Is valid
 */
function validateCanvaDesign(design) {
  if (!design || typeof design !== 'object') {
    return false;
  }
  
  if (!design.url || typeof design.url !== 'string') {
    return false;
  }
  
  try {
    parseCanvaUrl(design.url);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Create design attachment object for event
 * @param {string} canvaUrl - Canva share URL
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Design attachment
 */
function createDesignAttachment(canvaUrl, metadata = {}) {
  const parsed = parseCanvaUrl(canvaUrl);
  
  return {
    type: 'canva',
    url: canvaUrl,
    designId: parsed.designId,
    embedUrl: parsed.embedUrl,
    embedCode: generateCanvaEmbed(canvaUrl),
    thumbnail: getCanvaThumbnail(canvaUrl),
    title: metadata.title || 'Event Design',
    description: metadata.description || '',
    createdAt: new Date().toISOString(),
  };
}

/**
 * Support for generic image/flyer uploads (non-Canva)
 * @param {string} imageUrl - Image URL
 * @param {Object} metadata - Metadata
 * @returns {Object} - Image attachment
 */
function createImageAttachment(imageUrl, metadata = {}) {
  return {
    type: 'image',
    url: imageUrl,
    thumbnail: imageUrl,
    title: metadata.title || 'Event Flyer',
    description: metadata.description || '',
    createdAt: new Date().toISOString(),
  };
}

module.exports = {
  parseCanvaUrl,
  generateCanvaEmbed,
  getCanvaThumbnail,
  validateCanvaDesign,
  createDesignAttachment,
  createImageAttachment,
};
