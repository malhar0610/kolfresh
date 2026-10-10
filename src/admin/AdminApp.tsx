// KolFresh Admin — application shell: auth gate, sidebar, hash router, topbar.
import { useEffect, useState } from 'react';
import { useAdmin, isAuthed, logout } from './store';
import { IDashboard, IOrders, IProducts, ICart, ITruck, IGear, ILogout, IClock } from './icons';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Products from './pages/Products';
import Procurement from './pages/Procurement';
import Delivery from './pages/Delivery';
import SettingsPage from './pages/Settings';
import type { Settings } from './store';

type Route = 'dashboard' | 'orders' | 'products' | 'procurement' | 'delivery' | 'settings';

const NAV: { id: Route; label: string; icon: typeof IDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: IDashboard },
  { id: 'orders', label: 'Orders', icon: IOrders },
  { id: 'products', label: 'Products', icon: IProducts },
  { id: 'procurement', label: 'Procurement', icon: ICart },
  { id: 'delivery', label: 'Delivery', icon: ITruck },
  { id: 'settings', label: 'Settings', icon: IGear },
];

function currentRoute(): Route {
  const h = (window.location.hash || '').replace('#/', '').replace('#', '');
  return (NAV.find((n) => n.id === h)?.id || 'dashboard') as Route;
}

// Compute ordering-window open state from the (editable) admin settings, in IST.
function windowOpenFromSettings(s: Settings, now: Date): boolean {
  const ist = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);
  const weekday = ist.getUTCDay();
  if (!s.weekdays.includes(weekday)) return false;
  const minutes = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  const start = s.startHour * 60 + s.startMinute;
  const end = s.endHour * 60 + s.endMinute;
  return minutes >= start && minutes < end;
}

export default function AdminApp() {
  const [authed, setAuthed] = useState(isAuthed());
  const state = useAdmin();
  const [route, setRoute] = useState<Route>(currentRoute());
  const [navOpen, setNavOpen] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const onHash = () => { setRoute(currentRoute()); setNavOpen(false); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Tick every 30s to keep the window indicator fresh.
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  if (!authed) {
    return <Login onDone={() => setAuthed(true)} />;
  }

  const open = windowOpenFromSettings(state.settings, new Date());
  const title = NAV.find((n) => n.id === route)?.label || 'Dashboard';

  return (
    <div className="shell">
      <aside className={`sidebar ${navOpen ? 'open' : ''}`}>
        <div className="side-brand">
          <span className="mark"><IClock size={20} /></span>
          <div>
            <strong>kol<span>fresh</span></strong>
            <small>ADMIN</small>
          </div>
        </div>
        <nav className="side-nav">
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <a key={n.id} href={`#/${n.id}`} className={route === n.id ? 'active' : ''}>
                <Icon size={18} /> {n.label}
              </a>
            );
          })}
        </nav>
        <div className="side-foot">
          {state.settings.businessName} · {state.settings.businessCity}
          <br />
          <button onClick={() => { logout(); setAuthed(false); }}><ILogout size={13} /> Sign out</button>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h2>{title}</h2>
          </div>
          <span className={`win ${open ? 'open' : 'closed'}`}>
            <span className="dot" /> {open ? 'Ordering open' : 'Ordering closed'}
          </span>
        </header>

        <div className="content">
          {route === 'dashboard' && <Dashboard />}
          {route === 'orders' && <Orders />}
          {route === 'products' && <Products />}
          {route === 'procurement' && <Procurement />}
          {route === 'delivery' && <Delivery />}
          {route === 'settings' && <SettingsPage />}
        </div>
      </div>
    </div>
  );
}
