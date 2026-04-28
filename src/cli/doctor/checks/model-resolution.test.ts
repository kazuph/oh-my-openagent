import { describe, it, expect, beforeEach, afterEach, spyOn, mock } from "bun:test"

describe("model-resolution check", () => {
  describe("getModelResolutionInfo", () => {
    // given: Model requirements are defined in model-requirements.ts
    // when: Getting model resolution info
    // then: Returns info for all agents and categories with their provider chains

    it("returns agent requirements even when fallback chain is intentionally empty", async () => {
      const { getModelResolutionInfo } = await import("./model-resolution")

      const info = getModelResolutionInfo()

      // then: Should have agent entries (subscription-only providers post-2026-04-17)
      const sisyphus = info.agents.find((a) => a.name === "sisyphus")
      expect(sisyphus).toBeDefined()
      expect(sisyphus!.requirement.fallbackChain).toHaveLength(0)
    })

    it("returns category requirements even when fallback chains are intentionally empty", async () => {
      const { getModelResolutionInfo } = await import("./model-resolution")

      const info = getModelResolutionInfo()

      // then: Should still have category entries, but no hardcoded chain
      const visual = info.categories.find((c) => c.name === "visual-engineering")
      expect(visual).toBeDefined()
      expect(visual!.requirement.fallbackChain).toHaveLength(0)
      expect(visual!.effectiveModel).toBe("unknown")
    })
  })

  describe("getModelResolutionInfoWithOverrides", () => {
    // given: User has overrides in oh-my-opencode.json
    // when: Getting resolution info with config
    // then: Shows user override in Step 1 position

    it("shows user override for agent when configured", async () => {
      const { getModelResolutionInfoWithOverrides } = await import("./model-resolution")

      // given: User has override for oracle agent
      const mockConfig = {
        agents: {
          oracle: { model: "anthropic/claude-opus-4-6" },
        },
      }

      const info = getModelResolutionInfoWithOverrides(mockConfig)

      // then: Oracle should show the override
      const oracle = info.agents.find((a) => a.name === "oracle")
      expect(oracle).toBeDefined()
      expect(oracle!.userOverride).toBe("anthropic/claude-opus-4-6")
      expect(oracle!.effectiveResolution).toBe("User override: anthropic/claude-opus-4-6")
    })

    it("shows user override for category when configured", async () => {
      const { getModelResolutionInfoWithOverrides } = await import("./model-resolution")

      // given: User has override for visual-engineering category
      const mockConfig = {
        categories: {
          "visual-engineering": { model: "openai/gpt-5.4" },
        },
      }

      const info = getModelResolutionInfoWithOverrides(mockConfig)

      // then: visual-engineering should show the override
      const visual = info.categories.find((c) => c.name === "visual-engineering")
      expect(visual).toBeDefined()
      expect(visual!.userOverride).toBe("openai/gpt-5.4")
      expect(visual!.effectiveResolution).toBe("User override: openai/gpt-5.4")
    })

    it("shows no fallback chain for sisyphus when no override exists", async () => {
      const { getModelResolutionInfoWithOverrides } = await import("./model-resolution")

      // given: No overrides configured
      const mockConfig = {}

      const info = getModelResolutionInfoWithOverrides(mockConfig)

      // then: Sisyphus now relies on /model or system default instead of its own chain
      const sisyphus = info.agents.find((a) => a.name === "sisyphus")
      expect(sisyphus).toBeDefined()
      expect(sisyphus!.userOverride).toBeUndefined()
      expect(sisyphus!.effectiveResolution).toBe("No fallback chain defined")
    })

    it("captures user variant for agent when configured", async () => {
      const { getModelResolutionInfoWithOverrides } = await import("./model-resolution")

      //#given User has model with variant override for oracle agent
      const mockConfig = {
        agents: {
          oracle: { model: "openai/gpt-5.4", variant: "xhigh" },
        },
      }

      //#when getting resolution info with config
      const info = getModelResolutionInfoWithOverrides(mockConfig)

      //#then Oracle should have userVariant set
      const oracle = info.agents.find((a) => a.name === "oracle")
      expect(oracle).toBeDefined()
      expect(oracle!.userOverride).toBe("openai/gpt-5.4")
      expect(oracle!.userVariant).toBe("xhigh")
    })

    it("captures user variant for category when configured", async () => {
      const { getModelResolutionInfoWithOverrides } = await import("./model-resolution")

      //#given User has model with variant override for visual-engineering category
      const mockConfig = {
        categories: {
          "visual-engineering": { model: "google/gemini-3-flash-preview", variant: "high" },
        },
      }

      //#when getting resolution info with config
      const info = getModelResolutionInfoWithOverrides(mockConfig)

      //#then visual-engineering should have userVariant set
      const visual = info.categories.find((c) => c.name === "visual-engineering")
      expect(visual).toBeDefined()
      expect(visual!.userOverride).toBe("google/gemini-3-flash-preview")
      expect(visual!.userVariant).toBe("high")
    })

    it("omits capability diagnostics when no built-in sisyphus model is defined", async () => {
      const { getModelResolutionInfoWithOverrides } = await import("./model-resolution")

      const info = getModelResolutionInfoWithOverrides({})
      const sisyphus = info.agents.find((a) => a.name === "sisyphus")

      expect(sisyphus).toBeDefined()
      expect(sisyphus!.effectiveModel).toBe("unknown")
      expect(sisyphus!.capabilityDiagnostics).toBeUndefined()
    })

    it("keeps provider-prefixed overrides for transport while capability diagnostics use pattern aliases", async () => {
      const { getModelResolutionInfoWithOverrides } = await import("./model-resolution")

      const info = getModelResolutionInfoWithOverrides({
        categories: {
          "visual-engineering": { model: "google/gemini-3.1-pro-high" },
        },
      })

      const visual = info.categories.find((category) => category.name === "visual-engineering")
      expect(visual).toBeDefined()
      expect(visual!.effectiveModel).toBe("google/gemini-3.1-pro-high")
      expect(visual!.capabilityDiagnostics).toMatchObject({
        resolutionMode: "alias-backed",
        canonicalization: {
          source: "pattern-alias",
          ruleID: "gemini-3.1-pro-tier-alias",
        },
      })
    })

    it("keeps provider-prefixed Claude overrides for transport while capability diagnostics canonicalize to bare IDs", async () => {
      const { getModelResolutionInfoWithOverrides } = await import("./model-resolution")

      const info = getModelResolutionInfoWithOverrides({
        agents: {
          oracle: { model: "anthropic/claude-opus-4-6-thinking" },
        },
      })

      const oracle = info.agents.find((agent) => agent.name === "oracle")
      expect(oracle).toBeDefined()
      expect(oracle!.effectiveModel).toBe("anthropic/claude-opus-4-6-thinking")
      expect(oracle!.capabilityDiagnostics).toMatchObject({
        resolutionMode: "alias-backed",
        canonicalization: {
          source: "pattern-alias",
          ruleID: "claude-thinking-legacy-alias",
        },
      })
    })
  })

  describe("checkModelResolution", () => {
    // given: Doctor check is executed
    // when: Running the model resolution check
    // then: Returns pass with details showing resolution flow

    it("returns pass or warn status with agent and category counts", async () => {
      const { checkModelResolution } = await import("./model-resolution")

      const result = await checkModelResolution()

      // then: Should pass (with cache) or warn (no cache) and show counts
      // In CI without model cache, status is "warn"; locally with cache, status is "pass"
      expect(["pass", "warn"]).toContain(result.status)
      expect(result.message).toMatch(/\d+ agents?, \d+ categories?/)
    })

    it("includes resolution details in verbose mode details array", async () => {
      const { checkModelResolution } = await import("./model-resolution")

      const result = await checkModelResolution()

      // then: Details should contain agent/category resolution info
      expect(result.details).toBeDefined()
      expect(result.details!.length).toBeGreaterThan(0)
      // Should have Available Models and Configured Models headers
      expect(result.details!.some((d) => d.includes("Available Models"))).toBe(true)
      expect(result.details!.some((d) => d.includes("Configured Models"))).toBe(true)
      expect(result.details!.some((d) => d.includes("Agents:"))).toBe(true)
      expect(result.details!.some((d) => d.includes("Categories:"))).toBe(true)
      // Should have legend
      expect(result.details!.some((d) => d.includes("user override"))).toBe(true)
      expect(result.details!.some((d) => d.includes("capabilities:"))).toBe(true)
    })

    it("collects warnings when configured models rely on compatibility fallback", async () => {
      const { collectCapabilityResolutionIssues, getModelResolutionInfoWithOverrides } = await import("./model-resolution")

      const info = getModelResolutionInfoWithOverrides({
        agents: {
          oracle: { model: "custom/unknown-llm" },
        },
      })

      const issues = collectCapabilityResolutionIssues(info)

      expect(issues).toHaveLength(1)
      expect(issues[0]?.title).toContain("compatibility fallback")
      expect(issues[0]?.description).toContain("oracle=custom/unknown-llm")
    })
  })

})
