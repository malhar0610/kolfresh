// Verification of the ordering-window logic against the core business rules.
// Compiled & run via esbuild: node scripts/verify-schedule.mjs
import { getOrderingState, isWindowOpen, nextWindowOpen, breakdown, formatDay, istNow } from '../src/schedule.ts';

let failures = 0;
function check(name, cond) {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}`);
  if (!cond) failures++;
}

// Helper: build a Date from an IST wall-clock time. IST = UTC+05:30.
const ist = (y, mo, d, h, mi) => new Date(Date.UTC(y, mo - 1, d, h - 5, mi - 30));

// --- Window open/closed boundaries (Mon=1, Wed=3, Sat=6; 8:00–18:00) ---
// Mon 11 Jan 2026 is a Monday.
check('Mon 07:59 -> closed', isWindowOpen(ist(2026, 1, 12, 7, 59)) === false);
check('Mon 08:00 -> open', isWindowOpen(ist(2026, 1, 12, 8, 0)) === true);
check('Mon 12:00 -> open', isWindowOpen(ist(2026, 1, 12, 12, 0)) === true);
check('Mon 17:59 -> open', isWindowOpen(ist(2026, 1, 12, 17, 59)) === true);
check('Mon 18:00 -> CLOSED (cut-off)', isWindowOpen(ist(2026, 1, 12, 18, 0)) === false);
check('Mon 20:00 -> closed', isWindowOpen(ist(2026, 1, 12, 20, 0)) === false);

// Tue/Thu/Sun are NOT ordering days.
check('Tue 10:00 -> closed (not an ordering day)', isWindowOpen(ist(2026, 1, 13, 10, 0)) === false);
// Wed 14 Jan 2026 is Wednesday.
check('Wed 10:00 -> open', isWindowOpen(ist(2026, 1, 14, 10, 0)) === true);
// Sat 17 Jan 2026 is Saturday.
check('Sat 10:00 -> open', isWindowOpen(ist(2026, 1, 17, 10, 0)) === true);
check('Sun 11 Jan 2026 -> closed', isWindowOpen(ist(2026, 1, 11, 10, 0)) === false);

// --- Fulfilment = next calendar day, while window open ---
let s = getOrderingState(ist(2026, 1, 12, 10, 0)); // Monday open
check('Mon open -> ordering day Mon 12', s.orderingDay.day === 12 && s.orderingDay.weekday === 1);
check('Mon open -> fulfilment Tue 13', s.fulfilmentDay.day === 13 && s.fulfilmentDay.weekday === 2);
check('Mon open -> counts down to cut-off (18:00)', s.nextChangeAt.getTime() === ist(2026, 1, 12, 18, 0).getTime());

s = getOrderingState(ist(2026, 1, 17, 10, 0)); // Saturday open
check('Sat open -> fulfilment Sun 18', s.fulfilmentDay.day === 18 && s.fulfilmentDay.weekday === 0);

// --- When closed, next open + fulfilment derived from that ordering day ---
s = getOrderingState(ist(2026, 1, 13, 10, 0)); // Tuesday, closed
check('Tue closed -> next open Wed 14 08:00', s.nextChangeAt.getTime() === ist(2026, 1, 14, 8, 0).getTime());
check('Tue closed -> fulfilment Thu 15', s.fulfilmentDay.day === 15 && s.fulfilmentDay.weekday === 4);
check('Tue closed -> not open', s.open === false);

s = getOrderingState(ist(2026, 1, 12, 19, 0)); // Monday evening, after cut-off
check('Mon evening -> next open Wed 14 08:00', s.nextChangeAt.getTime() === ist(2026, 1, 14, 8, 0).getTime());
check('Mon evening -> fulfilment Thu 15', s.fulfilmentDay.day === 15);

s = getOrderingState(ist(2026, 1, 11, 10, 0)); // Sunday, closed
check('Sun closed -> next open Mon 12 08:00', s.nextChangeAt.getTime() === ist(2026, 1, 12, 8, 0).getTime());

// --- Countdown breakdown ---
const b = breakdown((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000);
check('breakdown 2d 3h 4m 5s', b.days === 2 && b.hours === 3 && b.minutes === 4 && b.seconds === 5);
check('breakdown never negative', breakdown(-5000).totalMs === 0);

// --- Formatting sanity ---
check('formatDay Tue 13 Jan 2026', formatDay({ year: 2026, month: 1, day: 13, weekday: 2 }) === 'Tuesday, 13 January 2026');

console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
