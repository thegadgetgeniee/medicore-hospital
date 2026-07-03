'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Search, FileText, History, Edit, User, X } from 'lucide-react'
import { ToastProvider, useToast } from '@/components/ui/Toast'

const EMPTY = { name: '', age: '', gender: 'Male', phone: '', email: '', blood_group: '', address: '', allergies: '', emergency_contact: '' }

function PatientsInner({ initialPatients }: any) {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [patients, setPatients] = useState(initialPatients)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() =>
    patients.filter((p: any) =>
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.phone?.includes(search) ||
      p.uhid?.toLowerCase().includes(search.toLowerCase())
    ), [patients, search])

  function openAdd() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(p: any) { setEditing(p.id); setForm({ ...p }); setShowModal(true) }

  async function save() {
    if (!form.name || !form.phone) return toast('Name and phone are required', 'error')
    setSaving(true)
    if (editing) {
      const { data, error } = await supabase.from('patients').update({ ...form, age: Number(form.age) }).eq('id', editing).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setPatients((p: any) => p.map((x: any) => x.id === editing ? data : x))
      toast('Patient updated')
    } else {
      const { data, error } = await supabase.from('patients').insert([{ ...form, age: Number(form.age), uhid: '' }]).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setPatients((p: any) => [data, ...p])
      toast(`Patient registered — ${data.uhid}`)
    }
    setSaving(false)
    setShowModal(false)
  }

  const fields: [string, string, string, number?][] = [
    ['name', 'Full Name *', 'text'],
    ['age', 'Age *', 'number'],
    ['phone', 'Phone *', 'tel'],
    ['email', 'Email', 'email'],
    ['emergency_contact', 'Emergency Contact', 'tel'],
    ['address', 'Address', 'text', 3],
    ['allergies', 'Known Allergies', 'text', 3],
  ]

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Patient Registry ({patients.length})</span>
          <div className="flex gap-2">
            <div className="search-bar" style={{ width: 260 }}>
              <Search size={14} /><input placeholder="Name, phone, or UHID..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Register Patient</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>UHID</th><th>Patient</th><th>Age / Gender</th><th>Phone</th><th>Blood</th><th>Registered</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>No patients found</td></tr>}
              {filtered.map((p: any) => (
                <tr key={p.id}>
                  <td>
                    <span className="font-mono" style={{ fontSize: 12, background: 'var(--teal-pale)', color: 'var(--teal)', padding: '2px 8px', borderRadius: 4 }}>{p.uhid}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    {p.allergies && <div style={{ fontSize: 11, color: 'var(--red)' }}>⚠ {p.allergies}</div>}
                  </td>
                  <td style={{ fontSize: 13 }}>{p.age}y / {p.gender}</td>
                  <td className="font-mono" style={{ fontSize: 12 }}>{p.phone}</td>
                  <td>
                    {p.blood_group ? <span className="badge badge-red">{p.blood_group}</span> : <span style={{ color: 'var(--slate-400)', fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--slate-400)' }}>{p.created_at?.split('T')[0]}</td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-primary" onClick={() => router.push(`/patients/${p.id}/visit`)}><FileText size={13} /> Visit</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => router.push(`/patients/${p.id}/history`)} title="History"><History size={13} /></button>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}><Edit size={13} /></button>
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
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{editing ? 'Edit Patient' : 'Register New Patient'}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-3">
                {fields.map(([k, l, t, span]) => (
                  <div key={k} className="form-group" style={span ? { gridColumn: `span ${span}` } : {}}>
                    <label className="form-label">{l}</label>
                    <input type={t} className="form-input" value={form[k] || ''} onChange={e => setForm((f: any) => ({ ...f, [k]: e.target.value }))} />
                  </div>
                ))}
                <div className="form-group">
                  <label className="form-label">Gender</label>
                  <select className="form-select" value={form.gender} onChange={e => setForm((f: any) => ({ ...f, gender: e.target.value }))}>
                    {['Male', 'Female', 'Other'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select className="form-select" value={form.blood_group || ''} onChange={e => setForm((f: any) => ({ ...f, blood_group: e.target.value }))}>
                    <option value="">Unknown</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                <User size={14} /> {saving ? 'Saving…' : editing ? 'Update Patient' : 'Register Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PatientsClient(props: any) {
  return <ToastProvider><PatientsInner {...props} /></ToastProvider>
}
