'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Stethoscope, Activity, Pill, Plus, Trash2, Save, Send, ArrowLeft, Printer } from 'lucide-react'

const today = () => new Date().toISOString().split('T')[0]

function VisitInner({ patient, doctors, apptId, defaultDoctorId }: any) {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()

  const [form, setForm] = useState({
    doctor_id: defaultDoctorId || '',
    date: today(),
    chief_complaint: '',
    vitals: { bp: '', pulse: '', temp: '', weight: '', spo2: '' },
    diagnosis: '',
    prescription: [] as any[],
    notes: '',
    follow_up: '',
  })
  const [rxItem, setRxItem] = useState({ name: '', dosage: '', duration: '', instructions: '' })
  const [saving, setSaving] = useState(false)

  const doctor = doctors.find((d: any) => d.id === form.doctor_id)

  function addRx() {
    if (!rxItem.name) return toast('Enter medicine name', 'error')
    setForm(f => ({ ...f, prescription: [...f.prescription, { ...rxItem, _id: Date.now() }] }))
    setRxItem({ name: '', dosage: '', duration: '', instructions: '' })
  }

  function removeRx(id: number) {
    setForm(f => ({ ...f, prescription: f.prescription.filter((r: any) => r._id !== id) }))
  }

  async function saveVisit(sendToPharm = false) {
    if (!form.doctor_id) return toast('Select a doctor', 'error')
    setSaving(true)

    const visitData = {
      patient_id: patient.id,
      appointment_id: apptId || null,
      doctor_id: form.doctor_id,
      date: form.date,
      chief_complaint: form.chief_complaint,
      vitals: form.vitals,
      diagnosis: form.diagnosis,
      prescription: form.prescription,
      notes: form.notes,
      follow_up: form.follow_up || null,
      consultation_fee: doctor?.fee || 0,
      billing_paid: false,
    }

    const { data: visit, error } = await supabase.from('visits').insert([visitData]).select().single()
    if (error) { toast(error.message, 'error'); setSaving(false); return }

    // Update appointment status
    if (apptId) {
      await supabase.from('appointments').update({ status: 'Completed' }).eq('id', apptId)
    }

    toast('Visit saved successfully')

    if (sendToPharm && form.prescription.length > 0) {
      const { data: order } = await supabase.from('pharmacy_orders').insert([{
        visit_id: visit.id,
        patient_id: patient.id,
        doctor_id: form.doctor_id,
        date: form.date,
        items: form.prescription.map((r: any) => ({ name: r.name, dosage: r.dosage, duration: r.duration, qty: 1 })),
        status: 'Pending'
      }]).select().single()

      toast('Prescription sent to pharmacy!', 'info')
      if (order) { setSaving(false); router.push(`/pharmacy/sales?order=${order.id}`); return }
    }

    setSaving(false)
    router.push(`/patients/${patient.id}/history`)
  }

  return (
    <div>
      {/* Patient header */}
      <div className="card mb-4" style={{ background: 'var(--navy)', color: 'white', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <button onClick={() => router.push('/patients')} style={{ background: 'rgba(255,255,255,.1)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={12} /> Back to Patients
            </button>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{patient.name}</div>
            <div style={{ opacity: .7, fontSize: 13, marginTop: 4 }}>
              {patient.uhid} · {patient.age}y · {patient.gender} · Blood: {patient.blood_group || 'Unknown'}
              {patient.allergies && <span style={{ marginLeft: 12, color: '#fca5a5', fontWeight: 600 }}>⚠ Allergy: {patient.allergies}</span>}
            </div>
            <div style={{ opacity: .55, fontSize: 12, marginTop: 2 }}>{patient.phone}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,.1)', color: 'white', border: 'none' }} onClick={() => window.print()}><Printer size={13} /> Print</button>
            <button className="btn btn-sm" style={{ background: 'var(--teal)', color: 'white', border: 'none' }} onClick={() => router.push(`/patients/${patient.id}/history`)}>Visit History</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="section-heading"><Stethoscope />Visit Details</div>
            <div className="form-grid form-grid-2">
              <div className="form-group">
                <label className="form-label">Doctor *</label>
                <select className="form-select" value={form.doctor_id} onChange={e => setForm(f => ({ ...f, doctor_id: e.target.value }))}>
                  <option value="">Select doctor</option>
                  {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Visit Date</label>
                <input type="date" className="form-input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Chief Complaint</label>
                <input className="form-input" value={form.chief_complaint} onChange={e => setForm(f => ({ ...f, chief_complaint: e.target.value }))} placeholder="Main reason for visit..." />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Diagnosis</label>
                <input className="form-input" value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} placeholder="Clinical diagnosis..." />
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Notes / Advice</label>
                <textarea className="form-textarea" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Instructions, referrals..." style={{ minHeight: 64 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Follow-up Date</label>
                <input type="date" className="form-input" value={form.follow_up} onChange={e => setForm(f => ({ ...f, follow_up: e.target.value }))} />
              </div>
              {doctor && (
                <div className="form-group">
                  <label className="form-label">Consultation Fee</label>
                  <input className="form-input" readOnly value={`₹${doctor.fee}`} style={{ background: 'var(--slate-50)', fontWeight: 700, color: 'var(--teal)' }} />
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="section-heading"><Activity />Vitals</div>
            <div className="form-grid form-grid-2">
              {[['bp', 'BP (mmHg)', '120/80'], ['pulse', 'Pulse (bpm)', '72'], ['temp', 'Temp (°F)', '98.6'], ['weight', 'Weight (kg)', ''], ['spo2', 'SpO₂ (%)', '98']].map(([k, l, ph]) => (
                <div key={k} className="form-group">
                  <label className="form-label">{l}</label>
                  <input className="form-input" placeholder={ph} value={(form.vitals as any)[k]} onChange={e => setForm(f => ({ ...f, vitals: { ...f.vitals, [k]: e.target.value } }))} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Prescription */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="section-heading"><Pill />Digital Prescription (Rx)</div>

          <div style={{ background: 'var(--slate-50)', borderRadius: 8, padding: 14, marginBottom: 14, border: '1px solid var(--slate-200)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--slate-600)', marginBottom: 10 }}>Add Medicine</div>
            <div className="form-grid form-grid-2" style={{ marginBottom: 8 }}>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Medicine Name *</label>
                <input className="form-input" value={rxItem.name} onChange={e => setRxItem(r => ({ ...r, name: e.target.value }))} placeholder="e.g. Paracetamol 500mg" onKeyDown={e => e.key === 'Enter' && addRx()} />
              </div>
              <div className="form-group">
                <label className="form-label">Dosage</label>
                <select className="form-select" value={rxItem.dosage} onChange={e => setRxItem(r => ({ ...r, dosage: e.target.value }))}>
                  <option value="">Select</option>
                  {['1-0-0', '0-1-0', '0-0-1', '1-0-1', '1-1-1', '1-1-0', '0-1-1', 'SOS', 'OD', 'BD', 'TID', 'QID'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <select className="form-select" value={rxItem.duration} onChange={e => setRxItem(r => ({ ...r, duration: e.target.value }))}>
                  <option value="">Select</option>
                  {['1 day', '3 days', '5 days', '7 days', '10 days', '14 days', '1 month', 'Ongoing'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Instructions</label>
                <input className="form-input" value={rxItem.instructions} onChange={e => setRxItem(r => ({ ...r, instructions: e.target.value }))} placeholder="e.g. After food, with water" />
              </div>
            </div>
            <button className="btn btn-primary btn-sm" onClick={addRx}><Plus size={13} /> Add Medicine</button>
          </div>

          {form.prescription.length === 0 ? (
            <div className="empty-state"><Pill /><p>No medicines added yet</p></div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--slate-50)' }}>
                  {['#', 'Medicine', 'Dosage', 'Duration', 'Instructions', ''].map(h => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: 11, color: 'var(--slate-400)', fontWeight: 700, borderBottom: '1px solid var(--slate-200)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {form.prescription.map((r: any, i: number) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                    <td style={{ padding: '8px 10px', color: 'var(--teal)', fontWeight: 800, fontSize: 14 }}>{i + 1}</td>
                    <td style={{ padding: '8px 10px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '8px 10px' }}>
                      <span className="font-mono" style={{ fontSize: 12, background: 'var(--teal-pale)', color: 'var(--teal)', padding: '2px 6px', borderRadius: 4 }}>{r.dosage}</span>
                    </td>
                    <td style={{ padding: '8px 10px', fontSize: 12 }}>{r.duration}</td>
                    <td style={{ padding: '8px 10px', fontSize: 12, color: 'var(--slate-600)' }}>{r.instructions}</td>
                    <td style={{ padding: '4px' }}>
                      <button onClick={() => removeRx(r._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--red)' }}><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => saveVisit(false)} disabled={saving}><Save size={14} /> Save Visit</button>
            <button className="btn btn-primary" onClick={() => saveVisit(true)} disabled={saving}>
              <Send size={14} /> {saving ? 'Saving…' : 'Save & Send to Pharmacy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PatientVisitClient(props: any) {
  return <ToastProvider><VisitInner {...props} /></ToastProvider>
}
