import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PharmacyDashClient from './PharmacyDashClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function PharmacyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]

  const [{ data: pendingOrders }, { data: pharmBills }, { data: lowStock }] = await Promise.all([
    supabase.from('pharmacy_orders').select('*, patients(name), doctors(name)').eq('status', 'Pending').order('created_at', { ascending: false }),
    supabase.from('pharmacy_bills').select('grand_total, date').eq('date', today),
    supabase.from('medicines').select('id, name, brand, stock, unit, category').lt('stock', 50).order('stock'),
  ])

  const todayRevenue = (pharmBills || []).reduce((s: number, b: any) => s + (b.grand_total || 0), 0)

  return (
    <SharedLayout>
      <PharmacyDashClient pendingOrders={pendingOrders || []} todayRevenue={todayRevenue} todaySales={(pharmBills || []).length} lowStock={lowStock || []} />
    </SharedLayout>
  )
}
