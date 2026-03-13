'use client';

import { ReactElement } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import TokenIssueForm from '@/dashboard/components/TokenIssueForm';

export default function IssuePage(): ReactElement {
  return (
    <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap={3.5}>
      <Box gridColumn={{ xs: 'span 12', lg: 'span 8' }}>
        <Paper sx={{ p: { xs: 4, sm: 8 }, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h4" color="common.white" mb={4}>
            Issue Token
          </Typography>
          <TokenIssueForm />
        </Paper>
      </Box>
    </Box>
  );
}
