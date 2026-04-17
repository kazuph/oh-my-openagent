import type { GeneratedOmoConfig, ProviderAvailability } from "./model-fallback-types"

/**
 * OpenAI (direct-API) is a denied provider. This catalog never activates.
 * Kept as a no-op so existing call-sites compile; removed in a later cleanup.
 */
export function isOpenAiOnlyAvailability(_availability: ProviderAvailability): boolean {
  return false
}

export function applyOpenAiOnlyModelCatalog(config: GeneratedOmoConfig): GeneratedOmoConfig {
  return config
}
