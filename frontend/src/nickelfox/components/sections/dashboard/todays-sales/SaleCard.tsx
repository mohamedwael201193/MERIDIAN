import { ReactElement } from 'react';
import { Box, Stack, Typography } from '@mui/material';
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon';
import { SaleItem } from '@/nickelfox/types/sale-item';

const SaleCard = ({ saleItem }: { saleItem: SaleItem }): ReactElement => {
  return (
    <Stack gap={6} p={5} borderRadius={4} height={1} bgcolor="background.default" border="1px solid" borderColor="divider">
      <IconifyIcon icon={saleItem.icon} width={26} height={26} color={saleItem.color} />
      <Box>
        <Typography variant="h4" color="common.white" mb={4}>
          {saleItem.title}
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={2}>
          {saleItem.subtitle}
        </Typography>
        <Typography variant="body2" color={saleItem.color} lineHeight={1.25}>
          +{saleItem.increment}% this era
        </Typography>
      </Box>
    </Stack>
  );
};

export default SaleCard;
