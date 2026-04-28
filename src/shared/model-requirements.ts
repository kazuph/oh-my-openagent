export type FallbackEntry = {
  providers: string[]
  model: string
  variant?: string
  reasoningEffort?: string
  temperature?: number
  top_p?: number
  maxTokens?: number
  thinking?: { type: "enabled" | "disabled"; budgetTokens?: number }
}

export type ModelRequirement = {
  fallbackChain: FallbackEntry[]
  variant?: string
  requiresModel?: string
  requiresAnyModel?: boolean
  requiresProvider?: string[]
}

function noFallbackRequirement(overrides: Partial<ModelRequirement> = {}): ModelRequirement {
  return {
    fallbackChain: [],
    ...overrides,
  }
}

export const AGENT_MODEL_REQUIREMENTS: Record<string, ModelRequirement> = {
  sisyphus: noFallbackRequirement({ requiresAnyModel: false }),
  hephaestus: noFallbackRequirement(),
  oracle: noFallbackRequirement(),
  explore: noFallbackRequirement(),
  "multimodal-looker": noFallbackRequirement(),
  prometheus: noFallbackRequirement(),
  metis: noFallbackRequirement(),
  momus: noFallbackRequirement(),
  atlas: noFallbackRequirement(),
  "sisyphus-junior": noFallbackRequirement(),
}

export const CATEGORY_MODEL_REQUIREMENTS: Record<string, ModelRequirement> = {
  "visual-engineering": noFallbackRequirement(),
  ultrabrain: noFallbackRequirement(),
  deep: noFallbackRequirement(),
  artistry: noFallbackRequirement(),
  quick: noFallbackRequirement(),
  "unspecified-low": noFallbackRequirement(),
  "unspecified-high": noFallbackRequirement(),
  writing: noFallbackRequirement(),
}
