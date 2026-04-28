import { describe, expect, test } from "bun:test"
import { generateModelConfig, shouldShowChatGPTOnlyWarning } from "./model-fallback"

function createConfig(overrides: Record<string, boolean> = {}) {
  return {
    hasClaude: false,
    hasOpenAI: false,
    hasGemini: false,
    hasCopilot: false,
    hasOpencodeZen: false,
    hasZaiCodingPlan: false,
    hasKimiForCoding: false,
    hasOpencodeGo: false,
    hasVercelAiGateway: false,
    isMax20: false,
    ...overrides,
  }
}

describe("generateModelConfig", () => {
  test("returns only the schema URL regardless of provider availability", () => {
    expect(generateModelConfig(createConfig())).toEqual({
      $schema:
        "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json",
    })

    expect(
      generateModelConfig(
        createConfig({
          hasClaude: true,
          hasOpenAI: true,
          hasGemini: true,
          hasCopilot: true,
          hasOpencodeZen: true,
          hasZaiCodingPlan: true,
          hasKimiForCoding: true,
          hasOpencodeGo: true,
          hasVercelAiGateway: true,
          isMax20: true,
        }),
      ),
    ).toEqual({
      $schema:
        "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json",
    })
  })
})

describe("shouldShowChatGPTOnlyWarning", () => {
  test("is always disabled once automatic model fallback is removed", () => {
    expect(shouldShowChatGPTOnlyWarning(createConfig({ hasOpenAI: true }))).toBe(false)
    expect(shouldShowChatGPTOnlyWarning(createConfig({ hasClaude: true, hasOpenAI: true }))).toBe(false)
  })
})
