'use client'

import dynamic from 'next/dynamic'

const CompliancePage = dynamic(() => import('@/dashboard/pages/CompliancePage'), { ssr: false })

export default CompliancePage
