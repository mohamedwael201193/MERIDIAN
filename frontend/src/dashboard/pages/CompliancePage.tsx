import { ReactElement } from 'react';
import { Box } from '@mui/material';
import ComplianceLookup from '@/dashboard/components/ComplianceLookup';
import CustomerFulfillment from '@/nickelfox/components/sections/dashboard/customer-fulfilment/CustomerFulfillment';
import Customers from '@/nickelfox/components/sections/dashboard/customers/Customers';

export default function CompliancePage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
      <Box gridColumn={{ xs: 'span 12' }}>
        <ComplianceLookup />
      </Box>
      <Box gridColumn={{ xs: 'span 12', md: 'span 6', xl: 'span 4' }}>
        <CustomerFulfillment />
      </Box>
      <Box gridColumn={{ xs: 'span 12', xl: 'span 8' }}>
        <Customers />
      </Box>
    </Box>
  );
}
