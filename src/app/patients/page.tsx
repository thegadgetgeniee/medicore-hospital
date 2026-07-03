import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PatientsClient from './PatientsClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function PatientsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: patients } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <SharedLayout>
      <PatientsClient initialPatients={patients || []} />
    </SharedLayout>
  )
}
