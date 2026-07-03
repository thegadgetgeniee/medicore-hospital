import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppointmentsClient from './AppointmentsClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function AppointmentsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: appointments }, { data: patients }, { data: doctors }] = await Promise.all([
    supabase.from('appointments')
      .select('*, patients(name, uhid, phone), doctors(name, specialization)')
      .order('date', { ascending: false })
      .order('token', { ascending: true })
      .limit(200),
    supabase.from('patients').select('id, name, uhid, phone').order('name'),
    supabase.from('doctors').select('id, name, specialization, fee').eq('available', true).order('name'),
  ])

  return (
    <SharedLayout>
      <AppointmentsClient
        initialAppointments={appointments || []}
        patients={patients || []}
        doctors={doctors || []}
        today={today}
      />
    </SharedLayout>
  )
}
