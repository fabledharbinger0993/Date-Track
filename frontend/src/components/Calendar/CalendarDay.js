import React from 'react';
import './CalendarDay.css';

/**
 * Individual calendar day cell with event dots, multi-day dashes, and sticky notes
 * Supports stacking up to 3 events with visual indicators
 */
function CalendarDay({ 
  day, 
  events = [], 
  note = null,
  isToday = false,
  onClick 
}) {
  if (!day) {
    return <div className="calendar-day calendar-day--empty"></div>;
  }

  // Calculate positions for event dots (stacking system)
  const eventPositions = events.slice(0, 3).map((_, index) => {
    const count = Math.min(events.length, 3);
    if (count === 1) return 50; // Single event at 50%
    if (count === 2) return index === 0 ? 33 : 67; // Two events at 33% and 67%
    // Three events at 25%, 50%, 75%
    return [25, 50, 75][index];
  });

  const hasOverflow = events.length > 3;

  return (
    <div 
      className={`calendar-day ${isToday ? 'calendar-day--today' : ''}`}
      onClick={() => onClick && onClick(day)}
      role="button"
      tabIndex={0}
      aria-label={`${day}, ${events.length} events${note ? ', has note' : ''}`}
    >
      {/* Day Number */}
      <span className="calendar-day__number">{day}</span>

      {/* Sticky Note Icon (top-right corner) */}
      {note && (
        <span 
          className="calendar-day__note-icon" 
          title="Has note attached"
          aria-label="Note"
        >
          📝
        </span>
      )}

      {/* Event Indicators Container */}
      <div className="calendar-day__events">
        {events.slice(0, 3).map((event, index) => {
          const position = eventPositions[index];
          const isMultiDay = event.isMultiDay;
          const isStart = event.position === 'start';
          const isMiddle = event.position === 'middle';
          const isEnd = event.position === 'end';

          return (
            <div
              key={event.id || index}
              className={`event-indicator event-indicator--${event.category || 'default'}`}
              style={{
                top: `${position}%`,
                transform: 'translateY(-50%)'
              }}
              title={event.title}
            >
              {/* Start: Dot */}
              {(!isMultiDay || isStart) && (
                <span className="event-indicator__dot"></span>
              )}

              {/* Middle/End: Dash */}
              {isMultiDay && (isMiddle || isEnd) && (
                <span className={`event-indicator__dash ${isEnd ? 'event-indicator__dash--end' : ''}`}></span>
              )}
            </div>
          );
        })}

        {/* Overflow Indicator */}
        {hasOverflow && (
          <div className="calendar-day__overflow">
            +{events.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}

export default CalendarDay;
