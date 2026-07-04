'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Activity, Shield, Users, BarChart3, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('receptionist')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
if (error) { setError(error.message); setLoading(false); return }
setLoading(false)
window.location.href = '/dashboard'
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, role } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSuccess('Account created! Check your email to confirm, then log in.')
    setMode('login')
    setLoading(false)
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`
    })
    if (error) { setError(error.message) } else { setSuccess('Password reset link sent to your email.') }
    setLoading(false)
  }

  return (
    <div className="auth-shell">
      {/* Left branding panel */}
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Activity size={22} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>MediCore</div>
            <div style={{ fontSize: 11, opacity: .55 }}>Hospital Operations</div>
          </div>
        </div>

        <div className="auth-title">Complete Hospital<br />Management System</div>
        <div className="auth-sub" style={{ marginBottom: 36 }}>
          Manage OPD, Pharmacy, Billing, and more — all in one secure platform built for modern hospitals.
        </div>

        {[
          { icon: Users, text: 'Patient registry with UHID & visit history' },
          { icon: Activity, text: 'Digital prescriptions sent directly to pharmacy' },
          { icon: Shield, text: 'GST-compliant pharmacy billing with CGST/SGST' },
          { icon: BarChart3, text: 'Real-time dashboard and revenue analytics' },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="auth-feature">
            <div className="auth-feature-icon"><Icon size={16} color="var(--teal-light)" /></div>
            <div style={{ fontSize: 14, opacity: .8 }}>{text}</div>
          </div>
        ))}

        <div style={{ marginTop: 48, padding: '16px 20px', background: 'rgba(255,255,255,.06)', borderRadius: 10, borderLeft: '3px solid var(--teal)' }}>
          <div style={{ fontSize: 12, opacity: .6, marginBottom: 4 }}>Demo credentials</div>
          <div style={{ fontSize: 13, fontFamily: 'monospace' }}>admin@medicore.in</div>
          <div style={{ fontSize: 13, fontFamily: 'monospace' }}>Admin@123</div>
          <div style={{ fontSize: 11, opacity: .4, marginTop: 6 }}>Create your account to get started</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--navy)', marginBottom: 6 }}>
              {mode === 'login' ? 'Sign in to MediCore' : mode === 'signup' ? 'Create your account' : 'Reset password'}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--slate-400)' }}>
              {mode === 'login' ? 'Enter your credentials to access the hospital system' :
               mode === 'signup' ? 'Register a new staff account' : 'We\'ll send you a reset link'}
            </p>
          </div>

          {error && (
            <div style={{ padding: '10px 14px', background: 'var(--red-light)', color: '#991b1b', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #fca5a5' }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{ padding: '10px 14px', background: 'var(--green-light)', color: '#065f46', borderRadius: 8, fontSize: 13, marginBottom: 16, border: '1px solid #6ee7b7' }}>
              {success}
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : mode === 'signup' ? handleSignup : handleReset}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Dr. / Mr. / Ms. Your Name" required />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@hospital.com" required />
              </div>

              {mode !== 'reset' && (
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      className="form-input"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Min 6 characters' : 'Your password'}
                      style={{ paddingRight: 40 }}
                      required
                    />
                    <button type="button" onClick={() => setShowPw(s => !s)}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--slate-400)' }}>
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="pharmacist">Pharmacist</option>
                    <option value="receptionist">Receptionist</option>
                    <option value="nurse">Nurse</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-navy" style={{ width: '100%', padding: '11px', fontSize: 14, justifyContent: 'center', marginTop: 4 }} disabled={loading}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
              </button>
            </div>
          </form>

          <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--slate-400)' }}>
            {mode === 'login' && <>
              <button onClick={() => { setMode('reset'); setError(''); setSuccess(''); }} style={{ border: 'none', background: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: 13 }}>Forgot password?</button>
              <span style={{ margin: '0 10px' }}>·</span>
              <button onClick={() => { setMode('signup'); setError(''); setSuccess(''); }} style={{ border: 'none', background: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: 13 }}>Create account</button>
            </>}
            {mode === 'signup' && <>
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ border: 'none', background: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Sign in</button>
            </>}
            {mode === 'reset' && <>
              <button onClick={() => { setMode('login'); setError(''); setSuccess(''); }} style={{ border: 'none', background: 'none', color: 'var(--teal)', cursor: 'pointer', fontSize: 13 }}>← Back to login</button>
            </>}
          </div>
        </div>
      </div>
    </div>
  )
}
