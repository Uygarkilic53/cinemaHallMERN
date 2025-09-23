/**
 * Parses a time string "HH:MM" and returns a Date object (today's date).
 * Returns null if invalid.
 */
export function parseShowtime(timeStr) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(timeStr.trim());
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Formats a Date object to "HH:MM" string.
 */
export function formatTime(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Checks if a Date object is within cinema hours.
 * cinemaOpenHour, cinemaCloseHour are numbers (e.g., 8, 24)
 */
export function isWithinCinemaHours(
  date,
  cinemaOpenHour = 8,
  cinemaCloseHour = 24
) {
  const hours = date.getHours() + date.getMinutes() / 60;

  // Handle midnight (00:00) as end of day
  if (cinemaCloseHour === 24 && hours === 0) {
    return true;
  }

  return hours >= cinemaOpenHour && hours < cinemaCloseHour;
}

/**
 * Calculates the next possible showtime given current start, movie duration, and break time
 * @param {Date} currentStart - The start time of current showing
 * @param {number} movieDuration - Movie duration in minutes
 * @param {number} breakTime - Break time in minutes (default 15)
 */
export function calculateNextShowtime(
  currentStart,
  movieDuration,
  breakTime = 15
) {
  const next = new Date(currentStart);
  next.setMinutes(next.getMinutes() + movieDuration + breakTime);
  return next;
}

/**
 * Checks if a new showtime overlaps with existing showtimes
 * @param {Date} newStart - New showtime start
 * @param {number} duration - Movie duration in minutes
 * @param {Array} existingTimes - Array of existing showtimes (Date objects)
 */
export function isOverlappingShowtimes(
  newStart,
  duration,
  existingTimes,
  breakTime = 15
) {
  if (!newStart || !duration || !existingTimes.length) return false;

  const newEnd = new Date(newStart);
  newEnd.setMinutes(newEnd.getMinutes() + duration + breakTime);

  return existingTimes.some((existingStart) => {
    if (!existingStart) return false;

    const existingEnd = new Date(existingStart);
    existingEnd.setMinutes(existingEnd.getMinutes() + duration + breakTime);

    // Check for overlap: new show starts before existing ends AND new show ends after existing starts
    return newStart < existingEnd && newEnd > existingStart;
  });
}

/**
 * Generates suggested next showtimes based on existing times
 * @param {Array} existingTimes - Array of existing showtime strings or Date objects
 * @param {number} duration - Movie duration in minutes
 * @param {number} breakTime - Break time in minutes
 * @param {number} maxSuggestions - Maximum number of suggestions to return
 */
export function generateSuggestedShowtimes(
  existingTimes,
  duration,
  breakTime = 15,
  maxSuggestions = 5
) {
  const suggestions = [];
  const parsedExisting = existingTimes
    .map((time) => (typeof time === "string" ? parseShowtime(time) : time))
    .filter(Boolean)
    .sort((a, b) => a.getTime() - b.getTime());

  if (parsedExisting.length === 0) {
    // If no existing times, start from 8:00 AM
    const firstShow = new Date();
    firstShow.setHours(8, 0, 0, 0);
    suggestions.push(formatTime(firstShow));
  } else {
    // Generate suggestions based on the last showtime
    const lastShow = parsedExisting[parsedExisting.length - 1];
    let nextShow = calculateNextShowtime(lastShow, duration, breakTime);

    let count = 0;
    while (count < maxSuggestions && isWithinCinemaHours(nextShow, 8, 24)) {
      const nextShowStr = formatTime(nextShow);

      // Make sure this suggestion doesn't overlap with existing times
      if (
        !isOverlappingShowtimes(nextShow, duration, parsedExisting, breakTime)
      ) {
        suggestions.push(nextShowStr);
        count++;
      }

      // Calculate next possible time
      nextShow = calculateNextShowtime(nextShow, duration, breakTime);
    }
  }

  return suggestions;
}

/**
 * Validates if a showtime can be added
 * @param {string} timeStr - Time string to validate
 * @param {number} duration - Movie duration in minutes
 * @param {Array} existingTimes - Array of existing showtime strings
 */
export function validateShowtime(timeStr, duration, existingTimes) {
  const errors = [];

  // Parse the time
  const parsed = parseShowtime(timeStr);
  if (!parsed) {
    errors.push("Invalid time format. Use HH:MM format.");
    return { isValid: false, errors };
  }

  // Check cinema hours
  if (!isWithinCinemaHours(parsed, 8, 24)) {
    errors.push("Showtime must be between 08:00 and 00:00.");
    return { isValid: false, errors };
  }

  // Check for duplicates
  const existingParsed = existingTimes
    .map((time) => parseShowtime(time))
    .filter(Boolean);

  const isDuplicate = existingParsed.some(
    (existing) =>
      existing.getHours() === parsed.getHours() &&
      existing.getMinutes() === parsed.getMinutes()
  );

  if (isDuplicate) {
    errors.push("This showtime already exists.");
    return { isValid: false, errors };
  }

  // Check for overlaps
  if (duration && isOverlappingShowtimes(parsed, duration, existingParsed)) {
    errors.push("This showtime overlaps with another showing.");
    return { isValid: false, errors };
  }

  // Check if movie would end after midnight
  const endTime = new Date(parsed);
  endTime.setMinutes(endTime.getMinutes() + duration);

  if (endTime.getHours() > 0 && endTime.getHours() < 8) {
    errors.push("Movie would end after midnight. Choose an earlier time.");
    return { isValid: false, errors };
  }

  return { isValid: true, errors: [] };
}
