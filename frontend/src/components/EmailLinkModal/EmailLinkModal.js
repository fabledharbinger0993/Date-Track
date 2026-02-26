import React, { useState, useEffect } from 'react';
import './EmailLinkModal.css';

/**
 * Email Link Modal - OAuth popup for Gmail/Outlook, IMAP for Yahoo
 * Supports multiple accounts (up to 10), disconnect, set primary
 */
function EmailLinkModal({ isOpen, onClose }) {
  const [view, setView] = useState('main'); // 'main', 'gmail', 'outlook', 'imap'
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // IMAP form state
  const [imapConfig, setImapConfig] = useState({
    email: '',
    password: '',
    host: 'imap.mail.yahoo.com',
    port: 993,
    provider: 'yahoo'
  });

  useEffect(() => {
    if (isOpen) {
      loadAccounts();
    }
  }, [isOpen]);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/email/accounts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const handleConnectGmail = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/connect/gmail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Error connecting Gmail:', error);
      alert('Error connecting Gmail');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectOutlook = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email/connect/outlook', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      }
    } catch (error) {
      console.error('Error connecting Outlook:', error);
      alert('Error connecting Outlook');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectIMAP = async (e) => {
    e.preventDefault();
    
    if (!imapConfig.email || !imapConfig.password) {
      alert('Please enter email and password');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/email/connect/imap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(imapConfig)
      });
      
      if (response.ok) {
        await loadAccounts();
        setView('main');
        setImapConfig({ email: '', password: '', host: 'imap.mail.yahoo.com', port: 993, provider: 'yahoo' });
      } else {
        alert('Failed to connect. Check your credentials.');
      }
    } catch (error) {
      console.error('Error connecting IMAP:', error);
      alert('Error connecting IMAP');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (accountId) => {
    if (!window.confirm('Disconnect this email account?')) {
      return;
    }

    try {
      const response = await fetch(`/api/email/accounts/${accountId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        await loadAccounts();
      }
    } catch (error) {
      console.error('Error disconnecting account:', error);
    }
  };

  const handleSetPrimary = async (accountId) => {
    try {
      const response = await fetch(`/api/email/accounts/${accountId}/primary`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        await loadAccounts();
      }
    } catch (error) {
      console.error('Error setting primary account:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="email-link-modal" onClick={onClose}>
      <div className="email-link-modal__content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="email-link-modal__header">
          <h2>📧 Link Email Accounts</h2>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="email-link-modal__body">
          {view === 'main' && (
            <>
              {/* Connected Accounts */}
              {accounts.length > 0 && (
                <div className="connected-accounts">
                  <h3>Connected Accounts ({accounts.length}/10)</h3>
                  <div className="accounts-list">
                    {accounts.map((account) => (
                      <div key={account.accountId} className="account-item">
                        <div className="account-item__info">
                          <span className="account-item__icon">
                            {account.provider === 'gmail' ? '📬' : 
                             account.provider === 'outlook' ? '📧' : '📮'}
                          </span>
                          <div className="account-item__details">
                            <strong>{account.email}</strong>
                            <span className="account-item__provider">{account.provider}</span>
                          </div>
                          {account.isPrimary && (
                            <span className="account-item__badge">Primary</span>
                          )}
                        </div>
                        <div className="account-item__actions">
                          {!account.isPrimary && (
                            <button
                              className="btn-small btn-small--primary"
                              onClick={() => handleSetPrimary(account.accountId)}
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            className="btn-small btn-small--danger"
                            onClick={() => handleDisconnect(account.accountId)}
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Account Buttons */}
              {accounts.length < 10 && (
                <div className="add-account-section">
                  <h3>{accounts.length === 0 ? 'Connect an Account' : 'Add Another Account'}</h3>
                  
                  <div className="provider-buttons">
                    <button
                      className="provider-btn provider-btn--gmail"
                      onClick={handleConnectGmail}
                      disabled={loading}
                    >
                      <span className="provider-btn__icon">📬</span>
                      <div className="provider-btn__text">
                        <strong>Gmail</strong>
                        <span>OAuth 2.0</span>
                      </div>
                    </button>

                    <button
                      className="provider-btn provider-btn--outlook"
                      onClick={handleConnectOutlook}
                      disabled={loading}
                    >
                      <span className="provider-btn__icon">📧</span>
                      <div className="provider-btn__text">
                        <strong>Outlook</strong>
                        <span>OAuth 2.0</span>
                      </div>
                    </button>

                    <button
                      className="provider-btn provider-btn--yahoo"
                      onClick={() => setView('imap')}
                      disabled={loading}
                    >
                      <span className="provider-btn__icon">📮</span>
                      <div className="provider-btn__text">
                        <strong>Yahoo / IMAP</strong>
                        <span>Username & Password</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {accounts.length >= 10 && (
                <div className="limit-message">
                  ⚠️ Maximum of 10 email accounts reached. Disconnect an account to add another.
                </div>
              )}
            </>
          )}

          {view === 'imap' && (
            <div className="imap-form-section">
              <button className="back-link" onClick={() => setView('main')}>
                ← Back to Accounts
              </button>
              
              <h3>Connect via IMAP</h3>
              <p className="form-description">
                Enter your email credentials. For Yahoo, enable "Allow apps that use less secure sign in" in your account settings.
              </p>

              <form onSubmit={handleConnectIMAP} className="imap-form">
                <div className="form-group">
                  <label>Provider</label>
                  <select
                    className="form-input"
                    value={imapConfig.provider}
                    onChange={(e) => {
                      const provider = e.target.value;
                      const hosts = {
                        yahoo: 'imap.mail.yahoo.com',
                        gmail: 'imap.gmail.com',
                        outlook: 'outlook.office365.com',
                        other: ''
                      };
                      setImapConfig({ ...imapConfig, provider, host: hosts[provider] || '' });
                    }}
                  >
                    <option value="yahoo">Yahoo Mail</option>
                    <option value="gmail">Gmail (App Password)</option>
                    <option value="outlook">Outlook (App Password)</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="your.email@example.com"
                    value={imapConfig.email}
                    onChange={(e) => setImapConfig({ ...imapConfig, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password / App Password *</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={imapConfig.password}
                    onChange={(e) => setImapConfig({ ...imapConfig, password: e.target.value })}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>IMAP Host</label>
                    <input
                      type="text"
                      className="form-input"
                      value={imapConfig.host}
                      onChange={(e) => setImapConfig({ ...imapConfig, host: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Port</label>
                    <input
                      type="number"
                      className="form-input"
                      value={imapConfig.port}
                      onChange={(e) => setImapConfig({ ...imapConfig, port: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn--primary btn--full" disabled={loading}>
                  {loading ? 'Connecting...' : 'Connect Account'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default EmailLinkModal;
