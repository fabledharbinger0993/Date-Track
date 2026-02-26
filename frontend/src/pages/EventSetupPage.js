import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './EventSetupPage.css';

/**
 * Event Setup Page - Create/Edit Events
 * Form fields: title, date, time, location, attendees, reminders, notes, repeat
 */
function EventSetupPage() {
  const navigate = useNavigate();
  const { eventId, date } = useParams();
  
  const [event, setEvent] = useState({
    id: null,
    title: '',
    startDate: date || new Date().toISOString().split('T')[0],
    endDate: '',
    startTime: '09:00',
    endTime: '10:00',
    isAllDay: false,
    location: '',
    attendees: '',
    reminder: '15',
    notes: '',
    repeat: 'none',
    category: 'default'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (eventId) {
      loadEvent(eventId);
    }
  }, [eventId]);

  const loadEvent = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/events/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const eventData = await response.json();
        setEvent(eventData);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setEvent({ ...event, [field]: value });
  };

  const handleAllDayToggle = () => {
    setEvent({ ...event, isAllDay: !event.isAllDay });
  };

  const handleSave = async () => {
    if (!event.title.trim()) {
      alert('Please enter an event title');
      return;
    }

    try {
      setLoading(true);
      
      const url = event.id ? `/api/events/${event.id}` : '/api/events';
      const method = event.id ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(event)
      });

      if (response.ok) {
        const savedEvent = await response.json();
        // Navigate back to calendar
        navigate('/calendar');
      } else {
        alert('Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Error saving event');
    } finally {
      setLoading(false);
    }
  };

  const handleDesign = () => {
    // Save event first, then navigate to design page
    if (event.id) {
      navigate(`/event/${event.id}/design`);
    } else {
      alert('Please save the event first');
    }
  };

  return (
    <div className="event-setup-page">
      {/* Header */}
      <div className="event-setup-page__header">
        <button className="event-setup-page__back-btn" onClick={() => navigate('/calendar')} aria-label="Back">
          ← Back
        </button>
        <h1 className="event-setup-page__title">
          {event.id ? '✏️ Edit Event' : '➕ New Event'}
        </h1>
        <button className="event-setup-page__design-btn" onClick={handleDesign} aria-label="Design">
          🎨 Design
        </button>
      </div>

      {/* Form Content */}
      <div className="event-setup-page__content">
        <form className="event-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          {/* Event Title */}
          <div className="form-group">
            <label htmlFor="title">Event Title *</label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder="e.g., Team Meeting"
              value={event.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>

          {/* Category */}
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              className="form-select"
              value={event.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <option value="default">General</option>
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="urgent">Urgent</option>
              <option value="meeting">Meeting</option>
              <option value="reminder">Reminder</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                id="startDate"
                type="date"
                className="form-input"
                value={event.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">End Date</label>
              <input
                id="endDate"
                type="date"
                className="form-input"
                value={event.endDate}
                onChange={(e) => handleChange('endDate', e.target.value)}
                min={event.startDate}
              />
            </div>
          </div>

          {/* All Day Toggle */}
          <div className="form-group">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={event.isAllDay}
                onChange={handleAllDayToggle}
              />
              <span>All Day Event</span>
            </label>
          </div>

          {/* Time Range (only if not all-day) */}
          {!event.isAllDay && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="startTime">Start Time</label>
                <input
                  id="startTime"
                  type="time"
                  className="form-input"
                  value={event.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="endTime">End Time</label>
                <input
                  id="endTime"
                  type="time"
                  className="form-input"
                  value={event.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Location */}
          <div className="form-group">
            <label htmlFor="location">📍 Location</label>
            <input
              id="location"
              type="text"
              className="form-input"
              placeholder="e.g., Conference Room A, Zoom Link"
              value={event.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>

          {/* Attendees */}
          <div className="form-group">
            <label htmlFor="attendees">👥 Attendees</label>
            <input
              id="attendees"
              type="text"
              className="form-input"
              placeholder="Comma-separated emails"
              value={event.attendees}
              onChange={(e) => handleChange('attendees', e.target.value)}
            />
          </div>

          {/* Reminder */}
          <div className="form-group">
            <label htmlFor="reminder">⏰ Reminder</label>
            <select
              id="reminder"
              className="form-select"
              value={event.reminder}
              onChange={(e) => handleChange('reminder', e.target.value)}
            >
              <option value="none">No reminder</option>
              <option value="0">At time of event</option>
              <option value="5">5 minutes before</option>
              <option value="15">15 minutes before</option>
              <option value="30">30 minutes before</option>
              <option value="60">1 hour before</option>
              <option value="1440">1 day before</option>
            </select>
          </div>

          {/* Repeat */}
          <div className="form-group">
            <label htmlFor="repeat">🔁 Repeat</label>
            <select
              id="repeat"
              className="form-select"
              value={event.repeat}
              onChange={(e) => handleChange('repeat', e.target.value)}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes">📝 Notes</label>
            <textarea
              id="notes"
              className="form-textarea"
              placeholder="Add notes, description, or agenda..."
              rows="4"
              value={event.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onBack}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : event.id ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventSetupPage;
