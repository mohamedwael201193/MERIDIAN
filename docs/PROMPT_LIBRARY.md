# Prompt Library

**111 production prompts** for Claude, Cursor, and MERIDIAN MCP.

Interactive UI with Copy buttons: **https://meridian-frontend-kappa.vercel.app/prompts**

Source of truth: `frontend/src/lib/prompt-library.ts`

## Categories

General · Compliance · Yield · Staking · Vault · Payments · Audit · Transfer · Portfolio · Developer · Planner · Judge Demo

## Master Agent Prompt

Copy from the Prompt Library page or `frontend/src/lib/mcp-catalog.ts` → `MASTER_AGENT_PROMPT`.

## Sample prompts

### General

- What is MERIDIAN and how do I use it as an AI agent?
- List every MCP tool and categorize read vs write.

### Yield

- What is the current MRWA yield APY?
- Show yield distribution history.

### Staking

- Delegate 500 CSPR to the first validator. My public key is 01...
- What is the minimum delegation amount on Casper?

### Judge Demo

- Complete 60-second MERIDIAN demo script.
- End-to-end: Claude → MCP → Wallet → Chain → Timeline.

See the full list of 111 prompts in the UI or source file.
