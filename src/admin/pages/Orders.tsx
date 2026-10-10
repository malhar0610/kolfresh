// Orders — dashboard with filters, status workflow, assignment, refund, detail.
import { useMemo, useState } from 'react';
import { useAdmin, useOrders, actions, ORDER_STATUSES, fulfilmentDates, statusMeta, prettyDate, type Order, type OrderStatus } from '../store';
import { Panel, formatINR, Badge, Modal } from '../ui';
import { IDownload } from '../icons';

const NEXT: Partial<Record<OrderStatus, OrderStatus>> = {
  placed: 'confirmed', confirmed: 'sourcing', sourcing: 'packed', packed: 'out',
};

export default function Orders() {
  const state = useAdmin();
  const allOrders = useOrders();
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<OrderStatus | 'all'>('all');
  const [date, setDate] = useState('all');
  const [slot, setSlot] = useState('all');
  const [detail, setDetail] = useState<Order | null>(null);

  const dates = useMemo(() => fulfilmentDates(allOrders), [allOrders]);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return allOrders
      .filter((o) => {
        const okS = status === 'all' || o.status === status;
        const okD = date === 'all' || o.fulfilmentDate === date;
        const okSl = slot === 'all' || o.slot === slot;
        const okQ = !n || `${o.id} ${o.customerName} ${o.phone} ${o.pincode}`.toLowerCase().includes(n);
        return okS && okD && okSl && okQ;
      })
      .sort((a, b) => b.fulfilmentDate.localeCompare(a.fulfilmentDate) || a.id.localeCompare(b.id));
  }, [allOrders, q, status, date, slot]);

  function exportCsv() {
    const header = 'Order,Customer,Phone,Pincode,Fulfilment,Slot,Type,Total,Status,Assigned\n';
    const body = rows.map((o) =>
      [o.id, o.customerName, o.phone, o.pincode, o.fulfilmentDate, o.slot, o.fulfillment, o.totalRupees, statusMeta(o.status).label, o.assignedTo || ''].join(','),
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'kolfresh-orders.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  const totalValue = rows.reduce((s, o) => s + (o.status === 'cancelled' ? 0 : o.totalRupees), 0);

  return (
    <>
      <div className="toolbar">
        <label className="search"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order, name, phone, pincode…" /></label>
        <select className="chip" value={date} onChange={(e) => setDate(e.target.value)} style={{ height: 36 }}>
          <option value="all">All fulfilment dates</option>
          {dates.map((d) => <option key={d} value={d}>{prettyDate(d)}</option>)}
        </select>
        <select className="chip" value={slot} onChange={(e) => setSlot(e.target.value)} style={{ height: 36 }}>
          <option value="all">All slots</option>
          <option value={state.settings.slotOne}>{state.settings.slotOne}</option>
          <option value={state.settings.slotTwo}>{state.settings.slotTwo}</option>
          <option value="Pickup">Pickup</option>
        </select>
        <div className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={exportCsv}><IDownload size={15} /> Export CSV</button>
      </div>

      <div className="toolbar" style={{ marginBottom: 12 }}>
        <button className={`chip ${status === 'all' ? 'active' : ''}`} onClick={() => setStatus('all')}>All</button>
        {ORDER_STATUSES.map((s) => (
          <button key={s.id} className={`chip ${status === s.id ? 'active' : ''}`} onClick={() => setStatus(s.id)}>{s.label}</button>
        ))}
      </div>

      <Panel title={`${rows.length} orders`} sub={`Value ${formatINR(totalValue)} (excludes cancelled)`}>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Fulfilment</th><th>Slot</th><th className="right">Total</th><th>Rider</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map((o) => {
                const next = NEXT[o.status];
                return (
                  <tr key={o.id}>
                    <td className="mono nowrap">{o.id}</td>
                    <td>{o.customerName}<div className="muted" style={{ fontSize: 11 }}>{o.phone} · {o.pincode}</div></td>
                    <td className="nowrap">{prettyDate(o.fulfilmentDate)}<div className="muted" style={{ fontSize: 11, textTransform: 'capitalize' }}>{o.fulfillment}</div></td>
                    <td className="nowrap muted">{o.slot}</td>
                    <td className="right mono">{formatINR(o.totalRupees)}</td>
                    <td>
                      {o.fulfillment === 'delivery' ? (
                        <select className="chip" style={{ height: 30 }} value={o.assignedTo || ''} onChange={(e) => actions.assignOrder(o.id, e.target.value || null)}>
                          <option value="">Unassigned</option>
                          {state.staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      ) : <span className="muted">—</span>}
                    </td>
                    <td><Badge status={o.status} /></td>
                    <td>
                      <div className="row-actions">
                        {next && <button className="btn btn-ghost btn-sm" onClick={() => actions.setOrderStatus(o.id, next)}>→ {statusMeta(next).label}</button>}
                        <button className="btn btn-ghost btn-sm" onClick={() => setDetail(o)}>View</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty">No orders match your filters.</div>}
        </div>
      </Panel>

      {detail && <OrderDetail id={detail.id} onClose={() => setDetail(null)} />}
    </>
  );
}

function OrderDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const state = useAdmin();
  const allOrders = useOrders();
  const order = allOrders.find((o) => o.id === id);
  if (!order) return null;
  const staff = state.staff.find((s) => s.id === order.assignedTo);
  const flow: OrderStatus[] = order.fulfillment === 'delivery'
    ? ['placed', 'confirmed', 'sourcing', 'packed', 'out', 'delivered']
    : ['placed', 'confirmed', 'sourcing', 'packed', 'collected'];
  const currentIdx = flow.indexOf(order.status);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.address + ' ' + order.pincode)}`;

  return (
    <Modal title={`Order ${order.id}`} onClose={onClose} footer={<button className="btn btn-ghost" onClick={onClose}>Close</button>}>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
        <Badge status={order.status} />
        {order.paymentStatus !== 'paid' && <span className="badge red"><span className="dot" />{order.paymentStatus}</span>}
        <span className="badge grey"><span className="dot" />{order.paymentMethod.toUpperCase()}</span>
      </div>

      <div className="section-title">Progress</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {flow.map((s, i) => {
          const done = order.status !== 'cancelled' && i <= currentIdx;
          return (
            <button key={s} className={`chip ${done ? 'active' : ''}`} onClick={() => actions.setOrderStatus(order.id, s)}>
              {statusMeta(s).label}
            </button>
          );
        })}
        {order.status !== 'cancelled' && (
          <button className="chip" style={{ color: 'var(--red)' }} onClick={() => actions.setOrderStatus(order.id, 'cancelled')}>Cancel</button>
        )}
      </div>

      <div className="grid2" style={{ marginBottom: 16 }}>
        <div>
          <div className="section-title">Customer</div>
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            <strong>{order.customerName}</strong><br />
            <a href={`tel:${order.phone}`} style={{ color: 'var(--leaf)' }}>{order.phone}</a><br />
            <span className="muted">{order.address}</span><br />
            {order.fulfillment === 'delivery'
              ? <a href={mapsUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--leaf)' }}>Open in Maps ↗</a>
              : <span className="muted">Pickup · {state.settings.pickupHours}</span>}
          </div>
        </div>
        <div>
          <div className="section-title">Fulfilment</div>
          <div style={{ fontSize: 13, lineHeight: 1.7 }}>
            <span className="muted">Date</span> {prettyDate(order.fulfilmentDate)}<br />
            <span className="muted">Slot</span> {order.slot}<br />
            <span className="muted">Rider</span> {staff ? staff.name : 'Unassigned'}
          </div>
        </div>
      </div>

      <div className="section-title">Items</div>
      <table className="tbl" style={{ marginBottom: 16 }}>
        <thead><tr><th>Item</th><th>Variant</th><th className="right">Qty</th><th className="right">Amount</th></tr></thead>
        <tbody>
          {order.items.map((it, i) => (
            <tr key={i}>
              <td>{it.name}</td>
              <td className="muted nowrap">{it.sizeLabel} · {it.cutLabel}</td>
              <td className="right mono">{it.qty}</td>
              <td className="right mono">{formatINR(it.unitRupees * it.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '4px 0' }}>
        <span className="muted">Total paid</span><strong className="mono">{formatINR(order.totalRupees)}</strong>
      </div>

      <div className="section-title" style={{ marginTop: 16 }}>Internal note</div>
      <input className="field" style={{ width: '100%' }} defaultValue={order.note || ''} placeholder="e.g. customer prefers extra ice"
        onBlur={(e) => actions.setOrderNote(order.id, e.target.value)} />

      {order.status !== 'cancelled' && (
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
          <div className="section-title">Shortfall / refund</div>
          <div className="row-actions">
            <button className="btn btn-danger btn-sm" onClick={() => { actions.refundOrder(order.id, 'partial'); onClose(); }}>Partial refund</button>
            <button className="btn btn-danger btn-sm" onClick={() => { actions.refundOrder(order.id, 'full'); onClose(); }}>Full refund &amp; cancel</button>
          </div>
          <div className="help">In a live build this triggers a gateway refund and an automatic message to the customer.</div>
        </div>
      )}
    </Modal>
  );
}

