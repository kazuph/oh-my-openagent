# src/tools/

**Generated:** 2026-04-11

## OVERVIEW

Current plugin-facing tools are registered via `createToolRegistry()`. Some legacy delegation helpers still exist as internal implementation modules, but `task`, `call_omo_agent`, `background_output`, `background_cancel`, and `look_at` are no longer registered by the plugin.

## TOOL CATALOG

### Task Management (4)

| Tool | Factory | Parameters |
|------|---------|------------|
| `task_create` | `createTaskCreateTool` | subject, description, blockedBy, blocks, metadata, parentID |
| `task_list` | `createTaskList` | (none) |
| `task_get` | `createTaskGetTool` | id |
| `task_update` | `createTaskUpdateTool` | id, subject, description, status, addBlocks, addBlockedBy, owner, metadata |

### LSP Refactoring (6) - Direct ToolDefinition

| Tool | Parameters |
|------|------------|
| `lsp_goto_definition` | filePath, line, character |
| `lsp_find_references` | filePath, line, character, includeDeclaration |
| `lsp_symbols` | filePath, scope (document/workspace), query, limit |
| `lsp_diagnostics` | filePath, severity |
| `lsp_prepare_rename` | filePath, line, character |
| `lsp_rename` | filePath, line, character, newName |

### Code Search (4)

| Tool | Factory | Parameters |
|------|---------|------------|
| `ast_grep_search` | `createAstGrepTools` | pattern, lang, paths, globs, context |
| `ast_grep_replace` | `createAstGrepTools` | pattern, rewrite, lang, paths, globs, dryRun |
| `grep` | `createGrepTools` | pattern, path, include (60s timeout, 10MB limit) |
| `glob` | `createGlobTools` | pattern, path (60s timeout, 100 file limit) |

### Session History (4)

| Tool | Factory | Parameters |
|------|---------|------------|
| `session_list` | `createSessionManagerTools` | (none) |
| `session_read` | `createSessionManagerTools` | session_id, include_todos, limit |
| `session_search` | `createSessionManagerTools` | query, session_id, case_sensitive, limit |
| `session_info` | `createSessionManagerTools` | session_id |

### Skill/Command (2)

| Tool | Factory | Parameters |
|------|---------|------------|
| `skill` | `createSkillTool` | name, user_message |
| `skill_mcp` | `createSkillMcpTool` | mcp_name, tool_name/resource_name/prompt_name, arguments, grep |

### System (2)

| Tool | Factory | Parameters |
|------|---------|------------|
| `interactive_bash` | Direct | tmux_command |

### Editing (1) - Conditional

| Tool | Factory | Parameters |
|------|---------|------------|
| `hashline_edit` | `createHashlineEditTool` | file, edits[] |

## HOW TO ADD A TOOL

1. Create `src/tools/{name}/index.ts` exporting factory
2. Create `src/tools/{name}/types.ts` for parameter schemas
3. Create `src/tools/{name}/tools.ts` for implementation
4. Register in `src/plugin/tool-registry.ts`
