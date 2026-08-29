/**
 * Centralized Timezone Utilities for Asia/Kolkata (IST)
 * Required to ensure consistency across the recruitment platform regardless of where the server is hosted.
 */

const RECRUITMENT_TIMEZONE = "Asia/Kolkata";

/**
 * Returns the start and end of the day in UTC, corresponding to midnight to 23:59:59.999 in IST.
 * If no date string is provided, it uses the current time in IST.
 */
export function getISTDateBounds(dateString?: string) {
  const now = new Date();
  
  // Create an explicit Date object locked to IST boundaries
  const istString = dateString
    ? new Date(dateString).toLocaleString("en-US", { timeZone: RECRUITMENT_TIMEZONE })
    : now.toLocaleString("en-US", { timeZone: RECRUITMENT_TIMEZONE });
    
  const istDate = new Date(istString);
  
  const year = istDate.getFullYear();
  const month = istDate.getMonth();
  const day = istDate.getDate();
  
  // IST is UTC+5:30 (5.5 hours)
  const startOfDay = new Date(Date.UTC(year, month, day, 0, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
  const endOfDay = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - (5.5 * 60 * 60 * 1000));
  const endOfWeek = new Date(endOfDay.getTime() + 7 * 86400000);
  
  return { startOfDay, endOfDay, endOfWeek };
}

/**
 * Converts a UTC Date object into an IST YYYY-MM-DD string for analytics grouping or comparisons.
 */
export function toISTDateString(date: Date): string {
  return date.toLocaleString("en-CA", { 
    timeZone: RECRUITMENT_TIMEZONE, 
    year: "numeric", 
    month: "2-digit", 
    day: "2-digit" 
  });
}

/**
 * Converts a UTC Date object to an HH:MM string in IST.
 */
export function toISTTimeString(date: Date): string {
  return date.toLocaleTimeString("en-GB", {
    timeZone: RECRUITMENT_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

/**
 * Converts an IST date and time string to a UTC Date object.
 * @param date YYYY-MM-DD
 * @param time HH:MM
 */
export function parseISTDateToUTC(date: string, time: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  
  // Create UTC date assuming IST (UTC - 5.5 hours)
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0) - (5.5 * 60 * 60 * 1000));
}
