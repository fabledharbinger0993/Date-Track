import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Calendar from '../components/Calendar/Calendar';

const API_BASE = 'http://localhost:5000/api';

function Home() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    axios
      .get(`${API_BASE}/events`)
      .then((res) => {
        setEvents(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching events:', err);
        const message =
          err?.response?.data?.message ||
          err?.message ||
          'Failed to load events. Is the backend running?';
        setError(message);
        setLoading(false);
      });
  }, []);

  const handleSyncGoogle = () => {
    window.location.href = `${API_BASE}/auth/google`;
  };

  const handleSyncMicrosoft = () => {
    window.location.href = `${API_BASE}/auth/microsoft`;
  };

  const handleSyncApple = () => {
    window.location.href = `${API_BASE}/auth/apple`;
  };

  return (
    <div className="home">
      {loading && <p className="status-msg">Loading events...</p>}
      {error && <p className="status-msg status-msg--error">{error}</p>}

      <Calendar events={events} />

      <section className="sync-section">
        <h2>Sync Calendar</h2>
        <p>Connect your external calendars to import events.</p>
        <div className="sync-buttons">
          <button className="sync-btn sync-btn--google" onClick={handleSyncGoogle}>
            Sync Google Calendar
          </button>
          <button className="sync-btn sync-btn--microsoft" onClick={handleSyncMicrosoft}>
            Sync Microsoft Calendar
          </button>
          <button className="sync-btn sync-btn--apple" onClick={handleSyncApple}>
            Sync Apple Calendar
          </button>
        </div>
      </section>
    </div>
  );
}

export default Home;
