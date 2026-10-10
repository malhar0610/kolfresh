# KolFresh frontend prototype

A responsive, customer-facing seafood pre-order storefront prototype for Kolhapur. It uses React, TypeScript and Vite, with local sample product data; orders persist in the browser through a shared `localStorage` store that the admin panel reads and writes too.

## Run locally

```bash
npm install      # pnpm also works if you have it; pnpm is pinned but not required
npm run dev      # http://localhost:3000  (also on your LAN IP for phone testing)
```

Create a static production build with `npm run build` (output in `dist/`), then
serve it with `npm run preview` (http://localhost:4173).

## What's in the prototype

- Browse and filter fresh fish, prawns, crabs, dried fish and ready-to-cook products.
- Choose weights/packs and preparation options (whole, cleaned, curry cut, fillet), then add or edit your basket.
- Try the `KOL10` coupon (10% off over ₹599).
- A **live ordering-window banner** driven by real `Asia/Kolkata` time — it shows whether ordering is open, a ticking countdown to the next open/close, and the exact next fulfilment date. Ordering is open Mon/Wed/Sat, 8:00 AM–6:00 PM IST; fulfilment is the next calendar day.
- Serviceability check against real Kolhapur pincodes (see `src/config.ts`).
- A checkout flow with delivery-slot choice, customer details, and a confirmation showing the real order number. Placing an order records it in the shared orders store (`src/shared/orders.ts`), so it appears in the admin panel immediately (same browser).
- Switch the interface between English, Marathi and Hindi.

## Images

Product and hero imagery are **local SVG placeholders** under `public/img/`
(no external CDN). Regenerate them with `npm run images`. Swap in real photos
by replacing the files (or editing the generator in `scripts/generate-images.mjs`).

## Verifying the ordering-window logic

The core business rule (ordering days/hours, the 6:00 PM cut-off, next-day
fulfilment and the next-window countdown) lives in `src/schedule.ts` and is
unit-checked with:

```bash
npm run verify:schedule
```

## Shared orders (storefront ↔ admin)

Orders placed in the storefront and managed in the admin panel flow through one
shared store: `src/shared/orders.ts`. It keeps orders in `localStorage` under
`kolfresh_orders_v1`, seeds six demo orders (KF-1041…KF-1046), notifies
subscribers on every change (React `useSyncExternalStore`) and re-syncs across
browser tabs via the `storage` event. The storefront's checkout calls
`placeOrder()`/`nextOrderId()`; the admin's order actions delegate to
`updateOrder()`; both subscribe with `useOrders()`.

Check it with:

```bash
npm run test:orders    # store contract: seed → place → update → persist
npm run test:render    # renders storefront + admin pages without runtime errors
```

**Limitation:** localStorage is per-browser/origin, so this connects the two
apps for demo and testing in *one* browser only. A real deployment needs a
backend + database — the shapes in `src/shared/orders.ts` are the contract it
will serve.

## Configuration (single source of truth)

`src/config.ts` holds the admin-style settings: ordering days/hours, delivery
window and slots, pickup address/hours, serviceable pincodes, and business
compliance details (FSSAI, phone). These are meant to be admin-editable; change
them in one place rather than through the UI.

## Deliberately not connected (frontend only)

There is no backend, API, database, login/OTP, real payment gateway, cross-device order history, or live delivery tracking. Placing an order does record it in the shared `localStorage` orders store (so the admin panel in the same browser sees it), but it does not charge money or send anything to a server. Server-side enforcement of the ordering window is a later phase; the
browser logic in `src/schedule.ts` is the reference implementation the server
will mirror. FSSAI, phone and pickup values in `src/config.ts` are placeholders
to replace before launch.

## Admin panel

A separate admin app lives in the same repo and builds alongside the storefront.
It deploys to the same Cloudflare Pages project.

- **Local:** http://localhost:3000/admin (Vite serves `admin.html`).
- **Live:** https://kolfresh.pages.dev/admin
- **Demo login:** username `admin`, password `admin123`.

**What it does** (data persisted in the browser via localStorage):
- **Dashboard** — orders for today, in-progress count, revenue & pipeline, recent orders, top products.
- **Orders** — search + filters (status, fulfilment date, slot), status workflow
  (Placed → Confirmed → Being sourced → Packed → Out → Delivered/Collected),
  assign riders, refund (full/partial), CSV export, printable detail.
- **Products** — add/edit/delete, toggle shown/hidden, per-product purchase cost
  and margin, daily order cap.
- **Procurement** — auto consolidated buying list per fulfilment day (units,
  weight, estimated cost), with a vendor column, CSV export and print.
- **Delivery** — service areas/pincodes with delivery fee + active toggle, and
  delivery staff management.
- **Settings** — ordering days/hours & cut-off, lead time, delivery window &
  slots, pickup address/hours, minimum order, holidays, business/FSSAI/GSTIN.

**Data layer:** `src/admin/store.ts` is a localStorage-backed store seeded from
`src/data.ts` (products) and `src/config.ts` (settings). Orders are **not**
stored there — both apps read and write them through the shared store
`src/shared/orders.ts` (the admin's `setOrderStatus`/`assignOrder`/
`refundOrder` delegate to its `updateOrder()`, and pages subscribe with
`useOrders()`). The admin store is the contract a real backend will replace —
swap the `actions`/`useAdmin` for API calls in a
later phase. Admin auth here is **demo only**; production needs server-side auth
with hashed passwords and role-based access.
