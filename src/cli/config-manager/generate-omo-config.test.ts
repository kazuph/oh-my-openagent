/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test"

import { generateOmoConfig } from "../config-manager"
import type { InstallConfig } from "../types"

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

describe("generateOmoConfig", () => {
  test("returns only the schema URL without preconfigured model fallbacks", () => {
    expect(generateOmoConfig(createConfig())).toEqual({
      $schema:
        "https://raw.githubusercontent.com/code-yeongyu/oh-my-openagent/dev/assets/oh-my-opencode.schema.json",
    })

    expect(
      generateOmoConfig(
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
