import React, { useState } from 'react';
import './FacebookImport.css';

const FacebookImport = ({ onImport, onCancel }) => {
  const [accessToken, setAccessToken] = useState('');
  const [importing, setImporting] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState(new Set());

  const handleFetchEvents = async () => {
    if (!accessToken.trim()) {
      alert('Please enter your Facebook access token');
      return;
    }

    setImporting(true);

    try {
      const API_BASE = process.env.REACT_APP_API_URL || `${window.location.origin}/api`;
      const response = await fetch(`${API_BASE}/integrations/facebook/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessToken }),
      });

      const data = await response.json();

      if (response.ok && data.events) {
        setEvents(data.events);
        if (data.events.length === 0) {
          alert('No Facebook events found');
        }
      } else {
        alert(data.message || 'Failed to fetch Facebook events');
        setEvents([]);
      }
    } catch (error) {
      console.error('Facebook import error:', error);
      alert('Failed to fetch Facebook events');
      setEvents([]);
    } finally {
      setImporting(false);
    }
  };

  const toggleEventSelection = (eventId) => {
    const newSelection = new Set(selectedEvents);
    if (newSelection.has(eventId)) {
      newSelection.delete(eventId);
    } else {
      newSelection.add(eventId);
    }
    setSelectedEvents(newSelection);
  };

  const handleImportSelected = () => {
    const eventsToImport = events.filter((_, index) => selectedEvents.has(index));
    if (eventsToImport.length === 0) {
      alert('Please select at least one event to import');
      return;
    }
    onImport(eventsToImport);
  };

  return (
    <div className="facebook-import">
      <h2>Import from Facebook Events</h2>
      
      <div className="token-section">
        <label htmlFor="fbToken">Facebook Access Token</label>
        <input
          type="password"
          id="fbToken"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="Paste your Facebook access token"
          disabled={importing}
        />
        <button
          type="button"
          className="btn-fetch"
          onClick={handleFetchEvents}
          disabled={importing || !accessToken.trim()}
        >
          {importing ? 'Fetching...' : 'Fetch My Events'}
        </button>
        <small>
          <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noopener noreferrer">
            Get your access token from Facebook Graph API Explorer
          </a>
        </small>
      </div>

      {events.length > 0 && (
        <div className="events-list">
          <h3>Select Events to Import ({events.length} found)</h3>
          
          {events.map((event, index) => (
            <div key={index} className="event-item">
              <input
                type="checkbox"
                id={`event-${index}`}
                checked={selectedEvents.has(index)}
                onChange={() => toggleEventSelection(index)}
              />
              <label htmlFor={`event-${index}`} className="event-label">
                <div className="event-info">
                  <strong>{event.title}</strong>
                  <span className="event-date">
                    {event.date} {event.startTime && `at ${event.startTime}`}
                  </span>
                  {event.location && <span className="event-location">📍 {event.location}</span>}
                </div>
              </label>
            </div>
          ))}

          <div className="import-actions">
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
            <button
              type="button"
              className="btn-import"
              onClick={handleImportSelected}
              disabled={selectedEvents.size === 0}
            >
              Import {selectedEvents.size} Event{selectedEvents.size !== 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}

      {!events.length && (
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default FacebookImport;
