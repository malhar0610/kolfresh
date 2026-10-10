// Dashboard — live KPIs, ordering-window status, recent orders, top products.
import { useOrders, prettyDate } from '../store';
import { Stat, Panel, formatINR, Badge } from '../ui';

function todayIst(): string {
  const s = new Date(Date.now() + (5 * 60 + 30) * 60 * 1000);
  return `${s.getUTCFullYear()}-${String(s.getUTCMonth() + 1).padStart(2, '0')}-${String(s.getUTCDate()).padStart(2, '0')}`;
}

export default function Dashboard() {
  const orders = useOrders();
  const today = todayIst();

  const active = orders.filter((o) => o.status !== 'cancelled');
  const todays = active.filter((o) => o.fulfilmentDate === today);
  const revenue = active.filter((o) => ['delivered', 'collected', 'out'].includes(o.status)).reduce((s, o) => s + o.totalRupees, 0);
  const pipeline = active.filter((o) => !['delivered', 'collected', 'cancelled'].includes(o.status)).reduce((s, o) => s + o.totalRupees, 0);
  const pending = active.filter((o) => ['placed', 'confirmed', 'sourcing', 'packed'].includes(o.status));

  // Top products by units sold (non-cancelled).
  const units = new Map<string, { name: string; qty: number }>();
  for (const o of active) for (const it of o.items) {
    const cur = units.get(it.productId) || { name: it.name, qty: 0 };
    cur.qty += it.qty; units.set(it.productId, cur);
  }
  const top = [...units.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  const maxQty = Math.max(1, ...top.map((t) => t.qty));

  const recent = [...orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt)).slice(0, 6);

  return (
    <>
      <div className="cards">
        <Stat k="Orders for today" v={todays.length} s={`Fulfilment ${prettyDate(today)}`} />
        <Stat k="In progress" v={pending.length} s="Placed → packed" />
        <Stat k="Revenue (fulfilled)" v={formatINR(revenue)} s="Delivered / out" />
        <Stat k="Order pipeline" v={formatINR(pipeline)} s="Confirmed value pending" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }} className="dash-grid">
        <Panel title="Recent orders" sub="Latest activity across the storefront">
          <div className="table-wrap">
            <table className="tbl">
              <thead><tr><th>Order</th><th>Customer</th><th>Fulfilment</th><th>Slot</th><th className="right">Total</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id}>
                    <td className="mono nowrap">{o.id}</td>
                    <td>{o.customerName}<div className="muted" style={{ fontSize: 11 }}>{o.pincode}</div></td>
                    <td className="nowrap">{prettyDate(o.fulfilmentDate)}</td>
                    <td className="nowrap muted">{o.slot}</td>
                    <td className="right mono">{formatINR(o.totalRupees)}</td>
                    <td><Badge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Top products" sub="By units ordered">
          {top.length === 0 && <div className="empty">No orders yet.</div>}
          {top.map((t) => (
            <div key={t.name} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                <span>{t.name}</span><span className="muted mono">{t.qty}×</span>
              </div>
              <div className="bar"><span style={{ width: `${(t.qty / maxQty) * 100}%` }} /></div>
            </div>
          ))}
          <div className="pill-note" style={{ marginTop: 6 }}>Margins &amp; reports are on the roadmap (Phase 6).</div>
        </Panel>
      </div>
    </>
  );
}
