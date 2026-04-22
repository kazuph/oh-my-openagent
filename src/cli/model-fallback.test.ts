/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"

import { generateModelConfig } from "./model-fallback"
import type { InstallConfig } from "./types"

function createConfig(overrides: Partial<InstallConfig> = {}): InstallConfig {
  return {
    hasClaude: false,
    isMax20: false,
    hasOpenAI: false,
    hasGemini: false,
    hasCopilot: false,
    hasOpencodeZen: false,
    hasZaiCodingPlan: false,
    hasKimiForCoding: false,
    hasOpencodeGo: false,
    hasVercelAiGateway: false,
    ...overrides,
  }
}

describe("generateModelConfig", () => {
  describe("no providers available", () => {
    test("returns ULTIMATE_FALLBACK for all agents and categories when no providers", () => {
      // #given no providers are available
      const config = createConfig()

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use ULTIMATE_FALLBACK for everything
      expect(result).toMatchSnapshot()
    })
  })

  describe("single native provider", () => {
    test("uses Claude models when only Claude is available", () => {
      // #given only Claude is available
      const config = createConfig({ hasClaude: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use Claude models per NATIVE_FALLBACK_CHAINS
      expect(result).toMatchSnapshot()
    })

    test("uses Claude models with isMax20 flag", () => {
      // #given Claude is available with Max 20 plan
      const config = createConfig({ hasClaude: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models for Sisyphus
      expect(result).toMatchSnapshot()
    })

    test("uses OpenAI models when only OpenAI is available", () => {
      // #given only OpenAI is available
      const config = createConfig({ hasOpenAI: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use OpenAI models
      expect(result).toMatchSnapshot()
    })

    test("uses OpenAI models with isMax20 flag", () => {
      // #given OpenAI is available with Max 20 plan
      const config = createConfig({ hasOpenAI: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })

    test("uses Gemini models when only Gemini is available", () => {
      // #given only Gemini is available
      const config = createConfig({ hasGemini: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use Gemini models
      expect(result).toMatchSnapshot()
    })

    test("uses Gemini models with isMax20 flag", () => {
      // #given Gemini is available with Max 20 plan
      const config = createConfig({ hasGemini: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })
  })

  describe("all native providers", () => {
    test("uses preferred models from fallback chains when all natives available", () => {
      // #given all native providers are available
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use first provider in each fallback chain
      expect(result).toMatchSnapshot()
    })

    test("uses preferred models with isMax20 flag when all natives available", () => {
      // #given all native providers are available with Max 20 plan
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
        isMax20: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })
  })

  describe("fallback providers", () => {
    test("uses OpenCode Zen models when only OpenCode Zen is available", () => {
      // #given only OpenCode Zen is available
      const config = createConfig({ hasOpencodeZen: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use OPENCODE_ZEN_MODELS
      expect(result).toMatchSnapshot()
    })

    test("uses OpenCode Zen models with isMax20 flag", () => {
      // #given OpenCode Zen is available with Max 20 plan
      const config = createConfig({ hasOpencodeZen: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })

    test("uses GitHub Copilot models when only Copilot is available", () => {
      // #given only GitHub Copilot is available
      const config = createConfig({ hasCopilot: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use GITHUB_COPILOT_MODELS
      expect(result).toMatchSnapshot()
    })

    test("uses GitHub Copilot models with isMax20 flag", () => {
      // #given GitHub Copilot is available with Max 20 plan
      const config = createConfig({ hasCopilot: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })

    test("uses ZAI model for librarian when only ZAI is available", () => {
      // #given only ZAI is available
      const config = createConfig({ hasZaiCodingPlan: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use ZAI_MODEL for librarian
      expect(result).toMatchSnapshot()
    })

    test("uses ZAI model for librarian with isMax20 flag", () => {
      // #given ZAI is available with Max 20 plan
      const config = createConfig({ hasZaiCodingPlan: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use ZAI_MODEL for librarian
      expect(result).toMatchSnapshot()
    })
  })

  describe("mixed provider scenarios", () => {
    test("uses Claude + OpenCode Zen combination", () => {
      // #given Claude and OpenCode Zen are available
      const config = createConfig({
        hasClaude: true,
        hasOpencodeZen: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer Claude (native) over OpenCode Zen
      expect(result).toMatchSnapshot()
    })

    test("uses OpenAI + Copilot combination", () => {
      // #given OpenAI and Copilot are available
      const config = createConfig({
        hasOpenAI: true,
        hasCopilot: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer OpenAI (native) over Copilot
      expect(result).toMatchSnapshot()
    })

    test("uses Claude + ZAI combination (librarian uses ZAI)", () => {
      // #given Claude and ZAI are available
      const config = createConfig({
        hasClaude: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then librarian should use ZAI, others use Claude
      expect(result).toMatchSnapshot()
    })

    test("uses Gemini + Claude combination (explore uses Gemini)", () => {
      // #given Gemini and Claude are available
      const config = createConfig({
        hasGemini: true,
        hasClaude: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then explore should use Gemini flash
      expect(result).toMatchSnapshot()
    })

    test("uses all fallback providers together", () => {
      // #given all fallback providers are available
      const config = createConfig({
        hasOpencodeZen: true,
        hasCopilot: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer OpenCode Zen, but librarian uses ZAI
      expect(result).toMatchSnapshot()
    })

    test("uses all providers together", () => {
      // #given all providers are available
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
        hasOpencodeZen: true,
        hasCopilot: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer native providers, librarian uses ZAI
      expect(result).toMatchSnapshot()
    })

    test("uses all providers with isMax20 flag", () => {
      // #given all providers are available with Max 20 plan
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
        hasOpencodeZen: true,
        hasCopilot: true,
        hasZaiCodingPlan: true,
        isMax20: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })
  })

  describe("explore agent special cases", () => {
    test("explore uses gpt-5-nano when only Gemini available (no Claude)", () => {
      // #given only Gemini is available (no Claude)
      const config = createConfig({ hasGemini: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then explore should use gpt-5-nano (Claude haiku not available)
      expect(result.agents?.explore?.model).toBe("opencode/gpt-5-nano")
    })

    // NOTE: After the 2026-04-17 API-key provider purge, "only Claude" / "only
    // OpenAI" routing to anthropic/openai no longer exists. Those tests were
    // deleted because the branches were removed from the source.

    test("explore uses gpt-5-mini when only Copilot available", () => {
      // #given only Copilot is available
      const config = createConfig({ hasCopilot: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then explore should use gpt-5-mini (Copilot fallback)
      expect(result.agents?.explore?.model).toBe("github-copilot/gpt-5-mini")
    })
  })

  describe("Sisyphus agent special cases", () => {
    test("Sisyphus is omitted when only subscription providers are available (Copilot)", () => {
      // #given Copilot is available
      const config = createConfig({ hasCopilot: true, isMax20: true })

      // #when
      const result = generateModelConfig(config)

      // #then — sisyphus now relies on /model or system default
      expect(result.agents?.sisyphus).toBeUndefined()
    })

    test("Sisyphus is omitted when multiple subscription providers are available", () => {
      // #given
      const config = createConfig({
        hasCopilot: true,
        hasKimiForCoding: true,
        hasOpencodeZen: true,
        hasZaiCodingPlan: true,
        isMax20: true,
      })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.sisyphus).toBeUndefined()
    })
  })

  // NOTE: The "OpenAI-only" fallback coverage tests were removed. After the
  // 2026-04-17 subscription-only purge, the openai provider is denied; native
  // OpenAI routing for Atlas/Metis/Sisyphus-Junior/Hephaestus no longer exists.

  describe("Hephaestus agent special cases", () => {
    test("Hephaestus falls back to Copilot GPT-5.4 when only Copilot is available", () => {
      // #given
      const config = createConfig({ hasCopilot: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.hephaestus).toEqual({
        model: "github-copilot/gpt-5.4",
        variant: "medium",
      })
    })

    test("Hephaestus is created when OpenCode Zen is available (opencode provider connected)", () => {
      // #given
      const config = createConfig({ hasOpencodeZen: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.hephaestus?.model).toBe("opencode/gpt-5.4")
      expect(result.agents?.hephaestus?.variant).toBe("medium")
    })

    test("Hephaestus is omitted when only Claude is available (no required provider connected)", () => {
      // #given
      const config = createConfig({ hasClaude: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.hephaestus).toBeUndefined()
    })

    test("Hephaestus is omitted when only Gemini is available (no required provider connected)", () => {
      // #given
      const config = createConfig({ hasGemini: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.hephaestus).toBeUndefined()
    })

    test("Hephaestus is omitted when only ZAI is available (no required provider connected)", () => {
      // #given
      const config = createConfig({ hasZaiCodingPlan: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.hephaestus).toBeUndefined()
    })
  })

  describe("librarian agent special cases", () => {
    test("librarian uses ZAI model when ZAI is available regardless of other providers", () => {
      // #given ZAI and Claude are available
      const config = createConfig({
        hasClaude: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then librarian should use ZAI_MODEL
      expect(result.agents?.librarian?.model).toBe("zai-coding-plan/glm-4.7")
    })

    test("librarian is omitted when no librarian provider matches", () => {
      // #given only Claude is available (no opencode-go or ZAI)
      const config = createConfig({ hasClaude: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then librarian should be omitted when its dedicated providers are unavailable
      expect(result.agents?.librarian).toBeUndefined()
    })
  })

  describe("special-case agents include fallback_models", () => {
    test("explore includes fallback_models when Copilot and OpenCode Zen are both available", () => {
      // #given both Copilot and OpenCode Zen are available (post-migration subscription routing)
      const config = createConfig({ hasCopilot: true, hasOpencodeZen: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then explore should have fallback_models from the remaining chain entries
      expect(result.agents?.explore?.model).toBe("opencode/claude-haiku-4-5")
      expect(result.agents?.explore?.fallback_models).toBeDefined()
      expect(result.agents?.explore?.fallback_models?.length).toBeGreaterThan(0)
    })

    test("librarian includes fallback_models when opencode-go and opencode are both available", () => {
      // #given opencode-go and opencode are available (post-migration subscription routing)
      const config = createConfig({ hasOpencodeGo: true, hasOpencodeZen: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then librarian should have fallback_models
      expect(result.agents?.librarian?.model).toBe("opencode-go/minimax-m2.7")
      expect(result.agents?.librarian?.fallback_models).toBeDefined()
      expect(result.agents?.librarian?.fallback_models?.length).toBeGreaterThan(0)
    })

    test("librarian omits fallback_models when only one provider matches", () => {
      // #given only opencode-go is available
      const config = createConfig({ hasOpencodeGo: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then librarian should not have fallback_models
      expect(result.agents?.librarian?.model).toBe("opencode-go/minimax-m2.7")
      expect(result.agents?.librarian?.fallback_models).toBeUndefined()
    })
  })

  // NOTE: The entire Vercel AI Gateway describe block was deleted. Vercel is
  // a denied (API-key) provider after the 2026-04-17 purge; the branch no
  // longer exists in the source.

  describe("schema URL", () => {
    test("always includes correct schema URL", () => {
      // #given any config
      const config = createConfig()

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should include correct schema URL
      expect(result.$schema).toBe(
        "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json"
      )
    })
  })
})
