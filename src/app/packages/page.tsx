import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PackagesClient from './PackagesClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function PackagesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const [{ data: packages }, { data: services }] = await Promise.all([
    supabase.from('packages').select('*').order('name'),
    supabase.from('services').select('id, name, price, category').eq('active', true).order('name'),
  ])
  return <SharedLayout><PackagesClient initialPackages={packages || []} services={services || []} /></SharedLayout>
}
