'use client'

import dynamic from 'next/dynamic'

const StakingPage = dynamic(() => import('@/dashboard/pages/StakingPage'), { ssr: false })

export default function StakingRoute() {
  return <StakingPage />
}
