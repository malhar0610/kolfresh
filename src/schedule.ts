// ---------------------------------------------------------------------------
// KolFresh — ordering-window & fulfilment logic (pure, testable).
//
// The core business rule: pre-orders open only on the configured ordering
// days (default Mon/Wed/Sat) between the configured hours (default 8 AM–6 PM
// IST). Fulfilment is the next calendar day. Delivery happens 5–9 PM IST.
//
// TIME HANDLING: India Standard Time is a fixed UTC+05:30 offset with no
// daylight saving, so we derive the IST wall-clock by shifting the instant by
// exactly +05:30 and reading it with UTC methods. This is always correct for
// Asia/Kolkata and does NOT depend on the device's local timezone.
//
// IMPORTANT: This runs in the browser for display only. Real enforcement MUST
// be re-computed on the server (Phase 1) before any order is accepted. The
// logic here is the reference implementation that the server will mirror.
// ---------------------------------------------------------------------------

import { HOLIDAYS, ORDERING } from './config';

const IST_OFFSET_MS = (5 * 60 + 30) * 60 * 1000; // +05:30 in ms

export interface IstWall {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  second: number; // 0-59
  weekday: number; // 0=Sun … 6=Sat
}

export interface DayParts {
  year: number;
  month: number;
  day: number;
  weekday: number;
}

/** Current wall-clock in Asia/Kolkata for the given instant (default now). */
export function istNow(now: Date = new Date()): IstWall {
  const shifted = new Date(now.getTime() + IST_OFFSET_MS);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds(),
    weekday: shifted.getUTCDay(),
  };
}

/** Add N calendar days to an IST wall date. */
function addDays(day: DayParts, n: number): DayParts {
  const d = new Date(Date.UTC(day.year, day.month - 1, day.day + n));
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate(), weekday: d.getUTCDay() };
}

/** Build a real UTC instant from an IST wall-clock date + time. */
function istWallToUtc(year: number, month: number, day: number, hour: number, minute: number): Date {
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0) - IST_OFFSET_MS);
}

function holidayKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isHoliday(day: DayParts): boolean {
  return HOLIDAYS.includes(holidayKey(day.year, day.month, day.day));
}

function isOrderingWeekday(weekday: number): boolean {
  return (ORDERING.weekdays as readonly number[]).includes(weekday);
}

/** True if, at `now`, the ordering window is open (weekday + hours + not a holiday). */
export function isWindowOpen(now: Date = new Date()): boolean {
  const t = istNow(now);
  if (!isOrderingWeekday(t.weekday)) return false;
  if (isHoliday(t)) return false;
  const minutes = t.hour * 60 + t.minute;
  const start = ORDERING.startHour * 60 + ORDERING.startMinute;
  const end = ORDERING.endHour * 60 + ORDERING.endMinute;
  // Inclusive start, exclusive end: at exactly 6:00 PM the window is CLOSED.
  return minutes >= start && minutes < end;
}

/** The next instant the ordering window opens (strictly after `now`). */
export function nextWindowOpen(now: Date = new Date()): Date {
  const t = istNow(now);
  const startHour = ORDERING.startHour;
  const startMinute = ORDERING.startMinute;
  for (let i = 0; i <= 14; i++) {
    const cand = addDays(t, i);
    if (!isOrderingWeekday(cand.weekday)) continue;
    if (isHoliday(cand)) continue;
    const openAt = istWallToUtc(cand.year, cand.month, cand.day, startHour, startMinute);
    if (openAt.getTime() > now.getTime()) return openAt;
  }
  // Fallback (should never happen with valid config): one week out.
  return istWallToUtc(t.year, t.month, t.day + 7, startHour, startMinute);
}

export interface OrderingState {
  open: boolean;
  /** Ordering day for the current/next order (IST date parts). */
  orderingDay: DayParts;
  /** Fulfilment day = ordering day + lead time (IST date parts). */
  fulfilmentDay: DayParts;
  /** Instant that drives the countdown: cut-off if open, next open if closed. */
  nextChangeAt: Date;
}

/** Full ordering state used by the UI banner and checkout. */
export function getOrderingState(now: Date = new Date()): OrderingState {
  const t = istNow(now);
  if (isWindowOpen(now)) {
    const orderingDay: DayParts = { year: t.year, month: t.month, day: t.day, weekday: t.weekday };
    return {
      open: true,
      orderingDay,
      fulfilmentDay: addDays(orderingDay, ORDERING.leadTimeDays),
      nextChangeAt: istWallToUtc(t.year, t.month, t.day, ORDERING.endHour, ORDERING.endMinute),
    };
  }
  const open = nextWindowOpen(now);
  const nt = istNow(open);
  const orderingDay: DayParts = { year: nt.year, month: nt.month, day: nt.day, weekday: nt.weekday };
  return {
    open: false,
    orderingDay,
    fulfilmentDay: addDays(orderingDay, ORDERING.leadTimeDays),
    nextChangeAt: open,
  };
}

export interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalMs: number;
}

/** Break a millisecond duration into whole d/h/m/s parts (never negative). */
export function breakdown(ms: number): Countdown {
  const totalMs = Math.max(0, ms);
  const totalSeconds = Math.floor(totalMs / 1000);
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  };
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** e.g. "Tuesday, 13 October 2026" (locale-independent, IST parts already). */
export function formatDay(day: DayParts): string {
  return `${WEEKDAY_NAMES[day.weekday]}, ${day.day} ${MONTH_NAMES[day.month - 1]} ${day.year}`;
}

/** e.g. "Tuesday" */
export function formatWeekday(day: DayParts): string {
  return WEEKDAY_NAMES[day.weekday];
}

/** Human list of ordering weekdays, e.g. "Mon, Wed & Sat". */
export function orderingDaysLabel(): string {
  const map: Record<number, string> = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' };
  const names = (ORDERING.weekdays as readonly number[]).map((w) => map[w]).filter(Boolean);
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`;
}

/** e.g. "8:00 AM – 6:00 PM" */
export function orderingHoursLabel(): string {
  const fmt = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = ((h + 11) % 12) + 1;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
  };
  return `${fmt(ORDERING.startHour, ORDERING.startMinute)} – ${fmt(ORDERING.endHour, ORDERING.endMinute)}`;
}

