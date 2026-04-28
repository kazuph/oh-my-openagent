import { describe, expect, test } from "bun:test"
import { createHephaestusAgent, getHephaestusPrompt } from "./index"
import { maybeCreateHephaestusConfig } from "../builtin-agents/hephaestus-agent"
import type { AgentOverrides } from "../types"
import type { CategoryConfig } from "../../config/schema"

describe("getHephaestusPrompt", () => {
  test("uses one default prompt path across model strings", () => {
    // given
    const gptPrompt = getHephaestusPrompt("openai/gpt-5.4")
    const claudePrompt = getHephaestusPrompt("anthropic/claude-opus-4-6")

    // then
    expect(gptPrompt).toBe(claudePrompt)
    expect(gptPrompt).toContain("Hephaestus")
    expect(gptPrompt).toContain("<tool_usage_rules>")
    expect(gptPrompt).toContain('load_skills=["librarian"]')
  })

  test("switches between todo and task discipline only via useTaskSystem", () => {
    // given
    const todoPrompt = getHephaestusPrompt(undefined, false)
    const taskPrompt = getHephaestusPrompt(undefined, true)

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
    const config = createHephaestusAgent("openai/gpt-5.4")

    // then
    expect(config).toHaveProperty("description")
    expect(config).toHaveProperty("mode", "primary")
    expect(config).toHaveProperty("model", "openai/gpt-5.4")
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
  function createConfig(agentOverrides: AgentOverrides, model: string) {
    const mergedCategories: Record<string, CategoryConfig> = {}

    return maybeCreateHephaestusConfig({
      disabledAgents: [],
      agentOverrides,
      availableModels: new Set([model]),
      systemDefaultModel: model,
      isFirstRunNoCache: false,
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
          model: "openai/gpt-5.4",
          permission: { apply_patch: "allow" },
        },
      },
      "openai/gpt-5.4",
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
          model: "anthropic/claude-opus-4-6",
          permission: { apply_patch: "allow" },
        },
      },
      "anthropic/claude-opus-4-6",
    )

    // then
    expect(config).toBeDefined()
    expect(config?.permission).toHaveProperty("apply_patch", "allow")
  })
})
