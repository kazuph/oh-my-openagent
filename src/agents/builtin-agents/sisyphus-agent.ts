import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentOverrides } from "../types"
import type { CategoriesConfig, CategoryConfig } from "../../config/schema"
import type { AvailableAgent, AvailableCategory, AvailableSkill } from "../dynamic-agent-prompt-builder"
import { applyEnvironmentContext } from "./environment-context"
import { applyOverrides } from "./agent-overrides"
import { createSisyphusAgent } from "../sisyphus"

export function maybeCreateSisyphusConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  availableAgents: AvailableAgent[]
  availableSkills: AvailableSkill[]
  availableCategories: AvailableCategory[]
  mergedCategories: Record<string, CategoryConfig>
  directory?: string
  userCategories?: CategoriesConfig
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

  if (disabledAgents.includes("sisyphus")) return undefined

  const sisyphusOverride = agentOverrides["sisyphus"]

  let sisyphusConfig = createSisyphusAgent(
    availableAgents,
    undefined,
    availableSkills,
    availableCategories,
    useTaskSystem
  )

  sisyphusConfig = applyOverrides(sisyphusConfig, sisyphusOverride, mergedCategories, directory)

  sisyphusConfig = applyEnvironmentContext(sisyphusConfig, directory, {
    disableOmoEnv,
  })

  return sisyphusConfig
}
