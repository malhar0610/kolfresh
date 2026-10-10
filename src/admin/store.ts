// ---------------------------------------------------------------------------
// KolFresh Admin — data layer.
//
// This is a frontend-only data store backed by localStorage, seeded from the
// storefront's product catalogue and business config. It exists because the
// current app has no backend yet; it lets the admin panel be fully functional
// (manage products, orders, procurement, delivery, settings) and deployable to
// static hosting. A production build should replace this module with API calls
// to a real backend — the shapes below are the contract that backend will serve.
//
// Money is stored as integer RUPEES to stay consistent with the storefront
// (formatINR). The production backend must switch to integer PAISE per spec.
// ---------------------------------------------------------------------------

import { PRODUCTS, type Product } from '../data';
import { ORDERING, DELIVERY, PICKUP, BUSINESS, SERVICEABLE_PINCODES } from '../config';
// Orders live in a SHARED store so the storefront and admin see the same data.
import {
  ORDER_STATUSES, statusMeta, updateOrder, useOrders,
  type OrderStatus, type Order, type OrderItem,
} from '../shared/orders';

// Re-export shared order types/hooks so existing admin imports keep working.
export { ORDER_STATUSES, statusMeta, useOrders };
export type { OrderStatus, Order, OrderItem };

// ---- Types -----------------------------------------------------------------

export interface AdminProduct extends Product {
  active: boolean;
  dailyCap: number; // max units per fulfilment day (0 = unlimited)
  costRupees: number; // purchase cost per base unit (for margin reporting)
  priceByDay: Record<string, number>; // per-ordering-day price override ('YYYY-MM-DD')
}

export interface Staff { id: string; name: string; phone: string }
export interface Area { pincode: string; area: string; feeRupees: number; active: boolean }

export interface Settings {
  weekdays: number[];
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  leadTimeDays: number;
  deliveryWindowStart: string;
  deliveryWindowEnd: string;
  slotOne: string;
  slotTwo: string;
  pickupAddress: string;
  pickupHours: string;
  businessName: string;
  businessCity: string;
  businessPhone: string;
  fssai: string;
  gstin: string;
  deliveryFeeRupees: number;
  minOrderRupees: number;
  holidays: string[];
}

// Orders are NOT stored here — they come from the shared orders store.
export interface AdminState {
  settings: Settings;
  products: AdminProduct[];
  staff: Staff[];
  areas: Area[];
}

// ---- Date helpers ----------------------------------------------------------

export function prettyDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${d} ${names[(m || 1) - 1]} ${y}`;
}

// ---- Seed ------------------------------------------------------------------

function seedProducts(): AdminProduct[] {
  return PRODUCTS.map((p) => ({
    ...p,
    active: true,
    dailyCap: 0,
    costRupees: Math.round(p.unitPrice * (p.category === 'dried-fish' ? 0.62 : 0.72)),
    priceByDay: {},
  }));
}

function seedSettings(): Settings {
  return {
    weekdays: [...ORDERING.weekdays],
    startHour: ORDERING.startHour,
    startMinute: ORDERING.startMinute,
    endHour: ORDERING.endHour,
    endMinute: ORDERING.endMinute,
    leadTimeDays: ORDERING.leadTimeDays,
    deliveryWindowStart: DELIVERY.windowStart,
    deliveryWindowEnd: DELIVERY.windowEnd,
    slotOne: DELIVERY.slotOne,
    slotTwo: DELIVERY.slotTwo,
    pickupAddress: PICKUP.address,
    pickupHours: PICKUP.hours,
    businessName: BUSINESS.name,
    businessCity: BUSINESS.city,
    businessPhone: BUSINESS.phone,
    fssai: BUSINESS.fssai,
    gstin: BUSINESS.gstin,
    deliveryFeeRupees: 0,
    minOrderRupees: 0,
    holidays: [],
  };
}

function seedStaff(): Staff[] {
  return [
    { id: 's1', name: 'Rahut Patil', phone: '+91 90000 11111' },
    { id: 's2', name: 'Imran Shaikh', phone: '+91 90000 22222' },
    { id: 's3', name: 'Ganesh Kamble', phone: '+91 90000 33333' },
  ];
}

function seedAreas(): Area[] {
  const names: Record<string, string> = {
    '416001': 'Shahupuri / Ruikar Colony', '416002': 'Rajarampuri', '416003': 'Tarabai Park',
    '416004': 'Vadgaon', '416005': 'Ujalaiwadi', '416006': 'Nagala Park',
    '416008': 'Shivaji Udyam Nagar', '416010': 'Line Ali', '416101': 'Gokul Shirgaon',
    '416103': 'Rukadi', '416115': 'Phulewadi', '416116': 'Kagal',
  };
  return SERVICEABLE_PINCODES.map((p, i) => ({
    pincode: p, area: names[p] || `Area ${p}`, feeRupees: i < 6 ? 0 : 30, active: true,
  }));
}


function freshState(): AdminState {
  return {
    settings: seedSettings(),
    products: seedProducts(),
    staff: seedStaff(),
    areas: seedAreas(),
  };
}


// ---- Persistence & reactivity ---------------------------------------------

const KEY = 'kf_admin_state_v1';
const AUTH_KEY = 'kf_admin_auth_v1';

function load(): AdminState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AdminState;
  } catch { /* ignore corrupt storage */ }
  const seeded = freshState();
  localStorage.setItem(KEY, JSON.stringify(seeded));
  return seeded;
}

let state: AdminState = typeof localStorage !== 'undefined' ? load() : freshState();
const listeners = new Set<() => void>();

function commit(next: AdminState) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot() { return state; }

import { useSyncExternalStore } from 'react';

/** React hook: subscribe a component to the admin store. */
export function useAdmin(): AdminState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ---- Auth (demo) -----------------------------------------------------------
// DEMO ONLY. A real admin must authenticate against a backend with hashed
// passwords and role-based access (see Phase 1 of the spec).

export function isAuthed(): boolean {
  try { return localStorage.getItem(AUTH_KEY) === 'yes'; } catch { return false; }
}
export function login(user: string, pass: string): boolean {
  if (user.trim().toLowerCase() === 'admin' && pass === 'admin123') {
    localStorage.setItem(AUTH_KEY, 'yes');
    listeners.forEach((l) => l());
    return true;
  }
  return false;
}
export function logout() {
  localStorage.removeItem(AUTH_KEY);
  listeners.forEach((l) => l());
}


// ---- Mutations (actions) ---------------------------------------------------

export const actions = {
  resetDemoData() { commit(freshState()); },

  updateSettings(patch: Partial<Settings>) {
    commit({ ...state, settings: { ...state.settings, ...patch } });
  },

  saveProduct(product: AdminProduct) {
    const exists = state.products.some((p) => p.id === product.id);
    commit({
      ...state,
      products: exists
        ? state.products.map((p) => (p.id === product.id ? product : p))
        : [...state.products, product],
    });
  },

  addProduct(partial: Partial<AdminProduct>): AdminProduct {
    const id = partial.id || `p-${Date.now().toString(36)}`;
    const base = state.products[0];
    const product: AdminProduct = {
      id,
      name: partial.name || 'New product',
      localName: partial.localName || '',
      category: partial.category || 'fresh-fish',
      image: partial.image || '/img/products/surmai.svg',
      alt: partial.alt || partial.name || 'Seafood',
      unitPrice: partial.unitPrice ?? 500,
      unitLabel: partial.unitLabel || 'kg',
      priceLabel: partial.priceLabel || 'per kg',
      sizeOptions: partial.sizeOptions || base?.sizeOptions || [{ label: '500 g', multiplier: 0.5 }],
      cutOptions: partial.cutOptions || base?.cutOptions || [{ id: 'whole', label: 'Whole', mr: 'अख्खा', hi: 'साबुत', surcharge: 0 }],
      notes: partial.notes || '',
      origin: partial.origin || 'Konkan coast',
      tag: partial.tag,
      tagTone: partial.tagTone,
      active: partial.active ?? true,
      dailyCap: partial.dailyCap ?? 0,
      costRupees: partial.costRupees ?? Math.round((partial.unitPrice ?? 500) * 0.7),
      priceByDay: partial.priceByDay || {},
    } as AdminProduct;
    commit({ ...state, products: [...state.products, product] });
    return product;
  },

  deleteProduct(id: string) {
    commit({ ...state, products: state.products.filter((p) => p.id !== id) });
  },

  toggleProduct(id: string) {
    commit({
      ...state,
      products: state.products.map((p) => (p.id === id ? { ...p, active: !p.active } : p)),
    });
  },

  setOrderStatus(id: string, status: OrderStatus) {
    updateOrder(id, { status });
  },

  assignOrder(id: string, staffId: string | null) {
    updateOrder(id, { assignedTo: staffId });
  },

  setOrderNote(id: string, note: string) {
    updateOrder(id, { note });
  },

  refundOrder(id: string, mode: 'full' | 'partial') {
    updateOrder(id, { status: 'cancelled', paymentStatus: mode === 'full' ? 'refunded' : 'partial' });
  },

  addStaff(name: string, phone: string) {
    commit({ ...state, staff: [...state.staff, { id: `s-${Date.now().toString(36)}`, name, phone }] });
  },
  removeStaff(id: string) {
    commit({ ...state, staff: state.staff.filter((s) => s.id !== id) });
  },

  upsertArea(area: Area) {
    const exists = state.areas.some((a) => a.pincode === area.pincode);
    commit({
      ...state,
      areas: exists ? state.areas.map((a) => (a.pincode === area.pincode ? area : a)) : [...state.areas, area],
    });
  },
  removeArea(pincode: string) {
    commit({ ...state, areas: state.areas.filter((a) => a.pincode !== pincode) });
  },
};


// ---- Derived selectors -----------------------------------------------------

export interface ProcurementRow {
  productId: string;
  name: string;
  cutLabel: string;
  qty: number;
  weightKg: number;
  estCostRupees: number;
}

/** Consolidated buying list for a fulfilment day, from non-cancelled orders. */
export function procurementFor(orders: Order[], products: AdminProduct[], fulfilmentDate: string): ProcurementRow[] {
  const map = new Map<string, ProcurementRow>();
  for (const o of orders) {
    if (o.fulfilmentDate !== fulfilmentDate) continue;
    if (o.status === 'cancelled') continue;
    for (const it of o.items) {
      const product = products.find((p) => p.id === it.productId);
      const costPerG = product ? product.costRupees / 1000 : 0;
      const key = `${it.productId}::${it.cutLabel}`;
      const row = map.get(key) || {
        productId: it.productId, name: it.name, cutLabel: it.cutLabel,
        qty: 0, weightKg: 0, estCostRupees: 0,
      };
      row.qty += it.qty;
      row.weightKg += it.weightG / 1000;
      row.estCostRupees += costPerG * it.weightG;
      map.set(key, row);
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function fulfilmentDates(orders: Order[]): string[] {
  return [...new Set(orders.map((o) => o.fulfilmentDate))].sort().reverse();
}


