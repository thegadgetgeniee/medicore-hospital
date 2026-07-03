'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { ShoppingCart, AlertTriangle, TrendingUp, Clock, CheckCircle, Package } from 'lucide-react'

function PharmacyDashInner({ pendingOrders: initialOrders, todayRevenue, todaySales, lowStock }: any) {
  const router = useRouter()
  const toast = useToast()
  const supabase = createClient()
  const [orders, setOrders] = useState(initialOrders)

  async function markProcessed(id: string) {
    const { error } = await supabase.from('pharmacy_orders').update({ status: 'Processed' }).eq('id', id)
    if (error) return toast(error.message, 'error')
    setOrders((o: any) => o.filter((x: any) => x.id !== id))
    toast('Marked as processed')
  }

  const stats = [
    { icon: Clock, label: 'Pending OPD Orders', value: orders.length, color: 'var(--amber)', bg: 'var(--amber-light)' },
    { icon: ShoppingCart, label: "Today's Sales", value: todaySales, color: 'var(--teal)', bg: 'var(--teal-pale)' },
    { icon: TrendingUp, label: "Today's Revenue", value: `₹${todayRevenue.toLocaleString('en-IN')}`, color: 'var(--green)', bg: 'var(--green-light)' },
    { icon: AlertTriangle, label: 'Low Stock Items', value: lowStock.length, color: 'var(--red)', bg: 'var(--red-light)' },
  ]

  return (
    <div>
      <div className="stats-grid">
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}><s.icon size={20} style={{ color: s.color }} /></div>
            <div><div className="stat-value" style={{ color: s.color }}>{s.value}</div><div className="stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
        {/* Pending OPD prescriptions */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Pending OPD Prescriptions</span>
            <button className="btn btn-sm btn-primary" onClick={() => router.push('/pharmacy/sales')}>
              <ShoppingCart size={13} /> New Sale
            </button>
          </div>
          {orders.length === 0 ? (
            <div className="empty-state"><CheckCircle /><p>No pending prescriptions from OPD</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {orders.map((order: any) => (
                <div key={order.id} style={{ border: '1px solid var(--amber-light)', borderRadius: 10, padding: 14, background: '#fffbeb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: 14 }}>{order.patients?.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--slate-600)', marginTop: 2 }}>
                        Prescribed by: {order.doctors?.name} · {order.date}
                      </div>
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(order.items || []).map((item: any, i: number) => (
                          <span key={i} className="tag">{item.name} {item.dosage && `(${item.dosage})`}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginLeft: 10, flexShrink: 0 }}>
                      <button className="btn btn-sm btn-primary"
                        onClick={() => router.push(`/pharmacy/sales?order=${order.id}`)}>
                        <ShoppingCart size={12} /> Bill
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => markProcessed(order.id)}>
                        <CheckCircle size={12} /> Done
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">⚠️ Low Stock Alert</span>
            <button className="btn btn-sm btn-ghost" onClick={() => router.push('/pharmacy/inventory')}>Manage</button>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state"><Package /><p>All medicines adequately stocked</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Medicine</th><th>Stock</th><th>Unit</th></tr></thead>
                <tbody>
                  {lowStock.map((m: any) => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{m.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{m.brand}</div>
                      </td>
                      <td>
                        <span className={`badge ${m.stock === 0 ? 'badge-red' : 'badge-amber'}`}>{m.stock}</span>
                      </td>
                      <td style={{ fontSize: 12 }}>{m.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick nav */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header"><span className="card-title">Pharmacy Quick Actions</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {[
              { label: '+ New Sale', path: '/pharmacy/sales', color: 'var(--teal)', desc: 'Walk-in or prescription sale' },
              { label: 'View Inventory', path: '/pharmacy/inventory', color: 'var(--navy)', desc: 'Manage drugs & stock' },
              { label: 'Sales History', path: '/pharmacy/sales', color: 'var(--purple)', desc: 'All GST invoices' },
              { label: 'Add Medicine', path: '/pharmacy/inventory', color: 'var(--amber)', desc: 'Register new drug' },
            ].map((a, i) => (
              <button key={i} onClick={() => router.push(a.path)}
                style={{ padding: '14px 12px', border: `1.5px solid ${a.color}`, borderRadius: 10, background: 'transparent', cursor: 'pointer', textAlign: 'left', transition: 'background .15s' }}
                onMouseOver={e => (e.currentTarget.style.background = a.color + '12')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ fontWeight: 700, color: a.color, fontSize: 13 }}>{a.label}</div>
                <div style={{ fontSize: 11, color: 'var(--slate-400)', marginTop: 4 }}>{a.desc}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PharmacyDashClient(props: any) {
  return <ToastProvider><PharmacyDashInner {...props} /></ToastProvider>
}
