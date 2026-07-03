import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StaffClient from './StaffClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function StaffPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: staff } = await supabase.from('staff').select('*').order('name')
  return <SharedLayout><StaffClient initialStaff={staff || []} /></SharedLayout>
}
