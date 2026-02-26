import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MainPage.css';
import Calendar from '../components/Calendar/Calendar';
import BottomNav from '../components/Navigation/BottomNav';

/**
 * Main Page: 50% Calendar (top) + 50% Navigation Buttons (bottom)
 * Per UI specification - expandable calendar with 6-button navigation
 */
function MainPage({ onOpenEmailModal }) {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [notes, setNotes] = useState({});
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load events and notes from API
  useEffect(() => {
    loadEventsAndNotes();
  }, []);

  const loadEventsAndNotes = async () => {
    try {
      setLoading(true);
      
      // Load events
      const eventsResponse = await fetch('/api/events', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEvents(eventsData);
      }

      // Load notes (if notes API exists)
      // For now, using local storage or empty state
      const savedNotes = localStorage.getItem('calendar_notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (dateStr, day) => {
    // Navigate to Event Setup page for the selected date
    navigate(`/event/new/${dateStr}`);
  };

  const handleToggleExpand = () => {
    setIsCalendarExpanded(!isCalendarExpanded);
  };

  const handleReturn = () => {
    // Return button disabled on main page (no-op)
    // Could be used if coming from expanded view to collapse
    if (isCalendarExpanded) {
      setIsCalendarExpanded(false);
    }
  };

  const handleAddEvent = () => {
    // Navigate to Event Setup page for today
    const today = new Date().toISOString().split('T')[0];
    navigate(`/event/new/${today}`);
  };

  const handleLinkEmail = () => {
    // Open Email Link modal
    if (onOpenEmailModal) {
      onOpenEmailModal();
    }
  };

  const handleNotes = () => {
    // Navigate to Notes page
    navigate('/notes');
  };

  const handleSettings = () => {
    // Navigate to Settings page
    navigate('/settings');
  };

  const handleDesign = () => {
    // Navigate to Design page (for latest event, or show a selector)
    // For now, go to event page
    navigate('/event');
  };

  return (
    <div className="main-page">
      {/* Top 50%: Calendar */}
      <div className={`main-page__calendar-section ${isCalendarExpanded ? 'expanded' : ''}`}>
        <Calendar
          events={events}
          notes={notes}
          onDayClick={handleDayClick}
          isExpanded={isCalendarExpanded}
          onToggleExpand={handleToggleExpand}
        />
      </div>

      {/* Bottom 50%: Navigation Buttons */}
      {!isCalendarExpanded && (
        <div className="main-page__nav-section">
          <BottomNav
            onReturn={handleReturn}
            onAddEvent={handleAddEvent}
            onLinkEmail={handleLinkEmail}
            onNotes={handleNotes}
            onSettings={handleSettings}
            onDesign={handleDesign}
            currentPage="main"
          />
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="main-page__loading">
          <div className="spinner"></div>
          <p>Loading your calendar...</p>
        </div>
      )}
    </div>
  );
}

export default MainPage;
