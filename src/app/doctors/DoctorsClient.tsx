'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Plus, X, Edit, Stethoscope } from 'lucide-react'

const EMPTY = { name: '', specialization: '', qualification: '', registration_no: '', fee: '', phone: '', email: '', schedule: '', available: true }

function DoctorsInner({ initialDoctors }: any) {
  const toast = useToast()
  const supabase = createClient()
  const [doctors, setDoctors] = useState(initialDoctors)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)

  function openAdd() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(d: any) { setEditing(d.id); setForm({ ...d }); setShowModal(true) }

  async function save() {
    if (!form.name || !form.specialization) return toast('Name and specialization required', 'error')
    setSaving(true)
    const payload = { ...form, fee: Number(form.fee) }
    if (editing) {
      const { data, error } = await supabase.from('doctors').update(payload).eq('id', editing).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setDoctors((d: any) => d.map((x: any) => x.id === editing ? data : x))
      toast('Doctor updated')
    } else {
      const { data, error } = await supabase.from('doctors').insert([payload]).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setDoctors((d: any) => [data, ...d])
      toast('Doctor added')
    }
    setSaving(false); setShowModal(false)
  }

  async function toggle(id: string, val: boolean) {
    await supabase.from('doctors').update({ available: !val }).eq('id', id)
    setDoctors((d: any) => d.map((x: any) => x.id === id ? { ...x, available: !val } : x))
  }

  const fields = [
    ['name', 'Full Name *', 'text'], ['specialization', 'Specialization *', 'text'],
    ['qualification', 'Qualification', 'text'], ['registration_no', 'Registration No', 'text'],
    ['fee', 'Consultation Fee (₹) *', 'number'], ['phone', 'Phone', 'tel'],
    ['email', 'Email', 'email'], ['schedule', 'Schedule', 'text'],
  ]

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Doctors & Consultants ({doctors.length})</span>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Doctor</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 14 }}>
          {doctors.length === 0 && <div className="empty-state" style={{ gridColumn: 'span 3' }}><Stethoscope /><p>No doctors added yet</p></div>}
          {doctors.map((d: any) => (
            <div key={d.id} style={{ border: `2px solid ${d.available ? 'var(--teal)' : 'var(--slate-200)'}`, borderRadius: 12, padding: 16, background: 'white', transition: 'border .2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)' }}>{d.name}</div>
                  <div style={{ color: 'var(--teal)', fontSize: 12, fontWeight: 600 }}>{d.specialization}</div>
                  <div style={{ color: 'var(--slate-400)', fontSize: 11, marginTop: 2 }}>{d.qualification}</div>
                </div>
                <span className={`badge ${d.available ? 'badge-green' : 'badge-red'}`}>{d.available ? 'Active' : 'Off'}</span>
              </div>
              <hr className="divider" />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, fontSize: 12, marginBottom: 12 }}>
                <div><span style={{ color: 'var(--slate-400)' }}>Fee: </span><strong>₹{d.fee}</strong></div>
                <div><span style={{ color: 'var(--slate-400)' }}>Phone: </span>{d.phone}</div>
                {d.schedule && <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--slate-400)' }}>Schedule: </span>{d.schedule}</div>}
                {d.registration_no && <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--slate-400)' }}>Reg: </span><span className="font-mono">{d.registration_no}</span></div>}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-sm btn-secondary" onClick={() => openEdit(d)} style={{ flex: 1 }}><Edit size={12} /> Edit</button>
                <button className="btn btn-sm" onClick={() => toggle(d.id, d.available)}
                  style={{ flex: 1, background: d.available ? 'var(--amber-light)' : 'var(--green-light)', color: d.available ? '#92400e' : '#065f46', border: 'none', cursor: 'pointer', borderRadius: 7, fontSize: 12, fontWeight: 600 }}>
                  {d.available ? 'Set Unavailable' : 'Set Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Doctor' : 'Add Doctor'}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                {fields.map(([k, l, t]) => (
                  <div key={k} className="form-group">
                    <label className="form-label">{l}</label>
                    <input type={t} className="form-input" value={form[k] || ''} onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.value }))} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.available ? 'y' : 'n'} onChange={e => setForm((f: any) => ({ ...f, available: e.target.value === 'y' }))}>
                    <option value="y">Available</option><option value="n">Unavailable</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}><Stethoscope size={14} /> {saving ? 'Saving…' : editing ? 'Update' : 'Add Doctor'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DoctorsClient(props: any) {
  return <ToastProvider><DoctorsInner {...props} /></ToastProvider>
}
