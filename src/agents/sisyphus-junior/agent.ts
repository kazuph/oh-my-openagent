/**
 * Sisyphus-Junior - Focused Task Executor
 *
 * Executes delegated tasks directly without spawning other agents.
 * Category-spawned executor with domain-specific configurations.
 *
 * Uses a single default prompt path.
 */

import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentMode } from "../types"
import type { AgentOverrideConfig } from "../../config/schema"
import {
  createAgentToolRestrictions,
  type PermissionValue,
} from "../../shared/permission-compat"

import { buildDefaultSisyphusJuniorPrompt } from "./default"

const MODE: AgentMode = "subagent"

// Core tools that Sisyphus-Junior must NEVER have access to.
const BLOCKED_TOOLS = ["task"]

export const SISYPHUS_JUNIOR_DEFAULTS = {
  model: "github-copilot/claude-sonnet-4-6",
  temperature: 0.1,
} as const

/**
 * Builds the appropriate Sisyphus-Junior prompt based on model.
 */
export function buildSisyphusJuniorPrompt(
  _model: string | undefined,
  useTaskSystem: boolean,
  promptAppend?: string
): string {
  return buildDefaultSisyphusJuniorPrompt(useTaskSystem, promptAppend)
}

export function createSisyphusJuniorAgentWithOverrides(
  override: AgentOverrideConfig | undefined,
  systemDefaultModel?: string,
  useTaskSystem = false
): AgentConfig {
  if (override?.disable) {
    override = undefined
  }

  const overrideModel = (override as { model?: string } | undefined)?.model
  const model = overrideModel ?? systemDefaultModel ?? SISYPHUS_JUNIOR_DEFAULTS.model
  const temperature = override?.temperature ?? SISYPHUS_JUNIOR_DEFAULTS.temperature

  const promptAppend = override?.prompt_append
  const prompt = buildSisyphusJuniorPrompt(model, useTaskSystem, promptAppend)
  const baseRestrictions = createAgentToolRestrictions(BLOCKED_TOOLS)

  const userPermission = (override?.permission ?? {}) as Record<string, PermissionValue>
  const basePermission = baseRestrictions.permission
  const merged: Record<string, PermissionValue> = { ...userPermission }
  for (const tool of BLOCKED_TOOLS) {
    merged[tool] = "deny"
  }
  merged.call_omo_agent = "allow"
  const toolsConfig = { permission: { ...merged, ...basePermission } as Record<string, PermissionValue> }
  const permission: Record<string, PermissionValue> = { ...toolsConfig.permission }

  const base: AgentConfig = {
    description: override?.description ??
      "Focused task executor. Same discipline, no delegation. (Sisyphus-Junior - OhMyOpenCode)",
    mode: MODE,
    model,
    temperature,
    maxTokens: 64000,
    prompt,
    color: override?.color ?? "#20B2AA",
    permission,
  }

  if (override?.top_p !== undefined) {
    base.top_p = override.top_p
  }

  return base as AgentConfig
}

createSisyphusJuniorAgentWithOverrides.mode = MODE
