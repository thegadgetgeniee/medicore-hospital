'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, Plus, Search, FileText, X } from 'lucide-react'
import { ToastProvider, useToast } from '@/components/ui/Toast'

const STATUS_OPTIONS = ['Scheduled', 'In Progress', 'Completed', 'Cancelled']

function AppointmentsInner({ initialAppointments, patients, doctors, today }: any) {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [appointments, setAppointments] = useState(initialAppointments)
  const [filter, setFilter] = useState(today)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    patient_id: '', doctor_id: '', date: today, time: '09:00', type: 'Consultation', notes: ''
  })

  const filtered = useMemo(() => {
    return appointments
      .filter((a: any) => {
        const matchDate = !filter || a.date === filter
        const name = a.patients?.name?.toLowerCase() || ''
        const doc = a.doctors?.name?.toLowerCase() || ''
        const matchSearch = !search || name.includes(search.toLowerCase()) || doc.includes(search.toLowerCase())
        return matchDate && matchSearch
      })
      .sort((a: any, b: any) => (a.token || 0) - (b.token || 0))
  }, [appointments, filter, search])

  const todayAppts = appointments.filter((a: any) => a.date === today)
  const completed = todayAppts.filter((a: any) => a.status === 'Completed').length

  async function book() {
    if (!form.patient_id || !form.doctor_id) return toast('Select patient and doctor', 'error')
    setSaving(true)
    const { data, error } = await supabase
      .from('appointments')
      .insert([form])
      .select('*, patients(name, uhid), doctors(name, specialization)')
      .single()
    if (error) { toast(error.message, 'error'); setSaving(false); return }
    setAppointments((prev: any) => [data, ...prev])
    toast(`Booked — Token #${data.token}`)
    setShowModal(false)
    setForm({ patient_id: '', doctor_id: '', date: today, time: '09:00', type: 'Consultation', notes: '' })
    setSaving(false)
  }

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id)
    if (error) return toast(error.message, 'error')
    setAppointments((prev: any) => prev.map((a: any) => a.id === id ? { ...a, status } : a))
    toast(`Status → ${status}`)
  }

  return (
    <div>
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
        {[
          { label: "Today's Total", value: todayAppts.length, color: 'var(--teal)' },
          { label: 'Completed', value: completed, color: 'var(--green)' },
          { label: 'Remaining', value: todayAppts.length - completed, color: 'var(--amber)' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div><div className="stat-value" style={{ color: s.color }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Appointments</span>
          <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
            <input type="date" className="form-input" style={{ width: 160 }} value={filter} onChange={e => setFilter(e.target.value)} />
            <div className="search-bar" style={{ width: 210 }}>
              <Search size={14} /><input placeholder="Patient or doctor..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> Book Appointment</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>No appointments found</td></tr>}
              {filtered.map((a: any) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ width: 34, height: 34, background: 'var(--teal-pale)', color: 'var(--teal)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14 }}>{a.token}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{a.patients?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{a.patients?.uhid} · {a.patients?.phone}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{a.doctors?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{a.doctors?.specialization}</div>
                  </td>
                  <td style={{ fontSize: 12 }}>{a.date}</td>
                  <td><span className="font-mono" style={{ fontSize: 12 }}>{a.time}</span></td>
                  <td><span className="badge badge-blue">{a.type}</span></td>
                  <td>
                    <select className="form-select" style={{ width: 130, fontSize: 12, padding: '4px 8px' }}
                      value={a.status} onChange={e => updateStatus(a.id, e.target.value)}>
                      {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-primary"
                      onClick={() => router.push(`/patients/${a.patient_id}/visit?apptId=${a.id}&doctorId=${a.doctor_id}`)}>
                      <FileText size={13} /> Visit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Book New Appointment</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group">
                  <label className="form-label">Patient *</label>
                  <select className="form-select" value={form.patient_id} onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}>
                    <option value="">Select patient…</option>
                    {patients.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.uhid}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Doctor *</label>
                  <select className="form-select" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
                    <option value="">Select doctor…</option>
                    {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.name} — {d.specialization}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time *</label>
                  <input type="time" className="form-input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Visit Type</label>
                  <select className="form-select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {['Consultation', 'Follow-up', 'Emergency', 'Procedure', 'Review'].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={book} disabled={saving}>
                <CalendarDays size={14} /> {saving ? 'Booking…' : 'Book Appointment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppointmentsClient(props: any) {
  return <ToastProvider><AppointmentsInner {...props} /></ToastProvider>
}
