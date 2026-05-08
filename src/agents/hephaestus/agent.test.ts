import { describe, expect, test } from "bun:test"
import { createHephaestusAgent, getHephaestusPrompt } from "./index"
import { maybeCreateHephaestusConfig } from "../builtin-agents/hephaestus-agent"
import type { AgentOverrides } from "../types"
import type { CategoryConfig } from "../../config/schema"

describe("getHephaestusPrompt", () => {
  test("uses one default prompt path across model strings", () => {
    // given
    const gptPrompt = getHephaestusPrompt()
    const claudePrompt = getHephaestusPrompt()

    // then
    expect(gptPrompt).toBe(claudePrompt)
    expect(gptPrompt).toContain("Hephaestus")
    expect(gptPrompt).toContain("<tool_usage_rules>")
    expect(gptPrompt).toContain('load_skills=["librarian"]')
  })

  test("switches between todo and task discipline only via useTaskSystem", () => {
    // given
    const todoPrompt = getHephaestusPrompt(false)
    const taskPrompt = getHephaestusPrompt(true)

    // then
    expect(todoPrompt).toContain("Todo Discipline")
    expect(todoPrompt).toContain("todowrite")
    expect(todoPrompt).not.toContain("task_create")

    expect(taskPrompt).toContain("Task Discipline")
    expect(taskPrompt).toContain("task_create")
    expect(taskPrompt).toContain("task_update")
    expect(taskPrompt).not.toContain("todowrite")
  })
})

describe("createHephaestusAgent", () => {
  test("returns the expected base config without model-specific apply_patch restrictions", () => {
    // when
    const config = createHephaestusAgent()

    // then
    expect(config).toHaveProperty("description")
    expect(config).toHaveProperty("mode", "primary")
    expect(config).toHaveProperty("maxTokens", 32000)
    expect(config).toHaveProperty("prompt")
    expect(config).toHaveProperty("color", "#D97706")
    expect(config.permission).toEqual({
      question: "allow",
      call_omo_agent: "deny",
    })
    expect(config.permission ?? {}).not.toHaveProperty("apply_patch")
  })
})

describe("maybeCreateHephaestusConfig", () => {
  function createConfig(agentOverrides: AgentOverrides) {
    const mergedCategories: Record<string, CategoryConfig> = {}

    return maybeCreateHephaestusConfig({
      disabledAgents: [],
      agentOverrides,
      availableAgents: [],
      availableSkills: [],
      availableCategories: [],
      mergedCategories,
      useTaskSystem: false,
    })
  }

  test("preserves user apply_patch permission for GPT models", () => {
    // when
    const config = createConfig(
      {
        hephaestus: {
          permission: { apply_patch: "allow" },
        },
      },
    )

    // then
    expect(config).toBeDefined()
    expect(config?.permission).toHaveProperty("apply_patch", "allow")
  })

  test("preserves user apply_patch permission for non-GPT models", () => {
    // when
    const config = createConfig(
      {
        hephaestus: {
          permission: { apply_patch: "allow" },
        },
      },
    )

    // then
    expect(config).toBeDefined()
    expect(config?.permission).toHaveProperty("apply_patch", "allow")
  })
})
