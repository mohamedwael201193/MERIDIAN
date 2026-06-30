'use client'

import dynamic from 'next/dynamic'

const IssuePage = dynamic(() => import('@/dashboard/pages/IssuePage'), { ssr: false })

export default function IssueRoute() {
  return <IssuePage />
}
