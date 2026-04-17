declare const require: (name: string) => any
const { describe, test, expect, beforeEach, afterEach, spyOn, mock } = require("bun:test")
import { resolveCategoryExecution } from "./category-resolver"
import type { ExecutorContext } from "./executor-types"
import * as connectedProvidersCache from "../../shared/connected-providers-cache"

describe("resolveCategoryExecution", () => {
	let connectedProvidersSpy: ReturnType<typeof spyOn> | undefined
	let providerModelsSpy: ReturnType<typeof spyOn> | undefined
	let hasConnectedProvidersSpy: ReturnType<typeof spyOn> | undefined
	let hasProviderModelsSpy: ReturnType<typeof spyOn> | undefined

	beforeEach(() => {
		mock.restore()
		connectedProvidersSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(null)
		providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
		hasConnectedProvidersSpy = spyOn(connectedProvidersCache, "hasConnectedProvidersCache").mockReturnValue(false)
		hasProviderModelsSpy = spyOn(connectedProvidersCache, "hasProviderModelsCache").mockReturnValue(false)
	})

	afterEach(() => {
		connectedProvidersSpy?.mockRestore()
		providerModelsSpy?.mockRestore()
		hasConnectedProvidersSpy?.mockRestore()
		hasProviderModelsSpy?.mockRestore()
	})

	const createMockExecutorContext = (): ExecutorContext => ({
		client: {} as any,
		manager: {} as any,
		directory: "/tmp/test",
		userCategories: {},
		sisyphusJuniorModel: undefined,
	})

	test("returns unpinned resolution when category cache is not ready on first run", async () => {
		//#given
		const args = {
			category: "deep",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			deep: {},
		}
		const inheritedModel = undefined
		const systemDefaultModel = "github-copilot/claude-sonnet-4-6"

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, inheritedModel, systemDefaultModel)

		//#then
		expect(result.error).toBeUndefined()
		expect(result.actualModel).toBeUndefined()
		expect(result.categoryModel).toBeUndefined()
		expect(result.agentToUse).toBeDefined()
	})

	test("returns 'unknown category' error for truly unknown categories", async () => {
		//#given
		const args = {
			category: "definitely-not-a-real-category-xyz123",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		const inheritedModel = undefined
		const systemDefaultModel = "github-copilot/claude-sonnet-4-6"

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, inheritedModel, systemDefaultModel)

		//#then
		expect(result.error).toBeDefined()
		expect(result.error).toContain("Unknown category")
		expect(result.error).toContain("definitely-not-a-real-category-xyz123")
	})

	test("uses category fallback_models for background/runtime fallback chain", async () => {
		//#given
		const args = {
			category: "deep",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			deep: {
				model: "github-copilot/claude-opus-4-6",
				fallback_models: ["opencode/kimi-k2.5", "opencode/gpt-5.2(high)"],
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeUndefined()
		expect(result.fallbackChain).toEqual([
			{ providers: ["opencode"], model: "kimi-k2.5", variant: undefined },
			{ providers: ["opencode"], model: "gpt-5.2", variant: "high" },
		])
	})

	test("promotes object-style fallback model settings to categoryModel when fallback becomes initial model", async () => {
		//#given
		const cacheSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue({
			models: { opencode: ["gpt-5.4"] },
			connected: ["opencode"],
			updatedAt: "2026-03-03T00:00:00.000Z",
		})
		const agentsSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(["opencode"])
		const args = {
			category: "quick",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			quick: {
				fallback_models: [
					{
						model: "opencode/gpt-5.4 high",
						variant: "low",
						reasoningEffort: "high",
						temperature: 0.4,
						top_p: 0.7,
						maxTokens: 4096,
						thinking: { type: "disabled" },
					},
				],
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeUndefined()
		expect(result.actualModel).toBe("opencode/gpt-5.4")
		expect(result.categoryModel).toEqual({
			providerID: "opencode",
			modelID: "gpt-5.4",
			variant: "low",
			reasoningEffort: "high",
			temperature: 0.4,
			top_p: 0.7,
			maxTokens: 4096,
			thinking: { type: "disabled" },
		})
		cacheSpy.mockRestore()
		agentsSpy.mockRestore()
	})

	test("preserves inline variant from category model string when no explicit variant is configured", async () => {
		//#given
		const args = {
			category: "quick",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			quick: {
				model: "opencode/gpt-5.4 high",
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeUndefined()
		expect(result.actualModel).toBeDefined()
		expect(result.categoryModel).toBeDefined()
		if (!result.actualModel || !result.categoryModel) {
			throw new Error("Expected resolved model and category model")
		}
		expect(result.actualModel).toBe("opencode/gpt-5.4")
		expect(result.categoryModel).toEqual({
			providerID: "opencode",
			modelID: "gpt-5.4",
			variant: "high",
		})
	})

	test("does not apply object-style fallback settings when the configured primary model matches directly", async () => {
		//#given
		const cacheSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue({
			models: { opencode: ["gpt-5.4-preview"] },
			connected: ["opencode"],
			updatedAt: "2026-03-03T00:00:00.000Z",
		})
		const agentsSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(["opencode"])
		const args = {
			category: "quick",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			quick: {
				model: "opencode/gpt-5.4-preview",
				fallback_models: [
					{
						model: "opencode/gpt-5.4",
						variant: "low",
						reasoningEffort: "high",
					},
				],
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeUndefined()
		expect(result.actualModel).toBe("opencode/gpt-5.4-preview")
		expect(result.categoryModel).toEqual({
			providerID: "opencode",
			modelID: "gpt-5.4-preview",
			variant: undefined,
		})
		cacheSpy.mockRestore()
		agentsSpy.mockRestore()
	})

	test("matches promoted fallback settings after fuzzy model resolution", async () => {
		//#given
		const cacheSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue({
			models: { opencode: ["gpt-5.4-preview"] },
			connected: ["opencode"],
			updatedAt: "2026-03-03T00:00:00.000Z",
		})
		const agentsSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(["opencode"])
		const args = {
			category: "quick",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			quick: {
				fallback_models: [
					{
						model: "opencode/gpt-5.4",
						variant: "low",
						reasoningEffort: "high",
						temperature: 0.6,
						top_p: 0.5,
						maxTokens: 1234,
						thinking: { type: "disabled" },
					},
				],
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeUndefined()
		expect(result.actualModel).toBe("opencode/gpt-5.4-preview")
		expect(result.categoryModel).toEqual({
			providerID: "opencode",
			modelID: "gpt-5.4-preview",
			variant: "low",
			reasoningEffort: "high",
			temperature: 0.6,
			top_p: 0.5,
			maxTokens: 1234,
			thinking: { type: "disabled" },
		})
		cacheSpy.mockRestore()
		agentsSpy.mockRestore()
	})

	test("prefers exact promoted fallback match over earlier fuzzy prefix match", async () => {
		//#given
		const cacheSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue({
			models: { opencode: ["gpt-5.4-preview"] },
			connected: ["opencode"],
			updatedAt: "2026-03-03T00:00:00.000Z",
		})
		const agentsSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(["opencode"])
		const args = {
			category: "quick",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			quick: {
				fallback_models: [
					{
						model: "opencode/gpt-5.4",
						variant: "low",
						reasoningEffort: "medium",
					},
					{
						model: "opencode/gpt-5.4-preview",
						variant: "max",
						reasoningEffort: "high",
					},
				],
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeUndefined()
		expect(result.actualModel).toBe("opencode/gpt-5.4-preview")
		expect(result.categoryModel).toEqual({
			providerID: "opencode",
			modelID: "gpt-5.4-preview",
			variant: "max",
			reasoningEffort: "high",
		})
		cacheSpy.mockRestore()
		agentsSpy.mockRestore()
	})

	test("matches promoted fallback settings when fuzzy resolution extends configured model without hyphen", async () => {
		//#given
		const cacheSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue({
			models: { opencode: ["gpt-5.4o"] },
			connected: ["opencode"],
			updatedAt: "2026-03-03T00:00:00.000Z",
		})
		const agentsSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(["opencode"])
		const args = {
			category: "quick",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			quick: {
				fallback_models: [
					{
						model: "opencode/gpt-5.4",
						variant: "low",
						reasoningEffort: "high",
					},
				],
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeUndefined()
		expect(result.actualModel).toBe("opencode/gpt-5.4o")
		expect(result.categoryModel).toEqual({
			providerID: "opencode",
			modelID: "gpt-5.4o",
			variant: "low",
			reasoningEffort: "high",
		})
		cacheSpy.mockRestore()
		agentsSpy.mockRestore()
	})

	test("prefers the most specific prefix match when fallback entries share a prefix", async () => {
		//#given
		const cacheSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue({
			models: { opencode: ["gpt-4o"] },
			connected: ["opencode"],
			updatedAt: "2026-03-03T00:00:00.000Z",
		})
		const agentsSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(["opencode"])
		const args = {
			category: "deep",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			deep: {
				fallback_models: [
					{
						model: "openai/gpt-4",
						variant: "low",
						reasoningEffort: "medium",
					},
					{
						model: "opencode/gpt-4o",
						variant: "max",
						reasoningEffort: "high",
					},
				],
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeUndefined()
		expect(result.actualModel).toBe("opencode/gpt-4o")
		expect(result.categoryModel).toEqual({
			providerID: "opencode",
			modelID: "gpt-4o",
			variant: "max",
			reasoningEffort: "high",
		})
		cacheSpy.mockRestore()
		agentsSpy.mockRestore()
	})

	test("does not inherit hardcoded fallbackChain when user configures a category model [regression #3040]", async () => {
		//#given
		const args = {
			category: "quick",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			quick: {
				model: "github-copilot/grok-4-fast-non-reasoning",
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeUndefined()
		expect(result.actualModel).toBe("github-copilot/grok-4-fast-non-reasoning")
		expect(result.categoryModel).toEqual({
			providerID: "github-copilot",
			modelID: "grok-4-fast-non-reasoning",
			variant: undefined,
		})
		expect(result.fallbackChain).toBeUndefined()
	})

	test("does not inherit hardcoded fallbackChain when sisyphus-junior model override is set [regression #2941]", async () => {
		//#given
		const args = {
			category: "quick",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.sisyphusJuniorModel = "github-copilot/claude-sonnet-4-6"

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeUndefined()
		expect(result.actualModel).toBe("github-copilot/claude-sonnet-4-6")
		expect(result.categoryModel).toEqual({
			providerID: "github-copilot",
			modelID: "claude-sonnet-4-6",
			variant: undefined,
		})
		expect(result.fallbackChain).toBeUndefined()
	})

	test("rejects a user-configured denied provider model with a subscription-only guard error", async () => {
		//#given
		const args = {
			category: "deep",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			deep: {
				model: "openai/gpt-5.4",
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.agentToUse).toBe("")
		expect(result.categoryModel).toBeUndefined()
		expect(result.actualModel).toBeUndefined()
		expect(result.error).toBeDefined()
		expect(result.error).toContain("openai")
		expect(result.error).toContain("API-key providers are denied")
		expect(result.error).toContain("claude -p")
		expect(result.error).toContain("gemini")
		expect(result.error).toContain("copilot -p")
		expect(result.error).toContain("opencode run")
	})

	test("rejects a google-provider category model with a subscription-only guard error", async () => {
		//#given
		const args = {
			category: "visual-engineering",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			"visual-engineering": {
				model: "google/gemini-3.1-pro",
				variant: "high",
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeDefined()
		expect(result.error).toContain("google")
		expect(result.error).toContain("github-copilot")
		expect(result.categoryModel).toBeUndefined()
	})

	test("rejects an anthropic-provider category model so a stale user config cannot hit a denied API", async () => {
		//#given
		const args = {
			category: "unspecified-high",
			prompt: "test prompt",
			description: "Test task",
			run_in_background: false,
			load_skills: [],
			blockedBy: undefined,
			enableSkillTools: false,
		}
		const executorCtx = createMockExecutorContext()
		executorCtx.userCategories = {
			"unspecified-high": {
				model: "anthropic/claude-opus-4-6",
				variant: "max",
			},
		}

		//#when
		const result = await resolveCategoryExecution(args, executorCtx, undefined, "github-copilot/claude-sonnet-4-6")

		//#then
		expect(result.error).toBeDefined()
		expect(result.error).toContain("anthropic")
		expect(result.error).toContain("API-key providers are denied")
	})
})
