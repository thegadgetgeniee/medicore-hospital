'use client'
import { Activity, LogOut } from 'lucide-react'
import { signOut } from '@/lib/actions'

export default function Topbar({ user, profile }: { user: any; profile: any }) {
  const initials = (profile?.full_name || user?.email || 'U')
    .split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)

  const roleBadge: Record<string, string> = {
    admin: '#EF4444', doctor: '#0D9488', pharmacist: '#8B5CF6',
    receptionist: '#F59E0B', nurse: '#10B981'
  }

  return (
    <div className="topbar">
      <div className="flex-center gap-2">
        <Activity size={16} color="var(--teal)" />
        <span className="topbar-title">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>
      <div className="topbar-right">
        <div className="user-chip">
          <div className="user-avatar">{initials}</div>
          <div>
            <div className="user-name">{profile?.full_name || user?.email?.split('@')[0]}</div>
            <div className="user-role" style={{ color: roleBadge[profile?.role] || 'var(--slate-400)', fontWeight: 600, textTransform: 'capitalize' }}>
              {profile?.role || 'Staff'}
            </div>
          </div>
        </div>
        <form action={signOut}>
          <button type="submit" className="btn btn-sm btn-secondary" title="Sign out">
            <LogOut size={13} /> Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}
