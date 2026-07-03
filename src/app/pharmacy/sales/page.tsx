import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SalesClient from './SalesClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function PharmacySalesPage({ searchParams }: any) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: bills }, { data: medicines }, { data: patients }] = await Promise.all([
    supabase.from('pharmacy_bills').select('*').order('created_at', { ascending: false }).limit(150),
    supabase.from('medicines').select('*').order('name'),
    supabase.from('patients').select('id, name, uhid').order('name'),
  ])

  let pendingOrder = null
  const orderId = searchParams?.order
  if (orderId) {
    const { data } = await supabase.from('pharmacy_orders').select('*, patients(name), doctors(name)').eq('id', orderId).single()
    pendingOrder = data
  }

  return (
    <SharedLayout>
      <SalesClient
        initialBills={bills || []}
        medicines={medicines || []}
        patients={patients || []}
        pendingOrder={pendingOrder}
      />
    </SharedLayout>
  )
}
