/**
 * This script provides Turkey's current time in a human-friendly format for AI responses
 */

const getTurkeyTime = () => {
  const now = new Date();

  // Get Turkey time components
  const turkeyTimeOptions = {
    timeZone: "Europe/Istanbul",
    hour12: false,
  };

  const trDate = new Date(
    now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" })
  );

  const pad = (n) => n.toString().padStart(2, "0");

  const year = trDate.getFullYear();
  const month = pad(trDate.getMonth() + 1);
  const day = pad(trDate.getDate());
  const hour = pad(trDate.getHours());
  const min = pad(trDate.getMinutes());

  // Create human-readable format
  const dayName = trDate.toLocaleDateString("en-US", {
    timeZone: "Europe/Istanbul",
    weekday: "long",
  });

  const monthName = trDate.toLocaleDateString("en-US", {
    timeZone: "Europe/Istanbul",
    month: "long",
  });

  // For Turkish format: 20.11.2025
  const turkishDateFormat = `${day}.${month}.${year}`;

  // For English format: 20th of November 2025
  const getOrdinal = (n) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  const englishDateFormat = `${getOrdinal(
    parseInt(day)
  )} of ${monthName} ${year}`;

  // Technical ISO format (kept for system use)
  const strictIsoTurkey = `${year}-${month}-${day}T${hour}:${min}:00+03:00`;

  // Human-friendly AI context
  const aiTimeContext = `Today is ${dayName}, ${englishDateFormat}. The current time in Turkey is ${hour}:${min} (Turkey Time - TRT/UTC+3). When users ask about dates or times, use this as your reference point.`;

  return {
    turkishDateFormat,
    englishDateFormat,
    strictIsoTurkey,
    aiTimeContext,
    hour,
    min,
    dayName,
  };
};

export default getTurkeyTime;
