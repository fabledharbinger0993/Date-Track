const oauthConfig = {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/callback/google`,
    scopes: ['profile', 'email', 'https://www.googleapis.com/auth/calendar.readonly'],
  },
  microsoft: {
    clientId: process.env.MICROSOFT_CLIENT_ID || '',
    clientSecret: process.env.MICROSOFT_CLIENT_SECRET || '',
    redirectUri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/callback/microsoft`,
    scopes: ['openid', 'profile', 'email', 'Calendars.Read'],
    authority: 'https://login.microsoftonline.com/common',
  },
  apple: {
    clientId: process.env.APPLE_CLIENT_ID || '',
    teamId: process.env.APPLE_TEAM_ID || '',
    keyId: process.env.APPLE_KEY_ID || '',
    redirectUri: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/callback/apple`,
    scopes: ['name', 'email'],
  },
};

module.exports = oauthConfig;
