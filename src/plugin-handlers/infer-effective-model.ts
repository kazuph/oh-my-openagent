export function inferEffectiveModel(
  config: Record<string, unknown>,
): string | undefined {
  const configuredModel = config.model
  if (typeof configuredModel === "string" && configuredModel.trim().length > 0) {
    return configuredModel.trim()
  }

  const providers = config.provider
  if (!providers || typeof providers !== "object") {
    return undefined
  }

  for (const [providerID, providerConfig] of Object.entries(providers)) {
    if (!providerConfig || typeof providerConfig !== "object") continue
    const models = (providerConfig as { models?: Record<string, unknown> }).models
    if (!models || typeof models !== "object") continue

    for (const modelID of Object.keys(models)) {
      if (modelID.trim().length === 0) continue
      return `${providerID}/${modelID}`
    }
  }

  return undefined
}
