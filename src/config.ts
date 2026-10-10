// ---------------------------------------------------------------------------
// KolFresh — central business configuration (single source of truth).
//
// In production these values are meant to be admin-editable and stored in the
// database. For this frontend build they live here so the ordering-window,
// delivery-window, serviceability, pickup and compliance rules are NOT
// scattered / hard-coded through the UI. Change them in one place.
//
// NOTE: The values marked `PLACEHOLDER` are realistic stand-ins. Replace the
// FSSAI / phone / pickup address with the real business details before launch.
// ---------------------------------------------------------------------------

export const BUSINESS = {
  name: 'KolFresh',
  city: 'Kolhapur, Maharashtra',
  phone: '+91 90280 00000', // PLACEHOLDER — replace with the real support number
  fssai: 'FSSAI Lic. No. 10023456000078', // PLACEHOLDER — replace with the real licence
  gstin: '', // optional; shown on invoices if set
} as const;

export const ORDERING = {
  timezone: 'Asia/Kolkata',
  // JS weekday numbers: 0=Sun, 1=Mon, 3=Wed, 6=Sat  (the pre-order days)
  weekdays: [1, 3, 6],
  startHour: 8, // 8:00 AM IST
  startMinute: 0,
  endHour: 18, // 6:00 PM IST — payment cut-off
  endMinute: 0,
  // Fulfilment is the next calendar day after the ordering day.
  leadTimeDays: 1,
} as const;

// Days the business is closed to ordering. Format: IST 'YYYY-MM-DD'.
// An ordering weekday that appears here is treated as closed.
export const HOLIDAYS: string[] = [];

export const DELIVERY = {
  // Home delivery happens on the fulfilment day inside this window.
  windowStart: '5:00 PM',
  windowEnd: '9:00 PM',
  slotOne: '5:00 – 7:00 PM',
  slotTwo: '7:00 – 9:00 PM',
} as const;

export const PICKUP = {
  address: 'KolFresh Seafood, near Tararani Chowk, Kolhapur 416009', // PLACEHOLDER
  hours: '4:00 PM – 8:00 PM on your fulfilment day',
} as const;

// Pincodes / areas we currently deliver to (Kolhapur). Extend as coverage grows.
export const SERVICEABLE_PINCODES = [
  '416001', '416002', '416003', '416004', '416005',
  '416006', '416008', '416010', '416101', '416103',
  '416115', '416116',
];

export const DELIVERY_FEE_PAISE = 0; // PLACEHOLDER — set delivery fee rules later
export const MIN_ORDER_PAISE = 0; // PLACEHOLDER — set minimum order value later
