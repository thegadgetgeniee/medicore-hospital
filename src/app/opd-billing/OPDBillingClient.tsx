'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Plus, Search, Printer, X, Receipt, Trash2 } from 'lucide-react'

const today = () => new Date().toISOString().split('T')[0]

function BillPrint({ bill, onClose }: any) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">OPD Bill — {bill.id?.slice(0, 8).toUpperCase()}</span>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer size={13} /> Print</button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={13} /></button>
          </div>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '2px solid var(--navy)', paddingBottom: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>MediCore Hospital</div>
            <div style={{ fontSize: 13, color: 'var(--slate-400)' }}>OPD Bill / Receipt</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 13 }}>
            <div><strong>Patient:</strong> {bill.patients?.name || bill.patient_name}</div>
            <div><strong>Bill No:</strong> <span className="font-mono">{bill.id?.slice(0, 8).toUpperCase()}</span></div>
            <div><strong>Doctor:</strong> {bill.doctors?.name || bill.doctor_name || '—'}</div>
            <div><strong>Date:</strong> {bill.date}</div>
            <div><strong>Payment:</strong> {bill.payment_mode}</div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
            <thead>
              <tr style={{ background: 'var(--navy)', color: 'white' }}>
                {['Service', 'Qty', 'Rate', 'GST%', 'Amount'].map(h => (
                  <th key={h} style={{ padding: '7px 8px', textAlign: h === 'Qty' || h === 'GST%' ? 'center' : h === 'Rate' || h === 'Amount' ? 'right' : 'left', fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(bill.items || []).map((item: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                  <td style={{ padding: '7px 8px', fontSize: 13 }}>{item.name}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'center', fontSize: 13 }}>{item.qty}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: 13 }}>₹{item.price}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'center', fontSize: 12, color: 'var(--slate-400)' }}>{item.gst_percent}%</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, fontSize: 13 }}>₹{(item.price * item.qty * (1 + item.gst_percent / 100)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ textAlign: 'right', fontSize: 13 }}>
            {[['Subtotal', `₹${bill.sub_total?.toFixed(2)}`], ['GST', `₹${bill.gst_total?.toFixed(2)}`]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginBottom: 4 }}>
                <span style={{ color: 'var(--slate-400)' }}>{l}</span><span>{v}</span>
              </div>
            ))}
            {bill.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, marginBottom: 4, color: 'var(--green)' }}>
                <span>Discount</span><span>−₹{bill.discount}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, borderTop: '2px solid var(--navy)', paddingTop: 10, marginTop: 8, fontWeight: 800, fontSize: 18, color: 'var(--navy)' }}>
              <span>Grand Total</span><span>₹{bill.total?.toFixed(2)}</span>
            </div>
            <div style={{ marginTop: 8 }}><span className="badge badge-green">PAID — {bill.payment_mode}</span></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OPDBillingInner({ initialBills, patients, doctors, services, packages }: any) {
  const toast = useToast()
  const supabase = createClient()
  const [bills, setBills] = useState(initialBills)
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [viewBill, setViewBill] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [bill, setBill] = useState({ patient_id: '', doctor_id: '', date: today(), payment_mode: 'Cash', discount: 0, items: [] as any[], notes: '' })

  const doctor = doctors.find((d: any) => d.id === bill.doctor_id)
  const subTotal = bill.items.reduce((s: number, i: any) => s + i.price * i.qty, 0)
  const gstTotal = bill.items.reduce((s: number, i: any) => s + i.price * i.qty * i.gst_percent / 100, 0)
  const grandTotal = subTotal + gstTotal - Number(bill.discount || 0)

  function addConsultation() {
    if (!doctor) return toast('Select a doctor first', 'error')
    if (bill.items.find((i: any) => i.type === 'consultation')) return
    setBill(b => ({ ...b, items: [...b.items, { type: 'consultation', name: `Consultation — ${doctor.name}`, qty: 1, price: doctor.fee, gst_percent: 0 }] }))
  }

  function addService(svc: any) {
    setBill(b => ({ ...b, items: [...b.items, { type: 'service', name: svc.name, qty: 1, price: svc.price, gst_percent: svc.gst_percent }] }))
  }

  function addPackage(pkg: any) {
    setBill(b => ({ ...b, items: [...b.items, { type: 'package', name: pkg.name, qty: 1, price: pkg.price, gst_percent: 5 }] }))
  }

  function updateQty(i: number, qty: number) {
    setBill(b => ({ ...b, items: b.items.map((item: any, idx: number) => idx === i ? { ...item, qty } : item) }))
  }
  function removeItem(i: number) {
    setBill(b => ({ ...b, items: b.items.filter((_: any, idx: number) => idx !== i) }))
  }

  async function saveBill() {
    if (!bill.patient_id) return toast('Select a patient', 'error')
    if (bill.items.length === 0) return toast('Add at least one service', 'error')
    setSaving(true)
    const patient = patients.find((p: any) => p.id === bill.patient_id)
    const { data, error } = await supabase.from('opd_bills').insert([{
      patient_id: bill.patient_id, doctor_id: bill.doctor_id || null,
      date: bill.date, items: bill.items,
      sub_total: subTotal, gst_total: gstTotal,
      discount: Number(bill.discount || 0), total: grandTotal,
      payment_mode: bill.payment_mode, notes: bill.notes,
    }]).select('*, patients(name, uhid), doctors(name)').single()
    if (error) { toast(error.message, 'error'); setSaving(false); return }
    setBills((prev: any) => [data, ...prev])
    toast('Bill saved!')
    setViewBill(data)
    setShowNew(false)
    setBill({ patient_id: '', doctor_id: '', date: today(), payment_mode: 'Cash', discount: 0, items: [], notes: '' })
    setSaving(false)
  }

  const filtered = useMemo(() => bills.filter((b: any) =>
    !search || b.patients?.name?.toLowerCase().includes(search.toLowerCase()) || b.id?.includes(search)
  ), [bills, search])

  return (
    <div>
      {viewBill && <BillPrint bill={viewBill} onClose={() => setViewBill(null)} />}

      <div className="card">
        <div className="card-header">
          <span className="card-title">OPD Bills ({bills.length})</span>
          <div className="flex gap-2">
            <div className="search-bar" style={{ width: 210 }}><Search size={14} /><input placeholder="Patient or bill ID..." value={search} onChange={e => setSearch(e.target.value)} /></div>
            <button className="btn btn-primary" onClick={() => setShowNew(true)}><Plus size={14} /> New Bill</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Bill ID</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Items</th><th>Subtotal</th><th>GST</th><th>Discount</th><th>Total</th><th>Payment</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>No bills yet</td></tr>}
              {filtered.map((b: any) => (
                <tr key={b.id}>
                  <td><span className="font-mono" style={{ fontSize: 11 }}>{b.id?.slice(0, 8).toUpperCase()}</span></td>
                  <td style={{ fontWeight: 600 }}>{b.patients?.name}</td>
                  <td style={{ fontSize: 12, color: 'var(--slate-400)' }}>{b.doctors?.name || '—'}</td>
                  <td style={{ fontSize: 12 }}>{b.date}</td>
                  <td style={{ fontSize: 12, color: 'var(--slate-400)' }}>{b.items?.length}</td>
                  <td>₹{b.sub_total?.toFixed(2)}</td>
                  <td style={{ color: 'var(--amber)' }}>₹{b.gst_total?.toFixed(2)}</td>
                  <td style={{ color: 'var(--green)' }}>{b.discount > 0 ? `−₹${b.discount}` : '—'}</td>
                  <td style={{ fontWeight: 800, color: 'var(--navy)' }}>₹{b.total?.toFixed(2)}</td>
                  <td><span className="badge badge-green">{b.payment_mode}</span></td>
                  <td><button className="btn btn-sm btn-ghost" onClick={() => setViewBill(b)}><Printer size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNew && (
        <div className="modal-overlay" onClick={() => setShowNew(false)}>
          <div className="modal" style={{ maxWidth: 860 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">New OPD Bill</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowNew(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20 }}>
                {/* Left selectors */}
                <div>
                  <div className="form-grid" style={{ marginBottom: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Patient *</label>
                      <select className="form-select" value={bill.patient_id} onChange={e => setBill(b => ({ ...b, patient_id: e.target.value }))}>
                        <option value="">Select patient</option>
                        {patients.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.uhid}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Doctor</label>
                      <select className="form-select" value={bill.doctor_id} onChange={e => setBill(b => ({ ...b, doctor_id: e.target.value }))}>
                        <option value="">Select doctor</option>
                        {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.name} — ₹{d.fee}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Date</label>
                      <input type="date" className="form-input" value={bill.date} onChange={e => setBill(b => ({ ...b, date: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Payment Mode</label>
                      <select className="form-select" value={bill.payment_mode} onChange={e => setBill(b => ({ ...b, payment_mode: e.target.value }))}>
                        {['Cash', 'UPI', 'Card', 'NEFT', 'Insurance'].map(m => <option key={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-sm w-full" style={{ marginBottom: 12 }} onClick={addConsultation}>+ Add Consultation {doctor ? `(₹${doctor.fee})` : ''}</button>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-400)', marginBottom: 6, textTransform: 'uppercase' }}>Services</div>
                  <div style={{ maxHeight: 150, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {services.map((svc: any) => (
                      <button key={svc.id} onClick={() => addService(svc)}
                        style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', border: '1px solid var(--slate-200)', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12, transition: 'background .1s' }}
                        onMouseOver={e => (e.currentTarget.style.background = 'var(--teal-pale)')} onMouseOut={e => (e.currentTarget.style.background = 'white')}>
                        <span>{svc.name} <span style={{ color: 'var(--slate-400)' }}>({svc.category})</span></span>
                        <span style={{ color: 'var(--teal)', fontWeight: 700 }}>₹{svc.price}</span>
                      </button>
                    ))}
                  </div>
                  {packages.length > 0 && <>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--slate-400)', margin: '10px 0 6px', textTransform: 'uppercase' }}>Packages</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {packages.map((pkg: any) => (
                        <button key={pkg.id} onClick={() => addPackage(pkg)}
                          style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', border: '1px solid var(--purple-light)', borderRadius: 6, background: 'white', cursor: 'pointer', fontSize: 12 }}
                          onMouseOver={e => (e.currentTarget.style.background = 'var(--purple-light)')} onMouseOut={e => (e.currentTarget.style.background = 'white')}>
                          <span>{pkg.name}</span><span style={{ color: 'var(--purple)', fontWeight: 700 }}>₹{pkg.price}</span>
                        </button>
                      ))}
                    </div>
                  </>}
                </div>

                {/* Right bill */}
                <div>
                  {bill.items.length === 0 ? <div className="empty-state"><Receipt /><p>Add services from the left panel</p></div> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
                      <thead><tr style={{ background: 'var(--slate-50)' }}>
                        {['Item', 'Qty', 'Rate', 'GST', 'Total', ''].map(h => <th key={h} style={{ padding: '7px 8px', fontSize: 11, textAlign: h === 'Rate' || h === 'Total' ? 'right' : 'left', color: 'var(--slate-400)', fontWeight: 700 }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {bill.items.map((item: any, i: number) => (
                          <tr key={i} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                            <td style={{ padding: '7px 8px', fontSize: 12 }}>{item.name}</td>
                            <td style={{ padding: '7px 8px' }}><input type="number" min={1} className="form-input" style={{ width: 50, padding: '3px 6px', textAlign: 'center', fontSize: 12 }} value={item.qty} onChange={e => updateQty(i, Number(e.target.value))} /></td>
                            <td style={{ padding: '7px 8px', textAlign: 'right', fontSize: 12 }}>₹{item.price}</td>
                            <td style={{ padding: '7px 8px', textAlign: 'center' }}><span className="badge badge-amber" style={{ fontSize: 10 }}>{item.gst_percent}%</span></td>
                            <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700, fontSize: 12 }}>₹{(item.price * item.qty * (1 + item.gst_percent / 100)).toFixed(2)}</td>
                            <td><button onClick={() => removeItem(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--red)' }}><Trash2 size={13} /></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {bill.items.length > 0 && (
                    <div style={{ background: 'var(--slate-50)', borderRadius: 8, padding: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span style={{ color: 'var(--slate-400)' }}>Subtotal</span><span>₹{subTotal.toFixed(2)}</span></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 10 }}><span style={{ color: 'var(--slate-400)' }}>GST</span><span>₹{gstTotal.toFixed(2)}</span></div>
                      <div className="form-group" style={{ marginBottom: 10 }}>
                        <label className="form-label">Discount (₹)</label>
                        <input type="number" className="form-input" value={bill.discount} onChange={e => setBill(b => ({ ...b, discount: Number(e.target.value) }))} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, color: 'var(--navy)', borderTop: '2px solid var(--navy)', paddingTop: 10 }}>
                        <span>Grand Total</span><span>₹{grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowNew(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveBill} disabled={saving}><Receipt size={14} /> {saving ? 'Saving…' : 'Save & Print Bill'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function OPDBillingClient(props: any) {
  return <ToastProvider><OPDBillingInner {...props} /></ToastProvider>
}
