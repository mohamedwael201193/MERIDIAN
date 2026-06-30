'use client'

import { useMemo, ReactElement } from 'react'
import {
  Paper,
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  Typography,
  TableContainer,
  CircularProgress,
  Box,
  Alert,
  Stack,
} from '@mui/material'
import ProductItemRow from './ProductItemRow'
import SimpleBar from 'simplebar-react'
import { useTokens } from '@lib/hooks/useMeridianData'

const TopProducts = (): ReactElement => {
  const { data: tokens, isLoading, error } = useTokens()

  const productTableRows = useMemo(() => {
    if (!tokens?.length) return []
    const maxSupply = Math.max(...tokens.map((t) => Number(t.total_supply || 0)), 1)
    const colors = ['error', 'primary', 'warning', 'info'] as const
    return tokens.map((token, index) => ({
      id: String(index + 1).padStart(2, '0'),
      name: token.symbol ?? token.contract_name,
      color: colors[index % colors.length],
      sales: Math.round((Number(token.total_supply || 0) / maxSupply) * 100),
    }))
  }, [tokens])

  return (
    <Paper sx={{ p: { xs: 3, sm: 4 }, height: 1 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={4} gap={2}>
        <Box>
          <Typography variant="h4" color="common.white">
            Active Tokens
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.75}>
            Live contract registry from the Render backend.
          </Typography>
        </Box>
      </Stack>
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress color="primary" />
        </Box>
      ) : error ? (
        <Alert severity="error">
          Failed to load tokens from backend. The frontend will retry automatically.
        </Alert>
      ) : productTableRows.length === 0 ? (
        <Alert severity="info">No indexed tokens yet.</Alert>
      ) : (
        <TableContainer component={SimpleBar}>
          <Table sx={{ minWidth: 440 }}>
            <TableHead>
              <TableRow>
                <TableCell align="left">#</TableCell>
                <TableCell align="left">Name</TableCell>
                <TableCell align="left">Supply Share</TableCell>
                <TableCell align="center">Allocation</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productTableRows.map((product) => (
                <ProductItemRow key={product.id} productItem={product} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  )
}

export default TopProducts
