import { describe, expect, test } from "bun:test"
import {
  buildSisyphusJuniorPrompt,
  createSisyphusJuniorAgentWithOverrides,
  SISYPHUS_JUNIOR_DEFAULTS,
} from "./index"

describe("createSisyphusJuniorAgentWithOverrides", () => {
  test("applies simple overrides while preserving the base prompt", () => {
    // when
    const result = createSisyphusJuniorAgentWithOverrides({
      model: "openai/gpt-5.4",
      temperature: 0.5,
      top_p: 0.9,
      description: "Custom description",
      color: "#FF0000",
      prompt_append: "CUSTOM_MARKER_FOR_TEST",
    })

    // then
    expect(result.temperature).toBe(0.5)
    expect(result.top_p).toBe(0.9)
    expect(result.description).toBe("Custom description")
    expect(result.color).toBe("#FF0000")
    expect(result.prompt).toContain("Sisyphus-Junior")
    expect(result.prompt).toContain("CUSTOM_MARKER_FOR_TEST")
  })

  test("ignores override block when disable=true", () => {
    // when
    const result = createSisyphusJuniorAgentWithOverrides({
      disable: true,
      model: "openai/gpt-5.4",
      temperature: 0.9,
    })

    // then
    expect(result.temperature).toBe(SISYPHUS_JUNIOR_DEFAULTS.temperature)
  })

  test("forces subagent mode and keeps prompt replacement disabled", () => {
    // when
    const result = createSisyphusJuniorAgentWithOverrides({
      mode: "primary" as const,
      prompt: "replace everything",
    })

    // then
    expect(result.mode).toBe("subagent")
    expect(result.prompt).toContain("Sisyphus-Junior")
    expect(result.prompt).not.toBe("replace everything")
  })

  test("blocks task and allows call_omo_agent regardless of override format", () => {
    // when
    const viaTools = createSisyphusJuniorAgentWithOverrides({
      tools: { task: true, call_omo_agent: true, read: true },
    })
    const viaPermission = createSisyphusJuniorAgentWithOverrides({
      permission: { task: "allow", call_omo_agent: "allow", read: "allow" },
    })

    // then
    expect(viaTools.permission).toHaveProperty("task", "deny")
    expect(viaTools.permission).toHaveProperty("call_omo_agent", "allow")
    expect(viaPermission.permission).toHaveProperty("task", "deny")
    expect(viaPermission.permission).toHaveProperty("call_omo_agent", "allow")
  })

  test("does not add model-specific reasoning or apply_patch permissions", () => {
    // when
    const gptResult = createSisyphusJuniorAgentWithOverrides({ model: "openai/gpt-5.4" })
    const claudeResult = createSisyphusJuniorAgentWithOverrides({ model: "anthropic/claude-sonnet-4-6" })

    // then
    expect(gptResult.reasoningEffort).toBeUndefined()
    expect(gptResult.thinking).toBeUndefined()
    expect(gptResult.permission ?? {}).not.toHaveProperty("apply_patch")
    expect(claudeResult.reasoningEffort).toBeUndefined()
    expect(claudeResult.thinking).toBeUndefined()
    expect(claudeResult.permission ?? {}).not.toHaveProperty("apply_patch")
  })

  test("switches between todo and task discipline via useTaskSystem", () => {
    // when
    const todoResult = createSisyphusJuniorAgentWithOverrides({}, false)
    const taskResult = createSisyphusJuniorAgentWithOverrides({}, true)

    // then
    expect(todoResult.prompt).toContain("todowrite")
    expect(todoResult.prompt).not.toContain("task_create")
    expect(taskResult.prompt).toContain("<Task_Discipline>")
    expect(taskResult.prompt).toContain("task_create")
    expect(taskResult.prompt).toContain("task_update")
  })
})

describe("buildSisyphusJuniorPrompt", () => {
  test("uses a single default prompt path across model strings", () => {
    // when
    const gptPrompt = buildSisyphusJuniorPrompt(false)
    const claudePrompt = buildSisyphusJuniorPrompt(false)

    // then
    expect(gptPrompt).toBe(claudePrompt)
    expect(gptPrompt).toContain("Sisyphus-Junior")
    expect(gptPrompt).toContain("<Anti_Duplication>")
  })
})
