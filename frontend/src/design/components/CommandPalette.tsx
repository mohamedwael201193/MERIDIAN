'use client'

import React, { ReactElement, ReactNode, useCallback, useEffect, useState } from 'react'
import {
  Box,
  Dialog,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation'
import IconifyIcon from '@/nickelfox/components/base/IconifyIcon'
import { MISSION_LIBRARY } from '@lib/mission-library'
import { STARTER_PROMPTS } from '@lib/starter-prompts'
import { dashboardRoutes } from '@/dashboard/routes'
import { meridianTokens } from '@/design/tokens'

export interface CommandItem {
  id: string
  label: string
  description?: string
  icon: string
  action: () => void
  group: string
}

const CommandPaletteContext = React.createContext<{
  open: boolean
  setOpen: (v: boolean) => void
} | null>(null)

export function CommandPaletteProvider({ children }: { children: ReactNode }): ReactElement {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const items: CommandItem[] = [
    ...STARTER_PROMPTS.map((p) => ({
      id: `prompt-${p.id}`,
      label: p.label,
      description: 'Run on briefing',
      icon: 'mdi:lightning-bolt',
      group: 'Quick actions',
      action: () => router.push(`/agent?objective=${encodeURIComponent(p.objective)}`),
    })),
    ...MISSION_LIBRARY.slice(0, 8).map((m) => ({
      id: `mission-${m.id}`,
      label: m.title,
      description: m.category,
      icon: 'mdi:play-circle-outline',
      group: 'Templates',
      action: () => router.push(`/agent?objective=${encodeURIComponent(m.objective)}`),
    })),
    ...dashboardRoutes.map((r) => ({
      id: `route-${r.path}`,
      label: r.name,
      description: r.description,
      icon: 'mdi:arrow-right',
      group: 'Operations',
      action: () => router.push(r.path),
    })),
    { id: 'nav-agent', label: 'Briefing', icon: 'mdi:view-dashboard-outline', group: 'Navigate', action: () => router.push('/agent'), description: 'Home command center' },
    { id: 'nav-agents', label: 'Agents', icon: 'mdi:robot-outline', group: 'Navigate', action: () => router.push('/agents'), description: 'Specialist employees' },
    { id: 'nav-history', label: 'History', icon: 'mdi:history', group: 'Navigate', action: () => router.push('/activity'), description: 'Completed missions' },
    { id: 'nav-templates', label: 'Templates', icon: 'mdi:file-document-outline', group: 'Navigate', action: () => router.push('/templates'), description: 'Mission templates' },
    { id: 'nav-examples', label: 'Examples', icon: 'mdi:text-box-outline', group: 'Navigate', action: () => router.push('/examples'), description: 'Sample prompts' },
    { id: 'nav-marketplace', label: 'Marketplace', icon: 'mdi:store-outline', group: 'Navigate', action: () => router.push('/marketplace'), description: 'Agent templates' },
    { id: 'nav-x402', label: 'x402 Payments', icon: 'mdi:cash-multiple', group: 'Navigate', action: () => router.push('/x402'), description: 'Micropayment audit unlock' },
  ]

  return (
    <CommandPaletteContext.Provider value={{ open, setOpen }}>
      {children}
      <CommandPaletteDialog items={items} open={open} onClose={() => setOpen(false)} />
    </CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const ctx = React.useContext(CommandPaletteContext)
  if (!ctx) throw new Error('useCommandPalette requires CommandPaletteProvider')
  return ctx
}

function CommandPaletteDialog({
  items,
  open,
  onClose,
}: {
  items: CommandItem[]
  open: boolean
  onClose: () => void
}) {
  const [query, setQuery] = useState('')

  const filtered = items.filter((item) => {
    const q = query.toLowerCase()
    if (!q) return true
    return item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
  })

  const groups = [...new Set(filtered.map((i) => i.group))]

  const run = useCallback(
    (item: CommandItem) => {
      item.action()
      onClose()
      setQuery('')
    },
    [onClose],
  )

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: `${meridianTokens.radius.lg}px`,
          bgcolor: '#0a0a0a',
          border: '1px solid',
          borderColor: meridianTokens.color.glassBorder,
          backgroundImage: 'none',
        },
      }}
    >
      <Box p={2}>
        <TextField
          autoFocus
          fullWidth
          placeholder="Search capabilities, templates, pages…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <IconifyIcon icon="mdi:magnify" width={20} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 3,
              bgcolor: meridianTokens.color.glass,
            },
          }}
        />
        <Typography variant="caption" color="text.disabled" mt={1} display="block">
          ↑↓ navigate · Enter select · Esc close
        </Typography>
      </Box>
      <List sx={{ maxHeight: 400, overflow: 'auto', py: 0 }}>
        {groups.map((group) => (
          <Box key={group}>
            <Typography px={2} py={0.5} sx={{ ...meridianTokens.typography.label, color: 'text.disabled' }}>
              {group}
            </Typography>
            {filtered
              .filter((i) => i.group === group)
              .map((item) => (
                <ListItemButton key={item.id} onClick={() => run(item)} sx={{ py: 1 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <IconifyIcon icon={item.icon} width={20} />
                  </ListItemIcon>
                  <ListItemText primary={item.label} secondary={item.description} />
                </ListItemButton>
              ))}
          </Box>
        ))}
        {filtered.length === 0 ? (
          <Typography px={2} py={3} color="text.secondary" textAlign="center">
            No matches
          </Typography>
        ) : null}
      </List>
    </Dialog>
  )
}
