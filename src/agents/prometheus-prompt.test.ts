import { describe, test, expect } from "bun:test"
import { PROMETHEUS_SYSTEM_PROMPT } from "./prometheus"

describe("PROMETHEUS_SYSTEM_PROMPT Momus invocation policy", () => {
  test("directs providing only the file path string when invoking Momus", () => {
    expect(PROMETHEUS_SYSTEM_PROMPT.toLowerCase()).toMatch(/momus.*only.*path|path.*only.*momus/)
  })

  test("forbids wrapping Momus invocation in explanations or markdown", () => {
    expect(PROMETHEUS_SYSTEM_PROMPT.toLowerCase()).toMatch(/not.*wrap|no.*explanation|no.*markdown/)
  })
})

describe("PROMETHEUS_SYSTEM_PROMPT zero human intervention", () => {
  test("enforces universal zero human intervention rule", () => {
    const lowerPrompt = PROMETHEUS_SYSTEM_PROMPT.toLowerCase()

    expect(lowerPrompt).toContain("zero human intervention")
    expect(lowerPrompt).toContain("forbidden")
    expect(lowerPrompt).toMatch(/user manually tests|사용자가 직접 테스트/)
  })

  test("requires agent-executed QA scenarios for all tasks", () => {
    const lowerPrompt = PROMETHEUS_SYSTEM_PROMPT.toLowerCase()

    expect(lowerPrompt).toContain("agent-executed qa scenarios")
    expect(lowerPrompt).toMatch(/mandatory.*all tasks|all tasks.*mandatory/)
    expect(lowerPrompt).toContain("preconditions")
    expect(lowerPrompt).toContain("failure indicators")
    expect(lowerPrompt).toContain("evidence")
    expect(PROMETHEUS_SYSTEM_PROMPT).toMatch(/negative/i)
  })

  test("does not contain ambiguous manual QA terminology", () => {
    expect(PROMETHEUS_SYSTEM_PROMPT).not.toMatch(/manual QA procedures/i)
    expect(PROMETHEUS_SYSTEM_PROMPT).not.toMatch(/manual verification procedures/i)
    expect(PROMETHEUS_SYSTEM_PROMPT).not.toMatch(/Manual-only/i)
  })

  test("requires QA scenario adequacy in the self-review checklist", () => {
    const lowerPrompt = PROMETHEUS_SYSTEM_PROMPT.toLowerCase()

    expect(lowerPrompt).toMatch(/every task has agent-executed qa scenarios/)
    expect(lowerPrompt).toMatch(/happy-path and negative/)
    expect(lowerPrompt).toMatch(/zero acceptance criteria require human/)
  })
})

describe("Prometheus prompt anti-duplication coverage", () => {
  test("includes anti-duplication rules for delegated exploration", () => {
    expect(PROMETHEUS_SYSTEM_PROMPT).toContain("<Anti_Duplication>")
    expect(PROMETHEUS_SYSTEM_PROMPT).toContain("Anti-Duplication Rule")
    expect(PROMETHEUS_SYSTEM_PROMPT).toContain("DO NOT perform the same search yourself")
    expect(PROMETHEUS_SYSTEM_PROMPT).toContain("non-overlapping work")
  })
})
