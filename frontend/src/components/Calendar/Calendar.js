import React, { useState, useEffect, useRef } from 'react';
import './Calendar.css';
import CalendarDay from './CalendarDay';
import { getDaysInMonth, getFirstDayOfMonth, formatDate } from '../../utils/dateUtils';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Enhanced Calendar with dots/dashes visual system, sticky notes, expand/collapse, and swipe navigation
 */
function Calendar({ events = [], notes = {}, onDayClick, onEventClick, isExpanded = false, onToggleExpand }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const calendarRef = useRef(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Navigation
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Swipe navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNextMonth();
    } else if (isRightSwipe) {
      handlePrevMonth();
    }
  };

  // Build calendar grid
  const totalCells = firstDayOfMonth + daysInMonth;
  const rows = Math.ceil(totalCells / 7);
  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const dayNumber = i - firstDayOfMonth + 1;
    return dayNumber >= 1 && dayNumber <= daysInMonth ? dayNumber : null;
  });

  // Process events for visual system (dots/dashes/stacking)
  const processEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = formatDate(new Date(year, month, day));
    
    // Get all events that overlap this day
    const dayEvents = events
      .filter((e) => {
        if (e.startDate && e.endDate) {
          // Multi-day event
          const start = new Date(e.startDate);
          const end = new Date(e.endDate);
          const current = new Date(year, month, day);
          return current >= start && current <= end;
        } else {
          // Single-day event
          return e.date === dateStr;
        }
      })
      .map((e) => {
        const isMultiDay = !!(e.startDate && e.endDate);
        let position = 'single';
        
        if (isMultiDay) {
          const start = new Date(e.startDate);
          const end = new Date(e.endDate);
          const current = new Date(year, month, day);
          
          if (current.toDateString() === start.toDateString()) {
            position = 'start';
          } else if (current.toDateString() === end.toDateString()) {
            position = 'end';
          } else {
            position = 'middle';
          }
        }
        
        return {
          ...e,
          isMultiDay,
          position
        };
      });

    return dayEvents;
  };

  const getNoteForDay = (day) => {
    if (!day) return null;
    const dateStr = formatDate(new Date(year, month, day));
    return notes[dateStr] || null;
  };

  // Today detection
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  const handleDayClick = (day) => {
    if (onDayClick) {
      const dateStr = formatDate(new Date(year, month, day));
      onDayClick(dateStr, day);
    }
  };

  return (
    <div 
      className={`calendar ${isExpanded ? 'calendar--expanded' : ''}`}
      ref={calendarRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header with navigation and expand button */}
      <div className="calendar-header">
        <button 
          className="calendar-nav-btn" 
          onClick={handlePrevMonth} 
          aria-label="Previous month"
        >
          &#8249;
        </button>
        
        <h2 className="calendar-title">
          {MONTH_NAMES[month]} {year}
        </h2>
        
        <button 
          className="calendar-nav-btn" 
          onClick={handleNextMonth} 
          aria-label="Next month"
        >
          &#8250;
        </button>

        {onToggleExpand && (
          <button 
            className="calendar-expand-btn" 
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Collapse calendar' : 'Expand calendar'}
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '▼' : '▲'}
          </button>
        )}
      </div>

      {/* Day headers */}
      <div className="calendar-grid">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {cells.map((day, idx) => {
          const dayEvents = processEventsForDay(day);
          const dayNote = getNoteForDay(day);
          const isToday =
            day &&
            todayYear === year &&
            todayMonth === month &&
            todayDate === day;

          return (
            <CalendarDay
              key={idx}
              day={day}
              events={dayEvents}
              note={dayNote}
              isToday={isToday}
              onClick={handleDayClick}
            />
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
