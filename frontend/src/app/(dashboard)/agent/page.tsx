import { Suspense } from 'react'
import AgentHomePage from '@/dashboard/pages/AgentHomePage'

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AgentHomePage />
    </Suspense>
  )
}
