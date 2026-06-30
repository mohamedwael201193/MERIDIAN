'use client'

import { useMemo, ReactElement } from 'react'
import { Stack, Avatar, Typography, CircularProgress, Box } from '@mui/material'
import { DataGrid, GridSlots, GridColDef, GridRenderCellParams } from '@mui/x-data-grid'
import { stringAvatar } from '@/nickelfox/helpers/string-avatar'
import CustomPagination from '@/nickelfox/components/common/CustomPagination'
import CustomNoResultsOverlay from '@/nickelfox/components/common/CustomNoResultsOverlay'
import { useHolders } from '@lib/hooks/useMeridianData'
import { truncateHash } from '@lib/contracts'
import type { HolderRow } from '@lib/types'

const columns: GridColDef[] = [
  {
    field: 'account_hash',
    headerName: 'Account',
    flex: 1,
    minWidth: 180,
    renderCell: (params: GridRenderCellParams) => (
      <Stack direction="row" gap={1} alignItems="center">
        <Avatar {...stringAvatar(params.row.account_hash)} />
        <Typography variant="body2">{truncateHash(params.row.account_hash, 12, 8)}</Typography>
      </Stack>
    ),
  },
  {
    field: 'status',
    headerName: 'Status',
    flex: 0.6,
    minWidth: 120,
  },
  {
    field: 'country',
    headerName: 'Country',
    flex: 0.4,
    minWidth: 80,
    valueFormatter: (value) => (value == null ? '—' : String(value)),
  },
  {
    field: 'accredited',
    headerName: 'Accredited',
    flex: 0.5,
    minWidth: 100,
    valueFormatter: (value) => (value ? 'Yes' : 'No'),
  },
  {
    field: 'sanctions_cleared',
    headerName: 'Sanctions',
    flex: 0.5,
    minWidth: 100,
    valueFormatter: (value) => (value ? 'Clear' : 'Flagged'),
  },
  {
    field: 'registered_at',
    headerName: 'Registered',
    flex: 1,
    minWidth: 160,
    valueFormatter: (value) => (value ? new Date(String(value)).toLocaleString() : '—'),
  },
]

function matchesSearch(holder: HolderRow, searchText: string): boolean {
  const query = searchText.trim().toLowerCase()
  if (!query) return true
  const haystack = [
    holder.account_hash,
    holder.status,
    holder.country != null ? String(holder.country) : '',
    holder.accredited ? 'yes accredited' : 'no',
    holder.sanctions_cleared ? 'clear sanctions' : 'flagged',
    holder.registered_at ?? '',
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(query)
}

const CustomerTable = ({ searchText }: { searchText: string }): ReactElement => {
  const { data: holders, isLoading, error } = useHolders(500)

  const rows = useMemo(
    () =>
      (holders ?? [])
        .filter((holder) => matchesSearch(holder, searchText))
        .map((holder, index) => ({
          ...holder,
          id: holder.id ?? String(index + 1),
        })),
    [holders, searchText],
  )

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={325}>
        <CircularProgress color="primary" />
      </Box>
    )
  }

  if (error) {
    return <Typography color="error.main">Failed to load holders from backend.</Typography>
  }

  return (
    <DataGrid
      density="standard"
      columns={columns}
      autoHeight={false}
      rowHeight={56}
      disableColumnMenu
      disableRowSelectionOnClick
      rows={rows}
      initialState={{
        pagination: { paginationModel: { page: 0, pageSize: 4 } },
      }}
      slots={{
        loadingOverlay: CircularProgress as GridSlots['loadingOverlay'],
        pagination: CustomPagination as GridSlots['pagination'],
        noResultsOverlay: CustomNoResultsOverlay as GridSlots['noResultsOverlay'],
      }}
      sx={{ height: 1, width: 1, tableLayout: 'fixed', scrollbarWidth: 'thin' }}
    />
  )
}

export default CustomerTable
