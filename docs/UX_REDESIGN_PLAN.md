# MERIDIAN UX Redesign Plan

**Version:** 1.0  
**Date:** July 7, 2026  
**Scope:** Design system, information architecture, page priorities, motion  
**Baseline:** Post-audit frontend (`frontend/src/design/`), institutional Agent OS positioning

---

## Design Positioning

MERIDIAN should read as **the operating system for autonomous finance on Casper**—not a chat wrapper around crypto APIs. Users arrive at a morning briefing, assign missions to specialist agents, observe a visible execution pipeline, approve wallet actions explicitly, and review history with on-chain proof.

```
FROM: User → Chat input → Maybe wallet popup
TO:   User → Briefing → Agent employee → Pipeline → Approval → Chain → History
```

Cognitive load target on the primary surface: **three decisions** — Ask, Approve, Review History. Power features live under Templates, Examples, Operations, and ⌘K.

---

## Design System

### Token source

Primary tokens: `frontend/src/design/tokens.ts` (`meridianTokens`).

### Color

| Token               | Value                    | Usage                             |
| ------------------- | ------------------------ | --------------------------------- |
| `color.bg`          | `#050505`                | OLED base                         |
| `color.glass`       | `rgba(255,255,255,0.04)` | Card surfaces                     |
| `color.glassBorder` | `rgba(255,255,255,0.08)` | Bezel borders                     |
| `color.accent`      | `#dc2626`                | MERIDIAN red — CTAs, active nav   |
| `color.success`     | `#22c55e`                | Live status, cleared compliance   |
| `color.warning`     | `#f59e0b`                | Degraded backend, pending actions |
| `color.error`       | `#ef4444`                | Failures, rejected txs            |

### Typography

| Role    | Spec                                         | Notes                                |
| ------- | -------------------------------------------- | ------------------------------------ |
| Display | 2rem / 700 / -0.03em tracking                | Page titles (`typography.display`)   |
| Title   | 1.25rem / 600                                | Section headers                      |
| Label   | 0.6875rem / 600 / uppercase / 0.1em tracking | Metric card labels, ribbon chips     |
| Mono    | `var(--font-geist-mono)`                     | Tx hashes, tool counts, mission text |

**Recommendation:** Keep Inter for body density; use Geist Mono for on-chain identifiers (already referenced in components).

### Radius and elevation

| Token       | px  | Usage                 |
| ----------- | --- | --------------------- |
| `radius.sm` | 12  | Chips, small controls |
| `radius.md` | 16  | Cards, StatusRibbon   |
| `radius.lg` | 20  | Modals                |
| `radius.xl` | 24  | Hero briefing blocks  |

Shadows: `shadow.card` (inset highlight + drop), `shadow.glow` (accent halo on primary CTAs).

### Core components (existing)

| Component           | Path                                                   | Role                     |
| ------------------- | ------------------------------------------------------ | ------------------------ |
| `GlassCard`         | `frontend/src/design/components/GlassCard.tsx`         | Primary surface          |
| `PremiumButton`     | `frontend/src/design/components/PremiumButton.tsx`     | CTAs with icon + loading |
| `BriefingGrid`      | `frontend/src/design/components/BriefingGrid.tsx`      | 4-up metric row          |
| `StatusRibbon`      | `frontend/src/design/components/StatusRibbon.tsx`      | Live stack proof strip   |
| `AgentEmployeeCard` | `frontend/src/design/components/AgentEmployeeCard.tsx` | Specialist roster        |
| `CommandPalette`    | `frontend/src/design/components/CommandPalette.tsx`    | ⌘K navigation            |
| `SetupWizard`       | `frontend/src/design/components/SetupWizard.tsx`       | 7-step onboarding        |

### StatusRibbon pattern (required on primary pages)

Every primary page should mount `StatusRibbon` answering:

1. **Product** — "Autonomous compliant yield on Casper"
2. **Live** — Backend ready/degraded from `useHealth` / `useReady`
3. **Stack** — MCP · Planner · x402 · ERC-3643 chips
4. **Proof** — Dynamic MCP tool count (`useMcpHealth`) + latest tx link from `useEvents`

Currently mounted on: `/agent`, `/activity`, `/agents`, `/marketplace`, `/examples`, `/missions` (templates).

---

## Information Architecture

### Target navigation (3 groups)

```
Workspace
  Briefing      /agent
  Agents        /agents
  History       /activity

Discover
  Templates     /templates
  Examples      /examples
  Marketplace   /marketplace

Operations
  Dashboard     /dashboard
  Staking       /staking
  Compliance    /compliance
  Audit         /audit
  MCP Tools     /mcp
  x402          /x402
  Setup         /start
```

**Change from today:** Promote Operations from "More" to a labeled third group so institutional depth is discoverable without ⌘K.

### Redirect resolution

| Legacy URL     | Action                                                                     |
| -------------- | -------------------------------------------------------------------------- |
| `/missions`    | Keep redirect → `/templates`; update all docs/skills to `/templates`       |
| `/prompts`     | Keep redirect → `/examples`; add alias chip on Examples page               |
| `/playground`  | **Remove redirect** or mount dedicated quick-test surface at `/playground` |
| `/dashboard/*` | Keep redirects indefinitely (bookmark compatibility)                       |

---

## Page Priorities

### Tier 1 — Primary (ship-quality bar)

| Page              | Goal              | Key components to add/complete                                                        |
| ----------------- | ----------------- | ------------------------------------------------------------------------------------- |
| `/agent` Briefing | Morning OS home   | `AgentPipeline` + `PIPELINE_STAGES` (wired); remove duplicate `AgentExecutionConsole` |
| `/agents`         | Specialist roster | Already strong; add last-mission deep links                                           |
| `/activity`       | Audit trail       | Pipeline replay from SSE traces                                                       |
| `/start`          | Onboarding        | 7-step wizard (complete)                                                              |

### Tier 2 — Discoverability

| Page           | Goal                                                 |
| -------------- | ---------------------------------------------------- |
| `/templates`   | One-click mission launch with real planner execution |
| `/examples`    | Copy-paste prompts; link to `/agent?objective=`      |
| `/marketplace` | Template install → briefing (fixed)                  |

### Tier 3 — Institutional / power user

| Page                                | Goal                                 |
| ----------------------------------- | ------------------------------------ |
| `/dashboard`                        | Protocol KPIs, event feed            |
| `/staking`, `/compliance`, `/issue` | Form-driven ops                      |
| `/mcp`                              | Tool explorer with read/write badges |
| `/audit`, `/x402`                   | Premium audit + payment flow         |

### Deprioritize / remove

| Surface              | Rationale                                         |
| -------------------- | ------------------------------------------------- |
| `AgentConsolePage`   | Duplicate of briefing + pipeline; merge or delete |
| `TokensPage`         | Placeholder; `/issue` is canonical                |
| Nickelfox auth pages | 404 in Next.js; wallet is identity                |
| `DashboardNavbar`    | Unused legacy chrome                              |

---

## Briefing Layout Spec (`/agent`)

Target layout (1280px max, `meridianTokens.spacing.pageMax`):

```
┌─────────────────────────────────────────────────────────────┐
│ StatusRibbon                                                │
├─────────────────────────────────────────────────────────────┤
│ BriefingGrid (Portfolio | Compliance | Yield | Pending)     │
├──────────────────────────┬──────────────────────────────────┤
│ Command input + chips    │ AgentExecutionConsole (pipeline) │
│ ApprovalPrompt (if wallet)│ Live trace stages               │
│ SuccessBanner            │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

**Pending actions rule:** Count only wallet-blocking work (`useBriefingData.ts` lines 72–73)—never agent decision queue depth.

---

## Motion and Interaction

### Motion tokens (`meridianTokens.motion`)

| Property | Value                     | Usage                       |
| -------- | ------------------------- | --------------------------- |
| Spring   | stiffness 380, damping 32 | Stage expansion, card enter |
| Ease     | `[0.22, 1, 0.36, 1]`      | Page transitions            |
| Duration | 0.35s                     | Default UI transitions      |

### Pipeline stage motion

Map `PIPELINE_STAGES` (`frontend/src/design/tokens.ts`) to animated console:

| Stage ID    | Human label               | Animation                                |
| ----------- | ------------------------- | ---------------------------------------- |
| `planning`  | Analyzing your request…   | Pulse on active dot                      |
| `contracts` | Loading contract state…   | Indeterminate shimmer                    |
| `building`  | Constructing transaction… | Progress bar                             |
| `approval`  | Waiting for wallet…       | Glow border (`ApprovalPrompt` keyframes) |
| `broadcast` | Submitting to testnet…    | Spinner                                  |
| `confirmed` | Finality reached          | Success morph + explorer link            |

**Implementation target:** `frontend/src/components/AgentExecutionConsole.tsx` — already built; wire to `useAgentRuntime` phases on `/agent`.

### Micro-interactions

| Element          | Behavior                                                            |
| ---------------- | ------------------------------------------------------------------- |
| `PremiumButton`  | Magnetic hover (translateY -1px), loading spinner inline            |
| `GlassCard`      | `animate` prop — staggered fade-up (see `BriefingGrid` index delay) |
| `ApprovalPrompt` | 2.5s glow pulse on wallet-required state                            |
| Command palette  | 220ms fade; fuzzy match on routes + missions                        |
| Page enter       | `SetupWizard` fadeIn keyframes (12px translateY) — reuse globally   |

### Reduced motion

Respect `prefers-reduced-motion`: disable glow loops and spring overshoot; keep instant state changes.

---

## Responsive Behavior

| Breakpoint | Briefing                            | StatusRibbon        |
| ---------- | ----------------------------------- | ------------------- |
| xs–sm      | Single column; pipeline below input | Stack vertically    |
| md+        | 60/40 or 50/50 split                | Horizontal chip row |
| lg         | max-width 1280 centered             | Full proof strip    |

Sidebar: Nickelfox collapsible drawer (`DashboardShellLayout`).

---

## Accessibility

| Requirement    | Implementation                                                     |
| -------------- | ------------------------------------------------------------------ |
| Focus rings    | MUI defaults on form controls; add visible ring on `PremiumButton` |
| Live regions   | Pipeline stage changes → `aria-live="polite"` on console           |
| Color contrast | White primary on #050505 passes; verify `text.secondary` on glass  |
| Keyboard       | ⌘K palette; Enter to run mission; Esc dismiss                      |

---

## Implementation Phases

| Phase | Deliverable                | Files                                               |
| ----- | -------------------------- | --------------------------------------------------- |
| 1     | Wire pipeline to briefing  | `AgentHomePage.tsx`, `AgentExecutionConsole.tsx`    |
| 2     | Nav IA update              | `nav-items.ts`, `CommandPalette.tsx`                |
| 3     | Operations group promotion | `DashboardShellLayout`, sidebar                     |
| 4     | Redirect/doc cleanup       | `next.config.mjs`, skill files, `meridian-skill.md` |
| 5     | Motion polish              | `tokens.ts`, shared keyframes module                |
| 6     | Degraded-state UX          | Banner when `health.status === 'degraded'`          |

---

## Success Metrics

| Metric                           | Current                | Target                        |
| -------------------------------- | ---------------------- | ----------------------------- |
| Time to first mission (new user) | ~5 min with wizard     | <3 min                        |
| Visible pipeline stages on write | 0 on `/agent`          | ≥8 stages                     |
| Nav clicks to reach `/dashboard` | 2+ (More → Operations) | 1                             |
| False pending action count       | Fixed (was 7)          | 0 when idle                   |
| MCP tool count accuracy          | Fixed (live)           | Always from `/api/mcp/health` |

---

## Related Documents

- `docs/PRODUCT_AUDIT.md` — route matrix and broken items
- `docs/AGENT_EXPERIENCE_SPEC.md` — pipeline and approval flow detail
- `docs/ONBOARDING_FLOW.md` — 7-step wizard specification
