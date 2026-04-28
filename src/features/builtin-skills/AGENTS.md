# src/features/builtin-skills/ -- 3 Built-in Skills

**Generated:** 2026-04-11

## OVERVIEW

24 files. 3 built-in skills are auto-registered via `createBuiltinSkills()`. Browser and other external-tool skills remain in the tree for compatibility/reference, but are no longer auto-loaded by default.

## STRUCTURE

```
builtin-skills/
├── index.ts              # Barrel exports
├── skills.ts             # createBuiltinSkills() factory
├── types.ts              # BuiltinSkill interface
├── git-master/           # SKILL.md + resources
├── frontend-ui-ux/       # SKILL.md
├── agent-browser/        # SKILL.md
├── dev-browser/          # SKILL.md
└── skills/               # Skill implementations as .ts files
    ├── git-master-sections/  # Git master prompt sections
    ├── playwright.ts         # Playwright + agent-browser + playwright-cli + dev-browser
    ├── frontend-ui-ux.ts     # Frontend UI/UX skill
    ├── review-work.ts        # 5-lane local CLI review orchestrator
    └── ai-slop-remover.ts    # AI code smell remover
```

## SKILL CATALOG

| Skill | LOC | MCP | Purpose |
|-------|-----|-----|---------|
| **git-master** | 1111 | -- | Atomic commits, rebase, history search |
| **frontend-ui-ux** | 79 | -- | Design-first UI development |
| **ai-slop-remover** | ~300 | -- | Remove AI code patterns |

## BROWSER COMPATIBILITY

Config `browser_automation_engine` selects which discovered browser skill name is preferred:
- `"playwright-cli"` (default) -> prefer discovered `playwright-cli`, accept canonical `playwright`
- `"playwright"` -> prefer discovered `playwright`
- `"agent-browser"` -> prefer discovered `agent-browser`
- `"dev-browser"` -> prefer discovered `dev-browser`

## SKILL LOADING

Skills loaded by `opencode-skill-loader` with priority: project > opencode > user > builtin. User-installed skills with same name override built-ins.
