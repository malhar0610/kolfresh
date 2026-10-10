// ---------------------------------------------------------------------------
// Render smoke test — renders the storefront and the admin pages with
// react-dom/server to catch runtime crashes (undefined state, bad selectors,
// broken JSX wiring) without needing a browser.
//
// Run:  npm run test:render
// ---------------------------------------------------------------------------

// localStorage stub — set before the test body runs (no module reads storage
// at import time; both stores read lazily on first access).
const backing = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => (backing.has(k) ? backing.get(k)! : null),
  setItem: (k: string, v: string) => { backing.set(k, v); },
  removeItem: (k: string) => { backing.delete(k); },
};

import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import App from '../src/App';
import Dashboard from '../src/admin/pages/Dashboard';
import OrdersPage from '../src/admin/pages/Orders';
import ProcurementPage from '../src/admin/pages/Procurement';
import DeliveryPage from '../src/admin/pages/Delivery';

let failures = 0;
function check(name: string, cond: boolean, extra?: unknown) {
  if (cond) console.log(`PASS  ${name}`);
  else { failures += 1; console.error(`FAIL  ${name}`, extra ?? ''); }
}

function render(name: string, element: ReturnType<typeof createElement>): string {
  try {
    const html = renderToString(element);
    check(`renders ${name}`, html.length > 200, `html length=${html.length}`);
    return html;
  } catch (error) {
    check(`renders ${name}`, false, error);
    return '';
  }
}

const home = render('storefront <App/>', createElement(App));
check('storefront shows brand', home.includes('brand-word'));
check('storefront shows market content', home.includes('market') || home.includes('section-kicker'));

const dashboard = render('admin Dashboard', createElement(Dashboard));
check('dashboard shows seeded order ids', dashboard.includes('KF-104'));

const ordersPage = render('admin Orders', createElement(OrdersPage));
check('orders page lists KF-1041', ordersPage.includes('KF-1041'));

render('admin Procurement', createElement(ProcurementPage));
render('admin Delivery', createElement(DeliveryPage));

console.log(failures ? `\n${failures} check(s) FAILED` : '\nAll render checks passed.');
process.exit(failures ? 1 : 0);
