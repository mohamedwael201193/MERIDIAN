# MERIDIAN Full Product Redesign Audit

**Version:** 1.0  
**Date:** July 7, 2026  
**Audience:** Casper Agentic Buildathon judges, product team, implementation  
**Mode:** Redesign — Overhaul (visual + IA), Preserve (content, routes, backend integrations)  
**Design Read:** Institutional Agent OS for finance/RWA operators and hackathon judges, Linear × Stripe × Bloomberg Terminal language, dark OLED + glass, VISUAL_DENSITY 7, MOTION_INTENSITY 6, DESIGN_VARIANCE 5

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Judge Lens: Five-Second Comprehension](#2-judge-lens-five-second-comprehension)
3. [Current State Audit](#3-current-state-audit)
4. [Navigation Audit](#4-navigation-audit)
5. [Information Architecture](#5-information-architecture)
6. [User Journey: Current vs Target](#6-user-journey-current-vs-target)
7. [Page-by-Page Audit](#7-page-by-page-audit)
8. [Agent Experience Gap Analysis](#8-agent-experience-gap-analysis)
9. [Design Language & Tokens](#9-design-language--tokens)
10. [Component Inventory](#10-component-inventory)
11. [Motion & Interaction Specs](#11-motion--interaction-specs)
12. [Onboarding Redesign](#12-onboarding-redesign)
13. [Discoverability: Templates, Capabilities, Advanced](#13-discoverability-templates-capabilities-advanced)
14. [Specialist Agents Redesign](#14-specialist-agents-redesign)
15. [States, Accessibility, Responsive](#15-states-accessibility-responsive)
16. [Wireframes & User Flows](#16-wireframes--user-flows)
17. [Implementation Plan](#17-implementation-plan)
18. [Pre-Flight & Anti-Slop Checklist](#18-pre-flight--anti-slop-checklist)

---

## 1. Executive Summary

### What MERIDIAN is today (technically)

MERIDIAN is a **production-grade Casper agent stack**: Planner API, 13 MCP tools, wallet signing, x402 micropayments, SSE trace streaming, indexer-backed read tools, and on-chain write tools. The backend is real. The wallet is real. Transactions finalize on testnet.

### What MERIDIAN feels like (experientially)

After the recent chat-first pivot, MERIDIAN feels like **"ChatGPT with crypto"** — a narrow chat column, suggestion chips, and human-readable bubbles. The institutional ops layer (dashboard KPIs, audit trail, agent decisions, MCP explorer) exists but is **demoted or orphaned**.

### What MERIDIAN must feel like

**The Operating System for Autonomous Finance on Casper** — an AI employee with a morning briefing, live pipeline visibility, institutional confidence, and progressive depth for experts.

### Why this redesign is necessary (judge framing)

| Judge question    | Current answer (5 sec)   | Target answer (5 sec)                                 |
| ----------------- | ------------------------ | ----------------------------------------------------- |
| What is MERIDIAN? | "A chat app about yield" | "AI employees for compliant RWA on Casper"            |
| Why Casper?       | Unclear from Home        | "Native staking, contracts, testnet txs visible"      |
| Why AI?           | "Type a question"        | "Agent plans, executes, asks wallet only when needed" |
| Why MCP?          | Hidden                   | "13 tools, shown in Capabilities"                     |
| Why x402?         | Buried on `/x402`        | "Premium audit unlock in pipeline"                    |
| Why ERC-3643?     | Not visible              | "Compliance status on briefing card"                  |

### Strategic repositioning

```
FROM: User → Chat → Maybe wallet
TO:   User → Briefing → Agent Employee → Pipeline → Approval → Chain → History
```

**Cognitive load target:** Reduce visible decisions on Home from ~15 to **3** (Ask, Approve, Review History). Power features live under **Capabilities**, **Templates**, and **⌘K**.

---

## 2. Judge Lens: Five-Second Comprehension

Every primary screen must embed a **Judge Ribbon** — a single horizontal strip answering:

1. **MERIDIAN** — Autonomous compliant yield for RWAs on Casper testnet
2. **LIVE** — Real indexer + MCP + wallet (not demo)
3. **PROOF** — Last finalized tx hash or "0 txs today" (honest)
4. **STACK** — MCP · Planner · x402 · ERC-3643 (icon row, not paragraph)

This ribbon is **not marketing fluff** — it links to real data (`useHealth`, `useEvents`, profile history).

### Homepage hero replacement

**Remove:** "What can I help with?"  
**Add:** Personalized briefing block:

```
Good evening, Mohamed
Wallet Connected · 4,347 CSPR
─────────────────────────────────
Portfolio        Compliance       Yield
MRWA live        Cleared ✓        0.00% APY
─────────────────────────────────
Pending Actions: 0
Today's Insight: No distributions indexed yet
Recommended: Check yield · Review validators
Agent Status: Everything healthy · MCP 13 tools
─────────────────────────────────
What should I help you with today?
```

All values from **real hooks** — no placeholders.

---

## 3. Current State Audit

### 3.1 Navigation

| Item                                  | Path           | In nav? | Problem                               |
| ------------------------------------- | -------------- | ------- | ------------------------------------- |
| Home                                  | `/agent`       | ✓       | Chat icon, chatbot framing            |
| History                               | `/activity`    | ✓       | Thin list, no pipeline replay         |
| Get set up                            | `/start`       | ✓       | Still config-copy mental model        |
| Dashboard                             | `/dashboard`   | ✗       | Best institutional surface, hidden    |
| Missions                              | `/missions`    | ✗       | Redirects to `/agent` — dead bookmark |
| Marketplace                           | `/marketplace` | ✗       | Orphaned                              |
| Agents timeline                       | `/agents`      | ✗       | Redirects to `/activity`              |
| Staking, Compliance, MCP, x402, Audit | various        | ✗       | Power user only                       |

**Verdict:** IA is **over-corrected** toward minimalism. Judges never discover depth.

### 3.2 Pages (16 dashboard + landing)

**Primary (3):** AgentHome, Activity, Start  
**Orphaned but built:** AgentConsolePage, Missions, Marketplace, Playground, Prompts  
**Institutional (hidden):** Dashboard, Staking, Compliance, Audit, MCP, x402, Issue, Agents

### 3.3 Flows

| Flow                   | Works?                       | UX quality                       |
| ---------------------- | ---------------------------- | -------------------------------- |
| Read yield via planner | ✓                            | Good human summary               |
| Delegate 500 CSPR      | ✓ (after addresses.json fix) | Pipeline not visible             |
| Wallet connect         | ✓                            | Topbar only, not in briefing     |
| MCP install            | ✓                            | Still feels like dev setup       |
| x402 audit             | ✓                            | Surfaces payment required — good |
| SSE timeline           | ✓                            | Not on Home                      |

### 3.4 Spacing & hierarchy

- Chat column: 760px — appropriate for chat, **wrong for OS briefing**
- Border radius: 16px — good start, not yet "rounded XL" institutional glass
- Typography: Inter via MUI — skill flags Inter as overused; consider **Geist** or keep Inter only for data density (VISUAL_DENSITY 7)
- No command palette, no floating command bar

### 3.5 Animations

- `ThinkingIndicator` — dots only, not pipeline stages
- `AgentExecutionConsole` — **built, unwired**
- Page fade: 220ms — minimal
- No spring physics, no stage expansion

### 3.6 Visual language

- Dark red on black — on-brand but reads "crypto dashboard"
- No glass blur system, no double-bezel cards
- Emoji specialist cards — violates taste-skill emoji policy for institutional brief

### 3.7 Button / form systems

- MUI defaults — functional, not premium
- Missing: magnetic hover, success/failure morph, loading skeleton on CTAs
- Forms: chat input only on Home — staking/compliance forms untouched

### 3.8 Wallet UX

- `WalletAccountStatus` in topbar — good
- Profile shows "No wallet" when wallet connected — **bug/ sync gap**
- Approval via `ApprovalPrompt` — good copy, needs pipeline context

### 3.9 Agent UX

- Runtime phases exist in `useAgentRuntime` — **not rendered as pipeline**
- Traces stream live — not mapped to human stage labels
- No "Reading blockchain..." animated stages

### 3.10 Loading / errors / approvals

- Thinking dots — loading
- Error in chat bubble — ok
- ENOENT was production error — fixed in backend
- Approval card — good; needs simulation step before it

### 3.11 Mock vs real

| Real                  | Mock/static                          |
| --------------------- | ------------------------------------ |
| All `useMeridianData` | `MISSION_LIBRARY`, `AGENT_TEMPLATES` |
| Planner, wallet, txs  | Specialist emoji personas            |
| MCP health            | localStorage profile                 |

**Rule for redesign:** Briefing cards = real. Templates = static objectives but **real execution**.

---

## 4. Navigation Audit

### Current (3 items)

```
Home | History | Get set up
```

### Proposed (5 items + overflow)

```
Briefing (Home) | Agents | History | Capabilities ⌘K | ··· More
```

**More menu contains:**

- Templates (was Marketplace)
- Examples (was Mission Library)
- Get set up
- Operations: Staking, Compliance, Audit
- Advanced: MCP Tools, x402, Dashboard (legacy KPI)

### Why

- **Briefing** not Home — OS not chat app
- **Agents** — specialist employees, not chat
- **Capabilities** — opens command palette + tool index
- **More** — progressive disclosure (ChatGPT model)

### Sidebar vs top nav

For institutional density, move to **collapsible rail** (64px icons) + **top briefing bar** on desktop. Mobile: bottom tab bar (3 tabs) + More sheet.

---

## 5. Information Architecture

```
MERIDIAN OS
├── Briefing (/agent)          ← DEFAULT LANDING AFTER AUTH
│   ├── Command bar (bottom)
│   ├── Pipeline panel (right drawer on desktop)
│   └── Quick ask
├── Agents (/agents)           ← Specialist employees
├── History (/activity)        ← Completed missions + tx proof
├── Capabilities (⌘K modal)    ← MCP tools, pages, recent
└── More
    ├── Templates (/templates) ← was marketplace
    ├── Examples (/examples)   ← was missions
    ├── Setup (/start)
    └── Operations
        ├── Staking
        ├── Compliance
        ├── Audit
        └── Advanced (MCP, x402, Dashboard)
```

**URL preservation:** Redirects keep `/marketplace` → `/templates`, `/missions` → `/examples`.

---

## 6. User Journey: Current vs Target

### Target journey

```
Landing → Briefing (if wallet: skip setup)
    ↓
Optional: Setup wizard (5 animated steps)
    ↓
Briefing shows real portfolio/compliance/yield
    ↓
User: "Stake 500 CSPR"
    ↓
Pipeline panel opens (animated stages)
    ↓
Approval card (simulation summary)
    ↓
Wallet sign → Broadcast → Finalized → Explorer
    ↓
History records mission + tx
```

### Clicks to first value

| Path                          | Current        | Target                    |
| ----------------------------- | -------------- | ------------------------- |
| Returning user → yield answer | 2 (Home, chip) | 1 (insight on briefing)   |
| First-time → installed        | 4+             | 3 (setup) or 0 (skip)     |
| Judge → understand product    | ∞ (docs)       | 5 sec (briefing + ribbon) |

---

## 7. Page-by-Page Audit

### 7.1 Briefing `/agent` (redesign Home)

**Why it exists:** Command center for AI employee — not chat log.

**Remove:**

- Centered-only chat layout as primary
- Emoji specialist cards
- Generic empty state copy

**Add:**

- Morning/evening greeting with user name (from profile or wallet)
- 4-up status cards: Portfolio, Compliance, Yield, Pending Actions
- Insight line from real data
- Recommended tasks (from `MISSION_LIBRARY` top 3 + live context)
- Agent status strip (MCP health, backend ready)
- Command bar: "What should I help you with today?"
- Pipeline drawer (right): `AgentPipeline` component

### 7.2 Agents `/agents` (new primary)

**Why:** Specialist employees — installable, status-aware.

**Replace:** Old Activity Center planner duplicate.

**Content:** 5 agent cards with live decision counts, glow on active, sample prompts drawer.

### 7.3 History `/activity`

**Why:** Proof for judges — txs and missions.

**Add:** Expandable pipeline replay per session, explorer links, filter by agent.

### 7.4 Setup `/start`

**Why:** Zero friction install — see Section 12.

**Remove:** "Copy config" as hero action.

### 7.5 Templates `/templates`

**Why:** Install agent employees with policies.

**Keep data:** `AGENT_TEMPLATES` — rename labels for humans.

### 7.6 Examples `/examples`

**Why:** One-click objectives without "Mission Library" jargon.

### 7.7 Operations pages

**Staking, Compliance, Audit:** Re-skin with glass cards, link back to Briefing. Keep real forms.

### 7.8 Landing `/`

**Why:** Judge entry — must route to Briefing CTA, embed Judge Ribbon preview.

**Remove:** E-commerce dashboard CTA confusion.

### 7.9 404 / Loading / Empty

**Missing today.** Add branded 404, skeleton briefing, empty pending actions state.

---

## 8. Agent Experience Gap Analysis

### Required pipeline (user spec)

```
Planning → Reading Contracts → Checking Compliance → Checking Wallet
→ Finding Best Validator → Building Transaction → Simulation
→ Approval Required → Broadcast → Explorer → Confirmed
```

### Mapping to trace `step_type`

| Human stage          | Trace / runtime source               |
| -------------------- | ------------------------------------ |
| Planning             | `objective_received`, `reasoning`    |
| Reading Contracts    | `tool_invoked` get_token_info        |
| Checking Compliance  | `tool_invoked` get_compliance_status |
| Checking Wallet      | wallet connect state                 |
| Finding Validator    | `tool_invoked` list_validators       |
| Building Transaction | `wallet_required`, unsigned tx       |
| Simulation           | NEW: decode tx summary client-side   |
| Approval Required    | `ApprovalPrompt`                     |
| Broadcast            | `deploy_broadcast`                   |
| Explorer             | tx hash link                         |
| Confirmed            | `finality`, `complete`               |

### Component: `AgentPipeline.tsx`

- Vertical stepper with spring expand
- Active step pulses
- Completed steps checkmark
- Failed step retry CTA
- Technical details collapsed per step
- Driven by `useAgentRuntime.phase` + `useAgentTraceStream` filtered by session

**Critical fix:** Wire existing `AgentExecutionConsole` logic into new human labels — do not rebuild from scratch.

---

## 9. Design Language & Tokens

### Aesthetic: Institutional Glass (Ethereal Glass archetype)

- Background: `#050505` with subtle radial mesh (meridian red at 3% opacity, top-right)
- Surface: `rgba(255,255,255,0.04)` + `backdrop-blur(24px)` on cards
- Border: `1px solid rgba(255,255,255,0.08)` + inner highlight
- Accent: Meridian red `#E53935` — single accent, no purple AI glow
- Text: off-white `#F5F5F5`, secondary `#9CA3AF`
- Success: muted green `#2E7D32`
- Font: **Geist** (display) + **Geist Mono** (data/tx hashes) via `next/font`

### Spacing scale

```
space-1: 4px   space-2: 8px   space-3: 12px  space-4: 16px
space-6: 24px  space-8: 32px  space-12: 48px space-16: 64px
Section py: 48-64px desktop, 32px mobile
Card padding: 24-32px
Briefing grid gap: 16px
```

### Radius

```
radius-sm: 8px   radius-md: 16px   radius-lg: 24px   radius-xl: 32px
Cards: radius-lg, Buttons: radius-md (pill for primary CTA)
```

### Shadows

```
shadow-glass: 0 8px 32px rgba(0,0,0,0.4)
shadow-elevated: 0 16px 48px rgba(229,57,53,0.08)  /* tinted */
```

### Motion tokens

```
ease-spring: cubic-bezier(0.32, 0.72, 0, 1)
duration-fast: 200ms
duration-normal: 400ms
duration-slow: 700ms
stagger: 60ms per item
```

---

## 10. Component Inventory

### New components

| Component           | Purpose                        |
| ------------------- | ------------------------------ |
| `BriefingHeader`    | Greeting, wallet, judge ribbon |
| `BriefingGrid`      | 4 status cards                 |
| `AgentPipeline`     | Animated execution stages      |
| `CommandBar`        | Floating ask input             |
| `CommandPalette`    | ⌘K search                      |
| `GlassCard`         | Base surface                   |
| `AgentEmployeeCard` | Specialist with status         |
| `SetupWizard`       | 5-step onboarding              |
| `SimulationSummary` | Pre-approval tx human decode   |
| `JudgeRibbon`       | 5-second stack explanation     |
| `PremiumButton`     | Full state machine             |
| `EmptyBriefing`     | First-run                      |
| `PageTransition`    | Layout fade                    |

### Evolve existing

| Component           | Change                                     |
| ------------------- | ------------------------------------------ |
| `AgentHomePage`     | Split briefing + chat + pipeline           |
| `AgentInstaller`    | Step 1 skill, step 2 MCP, verify animation |
| `ApprovalPrompt`    | Add simulation block                       |
| `TransactionStatus` | Integrate into pipeline final steps        |
| `human-results.ts`  | Extend for portfolio briefing              |

### Deprecate / merge

| Component              | Fate                                |
| ---------------------- | ----------------------------------- |
| `AgentConsolePage`     | Merge into Briefing pipeline drawer |
| `SuggestionChips`      | Move under command bar as Examples  |
| Emoji specialist cards | Replace `AgentEmployeeCard`         |

---

## 11. Motion & Interaction Specs

### Page transitions

- Briefing ↔ History: shared layout on command bar, 400ms fade + 8px Y
- Setup steps: horizontal slide with progress spring

### Agent thinking

- Active pipeline step: opacity pulse + 2px translateY loop (1.2s)
- Completed: checkmark scale-in (spring)
- Expand step: height auto with `motion` AnimatePresence

### Buttons (PremiumButton states)

| State    | Behavior                              |
| -------- | ------------------------------------- |
| Hover    | translateY -1px, shadow increase      |
| Press    | scale 0.98                            |
| Loading  | width-preserving spinner, label fades |
| Success  | checkmark morph 300ms                 |
| Failure  | shake 4px, red border flash           |
| Disabled | opacity 0.4, no pointer               |
| Focus    | 2px meridian ring                     |

### Command palette

- `⌘K` / `Ctrl+K` opens modal
- Fuzzy search: pages, examples, MCP tools, recent objectives
- Arrow navigate, Enter execute

### Reduced motion

All animations respect `prefers-reduced-motion` — static pipeline, instant transitions.

---

## 12. Onboarding Redesign

### Remove current

- "Copy connection" as primary
- Skip-heavy flow that doesn't verify

### New 5-step wizard

| Step | Title                  | Action                    | Verification           |
| ---- | ---------------------- | ------------------------- | ---------------------- |
| 1    | Install MERIDIAN Skill | Download + path guide     | Checkbox confirm       |
| 2    | Install MCP            | Client select + copy      | —                      |
| 3    | Verify Installation    | Test connection           | Real `/api/mcp/health` |
| 4    | Connect Wallet         | Inline CSPR.click         | Public key captured    |
| 5    | Everything Ready       | Confetti + route Briefing | Profile saved          |

### Visual

- Glass cards per step
- Illustrated icons (SVG, not emoji)
- Progress bar spring
- Error: retry with explanation
- Success: green glow per step

---

## 13. Discoverability: Templates, Capabilities, Advanced

### ChatGPT model

| Beginner          | Expert                      |
| ----------------- | --------------------------- |
| Briefing cards    | ⌘K Capabilities             |
| Recommended tasks | Templates                   |
| Ask bar           | Examples                    |
| —                 | More → MCP, x402, Dashboard |

### No clutter rule

Max **5** primary nav items. Everything else in More or ⌘K.

---

## 14. Specialist Agents Redesign

### From static emoji → AI employee cards

Each card shows:

- Name + role (Yield Analyst, Compliance Officer, etc.)
- **Live status** (green/amber from `useDecisions` filter)
- Last action timestamp
- 3 capability chips
- "Hire" installs template to profile
- "Assign task" opens command bar with objective
- Hover: subtle glow (`box-shadow` meridian tint)
- Expand: sample prompts list

### Agents

1. **Yield Analyst** — APY, staking, distributions
2. **Compliance Officer** — ERC-3643 registry, holder status
3. **Treasury Manager** — portfolio, vault
4. **Audit Investigator** — events, x402 premium
5. **Portfolio Advisor** — read-only aggregation

---

## 15. States, Accessibility, Responsive

### Empty states

- Briefing: "Connect wallet to unlock compliance card" — honest
- History: illustration + CTA to Briefing
- Agents: "Hire your first specialist"

### Loading

- Briefing: skeleton 4-card grid
- Pipeline: step placeholders
- Never full-page spinner > 200ms without skeleton

### Errors

- Human message + retry + technical accordion
- Wallet errors: unlock site, approve site

### Accessibility

- WCAG AA contrast on glass surfaces
- Focus rings on all interactives
- Skip to briefing content link
- `aria-live` on pipeline updates

### Responsive

| Breakpoint      | Layout                                 |
| --------------- | -------------------------------------- |
| Desktop ≥1280   | Briefing 2-col: grid + pipeline drawer |
| Tablet 768-1279 | Stacked cards, pipeline bottom sheet   |
| Mobile <768     | Single column, bottom command bar      |

---

## 16. Wireframes & User Flows

### Briefing desktop (ASCII)

```
┌─────────────────────────────────────────────────────────────────┐
│ MERIDIAN · Casper RWA · MCP·Planner·x402·ERC-3643    [Wallet]  │
├─────────────────────────────────────────────────────────────────┤
│ Good evening, Mohamed                    Agent: ● Healthy     │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │Portfolio │ │Compliance│ │  Yield   │ │ Pending  │          │
│ │ MRWA     │ │ Cleared  │ │ 0.00%    │ │ 0 actions│          │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│ Insight: No distributions indexed yet                         │
│ Recommended: [Check yield] [Stake 500] [Portfolio]              │
├─────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────┐ ┌──────────────────────────┐ │
│ │ Chat / results area         │ │ PIPELINE                 │ │
│ │                             │ │ ✓ Planning               │ │
│ │                             │ │ → Reading contracts...   │ │
│ └─────────────────────────────┘ └──────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ What should I help you with today?                    [↑]  │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Stake 500 CSPR flow

```
User submits → Pipeline opens
  → Planning (reasoning text)
  → Reading contracts (get_token_info)
  → Checking compliance (if applicable)
  → Finding validator (list_validators)
  → Building transaction (delegate_stake)
  → Simulation (amount, validator, gas note)
  → Approval required (wallet card)
  → Broadcast (tx hash)
  → Explorer link
  → Confirmed (finality)
  → Briefing Pending Actions clears
  → History entry created
```

---

## 17. Implementation Plan

### Phase 0 — Foundation (Day 1)

1. Design tokens file `frontend/src/design/tokens.ts`
2. `GlassCard`, `PremiumButton`, `JudgeRibbon`
3. Geist font via `next/font`
4. Nav restructure (5 items + More)
5. Redirects: `/templates`, `/examples`

### Phase 1 — Briefing Home (Day 1-2)

1. `BriefingHeader` + `BriefingGrid` with real hooks
2. Split layout: main + `AgentPipeline` drawer
3. Wire `useAgentRuntime` + traces to pipeline labels
4. Replace chat-only `AgentHomePage`
5. Command bar copy: "What should I help you with today?"

### Phase 2 — Agent Pipeline (Day 2)

1. `AgentPipeline.tsx` with 11 human stages
2. `SimulationSummary` before approval
3. Expandable technical details per step
4. Spring animations via `motion/react` (add dependency)

### Phase 3 — Agents & Discoverability (Day 2-3)

1. `/agents` page with `AgentEmployeeCard`
2. `/templates`, `/examples` renamed routes
3. `CommandPalette` (⌘K)

### Phase 4 — Onboarding (Day 3)

1. 5-step `SetupWizard` with illustrations
2. Skill install step first
3. Verification animations

### Phase 5 — Polish (Day 3-4)

1. 404, loading skeletons, error recovery
2. Landing Judge Ribbon
3. Re-skin operations pages (glass pass)
4. Mobile bottom nav
5. Remove emoji, em-dashes per taste-skill

### Phase 6 — Validation

1. E2E: yield read, delegate, compliance audit
2. Judge walkthrough script (60 sec)
3. Lighthouse, reduced motion test
4. Typecheck, MCP self-test, push

### Files touched (estimate)

~35 files, ~2500 LOC net new.

---

## 18. Pre-Flight & Anti-Slop Checklist

Per taste-skill Section 14:

- [ ] Zero em-dashes in UI copy
- [ ] No emoji in institutional surfaces
- [ ] No purple AI gradients
- [ ] No three equal feature columns
- [ ] Real data on briefing cards
- [ ] Motion respects reduced motion
- [ ] One accent color (meridian red)
- [ ] Glass with solid fallback
- [ ] CTA contrast WCAG AA
- [ ] Pipeline motion = motion shown when executing
- [ ] Judge comprehends in 5 seconds on Briefing
- [ ] No div-based fake screenshots
- [ ] No "Mission Library" jargon in primary UI

---

## Appendix A — Skills Applied

| Skill                      | Application                                                      |
| -------------------------- | ---------------------------------------------------------------- |
| design-taste-frontend      | Anti-slop, dials 5/6/7, em-dash ban, institutional glass         |
| redesign-existing-projects | Audit-first, preserve routes/backend, font/spacing/motion levers |
| high-end-visual-design     | Double-bezel cards, spring motion, no banned patterns            |

**Not installed:** `image-to-code`, `full-output-enforcement` (not in repo clone).

---

## Appendix B — Preservation List (do not break)

- All `/api/*` proxies
- `useAgentRuntime` trace emission
- Wallet CSPR.click integration
- Planner regex rules (extend, don't replace with mock LLM)
- `skills/MERIDIAN/SKILL.md`
- Contract addresses from indexer
- URL redirects for legacy bookmarks

---

_End of audit. Implementation proceeds per Phase 0-6 after stakeholder acknowledgment._
