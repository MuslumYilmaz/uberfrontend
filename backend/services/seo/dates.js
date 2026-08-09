'use strict';

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date');
  return date.toISOString().slice(0, 10);
}

function dateKeyInTimezone(value = new Date(), timeZone = 'America/Los_Angeles') {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid date');
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid date key: ${dateKey}`);
  return utcDateKey(new Date(date.getTime() + days * DAY_MS));
}

function finalizedDateKey(now, lagDays) {
  return shiftDateKey(dateKeyInTimezone(now, 'America/Los_Angeles'), -Math.max(0, lagDays));
}

function detailExpiryForDate(dateKey) {
  const date = new Date(`${dateKey}T00:00:00.000Z`);
  return new Date(date.getTime() + 180 * DAY_MS);
}

function expiryFromNow(now, days) {
  return new Date(new Date(now).getTime() + days * DAY_MS);
}

function inclusiveDateCount(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00.000Z`).getTime();
  const end = new Date(`${endDate}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.floor((end - start) / DAY_MS) + 1);
}

module.exports = {
  DAY_MS,
  detailExpiryForDate,
  dateKeyInTimezone,
  expiryFromNow,
  finalizedDateKey,
  inclusiveDateCount,
  shiftDateKey,
  utcDateKey,
};
