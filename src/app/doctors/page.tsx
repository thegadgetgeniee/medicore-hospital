import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DoctorsClient from './DoctorsClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function DoctorsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: doctors } = await supabase.from('doctors').select('*').order('name')
  return <SharedLayout><DoctorsClient initialDoctors={doctors || []} /></SharedLayout>
}
