import { LeadsWorkspace } from '@/components/leads/LeadsWorkspace'
import { leadService } from '@/lib/services/leadService'

export const dynamic = 'force-dynamic'

export default async function LeadsPage() {
  const { allLeads, initialColumns, stats } = await leadService.getWorkspaceData()

  return (
    <LeadsWorkspace
      allLeads={allLeads}
      initialColumns={initialColumns}
      stats={stats}
    />
  )
}
