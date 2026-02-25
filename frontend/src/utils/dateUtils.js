/**
 * Formats a Date object to a YYYY-MM-DD string.
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the number of days in a given month.
 * @param {number} year
 * @param {number} month - 0-indexed (0 = January)
 * @returns {number}
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Returns the day of week (0 = Sunday, 6 = Saturday) for the first day of the month.
 * @param {number} year
 * @param {number} month - 0-indexed
 * @returns {number}
 */
export function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

/**
 * Compares two Date objects and returns true if they represent the same calendar day.
 * @param {Date} date1
 * @param {Date} date2
 * @returns {boolean}
 */
export function isSameDay(date1, date2) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
