import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentOverrides } from "../types"
import type { CategoryConfig } from "../../config/schema"
import type { AvailableAgent, AvailableCategory, AvailableSkill } from "../dynamic-agent-prompt-builder"
import { createHephaestusAgent } from "../hephaestus"
import { applyEnvironmentContext } from "./environment-context"
import { applyCategoryOverride, mergeAgentConfig } from "./agent-overrides"

export function maybeCreateHephaestusConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  availableAgents: AvailableAgent[]
  availableSkills: AvailableSkill[]
  availableCategories: AvailableCategory[]
  mergedCategories: Record<string, CategoryConfig>
  directory?: string
  useTaskSystem: boolean
  disableOmoEnv?: boolean
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    availableAgents,
    availableSkills,
    availableCategories,
    mergedCategories,
    directory,
    useTaskSystem,
    disableOmoEnv = false,
  } = input

  if (disabledAgents.includes("hephaestus")) return undefined

  const hephaestusOverride = agentOverrides["hephaestus"]

  let hephaestusConfig = createHephaestusAgent(
    availableAgents,
    undefined,
    availableSkills,
    availableCategories,
    useTaskSystem
  )

  const hepOverrideCategory = (hephaestusOverride as Record<string, unknown> | undefined)?.category as string | undefined
  if (hepOverrideCategory) {
    hephaestusConfig = applyCategoryOverride(hephaestusConfig, hepOverrideCategory, mergedCategories)
  }

  hephaestusConfig = applyEnvironmentContext(hephaestusConfig, directory, { disableOmoEnv })

  if (hephaestusOverride) {
    hephaestusConfig = mergeAgentConfig(hephaestusConfig, hephaestusOverride, directory)
  }

  return hephaestusConfig
}
