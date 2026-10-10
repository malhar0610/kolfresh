// Settings — ordering window, delivery, pickup, business info, holidays.
import { useState } from 'react';
import { useAdmin, actions, type Settings } from '../store';
import { Panel } from '../ui';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function SettingsPage() {
  const state = useAdmin();
  const s = state.settings;
  const [saved, setSaved] = useState(false);
  const [holidayInput, setHolidayInput] = useState('');

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => { actions.updateSettings({ [k]: v } as Partial<Settings>); setSaved(true); };

  function toggleDay(d: number) {
    const has = s.weekdays.includes(d);
    set('weekdays', has ? s.weekdays.filter((x) => x !== d) : [...s.weekdays, d].sort());
  }

  function addHoliday() {
    const v = holidayInput.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(v) && !s.holidays.includes(v)) {
      set('holidays', [...s.holidays, v].sort());
      setHolidayInput('');
    }
  }

  return (
    <>
      <Panel title="Ordering window" sub="When customers can place pre-orders. Times are IST; fulfilment is the next calendar day.">
        <div className="section-title">Ordering days</div>
        <div className="daypicker" style={{ marginBottom: 16 }}>
          {DAYS.map((d, i) => (
            <button key={d} className={`chip ${s.weekdays.includes(i) ? 'active' : ''}`} onClick={() => toggleDay(i)}>{d}</button>
          ))}
        </div>
        <div className="grid2">
          <label className="field"><span>Opens at (hour, 0–23)</span><input type="number" min={0} max={23} value={s.startHour} onChange={(e) => set('startHour', Number(e.target.value))} /></label>
          <label className="field"><span>Cut-off (hour, 0–23)</span><input type="number" min={0} max={23} value={s.endHour} onChange={(e) => set('endHour', Number(e.target.value))} /></label>
          <label className="field"><span>Lead time (days)</span><input type="number" min={0} max={7} value={s.leadTimeDays} onChange={(e) => set('leadTimeDays', Number(e.target.value))} /></label>
          <label className="field"><span>Minimum order (₹)</span><input type="number" min={0} value={s.minOrderRupees} onChange={(e) => set('minOrderRupees', Number(e.target.value))} /></label>
        </div>
        <div className="help">At the cut-off the business buys stock against confirmed orders, then cleans, packs and delivers the next day.</div>
      </Panel>

      <Panel title="Delivery & pickup" sub="Home-delivery window, slots and the pickup point.">
        <div className="grid2">
          <label className="field"><span>Delivery window start</span><input value={s.deliveryWindowStart} onChange={(e) => set('deliveryWindowStart', e.target.value)} /></label>
          <label className="field"><span>Delivery window end</span><input value={s.deliveryWindowEnd} onChange={(e) => set('deliveryWindowEnd', e.target.value)} /></label>
          <label className="field"><span>Slot 1</span><input value={s.slotOne} onChange={(e) => set('slotOne', e.target.value)} /></label>
          <label className="field"><span>Slot 2</span><input value={s.slotTwo} onChange={(e) => set('slotTwo', e.target.value)} /></label>
        </div>
        <label className="field"><span>Default delivery fee (₹)</span><input type="number" min={0} value={s.deliveryFeeRupees} onChange={(e) => set('deliveryFeeRupees', Number(e.target.value))} /></label>
        <label className="field"><span>Pickup address</span><input value={s.pickupAddress} onChange={(e) => set('pickupAddress', e.target.value)} /></label>
        <label className="field"><span>Pickup hours</span><input value={s.pickupHours} onChange={(e) => set('pickupHours', e.target.value)} /></label>
      </Panel>

      <Panel title="Holidays" sub="Ordering weekdays listed here are treated as closed.">
        <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
          <input className="field" style={{ margin: 0, flex: 1, minWidth: 180 }} type="date" value={holidayInput} onChange={(e) => setHolidayInput(e.target.value)} />
          <button className="btn btn-ghost btn-sm" onClick={addHoliday}>Add holiday</button>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {s.holidays.length === 0 && <span className="muted" style={{ fontSize: 13 }}>No holidays set.</span>}
          {s.holidays.map((h) => (
            <span key={h} className="chip" style={{ cursor: 'pointer' }} onClick={() => set('holidays', s.holidays.filter((x) => x !== h))}>{h} ✕</span>
          ))}
        </div>
      </Panel>

      <Panel title="Business & compliance" sub="Shown in the storefront footer and on invoices.">
        <div className="grid2">
          <label className="field"><span>Business name</span><input value={s.businessName} onChange={(e) => set('businessName', e.target.value)} /></label>
          <label className="field"><span>City</span><input value={s.businessCity} onChange={(e) => set('businessCity', e.target.value)} /></label>
          <label className="field"><span>Support phone</span><input value={s.businessPhone} onChange={(e) => set('businessPhone', e.target.value)} /></label>
          <label className="field"><span>GSTIN (optional)</span><input value={s.gstin} onChange={(e) => set('gstin', e.target.value)} /></label>
        </div>
        <label className="field"><span>FSSAI licence number</span><input value={s.fssai} onChange={(e) => set('fssai', e.target.value)} /></label>
      </Panel>

      <Panel title="Danger zone" sub="Reset all demo data (products, orders, staff, areas, settings) back to defaults.">
        <button className="btn btn-danger btn-sm" onClick={() => { if (confirm('Reset all admin data to defaults?')) actions.resetDemoData(); }}>Reset demo data</button>
        {saved && <span className="pill-note" style={{ marginLeft: 12 }}>Changes saved automatically.</span>}
      </Panel>
    </>
  );
}
