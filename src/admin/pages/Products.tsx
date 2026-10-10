// Products — catalogue management: list, filter, toggle, add/edit/delete.
import { useMemo, useState } from 'react';
import { useAdmin, actions, type AdminProduct } from '../store';
import { Panel, formatINR, Switch, Modal } from '../ui';
import { IPlus, IEdit, ITrash } from '../icons';
import { CATEGORIES, type CategoryId } from '../../data';

const CATS = CATEGORIES.filter((c) => c.id !== 'all');

function emptyProduct(): AdminProduct {
  return {
    id: '', name: '', localName: '', category: 'fresh-fish', image: '/img/products/surmai.svg',
    alt: '', unitPrice: 500, unitLabel: 'kg', priceLabel: 'per kg',
    sizeOptions: [
      { label: '250 g', multiplier: 0.25 },
      { label: '500 g', multiplier: 0.5 },
      { label: '1 kg', multiplier: 1 },
    ],
    cutOptions: [{ id: 'whole', label: 'Whole', mr: 'अख्खा', hi: 'साबुत', surcharge: 0 }],
    notes: '', origin: 'Konkan coast',
    active: true, dailyCap: 0, costRupees: 350, priceByDay: {},
  };
}

export default function Products() {
  const state = useAdmin();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<CategoryId | 'all'>('all');
  const [editing, setEditing] = useState<AdminProduct | null>(null);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return state.products.filter((p) => {
      const okCat = cat === 'all' || p.category === cat;
      const okQ = !n || `${p.name} ${p.localName}`.toLowerCase().includes(n);
      return okCat && okQ;
    });
  }, [state.products, q, cat]);

  function save(p: AdminProduct) {
    if (!p.id) actions.addProduct(p);
    else actions.saveProduct(p);
    setEditing(null);
  }

  return (
    <>
      <div className="toolbar">
        <label className="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" />
        </label>
        <div className="grow" />
        <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>All</button>
        {CATS.map((c) => (
          <button key={c.id} className={`chip ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>{c.label}</button>
        ))}
        <button className="btn btn-primary btn-sm" onClick={() => setEditing(emptyProduct())}><IPlus size={15} /> Add product</button>
      </div>

      <Panel title={`${rows.length} products`} sub="Toggle to show/hide in the storefront. Set a daily cap to avoid overselling.">
        <div className="table-wrap">
          <table className="tbl">
            <thead>
              <tr><th>Product</th><th>Category</th><th className="right">Price</th><th className="right">Cost</th><th className="right">Margin</th><th>Daily cap</th><th>Shown</th><th></th></tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const margin = p.unitPrice - p.costRupees;
                const mPct = p.unitPrice ? Math.round((margin / p.unitPrice) * 100) : 0;
                return (
                  <tr key={p.id}>
                    <td>
                      <div className="prod-cell">
                        <img className="thumb" src={p.image} alt="" />
                        <div><div className="nm">{p.name}</div><div className="ln">{p.localName || p.unitLabel}</div></div>
                      </div>
                    </td>
                    <td className="nowrap muted">{CATS.find((c) => c.id === p.category)?.label || p.category}</td>
                    <td className="right mono">{formatINR(p.unitPrice)}<div className="muted" style={{ fontSize: 11 }}>/{p.unitLabel}</div></td>
                    <td className="right mono muted">{formatINR(p.costRupees)}</td>
                    <td className="right mono">{formatINR(margin)} <span className="muted">({mPct}%)</span></td>
                    <td className="nowrap">{p.dailyCap ? `${p.dailyCap}/day` : <span className="muted">Unlimited</span>}</td>
                    <td><Switch on={p.active} onChange={() => actions.toggleProduct(p.id)} label={`Toggle ${p.name}`} /></td>
                    <td>
                      <div className="row-actions">
                        <button className="iconbtn" onClick={() => setEditing(p)} aria-label="Edit"><IEdit size={16} /></button>
                        <button className="iconbtn" onClick={() => { if (confirm(`Delete ${p.name}?`)) actions.deleteProduct(p.id); }} aria-label="Delete"><ITrash size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length === 0 && <div className="empty">No products match your filters.</div>}
        </div>
      </Panel>

      {editing && <ProductEditor product={editing} onClose={() => setEditing(null)} onSave={save} />}
    </>
  );
}

function ProductEditor({ product, onClose, onSave }: { product: AdminProduct; onClose: () => void; onSave: (p: AdminProduct) => void }) {
  const [p, setP] = useState<AdminProduct>({ ...product });
  const set = <K extends keyof AdminProduct>(k: K, v: AdminProduct[K]) => setP({ ...p, [k]: v });

  return (
    <Modal
      title={p.id ? `Edit ${p.name}` : 'Add product'}
      onClose={onClose}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave({ ...p, alt: p.alt || p.name })}>Save product</button>
      </>}
    >
      <div className="grid2">
        <label className="field"><span>Name</span><input value={p.name} onChange={(e) => set('name', e.target.value)} /></label>
        <label className="field"><span>Local name / subtitle</span><input value={p.localName} onChange={(e) => set('localName', e.target.value)} /></label>
        <label className="field"><span>Category</span>
          <select value={p.category} onChange={(e) => set('category', e.target.value as AdminProduct['category'])}>
            {CATS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <label className="field"><span>Unit</span>
          <select value={p.unitLabel} onChange={(e) => set('unitLabel', e.target.value)}>
            <option value="kg">kg</option><option value="pack">pack</option>
          </select>
        </label>
        <label className="field"><span>Sale price (₹ per {p.unitLabel})</span><input type="number" value={p.unitPrice} onChange={(e) => set('unitPrice', Number(e.target.value))} /></label>
        <label className="field"><span>Purchase cost (₹ per {p.unitLabel})</span><input type="number" value={p.costRupees} onChange={(e) => set('costRupees', Number(e.target.value))} /></label>
        <label className="field"><span>Daily order cap (0 = unlimited)</span><input type="number" value={p.dailyCap} onChange={(e) => set('dailyCap', Number(e.target.value))} /></label>
        <label className="field"><span>Origin</span><input value={p.origin} onChange={(e) => set('origin', e.target.value)} /></label>
      </div>
      <label className="field"><span>Image path</span><input value={p.image} onChange={(e) => set('image', e.target.value)} /></label>
      <label className="field"><span>Notes</span><textarea rows={2} value={p.notes} onChange={(e) => set('notes', e.target.value)} /></label>
      <div className="help">Weight is measured before cleaning. Per-day price overrides are handled in a full build.</div>
    </Modal>
  );
}

