import type { InstallConfig } from "./types"
import type { GeneratedOmoConfig } from "./model-fallback-types"

export type { GeneratedOmoConfig } from "./model-fallback-types"

const SCHEMA_URL = "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json"
export function generateModelConfig(_config: InstallConfig): GeneratedOmoConfig {
  return {
    $schema: SCHEMA_URL,
  }
}

export function shouldShowChatGPTOnlyWarning(_config: InstallConfig): boolean {
  return false
}
