'use client'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Plus, Search, Printer, X, ShoppingCart, Trash2, Receipt } from 'lucide-react'

const today = () => new Date().toISOString().split('T')[0]

function GstInvoicePrint({ bill, onClose }: any) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">Pharmacy Bill — {bill.id?.slice(0, 8).toUpperCase()}</span>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}><Printer size={13} /> Print</button>
            <button className="btn btn-secondary btn-sm" onClick={onClose}><X size={13} /></button>
          </div>
        </div>
        <div className="modal-body">
          <div style={{ textAlign: 'center', marginBottom: 16, borderBottom: '2px solid var(--navy)', paddingBottom: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>MediCore Hospital Pharmacy</div>
            <div style={{ fontSize: 12, color: 'var(--slate-400)', marginTop: 2 }}>GST Tax Invoice</div>
            <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>GSTIN: 37AAAAA0000A1Z5 | Drug Lic: AP/DL/2024/0001</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14, fontSize: 12 }}>
            <div style={{ background: 'var(--slate-50)', padding: 10, borderRadius: 6 }}>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>Bill To:</div>
              <div>{bill.patient_name || 'Walk-in Customer'}</div>
              {bill.doctor_name && <div style={{ color: 'var(--slate-400)' }}>Prescribed by: {bill.doctor_name}</div>}
            </div>
            <div style={{ background: 'var(--slate-50)', padding: 10, borderRadius: 6 }}>
              <div><strong>Bill No:</strong> <span className="font-mono">{bill.id?.slice(0, 8).toUpperCase()}</span></div>
              <div><strong>Date:</strong> {bill.date}</div>
              <div><strong>Payment:</strong> {bill.payment_mode}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14, fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--navy)', color: 'white' }}>
                <th style={{ padding: '7px 8px', textAlign: 'left' }}>#</th>
                <th style={{ padding: '7px 8px', textAlign: 'left' }}>Medicine</th>
                <th style={{ padding: '7px 8px', textAlign: 'center' }}>HSN</th>
                <th style={{ padding: '7px 8px', textAlign: 'center' }}>Qty</th>
                <th style={{ padding: '7px 8px', textAlign: 'right' }}>MRP</th>
                <th style={{ padding: '7px 8px', textAlign: 'center' }}>GST%</th>
                <th style={{ padding: '7px 8px', textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {(bill.items || []).map((item: any, i: number) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--slate-200)' }}>
                  <td style={{ padding: '7px 8px' }}>{i + 1}</td>
                  <td style={{ padding: '7px 8px' }}>
                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                    {item.brand && <div style={{ fontSize: 10, color: 'var(--slate-400)' }}>{item.brand}</div>}
                    {item.dosage && <div style={{ fontSize: 10, color: 'var(--teal)' }}>{item.dosage}</div>}
                  </td>
                  <td style={{ padding: '7px 8px', textAlign: 'center' }} className="font-mono">{item.hsn_code || '—'}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'center' }}>{item.qty}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right' }}>₹{item.mrp.toFixed(2)}</td>
                  <td style={{ padding: '7px 8px', textAlign: 'center' }}>{item.gst}%</td>
                  <td style={{ padding: '7px 8px', textAlign: 'right', fontWeight: 700 }}>₹{(item.mrp * item.qty).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--slate-400)', marginBottom: 6, textTransform: 'uppercase' }}>GST Summary</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: 'var(--slate-50)' }}>
                    <th style={{ padding: '5px 8px', textAlign: 'left' }}>GST%</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Taxable</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>CGST</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>SGST</th>
                    <th style={{ padding: '5px 8px', textAlign: 'right' }}>Total GST</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(bill.gst_breakdown || {}).map(([rate, g]: any) => (
                    <tr key={rate} style={{ borderBottom: '1px solid var(--slate-100)' }}>
                      <td style={{ padding: '5px 8px' }}>{rate}%</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{g.taxable.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{g.cgst.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right' }}>₹{g.sgst.toFixed(2)}</td>
                      <td style={{ padding: '5px 8px', textAlign: 'right', fontWeight: 700 }}>₹{g.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: 'var(--slate-50)', borderRadius: 8, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}><span style={{ color: 'var(--slate-600)' }}>Subtotal (incl. GST)</span><span>₹{bill.sub_total?.toFixed(2)}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}><span style={{ color: 'var(--slate-600)' }}>Total GST (incl.)</span><span>₹{bill.gst_amount?.toFixed(2)}</span></div>
              {bill.discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: 'var(--green)' }}><span>Discount</span><span>−₹{bill.discount}</span></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid var(--navy)', paddingTop: 10, marginTop: 6, fontWeight: 800, fontSize: 17, color: 'var(--navy)' }}>
                <span>Grand Total</span><span>₹{bill.grand_total?.toFixed(2)}</span>
              </div>
              <div style={{ marginTop: 10, textAlign: 'center' }}><span className="badge badge-green" style={{ fontSize: 12 }}>✓ PAID — {bill.payment_mode}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SalesInner({ initialBills, medicines, patients, pendingOrder }: any) {
  const toast = useToast()
  const supabase = createClient()

  const [bills, setBills] = useState(initialBills)
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new')
  const [medSearch, setMedSearch] = useState('')
  const [viewBill, setViewBill] = useState<any>(null)
  const [billSearch, setBillSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const [bill, setBill] = useState<any>({
    patient_id: '', patient_name: '', date: today(), payment_mode: 'Cash',
    discount: 0, doctor_name: '', items: [] as any[], order_id: null,
  })

  // Load pending order on mount
  useEffect(() => {
    if (pendingOrder) {
      setBill((b: any) => ({
        ...b,
        patient_id: pendingOrder.patient_id,
        patient_name: pendingOrder.patients?.name,
        doctor_name: pendingOrder.doctors?.name,
        order_id: pendingOrder.id,
        items: (pendingOrder.items || []).map((item: any) => {
          const med = medicines.find((m: any) => m.name.toLowerCase().includes(item.name.toLowerCase().split(' ')[0]))
          return {
            _id: Date.now() + Math.random(),
            medicine_id: med?.id || '',
            name: item.name, brand: med?.brand || '',
            qty: 1, mrp: med?.mrp || 0, gst: med?.gst_percent || 12,
            hsn_code: med?.hsn_code || '', dosage: item.dosage, fromRx: true,
          }
        }),
      }))
      toast('Prescription loaded from OPD', 'info')
    }
  }, [])

  const subTotal = bill.items.reduce((s: number, i: any) => s + i.mrp * i.qty, 0)
  const gstBreakdown: Record<string, any> = {}
  bill.items.forEach((item: any) => {
    const basePrice = item.mrp / (1 + item.gst / 100)
    const gstAmt = item.mrp - basePrice
    const lineGst = gstAmt * item.qty
    if (!gstBreakdown[item.gst]) gstBreakdown[item.gst] = { taxable: 0, cgst: 0, sgst: 0, total: 0 }
    gstBreakdown[item.gst].taxable += basePrice * item.qty
    gstBreakdown[item.gst].cgst += lineGst / 2
    gstBreakdown[item.gst].sgst += lineGst / 2
    gstBreakdown[item.gst].total += lineGst
  })
  const totalGST = Object.values(gstBreakdown).reduce((s: number, g: any) => s + g.total, 0)
  const grandTotal = subTotal - Number(bill.discount || 0)

  const filteredMeds = useMemo(() =>
    medicines.filter((m: any) => medSearch && (m.name.toLowerCase().includes(medSearch.toLowerCase()) || m.brand?.toLowerCase().includes(medSearch.toLowerCase()))).slice(0, 8)
  , [medicines, medSearch])

  function addMedicine(med: any) {
    const exists = bill.items.find((i: any) => i.medicine_id === med.id)
    if (exists) {
      setBill((b: any) => ({ ...b, items: b.items.map((i: any) => i.medicine_id === med.id ? { ...i, qty: i.qty + 1 } : i) }))
    } else {
      setBill((b: any) => ({
        ...b, items: [...b.items, {
          _id: Date.now(), medicine_id: med.id, name: med.name, brand: med.brand,
          qty: 1, mrp: med.mrp, gst: med.gst_percent, hsn_code: med.hsn_code || '', unit: med.unit,
        }]
      }))
    }
    setMedSearch('')
  }

  function removeItem(id: number) { setBill((b: any) => ({ ...b, items: b.items.filter((i: any) => i._id !== id) })) }
  function updateQty(id: number, qty: number) { if (qty < 1) return; setBill((b: any) => ({ ...b, items: b.items.map((i: any) => i._id === id ? { ...i, qty: Number(qty) } : i) })) }
  function updateMrp(id: number, mrp: number) { setBill((b: any) => ({ ...b, items: b.items.map((i: any) => i._id === id ? { ...i, mrp: Number(mrp) } : i) })) }

  async function saveBill() {
    if (bill.items.length === 0) return toast('Add at least one medicine', 'error')
    setSaving(true)

    const payload = {
      patient_id: bill.patient_id || null,
      order_id: bill.order_id || null,
      patient_name: bill.patient_name,
      doctor_name: bill.doctor_name,
      date: bill.date,
      items: bill.items.map((i: any) => ({ ...i, _id: undefined })),
      sub_total: subTotal, gst_amount: totalGST, gst_breakdown: gstBreakdown,
      discount: Number(bill.discount || 0), grand_total: grandTotal,
      payment_mode: bill.payment_mode,
    }

    const { data, error } = await supabase.from('pharmacy_bills').insert([payload]).select().single()
    if (error) { toast(error.message, 'error'); setSaving(false); return }

    // Deduct stock for each medicine
    for (const item of bill.items) {
      if (item.medicine_id) {
        const med = medicines.find((m: any) => m.id === item.medicine_id)
        if (med) {
          await supabase.from('medicines').update({ stock: Math.max(0, med.stock - item.qty) }).eq('id', item.medicine_id)
          med.stock = Math.max(0, med.stock - item.qty) // update local cache
        }
      }
    }

    // Mark OPD order as billed
    if (bill.order_id) {
      await supabase.from('pharmacy_orders').update({ status: 'Billed', bill_id: data.id }).eq('id', bill.order_id)
    }

    setBills((prev: any) => [data, ...prev])
    setViewBill(data)
    setBill({ patient_id: '', patient_name: '', date: today(), payment_mode: 'Cash', discount: 0, doctor_name: '', items: [], order_id: null })
    toast('Bill saved! Stock updated.')
    setSaving(false)
  }

  const filteredBills = useMemo(() => bills.filter((b: any) =>
    !billSearch || b.patient_name?.toLowerCase().includes(billSearch.toLowerCase()) || b.id?.includes(billSearch)
  ), [bills, billSearch])

  return (
    <div>
      {viewBill && <GstInvoicePrint bill={viewBill} onClose={() => setViewBill(null)} />}

      <div className="tabs">
        <button className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`} onClick={() => setActiveTab('new')}>New Sale</button>
        <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Sales History</button>
      </div>

      {activeTab === 'new' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 16 }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="card">
              <div className="section-heading">👤 Patient Details</div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Patient (optional)</label>
                  <select className="form-select" value={bill.patient_id} onChange={e => {
                    const p = patients.find((x: any) => x.id === e.target.value)
                    setBill((b: any) => ({ ...b, patient_id: e.target.value, patient_name: p?.name || '' }))
                  }}>
                    <option value="">Walk-in / Manual</option>
                    {patients.map((p: any) => <option key={p.id} value={p.id}>{p.name} — {p.uhid}</option>)}
                  </select>
                </div>
                {!bill.patient_id && (
                  <div className="form-group">
                    <label className="form-label">Patient Name</label>
                    <input className="form-input" value={bill.patient_name} onChange={e => setBill((b: any) => ({ ...b, patient_name: e.target.value }))} placeholder="Walk-in customer name" />
                  </div>
                )}
                <div className="form-group"><label className="form-label">Doctor (if prescribed)</label><input className="form-input" value={bill.doctor_name} onChange={e => setBill((b: any) => ({ ...b, doctor_name: e.target.value }))} placeholder="Dr. name" /></div>
                <div className="form-group"><label className="form-label">Date</label><input type="date" className="form-input" value={bill.date} onChange={e => setBill((b: any) => ({ ...b, date: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Payment Mode</label><select className="form-select" value={bill.payment_mode} onChange={e => setBill((b: any) => ({ ...b, payment_mode: e.target.value }))}>{['Cash', 'UPI', 'Card', 'NEFT', 'Insurance'].map(m => <option key={m}>{m}</option>)}</select></div>
              </div>
            </div>

            <div className="card">
              <div className="section-heading">💊 Search & Add Medicine</div>
              <div className="search-bar" style={{ marginBottom: 10 }}>
                <Search size={14} />
                <input placeholder="Type medicine name or brand..." value={medSearch} onChange={e => setMedSearch(e.target.value)} autoFocus />
              </div>
              {filteredMeds.length > 0 && (
                <div style={{ border: '1px solid var(--slate-200)', borderRadius: 8, overflow: 'hidden' }}>
                  {filteredMeds.map((med: any) => (
                    <div key={med.id} onClick={() => addMedicine(med)}
                      style={{ padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseOver={e => (e.currentTarget.style.background = 'var(--teal-pale)')} onMouseOut={e => (e.currentTarget.style.background = 'white')}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{med.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{med.brand} · {med.category}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, color: 'var(--navy)' }}>₹{med.mrp}</div>
                        <div style={{ fontSize: 11, color: med.stock < 20 ? 'var(--red)' : 'var(--slate-400)' }}>Stock: {med.stock}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {medSearch && filteredMeds.length === 0 && <div style={{ padding: 12, color: 'var(--slate-400)', fontSize: 13, textAlign: 'center' }}>No medicines found</div>}
            </div>
          </div>

          {/* Right: bill */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="section-heading">
              <ShoppingCart size={13} /> Current Bill {bill.items.length > 0 && <span style={{ marginLeft: 6, background: 'var(--teal)', color: 'white', borderRadius: 99, padding: '1px 7px', fontSize: 11 }}>{bill.items.length}</span>}
            </div>

            {bill.items.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}><ShoppingCart /><p>Search and add medicines to generate bill</p></div>
            ) : (
              <div className="table-wrap" style={{ marginBottom: 16 }}>
                <table>
                  <thead><tr><th>Medicine</th><th style={{ textAlign: 'center', width: 70 }}>Qty</th><th style={{ textAlign: 'right', width: 90 }}>MRP (₹)</th><th style={{ textAlign: 'center', width: 55 }}>GST%</th><th style={{ textAlign: 'right', width: 90 }}>Total</th><th style={{ width: 32 }}></th></tr></thead>
                  <tbody>
                    {bill.items.map((item: any) => (
                      <tr key={item._id}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{item.brand} {item.fromRx && <span style={{ color: 'var(--teal)' }}>· Rx</span>}</div>
                        </td>
                        <td style={{ textAlign: 'center' }}><input type="number" min={1} className="form-input" style={{ width: 58, padding: '4px 6px', textAlign: 'center', fontSize: 13 }} value={item.qty} onChange={e => updateQty(item._id, Number(e.target.value))} /></td>
                        <td style={{ textAlign: 'right' }}><input type="number" className="form-input" style={{ width: 80, padding: '4px 8px', textAlign: 'right', fontSize: 13 }} value={item.mrp} onChange={e => updateMrp(item._id, Number(e.target.value))} /></td>
                        <td style={{ textAlign: 'center' }}><span className="badge badge-amber">{item.gst}%</span></td>
                        <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>₹{(item.mrp * item.qty).toFixed(2)}</td>
                        <td><button onClick={() => removeItem(item._id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--red)' }}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {bill.items.length > 0 && (
              <div style={{ marginTop: 'auto' }}>
                <div style={{ background: 'var(--slate-50)', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 12 }}>
                  <div style={{ fontWeight: 700, color: 'var(--slate-600)', marginBottom: 6 }}>GST Breakdown (inclusive in MRP)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 4, fontSize: 11 }}>
                    <span style={{ color: 'var(--slate-400)' }}>Slab</span><span style={{ color: 'var(--slate-400)', textAlign: 'right' }}>Taxable</span><span style={{ color: 'var(--slate-400)', textAlign: 'right' }}>CGST</span><span style={{ color: 'var(--slate-400)', textAlign: 'right' }}>SGST</span><span style={{ color: 'var(--slate-400)', textAlign: 'right' }}>GST Total</span>
                    {Object.entries(gstBreakdown).map(([rate, g]: any) => (
                      <>
                        <span key={rate + 'a'} style={{ fontWeight: 700 }}>{rate}%</span>
                        <span key={rate + 'b'} style={{ textAlign: 'right' }}>₹{g.taxable.toFixed(2)}</span>
                        <span key={rate + 'c'} style={{ textAlign: 'right' }}>₹{g.cgst.toFixed(2)}</span>
                        <span key={rate + 'd'} style={{ textAlign: 'right' }}>₹{g.sgst.toFixed(2)}</span>
                        <span key={rate + 'e'} style={{ textAlign: 'right', fontWeight: 700 }}>₹{g.total.toFixed(2)}</span>
                      </>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}><div className="form-group"><label className="form-label">Discount (₹)</label><input type="number" className="form-input" value={bill.discount} onChange={e => setBill((b: any) => ({ ...b, discount: Number(e.target.value) }))} /></div></div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: 'var(--slate-400)' }}>Total GST incl.: <strong>₹{totalGST.toFixed(2)}</strong></div>
                    {bill.discount > 0 && <div style={{ fontSize: 12, color: 'var(--green)' }}>Discount: −₹{bill.discount}</div>}
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)' }}>₹{grandTotal.toFixed(2)}</div>
                  </div>
                </div>
                <button className="btn btn-primary w-full" style={{ marginTop: 12, padding: 11, fontSize: 14, justifyContent: 'center' }} onClick={saveBill} disabled={saving}>
                  <Receipt size={16} /> {saving ? 'Generating…' : 'Generate GST Bill & Save'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pharmacy Sales History ({bills.length})</span>
            <div className="search-bar" style={{ width: 240 }}><Search size={14} /><input placeholder="Search by patient or bill ID..." value={billSearch} onChange={e => setBillSearch(e.target.value)} /></div>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Bill No</th><th>Patient</th><th>Doctor</th><th>Date</th><th>Items</th><th>Subtotal</th><th>GST</th><th>Discount</th><th>Grand Total</th><th>Payment</th><th></th></tr></thead>
              <tbody>
                {filteredBills.length === 0 && <tr><td colSpan={11} style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>No bills found</td></tr>}
                {filteredBills.map((b: any) => (
                  <tr key={b.id}>
                    <td><span className="font-mono" style={{ fontSize: 11 }}>{b.id?.slice(0, 8).toUpperCase()}</span></td>
                    <td style={{ fontWeight: 600 }}>{b.patient_name || 'Walk-in'}</td>
                    <td style={{ fontSize: 12, color: 'var(--slate-400)' }}>{b.doctor_name || '—'}</td>
                    <td style={{ fontSize: 12 }}>{b.date}</td>
                    <td style={{ fontSize: 12, color: 'var(--slate-400)' }}>{(b.items || []).length}</td>
                    <td>₹{b.sub_total?.toFixed(2)}</td>
                    <td style={{ color: 'var(--amber)' }}>₹{b.gst_amount?.toFixed(2)}</td>
                    <td style={{ color: 'var(--green)' }}>{b.discount > 0 ? `−₹${b.discount}` : '—'}</td>
                    <td style={{ fontWeight: 800, color: 'var(--navy)' }}>₹{b.grand_total?.toFixed(2)}</td>
                    <td><span className="badge badge-green">{b.payment_mode}</span></td>
                    <td><button className="btn btn-sm btn-ghost" onClick={() => setViewBill(b)}><Printer size={13} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default function SalesClient(props: any) {
  return <ToastProvider><SalesInner {...props} /></ToastProvider>
}
