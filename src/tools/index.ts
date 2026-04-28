import type { ToolDefinition } from "@opencode-ai/plugin"

import {
  lsp_goto_definition,
  lsp_find_references,
  lsp_symbols,
  lsp_diagnostics,
  lsp_prepare_rename,
  lsp_rename,
  lspManager,
} from "./lsp"

export { lspManager }

export { createAstGrepTools } from "./ast-grep"
export { createGrepTools } from "./grep"
export { createGlobTools } from "./glob"
export { createSkillTool } from "./skill"
export { discoverCommandsSync } from "./slashcommand"
export { createSessionManagerTools } from "./session-manager"

export { sessionExists } from "./session-manager/storage"

export { interactive_bash, startBackgroundCheck as startTmuxCheck } from "./interactive-bash"
export { createSkillMcpTool } from "./skill-mcp"
export {
  createTaskCreateTool,
  createTaskGetTool,
  createTaskList,
  createTaskUpdateTool,
} from "./task"
export { createHashlineEditTool } from "./hashline-edit"

export const builtinTools: Record<string, ToolDefinition> = {
  lsp_goto_definition,
  lsp_find_references,
  lsp_symbols,
  lsp_diagnostics,
  lsp_prepare_rename,
  lsp_rename,
}
