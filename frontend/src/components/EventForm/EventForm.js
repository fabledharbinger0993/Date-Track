import React, { useState } from 'react';
import './EventForm.css';

const EventForm = ({ onSubmit, onCancel, initialEvent = null }) => {
  const [formData, setFormData] = useState({
    title: initialEvent?.title || '',
    description: initialEvent?.description || '',
    date: initialEvent?.date || '',
    startTime: initialEvent?.startTime || '',
    endTime: initialEvent?.endTime || '',
    location: initialEvent?.location || '',
    attendees: initialEvent?.attendees?.join(', ') || '',
    reminders: initialEvent?.reminders || ['15min'],
    recurring: initialEvent?.recurring || 'none',
    recurringEndDate: initialEvent?.recurringEndDate || '',
    timezone: initialEvent?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    color: initialEvent?.color || '#3b82f6',
    isAllDay: initialEvent?.isAllDay || false,
    visibility: initialEvent?.visibility || 'default',
    availability: initialEvent?.availability || 'busy',
    designs: initialEvent?.designs || [],
    attachments: initialEvent?.attachments || [],
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [canvaUrl, setCanvaUrl] = useState('');
  const [showCanvaInput, setShowCanvaInput] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleReminderChange = (e) => {
    const value = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, reminders: value }));
  };

  const handleAttachCanva = async () => {
    if (!canvaUrl.trim()) {
      alert('Please enter a Canva URL');
      return;
    }

    try {
      const API_BASE = process.env.REACT_APP_API_URL || `${window.location.origin}/api`;
      const response = await fetch(`${API_BASE}/integrations/canva/attach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: canvaUrl }),
      });

      const data = await response.json();

      if (response.ok && data.design) {
        setFormData(prev => ({
          ...prev,
          designs: [...prev.designs, data.design]
        }));
        setCanvaUrl('');
        setShowCanvaInput(false);
        alert('Canva design attached successfully!');
      } else {
        alert(data.message || 'Failed to attach Canva design');
      }
    } catch (error) {
      console.error('Canva attach error:', error);
      alert('Failed to attach Canva design');
    }
  };

  const handleRemoveDesign = (index) => {
    setFormData(prev => ({
      ...prev,
      designs: prev.designs.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert attendees string to array
    const attendeesArray = formData.attendees
      .split(',')
      .map(email => email.trim())
      .filter(email => email);

    const eventData = {
      ...formData,
      attendees: attendeesArray,
    };

    onSubmit(eventData);
  };

  return (
    <form className="event-form" onSubmit={handleSubmit}>
      <h2>{initialEvent ? 'Edit Event' : 'Create New Event'}</h2>

      {/* Basic Info */}
      <div className="form-section">
        <h3>Event Details</h3>
        
        <div className="form-group">
          <label htmlFor="title">Event Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Event title"
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            placeholder="Add event description..."
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="isAllDay">
              <input
                type="checkbox"
                id="isAllDay"
                name="isAllDay"
                checked={formData.isAllDay}
                onChange={handleChange}
              />
              All Day Event
            </label>
          </div>
        </div>

        {!formData.isAllDay && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">Start Time</label>
              <input
                type="time"
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">End Time</label>
              <input
                type="time"
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="location">Location</label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="Add location (will integrate with Maps)"
          />
        </div>

        <div className="form-group">
          <label htmlFor="color">Event Color</label>
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Attendees */}
      <div className="form-section">
        <h3>Invitations & RSVPs</h3>
        
        <div className="form-group">
          <label htmlFor="attendees">Attendees (comma-separated emails)</label>
          <input
            type="text"
            id="attendees"
            name="attendees"
            value={formData.attendees}
            onChange={handleChange}
            placeholder="email1@example.com, email2@example.com"
          />
          <small>Invitations will be sent to all attendees</small>
        </div>
      </div>

      {/* Reminders & Recurring */}
      <div className="form-section">
        <h3>Notifications & Recurrence</h3>
        
        <div className="form-group">
          <label htmlFor="reminders">Reminders (hold Ctrl/Cmd for multiple)</label>
          <select
            id="reminders"
            name="reminders"
            multiple
            value={formData.reminders}
            onChange={handleReminderChange}
            size="5"
          >
            <option value="none">No reminder</option>
            <option value="5min">5 minutes before</option>
            <option value="15min">15 minutes before</option>
            <option value="30min">30 minutes before</option>
            <option value="1hour">1 hour before</option>
            <option value="1day">1 day before</option>
            <option value="1week">1 week before</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="recurring">Recurring Event</label>
          <select
            id="recurring"
            name="recurring"
            value={formData.recurring}
            onChange={handleChange}
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Every 2 weeks</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="weekdays">Every weekday (Mon-Fri)</option>
          </select>
        </div>

        {formData.recurring !== 'none' && (
          <div className="form-group">
            <label htmlFor="recurringEndDate">Repeat Until (optional)</label>
            <input
              type="date"
              id="recurringEndDate"
              name="recurringEndDate"
              value={formData.recurringEndDate}
              onChange={handleChange}
            />
          </div>
        )}
      </div>

      {/* Canva Design & Attachments */}
      <div className="form-section">
        <h3>Event Design & Flyers</h3>
        
        {formData.designs.length > 0 && (
          <div className="designs-list">
            {formData.designs.map((design, index) => (
              <div key={index} className="design-item">
                <div className="design-info">
                  <span className="design-type">{design.type === 'canva' ? '🎨 Canva Design' : '🖼️ Image'}</span>
                  <span className="design-title">{design.title}</span>
                </div>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveDesign(index)}
                  title="Remove design"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {!showCanvaInput ? (
          <button
            type="button"
            className="btn-add-design"
            onClick={() => setShowCanvaInput(true)}
          >
            + Add Canva Design or Flyer
          </button>
        ) : (
          <div className="canva-input-section">
            <label htmlFor="canvaUrl">Paste Canva Share Link</label>
            <div className="canva-input-row">
              <input
                type="url"
                id="canvaUrl"
                value={canvaUrl}
                onChange={(e) => setCanvaUrl(e.target.value)}
                placeholder="https://www.canva.com/design/..."
              />
              <button
                type="button"
                className="btn-attach"
                onClick={handleAttachCanva}
              >
                Attach
              </button>
              <button
                type="button"
                className="btn-cancel-small"
                onClick={() => {
                  setShowCanvaInput(false);
                  setCanvaUrl('');
                }}
              >
                Cancel
              </button>
            </div>
            <small>Share your Canva design and paste the link here</small>
          </div>
        )}
      </div>

      {/* Advanced Options */}
      <div className="form-section">
        <button
          type="button"
          className="toggle-advanced"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? '▼' : '▶'} Advanced Options
        </button>

        {showAdvanced && (
          <>
            <div className="form-group">
              <label htmlFor="timezone">Timezone</label>
              <input
                type="text"
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="visibility">Visibility</label>
              <select
                id="visibility"
                name="visibility"
                value={formData.visibility}
                onChange={handleChange}
              >
                <option value="default">Default visibility</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="availability">Show me as</label>
              <select
                id="availability"
                name="availability"
                value={formData.availability}
                onChange={handleChange}
              >
                <option value="busy">Busy</option>
                <option value="free">Free</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" className="btn-cancel" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-submit">
          {initialEvent ? 'Update Event' : 'Create Event'}
        </button>
      </div>
    </form>
  );
};

export default EventForm;
