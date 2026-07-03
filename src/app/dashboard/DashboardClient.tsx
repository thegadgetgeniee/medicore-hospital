'use client'
import { useRouter } from 'next/navigation'
import { Users, CalendarDays, Receipt, Pill, AlertTriangle, Clock, Activity } from 'lucide-react'

export default function DashboardClient({ stats, recentAppts, recentVisits, lowStock, pendingOrders }: any) {
  const router = useRouter()

  const statCards = [
    { icon: Users, label: 'Total Patients', value: stats.totalPatients, color: 'var(--teal)', bg: 'var(--teal-pale)', path: '/patients' },
    { icon: CalendarDays, label: "Today's Appointments", value: stats.todayAppts, color: 'var(--purple)', bg: 'var(--purple-light)', path: '/appointments' },
    { icon: Receipt, label: "Today's OPD Revenue", value: `₹${stats.opdRevenue.toLocaleString('en-IN')}`, color: 'var(--amber)', bg: 'var(--amber-light)', path: '/opd-billing' },
    { icon: Pill, label: "Today's Pharmacy Sales", value: `₹${stats.pharmRevenue.toLocaleString('en-IN')}`, color: 'var(--red)', bg: 'var(--red-light)', path: '/pharmacy/sales' },
  ]

  return (
    <div>
      <div className="stats-grid">
        {statCards.map((s, i) => (
          <div key={i} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => router.push(s.path)}>
            <div className="stat-icon" style={{ background: s.bg }}><s.icon style={{ color: s.color }} /></div>
            <div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Today's appointments */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Today's Appointments</span>
            <button className="btn btn-sm btn-ghost" onClick={() => router.push('/appointments')}>View all</button>
          </div>
          {recentAppts.length === 0 ? (
            <div className="empty-state"><CalendarDays /><p>No appointments today</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Token</th><th>Patient</th><th>Doctor</th><th>Time</th><th>Status</th></tr></thead>
                <tbody>
                  {recentAppts.map((a: any) => (
                    <tr key={a.id}>
                      <td><div style={{ width: 30, height: 30, background: 'var(--teal-pale)', color: 'var(--teal)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>{a.token}</div></td>
                      <td style={{ fontWeight: 600 }}>{a.patients?.name}</td>
                      <td style={{ fontSize: 12, color: 'var(--slate-600)' }}>{a.doctors?.name}</td>
                      <td><span className="font-mono" style={{ fontSize: 12 }}>{a.time}</span></td>
                      <td>
                        <span className={`badge ${a.status === 'Completed' ? 'badge-green' : a.status === 'Cancelled' ? 'badge-red' : 'badge-teal'}`}>
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent visits */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Recent Patient Visits</span>
            <button className="btn btn-sm btn-ghost" onClick={() => router.push('/patients')}>Patients</button>
          </div>
          {recentVisits.length === 0 ? (
            <div className="empty-state"><Activity /><p>No visits recorded yet</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Diagnosis</th></tr></thead>
                <tbody>
                  {recentVisits.map((v: any) => (
                    <tr key={v.id}>
                      <td style={{ fontWeight: 600 }}>{v.patients?.name}</td>
                      <td style={{ fontSize: 12, color: 'var(--slate-400)' }}>{v.doctors?.name}</td>
                      <td style={{ fontSize: 12 }}>{v.date}</td>
                      <td style={{ fontSize: 12, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.diagnosis || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Pending pharmacy orders */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Clock size={14} style={{ display: 'inline', marginRight: 6 }} />Pending Pharmacy Orders</span>
            <button className="btn btn-sm btn-ghost" onClick={() => router.push('/pharmacy')}>View</button>
          </div>
          {pendingOrders.length === 0 ? (
            <div className="empty-state"><Pill /><p>No pending prescriptions</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pendingOrders.map((o: any) => (
                <div key={o.id} style={{ padding: '10px 12px', background: 'var(--amber-light)', borderRadius: 8, fontSize: 13 }}>
                  <div style={{ fontWeight: 700 }}>{o.patients?.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--slate-600)' }}>Dr: {o.doctors?.name} · {(o.items || []).length} medicines</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><AlertTriangle size={14} style={{ display: 'inline', marginRight: 6, color: 'var(--amber)' }} />Low Stock Alert</span>
            <button className="btn btn-sm btn-ghost" onClick={() => router.push('/pharmacy/inventory')}>Inventory</button>
          </div>
          {lowStock.length === 0 ? (
            <div className="empty-state"><Pill /><p>All medicines adequately stocked</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Medicine</th><th>Category</th><th>Stock</th></tr></thead>
                <tbody>
                  {lowStock.map((m: any) => (
                    <tr key={m.id}>
                      <td><div style={{ fontWeight: 600 }}>{m.name}</div><div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{m.brand}</div></td>
                      <td><span className="tag">{m.category}</span></td>
                      <td><span className={`badge ${m.stock === 0 ? 'badge-red' : 'badge-amber'}`}>{m.stock} {m.unit}s</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header"><span className="card-title">Quick Actions</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }}>
            {[
              { label: '+ Appointment', path: '/appointments', color: 'var(--teal)' },
              { label: '+ Register Patient', path: '/patients', color: 'var(--purple)' },
              { label: '+ OPD Bill', path: '/opd-billing', color: 'var(--amber)' },
              { label: '+ Pharmacy Sale', path: '/pharmacy/sales', color: 'var(--red)' },
              { label: 'Add Medicine', path: '/pharmacy/inventory', color: 'var(--navy)' },
              { label: 'Manage Doctors', path: '/doctors', color: 'var(--teal)' },
            ].map((a, i) => (
              <button key={i} onClick={() => router.push(a.path)}
                style={{ padding: '12px 8px', border: `1.5px solid ${a.color}`, borderRadius: 8, background: 'transparent', color: a.color, fontWeight: 700, fontSize: 12, cursor: 'pointer', textAlign: 'center', transition: 'all .15s' }}
                onMouseOver={e => (e.currentTarget.style.background = a.color + '18')}
                onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
