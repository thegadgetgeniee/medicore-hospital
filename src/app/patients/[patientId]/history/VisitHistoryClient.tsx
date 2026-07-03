'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, FileText, ChevronDown, ChevronRight, Activity, Pill } from 'lucide-react'

export default function VisitHistoryClient({ patient, visits }: any) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(visits[0]?.id || null)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => router.push('/patients')}><ArrowLeft size={14} /> Patients</button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--navy)' }}>{patient.name}</div>
          <div style={{ fontSize: 13, color: 'var(--slate-400)' }}>{patient.uhid} · {patient.age}y / {patient.gender} · {patient.phone}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => router.push(`/patients/${patient.id}/visit`)}><FileText size={14} /> New Visit</button>
        </div>
      </div>

      {visits.length === 0 ? (
        <div className="card"><div className="empty-state"><FileText /><p>No visit history found</p></div></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visits.map((v: any, i: number) => (
            <div key={v.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, background: expanded === v.id ? 'var(--teal-pale)' : 'white', transition: 'background .15s' }}
                onClick={() => setExpanded(expanded === v.id ? null : v.id)}
              >
                <div style={{ width: 36, height: 36, background: 'var(--navy)', color: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                  {visits.length - i}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: 'var(--navy)' }}>{v.date} — {v.doctors?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate-600)', marginTop: 2 }}>
                    {v.chief_complaint || '—'}{v.diagnosis ? ` · ${v.diagnosis}` : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <span className="badge badge-teal">{(v.prescription || []).length} medicines</span>
                  {v.follow_up && <span className="badge badge-amber">Follow-up: {v.follow_up}</span>}
                  <span className={`badge ${v.billing_paid ? 'badge-green' : 'badge-red'}`}>{v.billing_paid ? 'Paid' : 'Unpaid'}</span>
                  {expanded === v.id ? <ChevronDown size={16} color="var(--teal)" /> : <ChevronRight size={16} color="var(--slate-400)" />}
                </div>
              </div>

              {expanded === v.id && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--slate-200)', background: 'var(--slate-50)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                    {/* Vitals */}
                    <div style={{ background: 'white', borderRadius: 10, padding: 14 }}>
                      <div className="section-heading" style={{ marginBottom: 10 }}><Activity />Vitals</div>
                      {Object.entries(v.vitals || {}).filter(([, val]) => val).map(([k, val]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid var(--slate-100)' }}>
                          <span style={{ color: 'var(--slate-400)', textTransform: 'uppercase', fontSize: 11, fontWeight: 600 }}>{k}</span>
                          <span style={{ fontWeight: 700 }}>{val as string}</span>
                        </div>
                      ))}
                    </div>

                    {/* Diagnosis */}
                    <div style={{ background: 'white', borderRadius: 10, padding: 14 }}>
                      <div className="section-heading" style={{ marginBottom: 10 }}><FileText />Diagnosis</div>
                      <div style={{ fontWeight: 700, color: 'var(--navy)', marginBottom: 8, fontSize: 14 }}>{v.diagnosis || '—'}</div>
                      {v.notes && <div style={{ fontSize: 12, color: 'var(--slate-600)', lineHeight: 1.6 }}>{v.notes}</div>}
                      {v.follow_up && (
                        <div style={{ marginTop: 10, fontSize: 12, background: 'var(--amber-light)', color: '#92400e', padding: '6px 10px', borderRadius: 6, fontWeight: 600 }}>
                          📅 Follow-up: {v.follow_up}
                        </div>
                      )}
                    </div>

                    {/* Billing */}
                    <div style={{ background: 'white', borderRadius: 10, padding: 14 }}>
                      <div className="section-heading" style={{ marginBottom: 10 }}>💰 Billing</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span>Consultation Fee</span><span style={{ fontWeight: 600 }}>₹{v.consultation_fee || 0}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 800, color: 'var(--navy)', borderTop: '2px solid var(--navy)', paddingTop: 8, marginTop: 8 }}>
                        <span>Total</span><span>₹{v.consultation_fee || 0}</span>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <span className={`badge ${v.billing_paid ? 'badge-green' : 'badge-red'}`}>{v.billing_paid ? '✓ Paid' : '⚠ Unpaid'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Prescription */}
                  {(v.prescription || []).length > 0 && (
                    <div style={{ background: 'white', borderRadius: 10, padding: 14 }}>
                      <div className="section-heading" style={{ marginBottom: 10 }}><Pill />Prescription</div>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr>
                            {['#', 'Medicine', 'Dosage', 'Duration', 'Instructions'].map(h => (
                              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, color: 'var(--slate-400)', fontWeight: 700, borderBottom: '1px solid var(--slate-200)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {v.prescription.map((r: any, idx: number) => (
                            <tr key={idx} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                              <td style={{ padding: '7px 10px', color: 'var(--teal)', fontWeight: 800 }}>{idx + 1}</td>
                              <td style={{ padding: '7px 10px', fontWeight: 600 }}>{r.name}</td>
                              <td style={{ padding: '7px 10px' }}>
                                <span className="font-mono" style={{ fontSize: 12, background: 'var(--teal-pale)', color: 'var(--teal)', padding: '2px 6px', borderRadius: 4 }}>{r.dosage}</span>
                              </td>
                              <td style={{ padding: '7px 10px', fontSize: 12 }}>{r.duration}</td>
                              <td style={{ padding: '7px 10px', fontSize: 12, color: 'var(--slate-600)' }}>{r.instructions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
