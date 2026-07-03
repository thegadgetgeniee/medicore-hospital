'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Plus, X, Edit, Trash2, Wrench } from 'lucide-react'

const CATS = ['OPD', 'Diagnostics', 'Lab', 'Radiology', 'Procedure', 'Surgery', 'Other']
const EMPTY = { name: '', category: 'OPD', price: '', gst_percent: 0, description: '', active: true }

function ServicesInner({ initialServices }: any) {
  const toast = useToast()
  const supabase = createClient()
  const [services, setServices] = useState(initialServices)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filterCat, setFilterCat] = useState('')

  const filtered = useMemo(() => services.filter((s: any) => !filterCat || s.category === filterCat), [services, filterCat])

  function openAdd() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(s: any) { setEditing(s.id); setForm({ ...s }); setShowModal(true) }

  async function save() {
    if (!form.name || !form.price) return toast('Name and price required', 'error')
    setSaving(true)
    const payload = { ...form, price: Number(form.price), gst_percent: Number(form.gst_percent) }
    if (editing) {
      const { data, error } = await supabase.from('services').update(payload).eq('id', editing).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setServices((s: any) => s.map((x: any) => x.id === editing ? data : x))
      toast('Service updated')
    } else {
      const { data, error } = await supabase.from('services').insert([payload]).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setServices((s: any) => [data, ...s])
      toast('Service added')
    }
    setSaving(false); setShowModal(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this service?')) return
    await supabase.from('services').delete().eq('id', id)
    setServices((s: any) => s.filter((x: any) => x.id !== id))
    toast('Service deleted')
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Services & Charges ({services.length})</span>
          <div className="flex gap-2">
            <select className="form-select" style={{ width: 150 }} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
              <option value="">All Categories</option>{CATS.map(c => <option key={c}>{c}</option>)}
            </select>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Service</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Service Name</th><th>Category</th><th>Price</th><th>GST%</th><th>Total (incl. GST)</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>No services found</td></tr>}
              {filtered.map((svc: any) => (
                <tr key={svc.id}>
                  <td><div style={{ fontWeight: 600 }}>{svc.name}</div>{svc.description && <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{svc.description}</div>}</td>
                  <td><span className="tag">{svc.category}</span></td>
                  <td style={{ fontWeight: 700 }}>₹{svc.price}</td>
                  <td><span className="badge badge-amber">{svc.gst_percent}%</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--teal)' }}>₹{(svc.price * (1 + svc.gst_percent / 100)).toFixed(2)}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(svc)}><Edit size={13} /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(svc.id)}><Trash2 size={13} /></button>
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
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Service' : 'Add Service'}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Service Name *</label><input className="form-input" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} placeholder="e.g. ECG, Blood Test CBC" /></div>
                <div className="form-group"><label className="form-label">Category</label><select className="form-select" value={form.category} onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Price (₹) *</label><input type="number" className="form-input" value={form.price} onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">GST %</label><select className="form-select" value={form.gst_percent} onChange={e => setForm((f: any) => ({ ...f, gst_percent: Number(e.target.value) }))}>{[0, 5, 12, 18, 28].map(g => <option key={g} value={g}>{g}%</option>)}</select></div>
                <div className="form-group"><label className="form-label">With GST</label><input className="form-input" readOnly value={`₹${(Number(form.price || 0) * (1 + Number(form.gst_percent) / 100)).toFixed(2)}`} style={{ background: 'var(--slate-50)', fontWeight: 700, color: 'var(--teal)' }} /></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Description</label><input className="form-input" value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}><Wrench size={14} /> {saving ? 'Saving…' : editing ? 'Update' : 'Add Service'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ServicesClient(props: any) {
  return <ToastProvider><ServicesInner {...props} /></ToastProvider>
}
