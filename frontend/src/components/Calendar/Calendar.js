import React, { useState } from 'react';
import './Calendar.css';
import { getDaysInMonth, getFirstDayOfMonth, formatDate } from '../../utils/dateUtils';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function Calendar({ events = [] }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Build array of cells: leading blanks + day numbers
  const totalCells = firstDayOfMonth + daysInMonth;
  const rows = Math.ceil(totalCells / 7);
  const cells = Array.from({ length: rows * 7 }, (_, i) => {
    const dayNumber = i - firstDayOfMonth + 1;
    return dayNumber >= 1 && dayNumber <= daysInMonth ? dayNumber : null;
  });

  const getEventsForDay = (day) => {
    if (!day) return [];
    const dateStr = formatDate(new Date(year, month, day));
    return events.filter((e) => e.date === dateStr);
  };

  // Compute today's components once to avoid creating Date objects on every cell render
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDate = today.getDate();

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="calendar-nav-btn" onClick={handlePrevMonth} aria-label="Previous month">
          &#8249; Prev
        </button>
        <h2 className="calendar-title">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button className="calendar-nav-btn" onClick={handleNextMonth} aria-label="Next month">
          Next &#8250;
        </button>
      </div>

      <div className="calendar-grid">
        {DAYS_OF_WEEK.map((day) => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}

        {cells.map((day, idx) => {
          const dayEvents = getEventsForDay(day);
          const isToday =
            day &&
            todayYear === year &&
            todayMonth === month &&
            todayDate === day;

          return (
            <div
              key={idx}
              className={`calendar-cell${day ? '' : ' calendar-cell--empty'}${isToday ? ' calendar-cell--today' : ''}`}
            >
              {day && (
                <>
                  <span className="calendar-day-number">{day}</span>
                  <div className="calendar-events">
                    {dayEvents.map((event) => (
                      <div key={event.id} className="calendar-event" title={event.title}>
                        {event.title}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Calendar;
