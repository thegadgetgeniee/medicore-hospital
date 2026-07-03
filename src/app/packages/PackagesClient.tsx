'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Plus, X, Edit, Trash2, Package } from 'lucide-react'

const EMPTY = { name: '', description: '', price: '', service_ids: [] as string[] }

function PackagesInner({ initialPackages, services }: any) {
  const toast = useToast()
  const supabase = createClient()
  const [packages, setPackages] = useState(initialPackages)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)

  function openAdd() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(p: any) { setEditing(p.id); setForm({ ...p, service_ids: p.service_ids || [] }); setShowModal(true) }

  function toggleService(id: string) {
    setForm((f: any) => ({
      ...f, service_ids: f.service_ids.includes(id) ? f.service_ids.filter((s: string) => s !== id) : [...f.service_ids, id]
    }))
  }

  const includedServices = services.filter((s: any) => form.service_ids?.includes(s.id))
  const mrpTotal = includedServices.reduce((s: number, svc: any) => s + svc.price, 0)

  async function save() {
    if (!form.name || !form.price) return toast('Name and price required', 'error')
    setSaving(true)
    const payload = { ...form, price: Number(form.price) }
    if (editing) {
      const { data, error } = await supabase.from('packages').update(payload).eq('id', editing).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setPackages((p: any) => p.map((x: any) => x.id === editing ? data : x))
      toast('Package updated')
    } else {
      const { data, error } = await supabase.from('packages').insert([payload]).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setPackages((p: any) => [data, ...p])
      toast('Package created')
    }
    setSaving(false); setShowModal(false)
  }

  async function remove(id: string) {
    if (!confirm('Delete this package?')) return
    await supabase.from('packages').delete().eq('id', id)
    setPackages((p: any) => p.filter((x: any) => x.id !== id))
    toast('Package deleted')
  }

  function getIncluded(pkg: any) {
    return services.filter((s: any) => (pkg.service_ids || []).includes(s.id))
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Health Packages ({packages.length})</span>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Create Package</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
          {packages.length === 0 && <div className="empty-state" style={{ gridColumn: 'span 3' }}><Package /><p>No packages created yet</p></div>}
          {packages.map((pkg: any) => {
            const svcs = getIncluded(pkg)
            const mrp = svcs.reduce((s: number, svc: any) => s + svc.price, 0)
            const saving = mrp - pkg.price
            return (
              <div key={pkg.id} style={{ border: '2px solid var(--teal-pale)', borderRadius: 14, overflow: 'hidden', background: 'white' }}>
                <div style={{ background: 'var(--navy)', padding: '14px 16px', color: 'white' }}>
                  <div style={{ fontSize: 15, fontWeight: 800 }}>{pkg.name}</div>
                  {pkg.description && <div style={{ fontSize: 12, opacity: .7, marginTop: 2 }}>{pkg.description}</div>}
                </div>
                <div style={{ padding: 14 }}>
                  {svcs.map((s: any) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--slate-100)' }}>
                      <span>{s.name}</span><span style={{ color: 'var(--slate-400)', textDecoration: 'line-through' }}>₹{s.price}</span>
                    </div>
                  ))}
                  {svcs.length === 0 && <div style={{ color: 'var(--slate-400)', fontSize: 12, marginBottom: 8 }}>No services linked</div>}
                  {saving > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--green)', marginTop: 8 }}>
                      <span>You save</span><span className="badge badge-green">₹{saving}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid var(--navy)', paddingTop: 10, marginTop: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: 18, color: 'var(--navy)' }}>₹{pkg.price}</span>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(pkg)}><Edit size={12} /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(pkg.id)}><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Package' : 'Create Package'}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid" style={{ marginBottom: 16 }}>
                <div className="form-group"><label className="form-label">Package Name *</label><input className="form-input" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Description</label><input className="form-input" value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Package Price (₹) *</label><input type="number" className="form-input" value={form.price} onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))} /></div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--navy)' }}>Select Included Services</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxHeight: 240, overflowY: 'auto' }}>
                {services.map((svc: any) => {
                  const checked = form.service_ids?.includes(svc.id)
                  return (
                    <label key={svc.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: `1.5px solid ${checked ? 'var(--teal)' : 'var(--slate-200)'}`, borderRadius: 8, cursor: 'pointer', background: checked ? 'var(--teal-pale)' : 'white', transition: 'all .1s' }}>
                      <input type="checkbox" checked={checked} onChange={() => toggleService(svc.id)} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{svc.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>₹{svc.price}</div>
                      </div>
                    </label>
                  )
                })}
              </div>
              {form.service_ids?.length > 0 && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--slate-100)', borderRadius: 8, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>Services MRP Total</span><strong>₹{mrpTotal}</strong>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}><Package size={14} /> {saving ? 'Saving…' : editing ? 'Update' : 'Create Package'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PackagesClient(props: any) {
  return <ToastProvider><PackagesInner {...props} /></ToastProvider>
}
