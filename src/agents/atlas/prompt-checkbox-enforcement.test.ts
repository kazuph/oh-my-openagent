import { describe, test, expect } from "bun:test"
import { ATLAS_SYSTEM_PROMPT } from "./default"

describe("ATLAS prompt checkbox enforcement", () => {
  test("does not mark the plan as read only", () => {
    expect(ATLAS_SYSTEM_PROMPT).not.toMatch(/\(READ ONLY\)/)
  })

  test("allows editing .sisyphus/plans/*.md checkboxes", () => {
    const lowerPrompt = ATLAS_SYSTEM_PROMPT.toLowerCase()

    expect(lowerPrompt).toMatch(/edit.*checkbox|checkbox.*edit/)
    expect(lowerPrompt).toMatch(/\.sisyphus\/plans\/\*\.md/)
    expect(lowerPrompt).toMatch(/checkbox/)
  })

  test("includes post-delegation guardrails", () => {
    const lowerPrompt = ATLAS_SYSTEM_PROMPT.toLowerCase()

    expect(lowerPrompt).toMatch(/post-delegation/)
    expect(lowerPrompt).toMatch(/must not.*call.*new.*task/)
    expect(ATLAS_SYSTEM_PROMPT).not.toMatch(/\.sisyphus\/tasks\//)
  })
})
