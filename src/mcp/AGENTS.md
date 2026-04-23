# src/mcp/ — Built-in MCP Stubs

**Generated:** 2026-04-11

## OVERVIEW

Tier 1 of the three-tier MCP system. This repository now exposes no built-in remote MCPs; `createBuiltinMcps()` returns an empty object.

## BUILT-IN MCPs

None. Remote MCP injection was removed from this fork.

## REGISTRATION PATTERN

```typescript
// Factory now returns an empty object
export function createBuiltinMcps(): Record<string, never>
```

## ENABLE/DISABLE

```jsonc
{ "disabled_mcps": ["custom-server"] }
```

## THREE-TIER SYSTEM

| Tier | Source | Mechanism |
|------|--------|-----------|
| 1. Built-in | `src/mcp/` | none, `createBuiltinMcps()` returns `{}` |
| 2. Claude Code | `.mcp.json` | `${VAR}` expansion via `claude-code-mcp-loader` |
| 3. Skill-embedded | SKILL.md YAML | Managed by `SkillMcpManager` (stdio + HTTP) |

## FILES

| File | Purpose |
|------|---------|
| `index.ts` | `createBuiltinMcps()` factory |
| `types.ts` | generic MCP name validation |
