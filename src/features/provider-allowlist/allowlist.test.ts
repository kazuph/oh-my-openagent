import { describe, it, expect } from "bun:test"
import {
  ALLOWED_PROVIDERS,
  DENIED_PROVIDERS,
  assertProviderAllowed,
  filterAllowedProviders,
  getProviderFromModelId,
  isProviderAllowed,
  isProviderAllowedForExecution,
} from "./allowlist"

describe("provider-allowlist constants", () => {
  it("includes exactly the 5 subscription-backed providers", () => {
    expect(Array.from(ALLOWED_PROVIDERS).sort()).toEqual([
      "github-copilot",
      "kimi-for-coding",
      "opencode",
      "opencode-go",
      "zai-coding-plan",
    ])
  })

  it("lists every denied provider explicitly (no overlap with allowlist)", () => {
    for (const denied of DENIED_PROVIDERS) {
      expect(ALLOWED_PROVIDERS.has(denied)).toBe(false)
    }
  })

  it("denies every currently-known API-key provider", () => {
    for (const provider of [
      "anthropic",
      "google",
      "openai",
      "xai",
      "openrouter",
      "moonshotai",
      "moonshotai-cn",
      "firmware",
      "ollama-cloud",
      "aihubmix",
      "vercel",
      "venice",
    ]) {
      expect(DENIED_PROVIDERS.has(provider)).toBe(true)
    }
  })
})

describe("getProviderFromModelId", () => {
  it("extracts provider prefix from well-formed ids", () => {
    expect(getProviderFromModelId("opencode/claude-opus-4-6")).toBe("opencode")
    expect(getProviderFromModelId("github-copilot/gpt-5.4")).toBe("github-copilot")
  })

  it("returns undefined for malformed ids", () => {
    expect(getProviderFromModelId("claude-opus-4-6")).toBeUndefined()
    expect(getProviderFromModelId("/claude-opus")).toBeUndefined()
    expect(getProviderFromModelId("")).toBeUndefined()
  })
})

describe("isProviderAllowed", () => {
  it("accepts every subscription provider", () => {
    for (const provider of ALLOWED_PROVIDERS) {
      expect(isProviderAllowed(provider)).toBe(true)
    }
  })

  it("rejects every denied provider", () => {
    for (const provider of DENIED_PROVIDERS) {
      expect(isProviderAllowed(provider)).toBe(false)
    }
  })

  it("rejects unknown providers (fail closed)", () => {
    expect(isProviderAllowed("totally-new-provider")).toBe(false)
  })
})

describe("isProviderAllowedForExecution", () => {
  it("accepts allowed provider model ids", () => {
    expect(isProviderAllowedForExecution("opencode/gpt-5.4")).toBe(true)
    expect(isProviderAllowedForExecution("github-copilot/claude-sonnet-4-6")).toBe(true)
    expect(isProviderAllowedForExecution("opencode-go/kimi-k2.5")).toBe(true)
  })

  it("rejects denied provider model ids", () => {
    expect(isProviderAllowedForExecution("openai/gpt-5.4")).toBe(false)
    expect(isProviderAllowedForExecution("google/gemini-3.1-pro")).toBe(false)
    expect(isProviderAllowedForExecution("anthropic/claude-opus-4-6")).toBe(false)
    expect(isProviderAllowedForExecution("vercel/gpt-5.4")).toBe(false)
  })

  it("rejects malformed ids", () => {
    expect(isProviderAllowedForExecution("gpt-5.4")).toBe(false)
    expect(isProviderAllowedForExecution("")).toBe(false)
  })
})

describe("filterAllowedProviders", () => {
  it("keeps allowed providers in original order", () => {
    expect(
      filterAllowedProviders([
        "anthropic",
        "github-copilot",
        "opencode",
        "openai",
        "opencode-go",
      ]),
    ).toEqual(["github-copilot", "opencode", "opencode-go"])
  })

  it("returns empty array when nothing is allowed", () => {
    expect(filterAllowedProviders(["anthropic", "openai", "google"])).toEqual([])
  })

  it("returns empty array for empty input", () => {
    expect(filterAllowedProviders([])).toEqual([])
  })
})

describe("assertProviderAllowed", () => {
  it("does not throw for allowed providers", () => {
    expect(() => assertProviderAllowed("opencode/gpt-5.4")).not.toThrow()
    expect(() => assertProviderAllowed("github-copilot/claude-opus-4-6")).not.toThrow()
  })

  it("throws with denial message for denied providers", () => {
    expect(() => assertProviderAllowed("openai/gpt-5.4")).toThrow(/denied/)
    expect(() => assertProviderAllowed("google/gemini-3.1-pro")).toThrow(/denied/)
    expect(() => assertProviderAllowed("anthropic/claude-opus-4-6")).toThrow(/denied/)
  })

  it("throws with 'unknown' message for unknown providers", () => {
    expect(() => assertProviderAllowed("mystery-provider/foo")).toThrow(/unknown/)
  })

  it("throws with 'malformed' message for malformed ids", () => {
    expect(() => assertProviderAllowed("just-a-model-name")).toThrow(/Malformed/)
  })

  it("mentions CLI alternatives in denial message", () => {
    expect(() => assertProviderAllowed("openai/gpt-5.4")).toThrow(
      /claude -p|gemini|copilot -p|opencode run/,
    )
  })
})
