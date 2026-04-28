import { describe, test, expect } from "bun:test"
import { ATLAS_SYSTEM_PROMPT } from "./default"

describe("Atlas prompt auto-continue policy", () => {
  test("forbids asking the user for continuation confirmation", () => {
    // when
    const lowerPrompt = ATLAS_SYSTEM_PROMPT.toLowerCase()

    // then
    expect(lowerPrompt).toContain("auto-continue policy")
    expect(lowerPrompt).toContain("never ask the user")
    expect(lowerPrompt).toContain("should i continue")
    expect(lowerPrompt).toContain("auto-continue immediately")
  })

  test("defines when user interaction is actually needed", () => {
    // when
    const lowerPrompt = ATLAS_SYSTEM_PROMPT.toLowerCase()

    // then
    expect(lowerPrompt).toMatch(/only pause.*truly blocked/)
    expect(lowerPrompt).toMatch(/plan needs clarification|blocked by external/)
  })
})

describe("Atlas prompt anti-duplication coverage", () => {
  test("includes anti-duplication rules for delegated exploration", () => {
    expect(ATLAS_SYSTEM_PROMPT).toContain("<Anti_Duplication>")
    expect(ATLAS_SYSTEM_PROMPT).toContain("Anti-Duplication Rule")
    expect(ATLAS_SYSTEM_PROMPT).toContain("DO NOT perform the same search yourself")
    expect(ATLAS_SYSTEM_PROMPT).toContain("non-overlapping work")
  })
})

describe("Atlas prompt plan path consistency", () => {
  test("uses .sisyphus/plans/{plan-name}.md path", () => {
    expect(ATLAS_SYSTEM_PROMPT).toContain(".sisyphus/plans/{plan-name}.md")
    expect(ATLAS_SYSTEM_PROMPT).not.toContain(".sisyphus/tasks/")
  })

  test("reads the plan file after verification and distinguishes top-level checkboxes", () => {
    const lowerPrompt = ATLAS_SYSTEM_PROMPT.toLowerCase()

    expect(ATLAS_SYSTEM_PROMPT).toMatch(/read[\s\S]*?\.sisyphus\/plans\//)
    expect(lowerPrompt).toMatch(/top-level.*checkbox/)
    expect(lowerPrompt).toMatch(/ignore nested.*checkbox/)
    expect(lowerPrompt).toMatch(/final verification wave/)
  })
})
