import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InventoryClient from './InventoryClient'
import SharedLayout from '@/components/layout/SharedLayout'

export default async function InventoryPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: medicines } = await supabase.from('medicines').select('*').order('name')

  return (
    <SharedLayout>
      <InventoryClient initialMedicines={medicines || []} />
    </SharedLayout>
  )
}
