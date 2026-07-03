import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VisitHistoryClient from './VisitHistoryClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function VisitHistoryPage({ params }: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: patient }, { data: visits }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', params.patientId).single(),
    supabase.from('visits')
      .select('*, doctors(name, specialization)')
      .eq('patient_id', params.patientId)
      .order('date', { ascending: false }),
  ])

  if (!patient) redirect('/patients')

  return (
    <SharedLayout>
      <VisitHistoryClient patient={patient} visits={visits || []} />
    </SharedLayout>
  )
}
