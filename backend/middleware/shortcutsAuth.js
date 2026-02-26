// Shortcut Token Authentication Middleware
const jwt = require('jsonwebtoken');

const authenticateShortcut = (req, res, next) => {
  // Accept token from header or query param (shortcuts limitation)
  const token = 
    req.headers['x-shortcuts-token'] || 
    req.headers.authorization?.split(' ')[1] ||
    req.query.token;
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'Please provide your Shortcuts token. Generate one at https://date-track.app/settings'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Verify this is a shortcuts token (not a regular session token)
    if (decoded.type !== 'shortcuts') {
      return res.status(401).json({ error: 'Invalid token type' });
    }
    
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Please generate a new Shortcuts token at https://date-track.app/settings'
      });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = { authenticateShortcut };
