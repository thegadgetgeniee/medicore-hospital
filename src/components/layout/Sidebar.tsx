'use client'
import { usePathname, useRouter } from 'next/navigation'
import { Activity, LayoutDashboard, CalendarDays, Users, Receipt, Stethoscope, UserCog, Wrench, Package, Pill, ClipboardList, ShoppingCart } from 'lucide-react'

const NAV = [
  { label: 'OVERVIEW', items: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  ]},
  { label: 'OPD', items: [
    { icon: CalendarDays, label: 'Appointments', path: '/appointments' },
    { icon: Users, label: 'Patients', path: '/patients' },
    { icon: Receipt, label: 'OPD Billing', path: '/opd-billing' },
  ]},
  { label: 'MANAGEMENT', items: [
    { icon: Stethoscope, label: 'Doctors', path: '/doctors' },
    { icon: UserCog, label: 'Staff', path: '/staff' },
    { icon: Wrench, label: 'Services', path: '/services' },
    { icon: Package, label: 'Packages', path: '/packages' },
  ]},
  { label: 'PHARMACY', items: [
    { icon: Pill, label: 'Pharmacy', path: '/pharmacy' },
    { icon: ClipboardList, label: 'Inventory', path: '/pharmacy/inventory' },
    { icon: ShoppingCart, label: 'Sales (GST)', path: '/pharmacy/sales' },
  ]},
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <Activity size={18} color="white" />
        </div>
        <div>
          <h1>MediCore</h1>
          <p>Hospital Operations</p>
        </div>
      </div>

      {NAV.map(section => (
        <div key={section.label} className="sidebar-section">
          <div className="sidebar-label">{section.label}</div>
          {section.items.map(item => {
            const active = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
            return (
              <button
                key={item.path}
                className={`nav-item ${active ? 'active' : ''}`}
                onClick={() => router.push(item.path)}
              >
                <item.icon />
                {item.label}
              </button>
            )
          })}
        </div>
      ))}

      <div style={{ marginTop: 'auto', padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ color: 'rgba(255,255,255,.25)', fontSize: 10 }}>MediCore v2.0 — Online</div>
        <div style={{ color: 'rgba(255,255,255,.15)', fontSize: 10 }}>Powered by Supabase</div>
      </div>
    </aside>
  )
}
