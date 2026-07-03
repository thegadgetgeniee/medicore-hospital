import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OPDBillingClient from './OPDBillingClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function OPDBillingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: bills }, { data: patients }, { data: doctors }, { data: services }, { data: packages }] = await Promise.all([
    supabase.from('opd_bills').select('*, patients(name, uhid), doctors(name)').order('created_at', { ascending: false }).limit(100),
    supabase.from('patients').select('id, name, uhid').order('name'),
    supabase.from('doctors').select('id, name, fee').order('name'),
    supabase.from('services').select('*').eq('active', true).order('category'),
    supabase.from('packages').select('*').eq('active', true).order('name'),
  ])

  return (
    <SharedLayout>
      <OPDBillingClient initialBills={bills || []} patients={patients || []} doctors={doctors || []} services={services || []} packages={packages || []} />
    </SharedLayout>
  )
}
