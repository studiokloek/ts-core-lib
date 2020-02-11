import { floor, isDate, padStart, toNumber, map } from 'lodash-es';

export function getDateString(date?: Date): string {
  const d = date || new Date();
  return `${d.getFullYear()}-${padStart(`${d.getMonth() + 1}`, 2, '0')}-${padStart(`${d.getDate()}`, 2, '0')}`;
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

  const parts = value.split('-');

  if (!parts || parts.length !== 3) {
    return;
  }

  return new Date(toNumber(parts[0]), toNumber(parts[1]) - 1, toNumber(parts[2]));
}

export function getDateFromAPIString(value: string): Date {
  const b = map(`${value}`.split(/\D/), v => toNumber(v));
  return new Date(b[0], --b[1], b[2], b[3], b[4], b[5]);
}

export function isSameDay(d1: Date, d2: Date): boolean {
  return d1 && d2 && d1.getUTCFullYear() == d2.getUTCFullYear() && d1.getUTCMonth() == d2.getUTCMonth() && d1.getUTCDate() == d2.getUTCDate();
}

export function getSecondsBetween(d1: Date, d2: Date): number {
  return Math.round((d1.getTime() - d2.getTime()) * 0.001);
}

export function calulateAgeFromDate(birthday?: Date | string): number {
  if (!birthday) {
    return -1;
  }

  if (typeof birthday === 'string') {
    birthday = new Date(birthday);
  } else {
    birthday = new Date(birthday.getTime());
  }

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
