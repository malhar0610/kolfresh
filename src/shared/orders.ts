// ---------------------------------------------------------------------------
// KolFresh — SHARED orders store (single source of truth for orders).
//
// Both the customer storefront (src/App.tsx) and the admin panel
// (src/admin/*) read and write orders here, so an order placed in the
// storefront shows up in the admin. Persistence is localStorage, which is
// shared across the whole origin — so / and /admin on the same domain (or
// localhost) see the same orders in the same browser.
//
// IMPORTANT LIMITATION: localStorage is per-browser. This connects the two
// apps for demo/testing in ONE browser. A real deployment needs a backend +
// database so a customer's device and the admin's device share data over the
// network. The shapes here are the contract that backend will serve.
// ---------------------------------------------------------------------------

import { useSyncExternalStore } from 'react';
import { PRODUCTS } from '../data';

export type OrderStatus =
  | 'placed' | 'confirmed' | 'sourcing' | 'packed'
  | 'out' | 'delivered' | 'collected' | 'cancelled';

export interface StatusMeta { id: OrderStatus; label: string; tone: string }

export const ORDER_STATUSES: StatusMeta[] = [
  { id: 'placed', label: 'Placed', tone: 'grey' },
  { id: 'confirmed', label: 'Confirmed', tone: 'blue' },
  { id: 'sourcing', label: 'Being sourced', tone: 'amber' },
  { id: 'packed', label: 'Packed', tone: 'purple' },
  { id: 'out', label: 'Out for delivery / Ready', tone: 'blue' },
  { id: 'delivered', label: 'Delivered', tone: 'green' },
  { id: 'collected', label: 'Collected', tone: 'green' },
  { id: 'cancelled', label: 'Cancelled', tone: 'red' },
];

export function statusMeta(id: OrderStatus): StatusMeta {
  return ORDER_STATUSES.find((s) => s.id === id) || ORDER_STATUSES[0];
}

export interface OrderItem {
  productId: string;
  name: string;
  sizeLabel: string;
  cutLabel: string;
  qty: number;
  unitRupees: number;
  weightG: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  pincode: string;
  fulfillment: 'delivery' | 'pickup';
  slot: string;
  orderingDay: string; // IST 'YYYY-MM-DD'
  fulfilmentDate: string; // IST 'YYYY-MM-DD'
  items: OrderItem[];
  subtotalRupees: number;
  deliveryFeeRupees: number;
  discountRupees: number;
  totalRupees: number;
  status: OrderStatus;
  assignedTo: string | null;
  placedAt: string; // ISO
  paymentMethod: 'upi' | 'card';
  paymentStatus: 'paid' | 'refunded' | 'partial';
  note?: string;
}

// ---- Date helpers ----------------------------------------------------------

export function isoAddDays(base: string, days: number): string {
  const [y, m, d] = base.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function istTodayISO(): string {
  const s = new Date(Date.now() + (5 * 60 + 30) * 60 * 1000);
  return `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, '0')}-${String(s.getUTCDate()).padStart(2, '0')}`;
}

export function isoFromParts(p: { year: number; month: number; day: number }): string {
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${names[(m || 1) - 1]} ${y}`;
}

// ---- Seed (demo orders so the admin isn't empty on first visit) ------------

function li(productId: string, name: string, sizeLabel: string, cutLabel: string, qty: number, unit: number, weightG: number): OrderItem {
  return { productId, name, sizeLabel, cutLabel, qty, unitRupees: unit, weightG: weightG * qty };
}

function seedOrders(): Order[] {
  const byId = (id: string) => PRODUCTS.find((p) => p.id === id)!;
  const t = istTodayISO();
  const tmr = isoAddDays(t, 1);
  const mk = (
    id: string, customerName: string, phone: string, address: string, pincode: string,
    fulfillment: 'delivery' | 'pickup', slot: string, orderingDay: string,
    items: OrderItem[], status: OrderStatus, assignedTo: string | null,
    paymentMethod: 'upi' | 'card', paymentStatus: 'paid' | 'refunded' | 'partial',
  ): Order => {
    const subtotal = items.reduce((s, it) => s + it.unitRupees * it.qty, 0);
    return {
      id, customerName, phone, address, pincode, fulfillment, slot, orderingDay,
      fulfilmentDate: isoAddDays(orderingDay, 1), items,
      subtotalRupees: subtotal, deliveryFeeRupees: 0, discountRupees: 0,
      totalRupees: subtotal, status, assignedTo, placedAt: new Date().toISOString(),
      paymentMethod, paymentStatus,
    };
  };
  const pomfret = byId('black-pomfret');
  const surmai = byId('surmai');
  const prawns = byId('tiger-prawns');
  const crab = byId('mud-crab');
  const bombil = byId('bombil');

  return [
    mk('KF-1041', 'Sunita Desai', '+91 98220 11223', '12 Rajarampuri, Lane 3', '416002', 'delivery', '5:00 – 7:00 PM', t,
      [li('black-pomfret', pomfret.name, '500 g', 'Curry cut', 2, Math.round(pomfret.unitPrice * 0.5 + 45), 500),
       li('bombil', bombil.name, '1 pack · 200 g', 'Standard pack', 1, bombil.unitPrice, 200)],
      'delivered', 's1', 'upi', 'paid'),
    mk('KF-1042', 'Amit Joshi', '+91 90280 44556', '45 Tarabai Park', '416003', 'delivery', '7:00 – 9:00 PM', t,
      [li('surmai', surmai.name, '1 kg', 'Fillet', 1, Math.round(surmai.unitPrice + 70), 1000),
       li('tiger-prawns', prawns.name, '500 g', 'Clean & deveined', 1, Math.round(prawns.unitPrice * 0.5 + 55), 500)],
      'out', 's1', 'card', 'paid'),
    mk('KF-1043', 'Priya Kulkarni', '+91 90110 77889', '7 Shahupuri Main Rd', '416001', 'pickup', 'Pickup', t,
      [li('mud-crab', crab.name, '1 kg', 'Cracked & cleaned', 2, Math.round(crab.unitPrice + 50), 1000)],
      'packed', null, 'upi', 'paid'),
    mk('KF-1044', 'Vikram Shinde', '+91 88880 33445', '23 Ujalaiwadi', '416005', 'delivery', '5:00 – 7:00 PM', tmr,
      [li('black-pomfret', pomfret.name, '1 kg', 'Curry cut', 1, Math.round(pomfret.unitPrice + 45), 1000),
       li('surmai', surmai.name, '250 g', 'Whole', 2, Math.round(surmai.unitPrice * 0.25), 250),
       li('bombil', bombil.name, '2 packs · 400 g', 'Standard pack', 1, bombil.unitPrice * 2, 400)],
      'sourcing', null, 'upi', 'paid'),
    mk('KF-1045', 'Neha Patil', '+91 93710 66554', '9 Vadgaon Corner', '416004', 'delivery', '7:00 – 9:00 PM', tmr,
      [li('tiger-prawns', prawns.name, '1 kg', 'Shell on', 1, prawns.unitPrice, 1000)],
      'confirmed', null, 'card', 'paid'),
    mk('KF-1046', 'Farhan Qureshi', '+91 97640 22110', '31 Nagala Park', '416006', 'delivery', '5:00 – 7:00 PM', tmr,
      [li('mud-crab', crab.name, '500 g', 'Whole', 1, Math.round(crab.unitPrice * 0.5), 500)],
      'placed', null, 'upi', 'paid'),
  ];
}

// ---- Storage, pub/sub, hooks ----------------------------------------------

const ORDERS_KEY = 'kolfresh_orders_v1';
let cache: Order[] | null = null;
const listeners = new Set<() => void>();

function read(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (raw) return JSON.parse(raw) as Order[];
  } catch { /* ignore */ }
  const seeded = seedOrders();
  try { localStorage.setItem(ORDERS_KEY, JSON.stringify(seeded)); } catch { /* ignore */ }
  return seeded;
}

function write(orders: Order[]) {
  cache = orders;
  try { localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function getOrders(): Order[] {
  if (!cache) cache = read();
  return cache;
}

/** Add a new order (from the storefront). */
export function placeOrder(order: Order): Order {
  write([order, ...getOrders()]);
  return order;
}

/** Patch an existing order (status, rider, refund, note) — used by the admin. */
export function updateOrder(id: string, patch: Partial<Order>) {
  write(getOrders().map((o) => (o.id === id ? { ...o, ...patch } : o)));
}

export function subscribeOrders(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// Live-sync across browser tabs (e.g. storefront in one tab, admin in another).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === ORDERS_KEY) { cache = null; getOrders(); listeners.forEach((l) => l()); }
  });
}

/** React hook to read the shared orders reactively. */
export function useOrders(): Order[] {
  return useSyncExternalStore(subscribeOrders, getOrders, getOrders);
}

/** Generate the next order id, e.g. KF-1047. */
export function nextOrderId(): string {
  const orders = getOrders();
  const max = orders.reduce((m, o) => {
    const n = Number(o.id.replace(/\D/g, ''));
    return Number.isFinite(n) && n > m ? n : m;
  }, 1000);
  return `KF-${max + 1}`;
}

