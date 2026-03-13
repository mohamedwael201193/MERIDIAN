'use client'

import { ReactElement } from 'react'
import { Box } from '@mui/material'
import ComplianceLookup from '@/dashboard/components/ComplianceLookup'
import RegisterHolderForm from '@/dashboard/components/RegisterHolderForm'
import CustomerFulfillment from '@/nickelfox/components/sections/dashboard/customer-fulfilment/CustomerFulfillment'
import Customers from '@/nickelfox/components/sections/dashboard/customers/Customers'
import PageHeader from '@/components/PageHeader'
import { meridianTokens } from '@/design/tokens'

export default function CompliancePage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={meridianTokens.spacing.sectionGap}>
      <Box gridColumn={{ xs: 'span 12' }}>
        <PageHeader
          icon="mdi:shield-check-outline"
          eyebrow="Operations"
          title="Compliance"
          stepLabel="Step 3 of 8"
          description="Look up any holder's ComplianceRegistry status, review the sanctions/accreditation state, and track the compliance rate across all registered holders."
        />
      </Box>
      <Box gridColumn={{ xs: 'span 12' }}>
        <ComplianceLookup />
      </Box>
      <Box gridColumn={{ xs: 'span 12' }}>
        <RegisterHolderForm />
      </Box>
      <Box gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}>
        <CustomerFulfillment />
      </Box>
      <Box gridColumn={{ xs: 'span 12', xl: 'span 8' }}>
        <Customers />
      </Box>
    </Box>
  )
}
