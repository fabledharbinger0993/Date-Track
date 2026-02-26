import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import './EventDesignPage.css';

/**
 * Event Design Page - Apple Invites Aesthetic
 * Templates, color picker, backgrounds, typography, image upload, shareable invites
 */
function EventDesignPage() {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  
  const [design, setDesign] = useState({
    template: 'modern',
    backgroundColor: '#ffffff',
    accentColor: '#4A90E2',
    backgroundImage: null,
    fontFamily: 'SF Pro',
    fontSize: 'medium',
    imageUrl: null,
    includeMap: true,
    includeCalendarButton: true
  });

  const [previewMode, setPreviewMode] = useState('invite');
  const [loading, setLoading] = useState(false);

  const templates = [
    { id: 'modern', name: 'Modern', icon: '✨' },
    { id: 'elegant', name: 'Elegant', icon: '🌟' },
    { id: 'minimal', name: 'Minimal', icon: '⚪' },
    { id: 'bold', name: 'Bold', icon: '🔥' },
    { id: 'classic', name: 'Classic', icon: '📜' },
    { id: 'festive', name: 'Festive', icon: '🎉' }
  ];

  const colorPalettes = [
    { name: 'Ocean', bg: '#E3F2FD', accent: '#1976D2' },
    { name: 'Sunset', bg: '#FFE0B2', accent: '#F57C00' },
    { name: 'Forest', bg: '#E8F5E9', accent: '#388E3C' },
    { name: 'Purple', bg: '#F3E5F5', accent: '#7B1FA2' },
    { name: 'Rose', bg: '#FCE4EC', accent: '#C2185B' },
    { name: 'Slate', bg: '#ECEFF1', accent: '#455A64' }
  ];

  useEffect(() => {
    // Load event data
    if (eventId) {
      loadEvent(eventId);
    }
  }, [eventId]);

  useEffect(() => {
    // Load saved design from event or localStorage
    if (event?.design) {
      setDesign(event.design);
    }
  }, [event]);

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
      } else {
        alert('Failed to load event');
        navigate('/calendar');
      }
    } catch (error) {
      console.error('Error loading event:', error);
      alert('Error loading event');
      navigate('/calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId) => {
    setDesign({ ...design, template: templateId });
  };

  const handleColorPalette = (palette) => {
    setDesign({
      ...design,
      backgroundColor: palette.bg,
      accentColor: palette.accent
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setDesign({ ...design, imageUrl: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      const updatedEvent = {
        ...event,
        design
      };

      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedEvent)
      });

      if (response.ok) {
        alert('Design saved!');
        navigate('/calendar');
      }
    } catch (error) {
      console.error('Error saving design:', error);
      alert('Error saving design');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/invite/${event.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: `You're invited to ${event.title}`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Shareable link copied to clipboard!');
    }
  };

  return (
    <div className="event-design-page">
      {/* Header */}
      <div className="event-design-page__header">
        <button className="event-design-page__back-btn" onClick={() => navigate('/calendar')} aria-label="Back">
          ← Back
        </button>
        <h1 className="event-design-page__title">🎨 Design Invite</h1>
        <button className="event-design-page__share-btn" onClick={handleShare} aria-label="Share">
          📤 Share
        </button>
      </div>

      {/* Content */}
      <div className="event-design-page__content">
        {/* Left: Design Controls */}
        <div className="design-controls">
          <h2>Customize Invite</h2>

          {/* Templates */}
          <section className="control-section">
            <h3>Template</h3>
            <div className="template-grid">
              {templates.map((template) => (
                <button
                  key={template.id}
                  className={`template-option ${design.template === template.id ? 'active' : ''}`}
                  onClick={() => handleTemplateChange(template.id)}
                >
                  <span className="template-option__icon">{template.icon}</span>
                  <span className="template-option__name">{template.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Color Palettes */}
          <section className="control-section">
            <h3>Color Palette</h3>
            <div className="palette-grid">
              {colorPalettes.map((palette) => (
                <button
                  key={palette.name}
                  className="palette-option"
                  onClick={() => handleColorPalette(palette)}
                  title={palette.name}
                >
                  <span className="palette-option__bg" style={{ backgroundColor: palette.bg }}></span>
                  <span className="palette-option__accent" style={{ backgroundColor: palette.accent }}></span>
                </button>
              ))}
            </div>
          </section>

          {/* Custom Colors */}
          <section className="control-section">
            <h3>Custom Colors</h3>
            <div className="color-picker-group">
              <div className="color-picker">
                <label>Background</label>
                <input
                  type="color"
                  value={design.backgroundColor}
                  onChange={(e) => setDesign({ ...design, backgroundColor: e.target.value })}
                />
              </div>
              <div className="color-picker">
                <label>Accent</label>
                <input
                  type="color"
                  value={design.accentColor}
                  onChange={(e) => setDesign({ ...design, accentColor: e.target.value })}
                />
              </div>
            </div>
          </section>

          {/* Image Upload */}
          <section className="control-section">
            <h3>Cover Image</h3>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="image-upload"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="image-upload-label">
              📷 Upload Image
            </label>
            {design.imageUrl && (
              <button
                className="btn--text"
                onClick={() => setDesign({ ...design, imageUrl: null })}
              >
                Remove Image
              </button>
            )}
          </section>

          {/* Typography */}
          <section className="control-section">
            <h3>Typography</h3>
            <select
              className="form-select"
              value={design.fontFamily}
              onChange={(e) => setDesign({ ...design, fontFamily: e.target.value })}
            >
              <option value="SF Pro">SF Pro (Apple)</option>
              <option value="New York">New York (Serif)</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Georgia">Georgia</option>
            </select>
          </section>

          {/* Options */}
          <section className="control-section">
            <h3>Options</h3>
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={design.includeMap}
                onChange={(e) => setDesign({ ...design, includeMap: e.target.checked })}
              />
              <span>Include Map</span>
            </label>
            <label className="toggle-option">
              <input
                type="checkbox"
                checked={design.includeCalendarButton}
                onChange={(e) => setDesign({ ...design, includeCalendarButton: e.target.checked })}
              />
              <span>Add to Calendar Button</span>
            </label>
          </section>

          {/* Save Button */}
          <button className="btn btn--primary btn--full" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : '💾 Save Design'}
          </button>
        </div>

        {/* Right: Preview */}
        <div className="design-preview">
          <div className="preview-toggle">
            <button
              className={previewMode === 'invite' ? 'active' : ''}
              onClick={() => setPreviewMode('invite')}
            >
              Invite View
            </button>
            <button
              className={previewMode === 'email' ? 'active' : ''}
              onClick={() => setPreviewMode('email')}
            >
              Email View
            </button>
          </div>

          <div
            className={`invite-preview invite-preview--${design.template}`}
            style={{
              backgroundColor: design.backgroundColor,
              fontFamily: design.fontFamily
            }}
          >
            {/* Cover Image */}
            {design.imageUrl && (
              <div className="invite-preview__image">
                <img src={design.imageUrl} alt="Event cover" />
              </div>
            )}

            {/* Content */}
            <div className="invite-preview__content">
              <h1 style={{ color: design.accentColor }}>{event?.title || 'Event Title'}</h1>
              
              <div className="invite-preview__details">
                <div className="detail-item">
                  <span className="detail-icon" style={{ color: design.accentColor }}>📅</span>
                  <span>{event?.startDate || 'Date'}</span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-icon" style={{ color: design.accentColor }}>🕐</span>
                  <span>{event?.startTime || 'Time'}</span>
                </div>
                
                {event?.location && (
                  <div className="detail-item">
                    <span className="detail-icon" style={{ color: design.accentColor }}>📍</span>
                    <span>{event.location}</span>
                  </div>
                )}
              </div>

              {event?.notes && (
                <p className="invite-preview__notes">{event.notes}</p>
              )}

              {design.includeCalendarButton && (
                <button
                  className="invite-preview__action-btn"
                  style={{
                    backgroundColor: design.accentColor,
                    color: '#ffffff'
                  }}
                >
                  Add to Calendar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDesignPage;
