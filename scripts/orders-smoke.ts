// ---------------------------------------------------------------------------
// Smoke test for the SHARED orders store (src/shared/orders.ts).
//
// Verifies the storefront/admin contract: seed data, placing an order,
// patching an order from the admin, and localStorage persistence.
//
// Run:  npm run test:orders
// (Bundles with esbuild, then runs the bundle under Node with a localStorage
// stub — no browser required.)
// ---------------------------------------------------------------------------

// localStorage stub — must exist before any store read/write happens.
const backing = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
  setItem: (k: string, v: string) => { backing.set(k, v); },
  removeItem: (k: string) => { backing.delete(k); },
};

import {
  getOrders, placeOrder, updateOrder, nextOrderId,
  istTodayISO, isoAddDays, type Order,
} from '../src/shared/orders';

let failures = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) console.log(`PASS  ${name}`);
  else { failures += 1; console.error(`FAIL  ${name}`, extra ?? ''); }
}

// 1. Seed data.
const seeded = getOrders();
check('seeds 6 demo orders', seeded.length === 6, seeded.length);
check(
  'seed ids KF-1041..KF-1046',
  seeded.map((o) => o.id).join(',') === 'KF-1041,KF-1042,KF-1043,KF-1044,KF-1045,KF-1046',
  seeded.map((o) => o.id).join(','),
);

// 2. Next id.
const id = nextOrderId();
check('nextOrderId is KF-1047', id === 'KF-1047', id);

// 3. Storefront places an order.
const newOrder: Order = {
  id,
  customerName: 'Test Customer',
  phone: '+91 90000 00000',
  address: '1 Test Lane, Shahupuri',
  pincode: '416001',
  fulfillment: 'delivery',
  slot: '5:00 – 7:00 PM',
  orderingDay: istTodayISO(),
  fulfilmentDate: isoAddDays(istTodayISO(), 1),
  items: [{ productId: 'surmai', name: 'Surmai', sizeLabel: '500 g', cutLabel: 'Curry cut', qty: 1, unitRupees: 740, weightG: 500 }],
  subtotalRupees: 740,
  deliveryFeeRupees: 0,
  discountRupees: 0,
  totalRupees: 740,
  status: 'placed',
  assignedTo: null,
  placedAt: new Date().toISOString(),
  paymentMethod: 'upi',
  paymentStatus: 'paid',
};
placeOrder(newOrder);
check('placeOrder adds order (6 → 7)', getOrders().length === 7, getOrders().length);
check('new order is first in list', getOrders()[0].id === id, getOrders()[0].id);

// 4. Admin patches the same order.
updateOrder(id, { status: 'confirmed', assignedTo: 's1' });
const updated = getOrders().find((o) => o.id === id);
check('updateOrder changed status', updated?.status === 'confirmed', updated?.status);
check('updateOrder assigned rider', updated?.assignedTo === 's1', updated?.assignedTo);

// 5. Persisted under the shared key both apps read.
const raw = backing.get('kolfresh_orders_v1');
check('persisted to kolfresh_orders_v1', !!raw && JSON.parse(raw).length === 7, raw ? JSON.parse(raw).length : 'missing');

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll checks passed.');
process.exit(failures ? 1 : 0);
