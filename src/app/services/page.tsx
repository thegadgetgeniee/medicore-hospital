import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ServicesClient from './ServicesClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function ServicesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { data: services } = await supabase.from('services').select('*').order('category').order('name')
  return <SharedLayout><ServicesClient initialServices={services || []} /></SharedLayout>
}
