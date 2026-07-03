'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { Plus, X, Edit, Trash2, UserCog } from 'lucide-react'

const ROLES = ['Nurse', 'Receptionist', 'Pharmacist', 'Lab Technician', 'Radiologist', 'Ward Boy', 'Cleaner', 'Security', 'Admin', 'Accountant']
const DEPTS = ['OPD', 'Front Desk', 'Pharmacy', 'Laboratory', 'Radiology', 'Ward', 'ICU', 'Emergency', 'Admin']
const EMPTY = { name: '', role: 'Nurse', department: 'OPD', phone: '', email: '', salary: '', join_date: '', address: '', active: true }

function StaffInner({ initialStaff }: any) {
  const toast = useToast()
  const supabase = createClient()
  const [staff, setStaff] = useState(initialStaff)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [filterDept, setFilterDept] = useState('')

  const filtered = useMemo(() => staff.filter((s: any) => !filterDept || s.department === filterDept), [staff, filterDept])

  function openAdd() { setEditing(null); setForm(EMPTY); setShowModal(true) }
  function openEdit(s: any) { setEditing(s.id); setForm({ ...s }); setShowModal(true) }

  async function save() {
    if (!form.name || !form.role) return toast('Name and role required', 'error')
    setSaving(true)
    const payload = { ...form, salary: Number(form.salary) }
    if (editing) {
      const { data, error } = await supabase.from('staff').update(payload).eq('id', editing).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setStaff((s: any) => s.map((x: any) => x.id === editing ? data : x))
      toast('Staff updated')
    } else {
      const { data, error } = await supabase.from('staff').insert([payload]).select().single()
      if (error) { toast(error.message, 'error'); setSaving(false); return }
      setStaff((s: any) => [data, ...s])
      toast('Staff added')
    }
    setSaving(false); setShowModal(false)
  }

  async function remove(id: string) {
    if (!confirm('Remove this staff member?')) return
    await supabase.from('staff').delete().eq('id', id)
    setStaff((s: any) => s.filter((x: any) => x.id !== id))
    toast('Staff removed')
  }

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Staff ({staff.length})</span>
          <div className="flex gap-2">
            <select className="form-select" style={{ width: 160 }} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Staff</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Department</th><th>Phone</th><th>Salary</th><th>Join Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--slate-400)' }}>No staff found</td></tr>}
              {filtered.map((s: any) => (
                <tr key={s.id}>
                  <td><div style={{ fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 11, color: 'var(--slate-400)' }}>{s.email}</div></td>
                  <td><span className="badge badge-teal">{s.role}</span></td>
                  <td style={{ fontSize: 13 }}>{s.department}</td>
                  <td className="font-mono" style={{ fontSize: 12 }}>{s.phone}</td>
                  <td style={{ fontWeight: 700 }}>₹{Number(s.salary || 0).toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 12, color: 'var(--slate-400)' }}>{s.join_date}</td>
                  <td><span className={`badge ${s.active !== false ? 'badge-green' : 'badge-red'}`}>{s.active !== false ? 'Active' : 'Inactive'}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}><Edit size={13} /></button>
                      <button className="btn btn-sm btn-danger" onClick={() => remove(s.id)}><Trash2 size={13} /></button>
                    </div>
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
              <span className="modal-title">{editing ? 'Edit Staff' : 'Add Staff Member'}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}><X size={14} /></button>
            </div>
            <div className="modal-body">
              <div className="form-grid form-grid-2">
                <div className="form-group"><label className="form-label">Full Name *</label><input className="form-input" value={form.name} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Role *</label><select className="form-select" value={form.role} onChange={e => setForm((f: any) => ({ ...f, role: e.target.value }))}>{ROLES.map(r => <option key={r}>{r}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Department</label><select className="form-select" value={form.department} onChange={e => setForm((f: any) => ({ ...f, department: e.target.value }))}>{DEPTS.map(d => <option key={d}>{d}</option>)}</select></div>
                <div className="form-group"><label className="form-label">Phone</label><input className="form-input" value={form.phone || ''} onChange={e => setForm((f: any) => ({ ...f, phone: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={form.email || ''} onChange={e => setForm((f: any) => ({ ...f, email: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Salary (₹)</label><input type="number" className="form-input" value={form.salary || ''} onChange={e => setForm((f: any) => ({ ...f, salary: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Join Date</label><input type="date" className="form-input" value={form.join_date || ''} onChange={e => setForm((f: any) => ({ ...f, join_date: e.target.value }))} /></div>
                <div className="form-group"><label className="form-label">Status</label><select className="form-select" value={form.active ? 'y' : 'n'} onChange={e => setForm((f: any) => ({ ...f, active: e.target.value === 'y' }))}><option value="y">Active</option><option value="n">Inactive</option></select></div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}><label className="form-label">Address</label><input className="form-input" value={form.address || ''} onChange={e => setForm((f: any) => ({ ...f, address: e.target.value }))} /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={save} disabled={saving}><UserCog size={14} /> {saving ? 'Saving…' : editing ? 'Update' : 'Add Staff'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StaffClient(props: any) {
  return <ToastProvider><StaffInner {...props} /></ToastProvider>
}
