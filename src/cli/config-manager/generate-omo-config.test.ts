/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"

import { generateOmoConfig } from "../config-manager"
import type { InstallConfig } from "../types"

describe("generateOmoConfig - model fallback system", () => {
  test("uses github-copilot sonnet fallback when only copilot available", () => {
    //#given
    const config: InstallConfig = {
      hasClaude: false,
      isMax20: false,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: true,
      hasOpencodeZen: false,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
      hasOpencodeGo: false,
      hasVercelAiGateway: false,
    }

    //#when
    const result = generateOmoConfig(config)

    //#then
    expect([
      "github-copilot/claude-opus-4.6",
      "github-copilot/claude-opus-4-6",
    ]).toContain((result.agents as Record<string, { model: string }>).sisyphus.model)
  })

  test("uses ultimate fallback when no providers configured", () => {
    //#given
    const config: InstallConfig = {
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
    }

    //#when
    const result = generateOmoConfig(config)

    //#then
    expect(result.$schema).toBe("https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json")
    expect((result.agents as Record<string, { model: string }>).sisyphus).toBeUndefined()
  })

  test("uses ZAI model for librarian when Z.ai is available", () => {
    //#given — anthropic is denied after 2026-04-17, so sisyphus routes via opencode subscription for claude-opus
    const config: InstallConfig = {
      hasClaude: false,
      isMax20: true,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: true,
      hasOpencodeZen: false,
      hasZaiCodingPlan: true,
      hasKimiForCoding: false,
      hasOpencodeGo: false,
      hasVercelAiGateway: false,
    }

    //#when
    const result = generateOmoConfig(config)

    //#then — librarian prefers zai when both zai + copilot are available,
    // sisyphus first entry resolves via github-copilot subscription
    expect((result.agents as Record<string, { model: string }>).librarian.model).toBe("zai-coding-plan/glm-4.7")
    expect((result.agents as Record<string, { model: string }>).sisyphus.model).toBe("github-copilot/claude-opus-4.6")
  })

  test("adds fallback_models when multiple subscription providers are available", () => {
    //#given — Copilot + OpenCode Zen subscriptions
    const config: InstallConfig = {
      hasClaude: false,
      isMax20: false,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: true,
      hasOpencodeZen: true,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
      hasOpencodeGo: false,
      hasVercelAiGateway: false,
    }

    //#when
    const result = generateOmoConfig(config)
    const agents = result.agents as Record<string, {
      model: string
      variant?: string
      fallback_models?: Array<{ model: string; variant?: string }>
    }>

    //#then — sisyphus first entry routes via github-copilot and has fallback entries
    expect(agents.sisyphus.model).toBe("github-copilot/claude-opus-4.6")
    expect(Array.isArray(agents.sisyphus.fallback_models)).toBe(true)
    expect((agents.sisyphus.fallback_models ?? []).length).toBeGreaterThan(0)
  })

  test("uses opencode haiku for explore when OpenCode Zen is available", () => {
    //#given
    const config: InstallConfig = {
      hasClaude: false,
      isMax20: false,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: true,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
      hasOpencodeGo: false,
      hasVercelAiGateway: false,
    }

    //#when
    const result = generateOmoConfig(config)

    //#then
    expect((result.agents as Record<string, { model: string }>).explore.model).toBe("opencode/claude-haiku-4-5")
  })
})
