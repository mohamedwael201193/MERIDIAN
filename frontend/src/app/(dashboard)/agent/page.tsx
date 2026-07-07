import { Suspense } from 'react'
import AgentConsolePage from '@/dashboard/pages/AgentConsolePage'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AgentConsolePage />
    </Suspense>
  )
}
