'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Plus, X, Edit, Trash2, Search, Package, AlertTriangle } from 'lucide-react'

const CATS = ['Analgesic', 'Antibiotic', 'Antacid', 'Anti-diabetic', 'Antihypertensive', 'Antihistamine', 'Antifungal', 'Antiviral', 'Electrolyte', 'Vitamin', 'Steroid', 'NSAID', 'Cardiac', 'Neurological', 'Respiratory', 'Other']
const UNITS = ['Strip', 'Tablet', 'Capsule', 'Bottle', 'Vial', 'Sachet', 'Tube', 'Inhaler', 'Injection', 'Drops']
const EMPTY = { name: '', brand: '', category: 'Analgesic', mrp: '', purchase_price: '', gst_percent: 12, stock: '', unit: 'Strip', hsn_code: '', manufacturer: '', expiry_date: '', location: '' }

function InventoryInner({ initialMedicines }: any) {
  const toast = useToast()
  const supabase = createClient()
  const [medicines, setMedicines] = useState(initialMedicines)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterStock, setFilterStock] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => medicines.filter((m: any) => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.brand?.toLowerCase().includes(search.toLowerCase()) || m.hsn_code?.includes(search)
    const matchCat = !filterCat || m.category === filterCat
    const matchStock = !filterStock || (filterStock === 'low' && m.stock < 50) || (filterStock === 'out' && m.stock === 0)
    return matchSearch && matchCat && matchStock
  }), [medicines, search, filterCat, filterStock])

  function openAdd() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(m: any) { setEditing(m.id); setForm({ ...m }); setShowModal(true) }

  async function save() {
    if (!form.name || !form.mrp) return toast('Name and MRP required', 'error')
    setSaving(true)
    const payload = { ...form, mrp: Number(form.mrp), purchase_price: Number(form.purchase_price || 0), gst_percent: Number(form.gst_percent), stock: Number(form.stock || 0) }
    if (editing) {
      const { data, error } = await supabase.from('medicines').update(payload).eq('id', editing).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setMedicines((m: any) => m.map((x: any) => x.id === editing ? data : x))
      toast('Medicine updated')
    } else {
      const { data, error } = await supabase.from('medicines').insert([payload]).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setMedicines((m: any) => [data, ...m])
      toast('Medicine added to inventory')
    }
    setSaving(false); setShowModal(false)
  }

  async function remove(id: string) {
    if (!confirm('Remove this medicine?')) return
    await supabase.from('medicines').delete().eq('id', id)
    setMedicines((m: any) => m.filter((x: any) => x.id !== id))
    toast('Medicine removed')
  }

  async function adjustStock(id: string, current: number, delta: number) {
    const newStock = Math.max(0, current + delta)
    const { error } = await supabase.from('medicines').update({ stock: newStock }).eq('id', id)
    if (error) return toast(error.message, 'error')
    setMedicines((m: any) => m.map((x: any) => x.id === id ? { ...x, stock: newStock } : x))
  }

  const totalValue = medicines.reduce((s: number, m: any) => s + m.purchase_price * m.stock, 0)
  const lowCount = medicines.filter((m: any) => m.stock < 50).length
  const outCount = medicines.filter((m: any) => m.stock === 0).length

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { label: 'Total Medicines', value: medicines.length, color: 'var(--teal)', bg: 'var(--teal-pale)', icon: Package },
          { label: 'Low Stock (<50)', value: lowCount, color: 'var(--amber)', bg: 'var(--amber-light)', icon: AlertTriangle },
          { label: 'Out of Stock', value: outCount, color: 'var(--red)', bg: 'var(--red-light)', icon: AlertTriangle },
          { label: 'Inventory Value', value: `₹${totalValue.toLocaleString('en-IN')}`, color: 'var(--green)', bg: 'var(--green-light)', icon: Package },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}><s.icon size={19} style={{ color: s.color }} /></div>
            <div><div className="stat-value" style={{ color: s.color, fontSize: 20 }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Drug Inventory ({filtered.length})</span>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ width: 220 }}><Search size={14} /><input placeholder="Search medicine, brand, HSN..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <select className="form-select" style={{ width: 150 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>{CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <select className="form-select" style={{ width: 140 }} value={filterStock} onChange={e => setFilterStock(e.target.value)}>
              <option value="">All Stock</option><option value="low">Low Stock</option><option value="out">Out of Stock</option>
            </select>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Medicine</button>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Medicine</th><th>Brand / Mfr</th><th>Category</th><th>HSN</th><th>MRP</th><th>Purchase</th><th>GST%</th><th>Stock</th><th>Unit</th><th>Expiry</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>No medicines found</td></tr>}
              {filtered.map((m: any) => (
                <tr key={m.id}>
                  <td><div style={{ fontWeight: 600 }}>{m.name}</div>{m.location && <div style={{ fontSize: 10, color: 'var(--slate-400)' }}>📍 {m.location}</div>}</td>
                  <td><div style={{ fontWeight: 500 }}>{m.brand}</div><div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{m.manufacturer}</div></td>
                  <td><span className="tag">{m.category}</span></td>
                  <td><span className="font-mono" style={{ fontSize: 11 }}>{m.hsn_code || '—'}</span></td>
                  <td style={{ fontWeight: 700 }}>₹{m.mrp}</td>
                  <td style={{ color: 'var(--slate-600)' }}>₹{m.purchase_price}</td>
                  <td><span className="badge badge-amber">{m.gst_percent}%</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => adjustStock(m.id, m.stock, -1)} style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--slate-200)', background: 'white', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>−</button>
                      <span className={`badge ${m.stock === 0 ? 'badge-red' : m.stock < 50 ? 'badge-amber' : 'badge-green'}`} style={{ minWidth: 44, textAlign: 'center' }}>{m.stock}</span>
                      <button onClick={() => adjustStock(m.id, m.stock, 1)} style={{ width: 22, height: 22, borderRadius: 4, border: '1px solid var(--slate-200)', background: 'white', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>+</button>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{m.unit}</td>
                  <td style={{ fontSize: 12, color: m.expiry_date && new Date(m.expiry_date) < new Date() ? 'var(--red)' : 'var(--slate-600)' }}>{m.expiry_date || '—'}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(m)}><Edit size={13} /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(m.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 760 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Medicine' : 'Add Medicine to Inventory'}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-3">
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Medicine Name *</label><input className="form-input" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. Paracetamol 500mg" /></div>
                <div className="form-group"><label className="form-label">Brand Name</label><input className="form-input" value={form.brand || ''} onChange={e => setForm((f: any) => ({ ...f, brand: e.target.value }))} placeholder="e.g. Crocin" /></div>
                <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Unit</label><select className="form-select" value={form.unit} onChange={e => setForm((f: any) => ({ ...f, unit: e.target.value }))}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
                <div className="form-group"><label className="form-label">HSN Code</label><input className="form-input font-mono" value={form.hsn_code || ''} onChange={e => setForm((f: any) => ({ ...f, hsn_code: e.target.value }))} placeholder="30049099" /></div>
                <div className="form-group"><label className="form-label">MRP (₹) *</label><input type="number" className="form-input" value={form.mrp} onChange={e => setForm((f: any) => ({ ...f, mrp: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Purchase Price (₹)</label><input type="number" className="form-input" value={form.purchase_price || ''} onChange={e => setForm((f: any) => ({ ...f, purchase_price: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">GST %</label><select className="form-select" value={form.gst_percent} onChange={e => setForm((f: any) => ({ ...f, gst_percent: Number(e.target.value) }))}>{[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}</select></div>
                <div className="form-group"><label className="form-label">Current Stock</label><input type="number" className="form-input" value={form.stock} onChange={e => setForm((f: any) => ({ ...f, stock: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Expiry Date</label><input type="month" className="form-input" value={form.expiry_date || ''} onChange={e => setForm((f: any) => ({ ...f, expiry_date: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Shelf Location</label><input className="form-input" value={form.location || ''} onChange={e => setForm((f: any) => ({ ...f, location: e.target.value }))} placeholder="e.g. Rack A-2" /></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Manufacturer</label><input className="form-input" value={form.manufacturer || ''} onChange={e => setForm((f: any) => ({ ...f, manufacturer: e.target.value }))} placeholder="e.g. Sun Pharma" /></div>
              </div>

              {form.mrp && (
                <div style={{ marginTop: 14, padding: '12px 16px', background: 'var(--teal-pale)', borderRadius: 8, display: 'flex', gap: 24, fontSize: 13, flexWrap: 'wrap' }}>
                  <div><span style={{ color: 'var(--slate-600)' }}>MRP: </span><strong>₹{form.mrp}</strong></div>
                  <div><span style={{ color: 'var(--slate-600)' }}>GST ({form.gst_percent}%): </span><strong>₹{(Number(form.mrp) * Number(form.gst_percent) / 100).toFixed(2)}</strong></div>
                  <div><span style={{ color: 'var(--slate-600)' }}>Base price: </span><strong>₹{(Number(form.mrp) / (1 + Number(form.gst_percent) / 100)).toFixed(2)}</strong></div>
                  {form.purchase_price && <div><span style={{ color: 'var(--slate-600)' }}>Margin: </span><strong style={{ color: 'var(--green)' }}>₹{(Number(form.mrp) - Number(form.purchase_price)).toFixed(2)}</strong></div>}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}><Package size={14} /> {saving ? 'Saving…' : editing ? 'Update Medicine' : 'Add to Inventory'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function InventoryClient(props: any) {
  return <ToastProvider><InventoryInner {...props} /></ToastProvider>
}
