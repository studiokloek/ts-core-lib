import { floor, isDate, padStart, toNumber, map } from 'lodash-es';

export function getDateString(date?: Date): string {
  const d = date || new Date();
  return `${d.getFullYear()}-${padStart(`${d.getMonth() + 1}`, 2, '0')}-${padStart(`${d.getDate()}`, 2, '0')}`;
}

export function isLeapYear(year: number): boolean {
  if (!year) {
    return false;
  }

  const d = new Date(year, 1, 28);
  d.setDate(d.getDate() + 1);
  return d.getMonth() === 1;
}

// wordt gebruikt voor date string uit firestore
export function getDateFromFirestoreString(value: string): Date | undefined {
  if (!value) {
    return;
  }

  const parts = map(`${value}`.split('-'), (v) => toNumber(v));

  if (!parts || parts.length !== 3) {
    return;
  }

  return new Date(parts[0], --parts[1], parts[2]);
}

export function getDateFromAPIString(value: string): Date {
  const parts = map(`${value}`.split(/\D/), (v) => toNumber(v));
  return new Date(parts[0], --parts[1], parts[2], parts[3], parts[4], parts[5]);
}

export function calulateAgeFromDate(birthday?: Date | string): number {
  if (!birthday) {
    return -1;
  }

  birthday = typeof birthday === 'string' ? new Date(birthday) : new Date(birthday.getTime());

  const now = new Date();

  let years = now.getFullYear() - birthday.getFullYear();
  birthday.setFullYear(birthday.getFullYear() + years);
  if (birthday > now) {
    years--;
    birthday.setFullYear(birthday.getFullYear() - 1);
  }

  const days = (now.getTime() - birthday.getTime()) / (3600 * 24 * 1000);
  return floor(years + days / (isLeapYear(now.getFullYear()) ? 366 : 365));
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return d1 && d2 && d1.getUTCFullYear() == d2.getUTCFullYear() && d1.getUTCMonth() == d2.getUTCMonth() && d1.getUTCDate() == d2.getUTCDate();
}

export function getDayDate(date?: Date): Date {
  if (!isDate(date)) {
    date = new Date();
  }

  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function isBeforeToday(before: Date): boolean {
  if (!isDate(before)) {
    return false;
  }

  // to UTC
  before = new Date(
    Date.UTC(before.getUTCFullYear(), before.getUTCMonth(), before.getUTCDate(), before.getUTCHours(), before.getUTCMinutes(), before.getUTCSeconds()),
  );

  const startOfToday = getDayDate();

  if (before < startOfToday) {
    return true;
  }

  return false;
}

export function isAfterToday(after: Date): boolean {
  if (!isDate(after)) {
    return false;
  }

  // to UTC
  after = new Date(
    Date.UTC(after.getUTCFullYear(), after.getUTCMonth(), after.getUTCDate(), after.getUTCHours(), after.getUTCMinutes(), after.getUTCSeconds()),
  );

  const endOfToday = getDayDate();
  endOfToday.setUTCHours(23, 59, 59);

  if (after > endOfToday) {
    return true;
  }

  return false;
}

export function isBetweenDates(start: Date, end: Date): boolean {
  if (!isDate(start) || !isDate(end)) {
    return false;
  }

  const now = new Date();

  if (now > start && now < end) {
    return true;
  }

  return false;
}

export function daysBetween(start: Date, end: Date): number {
  const oneDay = 1000 * 60 * 60 * 24,
    startDay = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
    endDay = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate());

  return (startDay - endDay) / oneDay;
}

export function getSecondsBetween(d1: Date, d2: Date): number {
  return Math.round((d1.getTime() - d2.getTime()) * 0.001);
}
