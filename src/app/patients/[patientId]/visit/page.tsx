import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PatientVisitClient from './PatientVisitClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function PatientVisitPage({ params, searchParams }: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: patient }, { data: doctors }] = await Promise.all([
    supabase.from('patients').select('*').eq('id', params.patientId).single(),
    supabase.from('doctors').select('id, name, specialization, fee').eq('available', true).order('name'),
  ])

  if (!patient) redirect('/patients')

  return (
    <SharedLayout>
      <PatientVisitClient
        patient={patient}
        doctors={doctors || []}
        apptId={searchParams?.apptId || null}
        defaultDoctorId={searchParams?.doctorId || ''}
      />
    </SharedLayout>
  )
}
