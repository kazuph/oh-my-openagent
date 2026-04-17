/**
 * Model version migration map: old full model strings → new full model strings.
 *
 * Used to auto-upgrade hardcoded model ids in user configs. After the
 * 2026-04-17 API-key provider purge, legacy `anthropic/` and `openai/` ids
 * migrate to their `github-copilot/` and `opencode/` subscription equivalents.
 *
 * Keys are full "provider/model" strings.
 */
export const MODEL_VERSION_MAP: Record<string, string> = {
  // Legacy Anthropic-direct → GitHub Copilot subscription
  "anthropic/claude-opus-4-5": "github-copilot/claude-opus-4-6",
  "anthropic/claude-sonnet-4-5": "github-copilot/claude-sonnet-4-6",
  "anthropic/claude-opus-4-6": "github-copilot/claude-opus-4-6",
  "anthropic/claude-sonnet-4-6": "github-copilot/claude-sonnet-4-6",
  "anthropic/claude-haiku-4-5": "github-copilot/claude-haiku-4-5",
  // Legacy OpenAI-direct → OpenCode Zen subscription (keeps codex family available via opencode)
  "openai/gpt-5.3-codex": "opencode/gpt-5.3-codex",
  "openai/gpt-5.4": "opencode/gpt-5.4",
  "openai/gpt-5.4-mini": "github-copilot/gpt-5-mini",
  // Legacy Google-direct → GitHub Copilot (which proxies Gemini family)
  "google/gemini-3.1-pro": "github-copilot/gemini-3.1-pro",
  "google/gemini-3-flash": "github-copilot/gemini-3-flash",
}

function migrationKey(oldModel: string, newModel: string): string {
  return `model-version:${oldModel}->${newModel}`
}

export function migrateModelVersions(
  configs: Record<string, unknown>,
  appliedMigrations?: Set<string>
): { migrated: Record<string, unknown>; changed: boolean; newMigrations: string[] } {
  const migrated: Record<string, unknown> = {}
  let changed = false
  const newMigrations: string[] = []

  for (const [key, value] of Object.entries(configs)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const config = value as Record<string, unknown>
      if (typeof config.model === "string" && MODEL_VERSION_MAP[config.model]) {
        const oldModel = config.model
        const newModel = MODEL_VERSION_MAP[oldModel]
        const mKey = migrationKey(oldModel, newModel)

        // Skip if this migration was already applied (user may have reverted)
        if (appliedMigrations?.has(mKey)) {
          migrated[key] = value
          continue
        }

        migrated[key] = { ...config, model: newModel }
        changed = true
        newMigrations.push(mKey)
        continue
      }
    }
    migrated[key] = value
  }

  return { migrated, changed, newMigrations }
}
