import React from 'react';
import './BottomNav.css';

/**
 * Bottom Navigation Bar with 6 main action buttons
 * Matches Date-Track UI specification
 */
function BottomNav({ 
  onReturn, 
  onAddEvent, 
  onLinkEmail, 
  onNotes, 
  onSettings, 
  onDesign,
  currentPage = 'main'
}) {
  return (
    <nav className="bottom-nav">
      <button 
        className="nav-btn nav-btn--return"
        onClick={onReturn}
        aria-label="Return to main page"
        disabled={currentPage === 'main'}
      >
        <span className="nav-btn__icon">←</span>
        <span className="nav-btn__label">Return</span>
      </button>

      <button 
        className="nav-btn nav-btn--add-event"
        onClick={onAddEvent}
        aria-label="Add new event"
      >
        <span className="nav-btn__icon">➕</span>
        <span className="nav-btn__label">Add Event</span>
      </button>

      <button 
        className="nav-btn nav-btn--link-email"
        onClick={onLinkEmail}
        aria-label="Link email account"
      >
        <span className="nav-btn__icon">📧</span>
        <span className="nav-btn__label">Link Email</span>
      </button>

      <button 
        className="nav-btn nav-btn--notes"
        onClick={onNotes}
        aria-label="Open notes"
      >
        <span className="nav-btn__icon">📝</span>
        <span className="nav-btn__label">Notes</span>
      </button>

      <button 
        className="nav-btn nav-btn--settings"
        onClick={onSettings}
        aria-label="Open settings"
      >
        <span className="nav-btn__icon">⚙️</span>
        <span className="nav-btn__label">Settings</span>
      </button>

      <button 
        className="nav-btn nav-btn--design"
        onClick={onDesign}
        aria-label="Event design"
      >
        <span className="nav-btn__icon">🎨</span>
        <span className="nav-btn__label">Design</span>
      </button>
    </nav>
  );
}

export default BottomNav;
