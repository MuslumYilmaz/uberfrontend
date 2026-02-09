const { APP_TIMEZONE } = require('./constants');

function formatPartsInTz(date, timeZone = APP_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const values = Object.create(null);
  for (const part of parts) values[part.type] = part.value;
  return {
    year: values.year,
    month: values.month,
    day: values.day,
  };
}

function dayKeyInTimezone(date = new Date(), timeZone = APP_TIMEZONE) {
  const { year, month, day } = formatPartsInTz(date, timeZone);
  return `${year}-${month}-${day}`;
}

function shiftDayKey(dayKey, deltaDays) {
  const dt = new Date(`${dayKey}T00:00:00.000Z`);
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().slice(0, 10);
}

function dayDiffByKey(fromDayKey, toDayKey) {
  if (!fromDayKey || !toDayKey) return Infinity;
  const from = new Date(`${fromDayKey}T00:00:00.000Z`).getTime();
  const to = new Date(`${toDayKey}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to)) return Infinity;
  return Math.round((to - from) / 86400000);
}

function weekBoundsFromDayKey(dayKey) {
  const day = new Date(`${dayKey}T00:00:00.000Z`);
  const weekday = day.getUTCDay(); // Sun=0..Sat=6
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const start = shiftDayKey(dayKey, mondayOffset);
  const end = shiftDayKey(start, 6);
  return { weekKey: start, startDayKey: start, endDayKey: end };
}

function currentWeekBounds(timeZone = APP_TIMEZONE) {
  return weekBoundsFromDayKey(dayKeyInTimezone(new Date(), timeZone));
}

module.exports = {
  dayKeyInTimezone,
  shiftDayKey,
  dayDiffByKey,
  weekBoundsFromDayKey,
  currentWeekBounds,
};
