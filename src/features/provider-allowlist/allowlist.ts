/**
 * Provider Allowlist - Subscription-only guard
 *
 * Central source of truth for which provider prefixes are allowed at runtime.
 * API-key-based providers are denied on principle: only subscription-backed
 * providers (Copilot / OpenCode / OpenCode-Go / Z.ai / Kimi) are authorized.
 *
 * Usage:
 *   if (!isProviderAllowedForExecution("openai/gpt-5.4")) throw ...
 */

/**
 * Subscription-backed providers (only these are permitted).
 *
 * - github-copilot : GitHub Copilot subscription
 * - opencode       : OpenCode Zen subscription
 * - opencode-go    : OpenCode-Go tier
 * - zai-coding-plan: Z.ai Coding Plan subscription
 * - kimi-for-coding: Moonshot Kimi-for-Coding subscription
 */
export const ALLOWED_PROVIDERS: ReadonlySet<string> = new Set([
  "github-copilot",
  "opencode",
  "opencode-go",
  "zai-coding-plan",
  "kimi-for-coding",
])

/**
 * API-key-based providers (strictly denied).
 * Listed explicitly so the reason each one is rejected is discoverable.
 */
export const DENIED_PROVIDERS: ReadonlySet<string> = new Set([
  "anthropic",      // Claude direct API (use claude CLI via Bash instead)
  "google",         // Google Generative AI API (use gemini CLI via Bash instead)
  "openai",         // OpenAI API
  "xai",            // xAI API
  "openrouter",     // OpenRouter proxy API
  "moonshotai",     // Moonshot direct API
  "moonshotai-cn",  // Moonshot CN direct API
  "firmware",       // Firmware API
  "ollama-cloud",   // Ollama Cloud API
  "aihubmix",       // AIHubMix proxy API
  "vercel",         // Vercel AI Gateway (API key based)
  "venice",         // Venice API
])

/**
 * Extracts the provider prefix from a `provider/model` identifier.
 * Returns `undefined` when the input is malformed.
 */
export function getProviderFromModelId(modelId: string): string | undefined {
  const idx = modelId.indexOf("/")
  if (idx <= 0) return undefined
  return modelId.slice(0, idx)
}

/**
 * Returns true when the provider is explicitly allowed.
 *
 * Unknown providers are treated as denied — we fail closed. Anything that
 * wants to pass must be listed in {@link ALLOWED_PROVIDERS}.
 */
export function isProviderAllowed(providerId: string): boolean {
  return ALLOWED_PROVIDERS.has(providerId)
}

/**
 * Returns true when a full `provider/model` id routes to an allowed provider.
 * Unknown / malformed ids return false (fail closed).
 */
export function isProviderAllowedForExecution(modelId: string): boolean {
  const provider = getProviderFromModelId(modelId)
  if (!provider) return false
  return isProviderAllowed(provider)
}

/**
 * Filters a provider list down to allowed providers only.
 * Preserves order. Useful when rewriting fallback chain `providers` arrays.
 */
export function filterAllowedProviders(providers: readonly string[]): string[] {
  return providers.filter(isProviderAllowed)
}

/**
 * Throws a descriptive error when a model id would route to a denied provider.
 * Call this at every execution entry point (delegate_task, call_omo_agent,
 * background-retry, sync-retry) as defense-in-depth.
 */
export function assertProviderAllowed(modelId: string): void {
  const provider = getProviderFromModelId(modelId)
  if (!provider) {
    throw new Error(
      `[provider-allowlist] Malformed model id "${modelId}". ` +
        `Expected "provider/model" format.`,
    )
  }
  if (DENIED_PROVIDERS.has(provider)) {
    throw new Error(
      `[provider-allowlist] Provider "${provider}" is denied: API-key providers are not permitted. ` +
        `Allowed providers: ${Array.from(ALLOWED_PROVIDERS).join(", ")}. ` +
        `To use Claude/Gemini/Codex capability, shell out via Bash to ` +
        `\`claude -p\`, \`gemini\`, \`copilot -p\`, or \`opencode run\`.`,
    )
  }
  if (!ALLOWED_PROVIDERS.has(provider)) {
    throw new Error(
      `[provider-allowlist] Provider "${provider}" is unknown. ` +
        `Allowed: ${Array.from(ALLOWED_PROVIDERS).join(", ")}.`,
    )
  }
}
