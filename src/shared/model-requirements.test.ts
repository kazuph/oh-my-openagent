import { describe, expect, test } from "bun:test"
import {
  AGENT_MODEL_REQUIREMENTS,
  CATEGORY_MODEL_REQUIREMENTS,
  type FallbackEntry,
  type ModelRequirement,
} from "./model-requirements"
import { DENIED_PROVIDERS } from "../features/provider-allowlist"

describe("AGENT_MODEL_REQUIREMENTS", () => {
  test("oracle has valid fallbackChain with gpt-5.4 as primary", () => {
    const oracle = AGENT_MODEL_REQUIREMENTS["oracle"]

    expect(oracle).toBeDefined()
    expect(oracle.fallbackChain).toBeArray()
    expect(oracle.fallbackChain.length).toBeGreaterThan(0)

    const primary = oracle.fallbackChain[0]
    expect(primary.providers).toContain("github-copilot")
    expect(primary.model).toBe("gpt-5.4")
    expect(primary.variant).toBe("high")
  })

  test("sisyphus no longer hardcodes a fallback chain", () => {
    const sisyphus = AGENT_MODEL_REQUIREMENTS["sisyphus"]

    expect(sisyphus).toBeDefined()
    expect(sisyphus.fallbackChain).toBeArray()
    expect(sisyphus.fallbackChain).toHaveLength(0)
    expect(sisyphus.requiresAnyModel).toBe(false)
  })

  test("librarian has valid fallbackChain with opencode-go/minimax-m2.7 as primary", () => {
    const librarian = AGENT_MODEL_REQUIREMENTS["librarian"]

    expect(librarian).toBeDefined()
    expect(librarian.fallbackChain).toBeArray()
    expect(librarian.fallbackChain.length).toBeGreaterThan(0)

    const primary = librarian.fallbackChain[0]
    expect(primary.providers[0]).toBe("opencode-go")
    expect(primary.model).toBe("minimax-m2.7")

    const second = librarian.fallbackChain[1]
    expect(second.providers[0]).toBe("opencode")
    expect(second.model).toBe("minimax-m2.7-highspeed")

    const tertiary = librarian.fallbackChain[2]
    expect(tertiary.providers[0]).toBe("opencode")
    expect(tertiary.model).toBe("claude-haiku-4-5")

    const quaternary = librarian.fallbackChain[3]
    expect(quaternary.model).toBe("gpt-5-nano")
  })

  test("explore has valid fallbackChain with grok-code-fast-1 as primary", () => {
    const explore = AGENT_MODEL_REQUIREMENTS["explore"]

    expect(explore).toBeDefined()
    expect(explore.fallbackChain).toBeArray()
    expect(explore.fallbackChain).toHaveLength(5)

    const primary = explore.fallbackChain[0]
    expect(primary.providers).toContain("github-copilot")
    expect(primary.model).toBe("grok-code-fast-1")

    const secondary = explore.fallbackChain[1]
    expect(secondary.providers).toContain("opencode-go")
    expect(secondary.model).toBe("minimax-m2.7-highspeed")

    const tertiary = explore.fallbackChain[2]
    expect(tertiary.providers).toContain("opencode")
    expect(tertiary.model).toBe("minimax-m2.7")

    const quaternary = explore.fallbackChain[3]
    expect(quaternary.providers).toContain("opencode")
    expect(quaternary.model).toBe("claude-haiku-4-5")

    const fifth = explore.fallbackChain[4]
    expect(fifth.providers).toContain("opencode")
    expect(fifth.model).toBe("gpt-5-nano")
  })

  test("multimodal-looker has valid fallbackChain with gpt-5.4 as primary", () => {
    const multimodalLooker = AGENT_MODEL_REQUIREMENTS["multimodal-looker"]

    expect(multimodalLooker).toBeDefined()
    expect(multimodalLooker.fallbackChain).toBeArray()
    expect(multimodalLooker.fallbackChain).toHaveLength(4)

    const primary = multimodalLooker.fallbackChain[0]
    expect(primary.providers).toEqual(["opencode"])
    expect(primary.model).toBe("gpt-5.4")
    expect(primary.variant).toBe("medium")

    const secondary = multimodalLooker.fallbackChain[1]
    expect(secondary.providers).toEqual(["opencode-go"])
    expect(secondary.model).toBe("kimi-k2.5")

    const tertiary = multimodalLooker.fallbackChain[2]
    expect(tertiary.model).toBe("glm-4.6v")

    const last = multimodalLooker.fallbackChain[3]
    expect(last.providers).toEqual(["github-copilot", "opencode"])
    expect(last.model).toBe("gpt-5-nano")
  })

  test("prometheus has claude-opus-4-6 as primary", () => {
    const prometheus = AGENT_MODEL_REQUIREMENTS["prometheus"]

    expect(prometheus).toBeDefined()
    expect(prometheus.fallbackChain).toBeArray()
    expect(prometheus.fallbackChain.length).toBeGreaterThan(1)

    const primary = prometheus.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-6")
    expect(primary.providers).toEqual(["github-copilot", "opencode"])
    expect(primary.variant).toBe("max")
  })

  test("metis has claude-opus-4-6 as primary", () => {
    const metis = AGENT_MODEL_REQUIREMENTS["metis"]

    expect(metis).toBeDefined()
    expect(metis.fallbackChain).toBeArray()
    expect(metis.fallbackChain.length).toBeGreaterThan(1)

    const primary = metis.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-6")
    expect(primary.providers).toEqual(["github-copilot", "opencode"])
    expect(primary.variant).toBe("max")

    const gptFallback = metis.fallbackChain.find((entry) => entry.model === "gpt-5.4")
    expect(gptFallback).toEqual({
      providers: ["github-copilot", "opencode"],
      model: "gpt-5.4",
      variant: "high",
    })
  })

  test("momus has valid fallbackChain with gpt-5.4 as primary", () => {
    const momus = AGENT_MODEL_REQUIREMENTS["momus"]

    expect(momus).toBeDefined()
    expect(momus.fallbackChain).toBeArray()
    expect(momus.fallbackChain.length).toBeGreaterThan(0)

    const primary = momus.fallbackChain[0]
    expect(primary.model).toBe("gpt-5.4")
    expect(primary.variant).toBe("xhigh")
    expect(primary.providers[0]).toBe("github-copilot")
  })

  test("atlas has valid fallbackChain with claude-sonnet-4-6 as primary", () => {
    const atlas = AGENT_MODEL_REQUIREMENTS["atlas"]

    expect(atlas).toBeDefined()
    expect(atlas.fallbackChain).toBeArray()
    expect(atlas.fallbackChain).toHaveLength(4)

    const primary = atlas.fallbackChain[0]
    expect(primary.model).toBe("claude-sonnet-4-6")
    expect(primary.providers[0]).toBe("github-copilot")

    const secondary = atlas.fallbackChain[1]
    expect(secondary.model).toBe("kimi-k2.5")
    expect(secondary.providers[0]).toBe("opencode-go")

    const tertiary = atlas.fallbackChain[2]
    expect(tertiary).toEqual({
      providers: ["github-copilot", "opencode"],
      model: "gpt-5.4",
      variant: "medium",
    })

    const quaternary = atlas.fallbackChain[3]
    expect(quaternary.model).toBe("minimax-m2.7")
    expect(quaternary.providers[0]).toBe("opencode-go")
  })

  test("sisyphus-junior has a gpt-5.4 fallback and minimax before big-pickle", () => {
    const sisyphusJunior = AGENT_MODEL_REQUIREMENTS["sisyphus-junior"]

    const gptFallback = sisyphusJunior.fallbackChain.find((entry) => entry.model === "gpt-5.4")
    const gptFallbackIndex = sisyphusJunior.fallbackChain.findIndex((entry) => entry.model === "gpt-5.4")
    const minimaxIndex = sisyphusJunior.fallbackChain.findIndex((entry) => entry.model === "minimax-m2.7")
    const bigPickleIndex = sisyphusJunior.fallbackChain.findIndex((entry) => entry.model === "big-pickle")

    expect(gptFallback).toEqual({
      providers: ["github-copilot", "opencode"],
      model: "gpt-5.4",
      variant: "medium",
    })
    expect(gptFallbackIndex).toBeGreaterThan(-1)
    expect(minimaxIndex).toBeGreaterThan(gptFallbackIndex)
    expect(bigPickleIndex).toBeGreaterThan(minimaxIndex)
  })

  test("hephaestus supports github-copilot and opencode subscription providers", () => {
    const hephaestus = AGENT_MODEL_REQUIREMENTS["hephaestus"]

    expect(hephaestus).toBeDefined()
    expect(hephaestus.requiresProvider).toEqual(["github-copilot", "opencode"])
    expect(hephaestus.requiresModel).toBeUndefined()
  })

  test("all 11 builtin agents have valid fallbackChain arrays", () => {
    const expectedAgents = [
      "sisyphus",
      "hephaestus",
      "oracle",
      "librarian",
      "explore",
      "multimodal-looker",
      "prometheus",
      "metis",
      "momus",
      "atlas",
      "sisyphus-junior",
    ]

    const definedAgents = Object.keys(AGENT_MODEL_REQUIREMENTS)

    expect(definedAgents).toHaveLength(11)
    for (const agent of expectedAgents) {
      const requirement = AGENT_MODEL_REQUIREMENTS[agent]
      expect(requirement).toBeDefined()
      expect(requirement.fallbackChain).toBeArray()
      if (agent === "sisyphus") {
        expect(requirement.fallbackChain).toHaveLength(0)
        continue
      }
      expect(requirement.fallbackChain.length).toBeGreaterThan(0)

      for (const entry of requirement.fallbackChain) {
        expect(entry.providers).toBeArray()
        expect(entry.providers.length).toBeGreaterThan(0)
        expect(typeof entry.model).toBe("string")
        expect(entry.model.length).toBeGreaterThan(0)
      }
    }
  })
})

describe("CATEGORY_MODEL_REQUIREMENTS", () => {
  test("ultrabrain has valid fallbackChain with gpt-5.4 as primary", () => {
    const ultrabrain = CATEGORY_MODEL_REQUIREMENTS["ultrabrain"]

    expect(ultrabrain).toBeDefined()
    expect(ultrabrain.fallbackChain).toBeArray()
    expect(ultrabrain.fallbackChain.length).toBeGreaterThan(0)

    const primary = ultrabrain.fallbackChain[0]
    expect(primary.variant).toBe("xhigh")
    expect(primary.model).toBe("gpt-5.4")
    expect(primary.providers[0]).toBe("opencode")
  })

  test("deep has valid fallbackChain with gpt-5.4 as primary", () => {
    const deep = CATEGORY_MODEL_REQUIREMENTS["deep"]

    expect(deep).toBeDefined()
    expect(deep.fallbackChain).toBeArray()
    expect(deep.fallbackChain.length).toBeGreaterThan(0)

    const primary = deep.fallbackChain[0]
    expect(primary.variant).toBe("medium")
    expect(primary.model).toBe("gpt-5.4")
    expect(primary.providers).toContain("github-copilot")
    expect(primary.providers).toContain("opencode")
  })

  test("visual-engineering has valid fallbackChain with gemini-3.1-pro high as primary", () => {
    const visualEngineering = CATEGORY_MODEL_REQUIREMENTS["visual-engineering"]

    expect(visualEngineering).toBeDefined()
    expect(visualEngineering.fallbackChain).toBeArray()
    expect(visualEngineering.fallbackChain).toHaveLength(5)

    const primary = visualEngineering.fallbackChain[0]
    expect(primary.providers[0]).toBe("github-copilot")
    expect(primary.model).toBe("gemini-3.1-pro")
    expect(primary.variant).toBe("high")

    const second = visualEngineering.fallbackChain[1]
    expect(second.providers[0]).toBe("zai-coding-plan")
    expect(second.model).toBe("glm-5")

    const third = visualEngineering.fallbackChain[2]
    expect(third.model).toBe("claude-opus-4-6")
    expect(third.variant).toBe("max")

    const fourth = visualEngineering.fallbackChain[3]
    expect(fourth.providers[0]).toBe("opencode-go")
    expect(fourth.model).toBe("glm-5")

    const fifth = visualEngineering.fallbackChain[4]
    expect(fifth.providers[0]).toBe("kimi-for-coding")
    expect(fifth.model).toBe("k2p5")
  })

  test("quick has valid fallbackChain with gpt-5.4-mini as primary and claude-haiku-4-5 as secondary", () => {
    const quick = CATEGORY_MODEL_REQUIREMENTS["quick"]

    expect(quick).toBeDefined()
    expect(quick.fallbackChain).toBeArray()
    expect(quick.fallbackChain.length).toBeGreaterThan(1)

    const primary = quick.fallbackChain[0]
    expect(primary.model).toBe("gpt-5.4-mini")
    expect(primary.providers).toContain("github-copilot")

    const secondary = quick.fallbackChain[1]
    expect(secondary.model).toBe("claude-haiku-4-5")
    expect(secondary.providers).toContain("github-copilot")
  })

  test("unspecified-low has valid fallbackChain with claude-sonnet-4-6 as primary", () => {
    const unspecifiedLow = CATEGORY_MODEL_REQUIREMENTS["unspecified-low"]

    expect(unspecifiedLow).toBeDefined()
    expect(unspecifiedLow.fallbackChain).toBeArray()
    expect(unspecifiedLow.fallbackChain.length).toBeGreaterThan(0)

    const primary = unspecifiedLow.fallbackChain[0]
    expect(primary.model).toBe("claude-sonnet-4-6")
    expect(primary.providers[0]).toBe("github-copilot")
  })

  test("unspecified-high has claude-opus-4-6 as primary and gpt-5.4 as secondary", () => {
    const unspecifiedHigh = CATEGORY_MODEL_REQUIREMENTS["unspecified-high"]

    expect(unspecifiedHigh).toBeDefined()
    expect(unspecifiedHigh.fallbackChain).toBeArray()
    expect(unspecifiedHigh.fallbackChain.length).toBeGreaterThan(1)

    const primary = unspecifiedHigh.fallbackChain[0]
    expect(primary.model).toBe("claude-opus-4-6")
    expect(primary.variant).toBe("max")
    expect(primary.providers).toEqual(["github-copilot", "opencode"])

    const secondary = unspecifiedHigh.fallbackChain[1]
    expect(secondary.model).toBe("gpt-5.4")
    expect(secondary.variant).toBe("high")
    expect(secondary.providers).toEqual(["github-copilot", "opencode"])
  })

  test("artistry has valid fallbackChain with gemini-3.1-pro as primary", () => {
    const artistry = CATEGORY_MODEL_REQUIREMENTS["artistry"]

    expect(artistry).toBeDefined()
    expect(artistry.fallbackChain).toBeArray()
    expect(artistry.fallbackChain.length).toBeGreaterThan(0)

    const primary = artistry.fallbackChain[0]
    expect(primary.model).toBe("gemini-3.1-pro")
    expect(primary.variant).toBe("high")
    expect(primary.providers[0]).toBe("github-copilot")
  })

  test("writing has valid fallbackChain with gemini-3-flash as primary", () => {
    const writing = CATEGORY_MODEL_REQUIREMENTS["writing"]

    expect(writing).toBeDefined()
    expect(writing.fallbackChain).toBeArray()
    expect(writing.fallbackChain).toHaveLength(4)

    const primary = writing.fallbackChain[0]
    expect(primary.model).toBe("gemini-3-flash")
    expect(primary.providers[0]).toBe("github-copilot")

    const second = writing.fallbackChain[1]
    expect(second.model).toBe("kimi-k2.5")
    expect(second.providers[0]).toBe("opencode-go")

    const third = writing.fallbackChain[2]
    expect(third.model).toBe("claude-sonnet-4-6")
    expect(third.providers[0]).toBe("github-copilot")

    const fourth = writing.fallbackChain[3]
    expect(fourth.model).toBe("minimax-m2.7")
    expect(fourth.providers[0]).toBe("opencode-go")
  })

  test("all 8 categories have valid fallbackChain arrays", () => {
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

    const definedCategories = Object.keys(CATEGORY_MODEL_REQUIREMENTS)

    expect(definedCategories).toHaveLength(8)
    for (const category of expectedCategories) {
      const requirement = CATEGORY_MODEL_REQUIREMENTS[category]
      expect(requirement).toBeDefined()
      expect(requirement.fallbackChain).toBeArray()
      expect(requirement.fallbackChain.length).toBeGreaterThan(0)

      for (const entry of requirement.fallbackChain) {
        expect(entry.providers).toBeArray()
        expect(entry.providers.length).toBeGreaterThan(0)
        expect(typeof entry.model).toBe("string")
        expect(entry.model.length).toBeGreaterThan(0)
      }
    }
  })
})

describe("FallbackEntry type", () => {
  test("FallbackEntry structure is correct", () => {
    const entry: FallbackEntry = {
      providers: ["github-copilot", "opencode"],
      model: "claude-opus-4-6",
      variant: "high",
    }

    expect(entry.providers).toEqual(["github-copilot", "opencode"])
    expect(entry.model).toBe("claude-opus-4-6")
    expect(entry.variant).toBe("high")
  })

  test("FallbackEntry variant is optional", () => {
    const entry: FallbackEntry = {
      providers: ["opencode"],
      model: "big-pickle",
    }

    expect(entry.variant).toBeUndefined()
  })
})

describe("ModelRequirement type", () => {
  test("ModelRequirement structure with fallbackChain is correct", () => {
    const requirement: ModelRequirement = {
      fallbackChain: [
        { providers: ["github-copilot", "opencode"], model: "claude-opus-4-6", variant: "max" },
        { providers: ["github-copilot", "opencode"], model: "gpt-5.4", variant: "high" },
      ],
    }

    expect(requirement.fallbackChain).toBeArray()
    expect(requirement.fallbackChain).toHaveLength(2)
    expect(requirement.fallbackChain[0].model).toBe("claude-opus-4-6")
    expect(requirement.fallbackChain[1].model).toBe("gpt-5.4")
  })

  test("ModelRequirement variant is optional", () => {
    const requirement: ModelRequirement = {
      fallbackChain: [{ providers: ["opencode"], model: "big-pickle" }],
    }

    expect(requirement.variant).toBeUndefined()
  })

  test("no model in fallbackChain has provider prefix", () => {
    const allRequirements = [
      ...Object.values(AGENT_MODEL_REQUIREMENTS),
      ...Object.values(CATEGORY_MODEL_REQUIREMENTS),
    ]

    for (const req of allRequirements) {
      for (const entry of req.fallbackChain) {
        expect(entry.model).not.toContain("/")
      }
    }
  })

  test("all fallbackChain entries have non-empty providers array", () => {
    const allRequirements = [
      ...Object.values(AGENT_MODEL_REQUIREMENTS),
      ...Object.values(CATEGORY_MODEL_REQUIREMENTS),
    ]

    for (const req of allRequirements) {
      for (const entry of req.fallbackChain) {
        expect(entry.providers).toBeArray()
        expect(entry.providers.length).toBeGreaterThan(0)
      }
    }
  })
})

describe("requiresModel field in categories", () => {
  test("deep category no longer has requiresModel (gpt-5.4 is widely available)", () => {
    const deep = CATEGORY_MODEL_REQUIREMENTS["deep"]
    expect(deep.requiresModel).toBeUndefined()
  })

  test("artistry category has requiresModel set to gemini-3.1-pro", () => {
    const artistry = CATEGORY_MODEL_REQUIREMENTS["artistry"]
    expect(artistry.requiresModel).toBe("gemini-3.1-pro")
  })
})

describe("gpt-5.3-codex provider restrictions", () => {
  test("no gpt-5.3-codex entry in AGENT_MODEL_REQUIREMENTS includes github-copilot as provider", () => {
    const allAgentEntries = Object.values(AGENT_MODEL_REQUIREMENTS).flatMap(
      (req) => req.fallbackChain
    )

    const codexEntries = allAgentEntries.filter((entry) => entry.model === "gpt-5.3-codex")

    for (const entry of codexEntries) {
      expect(entry.providers).not.toContain("github-copilot")
    }
  })

  test("no gpt-5.3-codex entry in CATEGORY_MODEL_REQUIREMENTS includes github-copilot as provider", () => {
    const allCategoryEntries = Object.values(CATEGORY_MODEL_REQUIREMENTS).flatMap(
      (req) => req.fallbackChain
    )

    const codexEntries = allCategoryEntries.filter((entry) => entry.model === "gpt-5.3-codex")

    for (const entry of codexEntries) {
      expect(entry.providers).not.toContain("github-copilot")
    }
  })
})

describe("API-key providers are fully purged", () => {
  test("no agent fallback chain entry contains a denied provider", () => {
    const allAgentEntries = Object.values(AGENT_MODEL_REQUIREMENTS).flatMap(
      (req) => req.fallbackChain,
    )

    for (const entry of allAgentEntries) {
      for (const provider of entry.providers) {
        expect(DENIED_PROVIDERS.has(provider)).toBe(false)
      }
    }
  })

  test("no category fallback chain entry contains a denied provider", () => {
    const allCategoryEntries = Object.values(CATEGORY_MODEL_REQUIREMENTS).flatMap(
      (req) => req.fallbackChain,
    )

    for (const entry of allCategoryEntries) {
      for (const provider of entry.providers) {
        expect(DENIED_PROVIDERS.has(provider)).toBe(false)
      }
    }
  })

  test("no requiresProvider array contains a denied provider", () => {
    for (const req of Object.values(AGENT_MODEL_REQUIREMENTS)) {
      if (!req.requiresProvider) continue
      for (const provider of req.requiresProvider) {
        expect(DENIED_PROVIDERS.has(provider)).toBe(false)
      }
    }
  })
})
