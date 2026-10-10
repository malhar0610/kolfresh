// Delivery — service areas/pincodes (fee, active) and delivery staff.
import { useState } from 'react';
import { useAdmin, useOrders, actions, type Area } from '../store';
import { Panel, formatINR, Switch, Modal } from '../ui';
import { IPlus, ITrash, IEdit } from '../icons';

export default function Delivery() {
  const state = useAdmin();
  const allOrders = useOrders();
  const [adding, setAdding] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');

  return (
    <>
      <Panel
        title="Service areas"
        sub="Pincodes you deliver to, with the delivery fee per order. Toggle to pause an area."
        actions={<button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><IPlus size={15} /> Add area</button>}
      >
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Pincode</th><th>Area</th><th className="right">Delivery fee</th><th>Active</th><th></th></tr></thead>
            <tbody>
              {state.areas.map((a) => (
                <tr key={a.pincode}>
                  <td className="mono">{a.pincode}</td>
                  <td>{a.area}</td>
                  <td className="right mono">{a.feeRupees ? formatINR(a.feeRupees) : <span className="muted">Free</span>}</td>
                  <td><Switch on={a.active} onChange={() => actions.upsertArea({ ...a, active: !a.active })} label={`Toggle ${a.pincode}`} /></td>
                  <td>
                    <div className="row-actions">
                      <button className="iconbtn" onClick={() => {
                        const fee = prompt(`Delivery fee for ${a.pincode} (₹)?`, String(a.feeRupees));
                        if (fee !== null) actions.upsertArea({ ...a, feeRupees: Math.max(0, Number(fee) || 0) });
                      }} aria-label="Edit fee"><IEdit size={16} /></button>
                      <button className="iconbtn" onClick={() => { if (confirm(`Remove ${a.pincode}?`)) actions.removeArea(a.pincode); }} aria-label="Remove"><ITrash size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="help">Delivery fee rules and slot capacity limits are configured per area in a full build.</div>
      </Panel>

      <Panel title="Delivery staff" sub="Riders you can assign evening orders to.">
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <input className="field" style={{ margin: 0, flex: 1, minWidth: 160 }} placeholder="Name" value={staffName} onChange={(e) => setStaffName(e.target.value)} />
          <input className="field" style={{ margin: 0, flex: 1, minWidth: 160 }} placeholder="Phone" value={staffPhone} onChange={(e) => setStaffPhone(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={() => { if (staffName.trim()) { actions.addStaff(staffName.trim(), staffPhone.trim()); setStaffName(''); setStaffPhone(''); } }}><IPlus size={15} /> Add rider</button>
        </div>
        <div className="table-wrap">
          <table className="tbl">
            <thead><tr><th>Name</th><th>Phone</th><th className="right">Assigned</th><th></th></tr></thead>
            <tbody>
              {state.staff.map((s) => {
                const count = allOrders.filter((o) => o.assignedTo === s.id && !['delivered', 'collected', 'cancelled'].includes(o.status)).length;
                return (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td className="mono">{s.phone}</td>
                    <td className="right mono">{count}</td>
                    <td className="right"><button className="iconbtn" onClick={() => { if (confirm(`Remove ${s.name}?`)) actions.removeStaff(s.id); }} aria-label="Remove"><ITrash size={16} /></button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {adding && <AddArea onClose={() => setAdding(false)} />}
    </>
  );
}

function AddArea({ onClose }: { onClose: () => void }) {
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [fee, setFee] = useState('0');
  const existing = useAdmin().areas.map((a) => a.pincode);

  function save() {
    const p = pincode.trim();
    if (p.length !== 6 || !/^\d{6}$/.test(p)) { alert('Enter a valid 6-digit pincode.'); return; }
    if (existing.includes(p)) { alert('That pincode already exists.'); return; }
    actions.upsertArea({ pincode: p, area: area.trim() || `Area ${p}`, feeRupees: Math.max(0, Number(fee) || 0), active: true } as Area);
    onClose();
  }

  return (
    <Modal title="Add service area" onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}>Add area</button></>}>
      <label className="field"><span>Pincode</span><input value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))} maxLength={6} inputMode="numeric" placeholder="416001" /></label>
      <label className="field"><span>Area name</span><input value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Rajarampuri" /></label>
      <label className="field"><span>Delivery fee (₹)</span><input type="number" value={fee} onChange={(e) => setFee(e.target.value)} /></label>
    </Modal>
  );
}
