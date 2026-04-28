import { describe, expect, test } from "bun:test"
import {
  AGENT_MODEL_REQUIREMENTS,
  CATEGORY_MODEL_REQUIREMENTS,
} from "./model-requirements"

describe("AGENT_MODEL_REQUIREMENTS", () => {
  test("keeps fallback chains empty for all built-in agents", () => {
    const expectedAgents = [
      "sisyphus",
      "hephaestus",
      "oracle",
      "explore",
      "multimodal-looker",
      "prometheus",
      "metis",
      "momus",
      "atlas",
      "sisyphus-junior",
    ]

    expect(Object.keys(AGENT_MODEL_REQUIREMENTS)).toEqual(expectedAgents)

    for (const agent of expectedAgents) {
      expect(AGENT_MODEL_REQUIREMENTS[agent]).toBeDefined()
      expect(AGENT_MODEL_REQUIREMENTS[agent]?.fallbackChain).toEqual([])
    }
  })

  test("does not define librarian as a built-in agent requirement", () => {
    expect(AGENT_MODEL_REQUIREMENTS["librarian"]).toBeUndefined()
  })
})

describe("CATEGORY_MODEL_REQUIREMENTS", () => {
  test("keeps fallback chains empty for all built-in categories", () => {
    const expectedCategories = [
      "visual-engineering",
      "ultrabrain",
      "deep",
      "artistry",
      "quick",
      "unspecified-low",
      "unspecified-high",
      "writing",
    ]

    expect(Object.keys(CATEGORY_MODEL_REQUIREMENTS)).toEqual(expectedCategories)

    for (const category of expectedCategories) {
      expect(CATEGORY_MODEL_REQUIREMENTS[category]).toBeDefined()
      expect(CATEGORY_MODEL_REQUIREMENTS[category]?.fallbackChain).toEqual([])
    }
  })
})
