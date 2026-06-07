// Date parsing and formatting utilities

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const today = () => {
  const d = new Date();
  return formatDate(d);
};

export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDate = (dateStr) => {
  return new Date(dateStr + 'T00:00:00');
};

export const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
};

export const dateLabel = (dateStr) => {
  const todayStr = today();
  const yesterdayStr = daysAgo(1);

  if (dateStr === todayStr) return 'Today';
  if (dateStr === yesterdayStr) return 'Yesterday';

  const date = parseDate(dateStr);
  const dayName = DAYS[date.getDay()];
  const monthName = MONTHS[date.getMonth()];
  const day = date.getDate();

  return `${dayName}, ${monthName} ${day}`;
};

export const shortDateLabel = (dateStr) => {
  const todayStr = today();
  if (dateStr === todayStr) return 'Today';

  const date = parseDate(dateStr);
  const monthName = MONTHS[date.getMonth()];
  const day = date.getDate();

  return `${monthName} ${day}`;
};

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 5)  return 'It\'s late-night';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Week and month boundaries (for progress calculations)
export const getStartOfWeek = (dateStr) => {
  const date = parseDate(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day;
  const sunday = new Date(date.setDate(diff));
  return formatDate(sunday);
};

export const getEndOfWeek = (dateStr) => {
  const date = parseDate(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + 6;
  const saturday = new Date(date.setDate(diff));
  return formatDate(saturday);
};

export const getStartOfMonth = (dateStr) => {
  const date = parseDate(dateStr);
  return formatDate(new Date(date.getFullYear(), date.getMonth(), 1));
};

export const getEndOfMonth = (dateStr) => {
  const date = parseDate(dateStr);
  return formatDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
};

export const getPreviousMonth = (dateStr) => {
  const date = parseDate(dateStr);
  return formatDate(new Date(date.getFullYear(), date.getMonth() - 1, date.getDate()));
};

export const getMonthName = (dateStr) => {
  const date = parseDate(dateStr);
  return MONTHS[date.getMonth()];
};

// Count days between two dates (inclusive of start, exclusive of end)
export const daysBetween = (startStr, endStr) => {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Compare two dates: -1 if before, 0 if same, 1 if after
export const compareDates = (dateStr1, dateStr2) => {
  if (dateStr1 < dateStr2) return -1;
  if (dateStr1 > dateStr2) return 1;
  return 0;
};

// Get all dates from start to end (inclusive, sorted descending)
export const dateRange = (startStr, endStr) => {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates.reverse();
};

// Get all dates in a month
export const datesInMonth = (dateStr) => {
  const start = getStartOfMonth(dateStr);
  const end = getEndOfMonth(dateStr);
  return dateRange(start, end);
};

// Get last N days from today
export const lastNDays = (n) => {
  const todayStr = today();
  const earlierStr = daysAgo(n - 1);
  return dateRange(earlierStr, todayStr);
};

// Get current time-of-day: "morning", "afternoon", "evening"
export const getCurrentTimeOfDay = () => {
  return getGreeting();
};

// Convert time-of-day string to greeting
export const getTimeLabel = (timeOfDay) => {
  const labels = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    anytime: 'Anytime'
  };
  return labels[timeOfDay] || timeOfDay;
};

// Get icon for time of day
export const getTimeIcon = (timeOfDay) => {
  const icons = {
    morning: 'Sunrise',
    afternoon: 'Sun',
    evening: 'Moon',
    anytime: 'Clock'
  };
  return icons[timeOfDay] || 'Clock';
};
