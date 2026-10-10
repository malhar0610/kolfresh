// Procurement — consolidated buying list per fulfilment day (printable).
import { useMemo, useState } from 'react';
import { useAdmin, useOrders, procurementFor, prettyDate, type ProcurementRow } from '../store';
import { Panel, formatINR } from '../ui';
import { IPrint, IDownload } from '../icons';

export default function Procurement() {
  const state = useAdmin();
  const allOrders = useOrders();
  const dates = useMemo(() => {
    const all = [...new Set(allOrders.filter((o) => o.status !== 'cancelled').map((o) => o.fulfilmentDate))].sort().reverse();
    return all.length ? all : [new Date().toISOString().slice(0, 10)];
  }, [allOrders]);
  const [date, setDate] = useState(dates[0]);
  const active = dates.includes(date) ? date : dates[0];

  const rows = useMemo(() => procurementFor(allOrders, state.products, active), [allOrders, state.products, active]);
  const totalCost = rows.reduce((s, r) => s + r.estCostRupees, 0);
  const totalKg = rows.reduce((s, r) => s + r.weightKg, 0);

  function print() { window.print(); }
  function exportCsv() {
    const header = 'Product,Cut,Qty,WeightKg,EstCost,Vendor\n';
    const body = rows.map((r) => [r.name, r.cutLabel, r.qty, r.weightKg.toFixed(2), Math.round(r.estCostRupees), ''].join(',')).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `procurement-${active}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="toolbar no-print">
        <label className="field" style={{ margin: 0, minWidth: 220 }}>
          <span>Fulfilment day</span>
          <select value={active} onChange={(e) => setDate(e.target.value)}>
            {dates.map((d) => <option key={d} value={d}>{prettyDate(d)}</option>)}
          </select>
        </label>
        <div className="grow" />
        <button className="btn btn-ghost btn-sm" onClick={exportCsv}><IDownload size={15} /> Export CSV</button>
        <button className="btn btn-primary btn-sm" onClick={print}><IPrint size={15} /> Print sheet</button>
      </div>

      <Panel title={`Buying list · ${prettyDate(active)}`} sub={`${rows.length} line items · ${totalKg.toFixed(2)} kg · est. cost ${formatINR(totalCost)}`}>
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Product</th><th>Cut / prep</th><th className="right">Units</th><th className="right">Weight</th><th className="right">Est. cost</th><th>Vendor (fill in)</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => <ProcRow key={`${r.productId}-${r.cutLabel}`} r={r} />)}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="right"><strong>Total</strong></td>
                <td className="right mono"><strong>{totalKg.toFixed(2)} kg</strong></td>
                <td className="right mono"><strong>{formatINR(totalCost)}</strong></td>
                <td></td>
              </tr>
            </tfoot>
          </table>
          {rows.length === 0 && <div className="empty">No confirmed orders for this day yet.</div>}
        </div>
        <div className="help">Auto-generated from confirmed (non-cancelled) orders. Estimated cost uses each product's purchase cost. Record the actual vendor and price when buying.</div>
      </Panel>
    </>
  );
}

function ProcRow({ r }: { r: ProcurementRow }) {
  const [vendor, setVendor] = useState('');
  return (
    <tr>
      <td>{r.name}</td>
      <td className="muted nowrap">{r.cutLabel}</td>
      <td className="right mono">{r.qty}</td>
      <td className="right mono">{r.weightKg.toFixed(2)} kg</td>
      <td className="right mono">{formatINR(r.estCostRupees)}</td>
      <td><input className="chip" style={{ height: 30, minWidth: 120 }} placeholder="Vendor" value={vendor} onChange={(e) => setVendor(e.target.value)} /></td>
    </tr>
  );
}
