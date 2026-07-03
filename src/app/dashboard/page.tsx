import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalPatients },
    { count: todayAppts },
    { data: opdBills },
    { data: pharmBills },
    { data: recentAppts },
    { data: recentVisits },
    { data: lowStock },
    { data: pendingOrders },
  ] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }).eq('date', today),
    supabase.from('opd_bills').select('total').eq('date', today),
    supabase.from('pharmacy_bills').select('grand_total').eq('date', today),
    supabase.from('appointments')
      .select('*, patients(name), doctors(name)')
      .eq('date', today)
      .order('token', { ascending: true })
      .limit(8),
    supabase.from('visits')
      .select('*, patients(name), doctors(name)')
      .order('created_at', { ascending: false })
      .limit(6),
    supabase.from('medicines')
      .select('id, name, brand, stock, unit, category')
      .lt('stock', 50)
      .order('stock', { ascending: true })
      .limit(8),
    supabase.from('pharmacy_orders')
      .select('*, patients(name), doctors(name)')
      .eq('status', 'Pending')
      .limit(5),
  ])

  const opdRevenue = (opdBills || []).reduce((s: number, b: any) => s + (b.total || 0), 0)
  const pharmRevenue = (pharmBills || []).reduce((s: number, b: any) => s + (b.grand_total || 0), 0)

  return (
    <SharedLayout>
      <DashboardClient
        stats={{ totalPatients: totalPatients || 0, todayAppts: todayAppts || 0, opdRevenue, pharmRevenue }}
        recentAppts={recentAppts || []}
        recentVisits={recentVisits || []}
        lowStock={lowStock || []}
        pendingOrders={pendingOrders || []}
      />
    </SharedLayout>
  )
}
