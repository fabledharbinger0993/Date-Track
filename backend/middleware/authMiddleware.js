/**
 * Middleware that requires an authenticated session.
 * Returns 401 if no user is found in the session.
 */
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  next();
};

/**
 * Middleware that optionally attaches the session user to req.user.
 * Always calls next() regardless of authentication state.
 */
const optionalAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
};

module.exports = { requireAuth, optionalAuth };
