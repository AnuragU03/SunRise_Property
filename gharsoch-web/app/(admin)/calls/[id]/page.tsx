import { notFound } from 'next/navigation'
import { callService } from '@/lib/services/callService'
import { CallReviewClient } from './CallReviewClient'

export const dynamic = 'force-dynamic'

export default async function CallReviewPage({ params }: { params: { id: string } }) {
  try {
    const call = await callService.get(params.id)
    
    if (!call) {
      return notFound()
    }

    return (
      <div className="flex-1 w-full max-w-7xl mx-auto py-6">
        <CallReviewClient initialCall={call} />
      </div>
    )
  } catch (error) {
    console.error('Error fetching call details:', error)
    return notFound()
  }
}
