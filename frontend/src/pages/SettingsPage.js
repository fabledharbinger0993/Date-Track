import React, { useState, useEffect } from 'react';
import './SettingsPage.css';

/**
 * Settings Page
 * - Theme: Light/Dark mode toggle
 * - Font: Comic Sans, Times New Roman, Instrument Sans
 * - Notifications: Volume slider (0-100%)
 */
function SettingsPage({ onBack }) {
  const [theme, setTheme] = useState('light');
  const [defaultFont, setDefaultFont] = useState('instrument-sans');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationVolume, setNotificationVolume] = useState(80);
  const [emailFrequency, setEmailFrequency] = useState('realtime');

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setTheme(settings.theme || 'light');
      setDefaultFont(settings.defaultFont || 'instrument-sans');
      setNotificationsEnabled(settings.notificationsEnabled ?? true);
      setNotificationVolume(settings.notificationVolume || 80);
      setEmailFrequency(settings.emailFrequency || 'realtime');
    }
  }, []);

  const saveSettings = (updatedSettings) => {
    const settings = {
      theme,
      defaultFont,
      notificationsEnabled,
      notificationVolume,
      emailFrequency,
      ...updatedSettings
    };
    
    localStorage.setItem('app_settings', JSON.stringify(settings));
    
    // Apply theme immediately
    if (updatedSettings.theme) {
      document.body.setAttribute('data-theme', updatedSettings.theme);
    }
    
    // Apply font immediately
    if (updatedSettings.defaultFont) {
      document.body.setAttribute('data-font', updatedSettings.defaultFont);
    }
  };

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    saveSettings({ theme: newTheme });
  };

  const handleFontChange = (newFont) => {
    setDefaultFont(newFont);
    saveSettings({ defaultFont: newFont });
  };

  const handleNotificationsToggle = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    saveSettings({ notificationsEnabled: newValue });
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setNotificationVolume(newVolume);
    saveSettings({ notificationVolume: newVolume });
  };

  const handleEmailFrequencyChange = (newFrequency) => {
    setEmailFrequency(newFrequency);
    saveSettings({ emailFrequency: newFrequency });
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all settings to defaults?')) {
      setTheme('light');
      setDefaultFont('instrument-sans');
      setNotificationsEnabled(true);
      setNotificationVolume(80);
      setEmailFrequency('realtime');
      
      const defaultSettings = {
        theme: 'light',
        defaultFont: 'instrument-sans',
        notificationsEnabled: true,
        notificationVolume: 80,
        emailFrequency: 'realtime'
      };
      
      localStorage.setItem('app_settings', JSON.stringify(defaultSettings));
      document.body.setAttribute('data-theme', 'light');
      document.body.setAttribute('data-font', 'instrument-sans');
    }
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-page__header">
        <button className="settings-page__back-btn" onClick={onBack} aria-label="Back">
          ← Back
        </button>
        <h1 className="settings-page__title">⚙️ Settings</h1>
        <button className="settings-page__reset-btn" onClick={handleResetToDefaults} aria-label="Reset">
          Reset
        </button>
      </div>

      {/* Content */}
      <div className="settings-page__content">
        {/* Theme Section */}
        <section className="settings-section">
          <h2 className="settings-section__title">🎨 Theme</h2>
          <p className="settings-section__description">
            Choose between light and dark mode
          </p>
          
          <div className="theme-selector">
            <button
              className={`theme-option theme-option--light ${theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              <span className="theme-option__icon">☀️</span>
              <span className="theme-option__label">Light</span>
            </button>
            
            <button
              className={`theme-option theme-option--dark ${theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              <span className="theme-option__icon">🌙</span>
              <span className="theme-option__label">Dark</span>
            </button>
          </div>
        </section>

        {/* Font Section */}
        <section className="settings-section">
          <h2 className="settings-section__title">🔤 Default Font</h2>
          <p className="settings-section__description">
            Select the default font for your notes and calendar
          </p>
          
          <div className="font-selector-grid">
            <button
              className={`font-option font-option--comic-sans ${defaultFont === 'comic-sans' ? 'active' : ''}`}
              onClick={() => handleFontChange('comic-sans')}
            >
              <span className="font-option__sample font-comic-sans">Aa</span>
              <span className="font-option__label">Comic Sans</span>
            </button>
            
            <button
              className={`font-option font-option--times ${defaultFont === 'times-new-roman' ? 'active' : ''}`}
              onClick={() => handleFontChange('times-new-roman')}
            >
              <span className="font-option__sample font-times-new-roman">Aa</span>
              <span className="font-option__label">Times New Roman</span>
            </button>
            
            <button
              className={`font-option font-option--instrument ${defaultFont === 'instrument-sans' ? 'active' : ''}`}
              onClick={() => handleFontChange('instrument-sans')}
            >
              <span className="font-option__sample font-instrument-sans">Aa</span>
              <span className="font-option__label">Instrument Sans</span>
            </button>
          </div>
        </section>

        {/* Notifications Section */}
        <section className="settings-section">
          <h2 className="settings-section__title">🔔 Notifications</h2>
          <p className="settings-section__description">
            Manage event reminders and sound alerts
          </p>
          
          <div className="notification-toggle">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={handleNotificationsToggle}
              />
              <span className="toggle-switch__slider"></span>
            </label>
            <span className="toggle-switch__label">
              {notificationsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {notificationsEnabled && (
            <div className="volume-control">
              <label className="volume-control__label">
                🔊 Notification Volume: <strong>{notificationVolume}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={notificationVolume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
            </div>
          )}
        </section>

        {/* Email Notifications Section */}
        <section className="settings-section">
          <h2 className="settings-section__title">📧 Email Sync Frequency</h2>
          <p className="settings-section__description">
            How often to check for new emails
          </p>
          
          <div className="frequency-selector">
            <button
              className={`frequency-option ${emailFrequency === 'realtime' ? 'active' : ''}`}
              onClick={() => handleEmailFrequencyChange('realtime')}
            >
              Real-time
            </button>
            <button
              className={`frequency-option ${emailFrequency === 'hourly' ? 'active' : ''}`}
              onClick={() => handleEmailFrequencyChange('hourly')}
            >
              Hourly
            </button>
            <button
              className={`frequency-option ${emailFrequency === 'daily' ? 'active' : ''}`}
              onClick={() => handleEmailFrequencyChange('daily')}
            >
              Daily
            </button>
            <button
              className={`frequency-option ${emailFrequency === 'manual' ? 'active' : ''}`}
              onClick={() => handleEmailFrequencyChange('manual')}
            >
              Manual Only
            </button>
          </div>
        </section>

        {/* Account Section */}
        <section className="settings-section">
          <h2 className="settings-section__title">👤 Account</h2>
          <p className="settings-section__description">
            Manage your account and data
          </p>
          
          <div className="account-actions">
            <button className="btn btn--secondary">Export Data</button>
            <button className="btn btn--secondary">Clear Cache</button>
            <button className="btn btn--danger">Sign Out</button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SettingsPage;
