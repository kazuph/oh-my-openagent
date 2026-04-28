/// <reference types="bun-types" />

import { describe, test, expect, beforeEach, afterEach, spyOn, mock } from "bun:test"
import type { AgentConfig } from "@opencode-ai/sdk"
import { clearSkillCache } from "../features/opencode-skill-loader/skill-content"
import * as connectedProvidersCache from "../shared/connected-providers-cache"
import * as modelAvailability from "../shared/model-availability"
import * as shared from "../shared"

const TEST_DEFAULT_MODEL = "github-copilot/claude-opus-4-6"
let createBuiltinAgents: (typeof import("./builtin-agents"))["createBuiltinAgents"]

async function importFreshBuiltinAgentsModule(): Promise<typeof import("./builtin-agents")> {
  return import(`./builtin-agents?test=${Date.now()}-${Math.random()}`)
}

beforeEach(async () => {
  mock.restore()
  clearSkillCache()
  connectedProvidersCache._resetMemCacheForTesting()
  ;({ createBuiltinAgents } = await importFreshBuiltinAgentsModule())
})

afterEach(() => {
  clearSkillCache()
  connectedProvidersCache._resetMemCacheForTesting()
  mock.restore()
})

describe("createBuiltinAgents with model overrides", () => {
  test("Sisyphus uses system default model when available models exist", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set([
        "anthropic/claude-opus-4-6",
        "kimi-for-coding/k2p5",
        "opencode/kimi-k2.5-free",
        "zai-coding-plan/glm-5",
        "opencode/big-pickle",
      ])
    )

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.sisyphus.model).toBe(TEST_DEFAULT_MODEL)
      expect(agents.sisyphus.thinking).toBeUndefined()
      expect(agents.sisyphus.reasoningEffort).toBeUndefined()
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("Sisyphus with GPT model override uses the requested model without extra model-specific prompt settings", async () => {
    // #given
    const providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
    const overrides = {
      sisyphus: { model: "github-copilot/gpt-5.4" },
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], undefined, undefined)

    // #then
    expect(agents.sisyphus.model).toBe("github-copilot/gpt-5.4")
    expect(agents.sisyphus.reasoningEffort).toBeUndefined()
    expect(agents.sisyphus.thinking).toBeUndefined()
    providerModelsSpy.mockRestore()
    fetchSpy.mockRestore()
  })

  test("Atlas uses uiSelectedModel", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["openai/gpt-5.4", "anthropic/claude-sonnet-4-6"])
    )
    const uiSelectedModel = "openai/gpt-5.4"

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        undefined,
        undefined,
        uiSelectedModel
      )

      // #then
      expect(agents.atlas).toBeDefined()
      expect(agents.atlas.model).toBe("openai/gpt-5.4")
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("user config model takes priority over uiSelectedModel for sisyphus", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["openai/gpt-5.4", "anthropic/claude-sonnet-4-6"])
    )
    const uiSelectedModel = "openai/gpt-5.4"
    const overrides = {
      sisyphus: { model: "google/antigravity-claude-opus-4-5-thinking" },
    }

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        overrides,
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        undefined,
        undefined,
        uiSelectedModel
      )

      // #then
      expect(agents.sisyphus).toBeDefined()
      expect(agents.sisyphus.model).toBe("google/antigravity-claude-opus-4-5-thinking")
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("user config model takes priority over uiSelectedModel for atlas", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["openai/gpt-5.4", "anthropic/claude-sonnet-4-6"])
    )
    const uiSelectedModel = "openai/gpt-5.4"
    const overrides = {
      atlas: { model: "google/antigravity-claude-opus-4-5-thinking" },
    }

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        overrides,
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        undefined,
        undefined,
        uiSelectedModel
      )

      // #then
      expect(agents.atlas).toBeDefined()
      expect(agents.atlas.model).toBe("google/antigravity-claude-opus-4-5-thinking")
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("Sisyphus is created on first run when no availableModels or cache exist", async () => {
    // #given
    const systemDefaultModel = "github-copilot/claude-opus-4-6"
    const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(null)
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, systemDefaultModel, undefined, undefined, [], {})

      // #then
      expect(agents.sisyphus).toBeDefined()
      expect(agents.sisyphus.model).toBe(systemDefaultModel)
    } finally {
      cacheSpy.mockRestore()
      fetchSpy.mockRestore()
    }
  })

   test("Oracle falls back to the system default model when availableModels is empty", async () => {
      // #given - fallback chains are removed, so systemDefaultModel is the only built-in source
      const providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
      const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
      const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(["github-copilot"])

     // #when
     const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], undefined, undefined)

      // #then - oracle now resolves to the configured system default model
      expect(agents.oracle.model).toBe(TEST_DEFAULT_MODEL)
     expect(agents.oracle.reasoningEffort).toBeUndefined()
     expect(agents.oracle.thinking).toBeUndefined()
     cacheSpy.mockRestore?.()
     providerModelsSpy.mockRestore()
     fetchSpy.mockRestore()
   })

   test("Oracle created without model field when no cache exists (first run scenario)", async () => {
     // #given - no cache at all (first run)
     const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(null)

     // #when
     const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL)

     // #then - oracle should be created with system default model (fallback to systemDefaultModel)
     expect(agents.oracle).toBeDefined()
     expect(agents.oracle.model).toBe(TEST_DEFAULT_MODEL)
     cacheSpy.mockRestore?.()
   })

  test("Oracle with GPT model override uses the requested model without extra model-specific prompt settings", async () => {
    // #given
    const providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
    const overrides = {
      oracle: { model: "openai/gpt-5.4" },
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], undefined, undefined)

    // #then
    expect(agents.oracle.model).toBe("openai/gpt-5.4")
    expect(agents.oracle.reasoningEffort).toBeUndefined()
    expect(agents.oracle.textVerbosity).toBeUndefined()
    expect(agents.oracle.thinking).toBeUndefined()
    providerModelsSpy.mockRestore()
    fetchSpy.mockRestore()
  })

  test("Oracle with Claude model override uses the requested model without injected thinking", async () => {
    // #given
    const providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
    const overrides = {
      oracle: { model: "anthropic/claude-sonnet-4" },
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], undefined, undefined)

    // #then
    expect(agents.oracle.model).toBe("anthropic/claude-sonnet-4")
    expect(agents.oracle.thinking).toBeUndefined()
    expect(agents.oracle.reasoningEffort).toBeUndefined()
    expect(agents.oracle.textVerbosity).toBeUndefined()
    providerModelsSpy.mockRestore()
    fetchSpy.mockRestore()
  })

   test("non-model overrides are still applied after factory rebuild", async () => {
     // #given
     const providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
     const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
     const overrides = {
       sisyphus: { model: "github-copilot/gpt-5.4", temperature: 0.5 },
     }

     // #when
     const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], undefined, undefined)

     // #then
     expect(agents.sisyphus.model).toBe("github-copilot/gpt-5.4")
     expect(agents.sisyphus.temperature).toBe(0.5)
     providerModelsSpy.mockRestore()
     fetchSpy.mockRestore()
   })

  test("createBuiltinAgents excludes disabled skills from availableSkills", async () => {
    // #given
    const providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
    const connectedSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(null)
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
    const disabledSkills = new Set(["playwright"])

    // #when
    const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], undefined, undefined, undefined, disabledSkills)

    // #then
    expect(agents.sisyphus.prompt).not.toContain("playwright")
    expect(agents.sisyphus.prompt).toContain("frontend-ui-ux")
    expect(agents.sisyphus.prompt).toContain("git-master")
    providerModelsSpy.mockRestore()
    connectedSpy.mockRestore()
    fetchSpy.mockRestore()
  })

  test("does not advertise custom agents in orchestrator prompts when provided via config", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set([
        "anthropic/claude-opus-4-6",
        "kimi-for-coding/k2p5",
        "opencode/kimi-k2.5-free",
        "zai-coding-plan/glm-5",
        "opencode/big-pickle",
        "openai/gpt-5.4",
      ])
    )

    const customAgentSummaries = [
      {
        name: "researcher",
        description: "Research agent for deep analysis",
        hidden: false,
      },
    ]

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries
      )

      // #then
      expect(agents.sisyphus.prompt).not.toContain("researcher")
      expect(agents.hephaestus.prompt).not.toContain("researcher")
      expect(agents.atlas.prompt).not.toContain("researcher")
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("excludes hidden custom agents from orchestrator prompts", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/claude-opus-4-6", "github-copilot/gpt-5.4"])
    )

    const customAgentSummaries = [
      {
        name: "hidden-agent",
        description: "Should never show",
        hidden: true,
      },
    ]

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries
      )

      // #then
      expect(agents.sisyphus.prompt).not.toContain("hidden-agent")
      expect(agents.hephaestus.prompt).not.toContain("hidden-agent")
      expect(agents.atlas.prompt).not.toContain("hidden-agent")
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("excludes disabled custom agents from orchestrator prompts", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/claude-opus-4-6", "github-copilot/gpt-5.4"])
    )

    const customAgentSummaries = [
      {
        name: "disabled-agent",
        description: "Should never show",
        disabled: true,
      },
    ]

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries
      )

      // #then
      expect(agents.sisyphus.prompt).not.toContain("disabled-agent")
      expect(agents.hephaestus.prompt).not.toContain("disabled-agent")
      expect(agents.atlas.prompt).not.toContain("disabled-agent")
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("excludes custom agents when disabledAgents contains their name (case-insensitive)", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/claude-opus-4-6", "github-copilot/gpt-5.4"])
    )

    const disabledAgents = ["ReSeArChEr"]
    const customAgentSummaries = [
      {
        name: "researcher",
        description: "Should never show",
      },
    ]

    try {
      // #when
      const agents = await createBuiltinAgents(
        disabledAgents,
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries
      )

      // #then
      expect(agents.sisyphus.prompt).not.toContain("researcher")
      expect(agents.hephaestus.prompt).not.toContain("researcher")
      expect(agents.atlas.prompt).not.toContain("researcher")
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("does not advertise duplicate custom agents case-insensitively", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/claude-opus-4-6", "github-copilot/gpt-5.4"])
    )

    const customAgentSummaries = [
      { name: "Researcher", description: "First" },
      { name: "researcher", description: "Second" },
    ]

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries
      )

      // #then
      const matches = (agents.sisyphus?.prompt ?? "").match(/Custom agent: researcher/gi) ?? []
      expect(matches.length).toBe(0)
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("does not surface custom agent strings in orchestrator prompts", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/claude-opus-4-6", "github-copilot/gpt-5.4"])
    )

    const customAgentSummaries = [
      {
        name: "table-agent",
        description: "Line1\nAlpha | Beta",
      },
    ]

    try {
      // #when
      const agents = await createBuiltinAgents(
        [],
        {},
        undefined,
        TEST_DEFAULT_MODEL,
        undefined,
        undefined,
        [],
        customAgentSummaries
      )

      // #then
      expect(agents.sisyphus.prompt).not.toContain("Line1 Alpha \\| Beta")
    } finally {
      fetchSpy.mockRestore()
    }
  })
})

describe("createBuiltinAgents without systemDefaultModel", () => {
   test("agents without explicit models are omitted without systemDefaultModel", async () => {
      // #given - connected providers alone no longer create fallback-based agents
      const providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
      const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
      const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(["github-copilot"])

     // #when
     const agents = await createBuiltinAgents([], {}, undefined, undefined)

      // #then
      expect(agents.oracle).toBeUndefined()
     cacheSpy.mockRestore?.()
     providerModelsSpy.mockRestore()
     fetchSpy.mockRestore()
   })

  test("oracle is omitted on first run when no cache and no systemDefaultModel", async () => {
    // #given
    const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(null)
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, undefined)

      // #then
      expect(agents.oracle).toBeUndefined()
    } finally {
      fetchSpy.mockRestore()
      cacheSpy.mockRestore()
    }
  })

  test("sisyphus is omitted without systemDefaultModel or /model", async () => {
    // #given
    const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue([
      "anthropic", "kimi-for-coding", "opencode", "zai-coding-plan"
    ])
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set([
        "anthropic/claude-opus-4-6",
        "kimi-for-coding/k2p5",
        "opencode/kimi-k2.5-free",
        "zai-coding-plan/glm-5",
        "opencode/big-pickle",
      ])
    )

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, undefined, undefined, undefined, [], {})

      // #then
      expect(agents.sisyphus).toBeUndefined()
    } finally {
      cacheSpy.mockRestore()
      fetchSpy.mockRestore()
    }
  })
})

describe("createBuiltinAgents with requiresProvider gating (hephaestus)", () => {
  test("hephaestus is created when provider-models cache connected list includes required provider", async () => {
    // #given - post-migration: requiresProvider is github-copilot / opencode only
    const connectedCacheSpy = spyOn(shared, "readConnectedProvidersCache").mockReturnValue(["opencode-go"])
    const providerModelsSpy = spyOn(shared, "readProviderModelsCache").mockReturnValue({
      connected: ["github-copilot"],
      models: {},
      updatedAt: new Date().toISOString(),
    })
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockImplementation(async (_, options) => {
      const providers = options?.connectedProviders ?? []
      return providers.includes("github-copilot")
        ? new Set(["github-copilot/gpt-5.3-codex"])
        : new Set(["opencode-go/kimi-k2.5"])
    })

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.hephaestus).toBeDefined()
    } finally {
      connectedCacheSpy.mockRestore()
      providerModelsSpy.mockRestore()
      fetchSpy.mockRestore()
    }
  })

  test("hephaestus still uses the system default model when no provider gating remains", async () => {
    // #given - requiresProvider gating is removed alongside fallback routing
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["opencode-go/kimi-k2.5"])
    )
    const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(["opencode-go"])

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.hephaestus).toBeDefined()
      expect(agents.hephaestus.model).toBe(TEST_DEFAULT_MODEL)
    } finally {
      fetchSpy.mockRestore()
      cacheSpy.mockRestore()
    }
  })

  test("hephaestus is created when opencode provider is connected", async () => {
    // #given - opencode provider has models available (post-migration subscription routing)
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["opencode/gpt-5.3-codex"])
    )

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.hephaestus).toBeDefined()
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("hephaestus IS created when github-copilot is connected with a GPT model", async () => {
    // #given - github-copilot provider has gpt-5.3-codex available
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/gpt-5.3-codex"])
    )
    const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(null)

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then - github-copilot is now a valid provider for hephaestus
      expect(agents.hephaestus).toBeDefined()
    } finally {
      fetchSpy.mockRestore()
      cacheSpy.mockRestore()
    }
  })

  test("hephaestus is created when opencode provider is connected", async () => {
    // #given - opencode provider has models available
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["opencode/gpt-5.3-codex"])
    )

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.hephaestus).toBeDefined()
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("hephaestus uses systemDefaultModel on first run when no availableModels or cache exist", async () => {
    // #given
    const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(null)
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.hephaestus).toBeDefined()
      expect(agents.hephaestus.model).toBe(TEST_DEFAULT_MODEL)
    } finally {
      cacheSpy.mockRestore()
      fetchSpy.mockRestore()
    }
  })

  test("hephaestus is created when explicit config provided even if provider unavailable", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/claude-opus-4-6"])
    )
    const overrides = {
      hephaestus: { model: "github-copilot/claude-opus-4-6" },
    }

    try {
      // #when
      const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.hephaestus).toBeDefined()
    } finally {
      fetchSpy.mockRestore()
    }
  })
})

describe("Hephaestus environment context toggle", () => {
  let fetchSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/gpt-5.4"])
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  async function buildAgents(disableFlag?: boolean) {
    return createBuiltinAgents(
      [],
      {},
      "/tmp/work",
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      disableFlag
    )
  }

  test("includes <omo-env> tag when disable flag is unset", async () => {
    // #when
    const agents = await buildAgents(undefined)

    // #then
    expect(agents.hephaestus).toBeDefined()
    expect(agents.hephaestus.prompt).toContain("<omo-env>")
  })

  test("includes <omo-env> tag when disable flag is false", async () => {
    // #when
    const agents = await buildAgents(false)

    // #then
    expect(agents.hephaestus).toBeDefined()
    expect(agents.hephaestus.prompt).toContain("<omo-env>")
  })

  test("omits <omo-env> tag when disable flag is true", async () => {
    // #when
    const agents = await buildAgents(true)

    // #then
    expect(agents.hephaestus).toBeDefined()
    expect(agents.hephaestus.prompt).not.toContain("<omo-env>")
  })
})

describe("Sisyphus and Librarian environment context toggle", () => {
  let fetchSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/claude-opus-4-6", "github-copilot/gemini-3-flash", "opencode/claude-haiku-4-5"])
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  async function buildAgents(disableFlag?: boolean) {
    return createBuiltinAgents(
      [],
      {},
      "/tmp/work",
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      disableFlag
    )
  }

  test("includes <omo-env> for sisyphus when disable flag is unset", async () => {
    const agents = await buildAgents(undefined)

    expect(agents.sisyphus).toBeDefined()
    expect(agents.librarian).toBeUndefined()
    expect(agents.sisyphus.prompt).toContain("<omo-env>")
  })

  test("includes <omo-env> for sisyphus when disable flag is false", async () => {
    const agents = await buildAgents(false)

    expect(agents.sisyphus).toBeDefined()
    expect(agents.librarian).toBeUndefined()
    expect(agents.sisyphus.prompt).toContain("<omo-env>")
  })

  test("omits <omo-env> for sisyphus when disable flag is true", async () => {
    const agents = await buildAgents(true)

    expect(agents.sisyphus).toBeDefined()
    expect(agents.librarian).toBeUndefined()
    expect(agents.sisyphus.prompt).not.toContain("<omo-env>")
  })
})

describe("Atlas is unaffected by environment context toggle", () => {
  let fetchSpy: ReturnType<typeof spyOn>

  beforeEach(() => {
    fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/claude-opus-4-6", "github-copilot/gpt-5.4"])
    )
  })

  afterEach(() => {
    fetchSpy.mockRestore()
  })

  test("atlas prompt is unchanged and never contains <omo-env>", async () => {
    const agentsDefault = await createBuiltinAgents(
      [],
      {},
      "/tmp/work",
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      false
    )

    const agentsDisabled = await createBuiltinAgents(
      [],
      {},
      "/tmp/work",
      TEST_DEFAULT_MODEL,
      undefined,
      undefined,
      [],
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      true
    )

    expect(agentsDefault.atlas).toBeDefined()
    expect(agentsDisabled.atlas).toBeDefined()
    expect(agentsDefault.atlas.prompt).not.toContain("<omo-env>")
    expect(agentsDisabled.atlas.prompt).not.toContain("<omo-env>")
    expect(agentsDisabled.atlas.prompt).toBe(agentsDefault.atlas.prompt)
  })
})

describe("createBuiltinAgents with explicit model selection for sisyphus", () => {
  test("sisyphus is created when systemDefaultModel is available", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["github-copilot/claude-opus-4-6"])
    )

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.sisyphus).toBeDefined()
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("sisyphus still uses systemDefaultModel on first run", async () => {
    // #given
    const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(null)
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.sisyphus).toBeDefined()
      expect(agents.sisyphus.model).toBe(TEST_DEFAULT_MODEL)
    } finally {
      cacheSpy.mockRestore()
      fetchSpy.mockRestore()
    }
  })

  test("sisyphus is created when explicit config provided even if no models available", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
    const overrides = {
      sisyphus: { model: "anthropic/claude-opus-4-6" },
    }

    try {
      // #when
      const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.sisyphus).toBeDefined()
    } finally {
      fetchSpy.mockRestore()
    }
  })

  test("sisyphus still uses systemDefaultModel when availableModels do not match", async () => {
    // #given - model availability does not matter once systemDefaultModel is supplied
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["venice/deepseek-v3.2"])
    )
    const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue([])

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.sisyphus).toBeDefined()
      expect(agents.sisyphus.model).toBe(TEST_DEFAULT_MODEL)
    } finally {
      fetchSpy.mockRestore()
      cacheSpy.mockRestore()
    }
  })

  test("sisyphus uses user-configured plugin model even when not in cache or fallback chain", async () => {
    // #given - user configures a model from a plugin provider (like antigravity)
    // that is NOT in the availableModels cache and NOT in the fallback chain
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set(["openai/gpt-5.4"])
    )
    const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(
      ["openai"]
    )
    const overrides = {
      sisyphus: { model: "google/antigravity-claude-opus-4-5-thinking" },
    }

    try {
      // #when
      const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.sisyphus).toBeDefined()
      expect(agents.sisyphus.model).toBe("google/antigravity-claude-opus-4-5-thinking")
    } finally {
      fetchSpy.mockRestore()
      cacheSpy.mockRestore()
    }
  })

  test("sisyphus uses user-configured plugin model when availableModels is empty but cache exists", async () => {
    // #given - connected providers cache exists but models cache is empty
    // This reproduces the exact scenario where provider-models.json has models: {}
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(
      new Set()
    )
    const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(
      ["google", "openai", "opencode"]
    )
    const overrides = {
      sisyphus: { model: "google/antigravity-claude-opus-4-5-thinking" },
    }

    try {
      // #when
      const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL, undefined, undefined, [], {})

      // #then
      expect(agents.sisyphus).toBeDefined()
      expect(agents.sisyphus.model).toBe("google/antigravity-claude-opus-4-5-thinking")
    } finally {
      fetchSpy.mockRestore()
      cacheSpy.mockRestore()
    }
  })

  test("atlas and metis are omitted without explicit models or a system default", async () => {
    // #given
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set(["openai/gpt-5.4"]))
    const cacheSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(["openai"])

    try {
      // #when
      const agents = await createBuiltinAgents([], {}, undefined, undefined, undefined, undefined, [], {})

      // #then
      expect(agents.atlas).toBeUndefined()
      expect(agents.metis).toBeUndefined()
    } finally {
      fetchSpy.mockRestore()
      cacheSpy.mockRestore()
    }
  })
})

describe("buildAgent with category and skills", () => {
  const { buildAgent } = require("./agent-builder")
  const TEST_MODEL = "anthropic/claude-opus-4-6"

  beforeEach(() => {
    clearSkillCache()
  })

  afterEach(() => {
    clearSkillCache()
  })

  test("agent with category inherits category settings", () => {
    // #given - agent factory that sets category but no model
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          category: "visual-engineering",
        }) as AgentConfig,
    }

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL)

    // #then - category's built-in model is applied (github-copilot subscription)
    expect(agent.model).toBe("github-copilot/gemini-3.1-pro")
  })

  test("agent with category and existing model keeps existing model", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          category: "visual-engineering",
          model: "custom/model",
        }) as AgentConfig,
    }

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL)

    // #then - explicit model takes precedence over category
    expect(agent.model).toBe("custom/model")
  })

  test("agent with category inherits variant", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          category: "custom-category",
        }) as AgentConfig,
    }

    const categories = {
      "custom-category": {
        model: "openai/gpt-5.4",
        variant: "xhigh",
      },
    }

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL, categories)

    // #then
    expect(agent.model).toBe("openai/gpt-5.4")
    expect(agent.variant).toBe("xhigh")
  })

  test("agent with skills has content prepended to prompt", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: ["frontend-ui-ux"],
          prompt: "Original prompt content",
        }) as AgentConfig,
    }

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL)

    // #then
    expect(agent.prompt).toContain("Role: Designer-Turned-Developer")
    expect(agent.prompt).toContain("Original prompt content")
    expect(agent.prompt).toMatch(/Designer-Turned-Developer[\s\S]*Original prompt content/s)
  })

  test("agent with multiple skills has all content prepended", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: ["frontend-ui-ux"],
          prompt: "Agent prompt",
        }) as AgentConfig,
    }

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL)

    // #then
    expect(agent.prompt).toContain("Role: Designer-Turned-Developer")
    expect(agent.prompt).toContain("Agent prompt")
  })

  test("agent without category or skills works as before", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          model: "custom/model",
          temperature: 0.5,
          prompt: "Base prompt",
        }) as AgentConfig,
    }

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL)

    // #then
    expect(agent.model).toBe("custom/model")
    expect(agent.temperature).toBe(0.5)
    expect(agent.prompt).toBe("Base prompt")
  })

  test("agent with category and skills applies both", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          category: "ultrabrain",
          skills: ["frontend-ui-ux"],
          prompt: "Task description",
        }) as AgentConfig,
    }

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL)

    // #then - category's built-in model and skills are applied (opencode subscription)
    expect(agent.model).toBe("opencode/gpt-5.4")
    expect(agent.variant).toBe("xhigh")
    expect(agent.prompt).toContain("Role: Designer-Turned-Developer")
    expect(agent.prompt).toContain("Task description")
  })

  test("agent with non-existent category has no effect", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          category: "non-existent",
          prompt: "Base prompt",
        }) as AgentConfig,
    }

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL)

    // #then
    // Note: The factory receives model, but if category doesn't exist, it's not applied
    // The agent's model comes from the factory output (which doesn't set model)
    expect(agent.model).toBeUndefined()
    expect(agent.prompt).toBe("Base prompt")
  })

  test("agent with non-existent skills only prepends found ones", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: ["frontend-ui-ux", "non-existent-skill"],
          prompt: "Base prompt",
        }) as AgentConfig,
    }

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL)

    // #then
    expect(agent.prompt).toContain("Role: Designer-Turned-Developer")
    expect(agent.prompt).toContain("Base prompt")
  })

  test("agent with empty skills array keeps original prompt", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: [],
          prompt: "Base prompt",
        }) as AgentConfig,
    }

    // #when
    const agent = buildAgent(source["test-agent"], TEST_MODEL)

    // #then
    expect(agent.prompt).toBe("Base prompt")
  })

  test("agent with agent-browser skill is not resolved from removed built-ins even when browserProvider is set", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: ["agent-browser"],
          prompt: "Base prompt",
        }) as AgentConfig,
    }

    // #when - browserProvider is "agent-browser"
    const agent = buildAgent(source["test-agent"], TEST_MODEL, undefined, undefined, "agent-browser")

    // #then - browser skills now come from discovered Claude Code/OpenCode skills, not built-ins
    expect(agent.prompt).toBe("Base prompt")
    expect(agent.prompt).not.toContain("agent-browser open")
  })

  test("agent with agent-browser skill NOT resolved when browserProvider not set", () => {
    // #given
    const source = {
      "test-agent": () =>
        ({
          description: "Test agent",
          skills: ["agent-browser"],
          prompt: "Base prompt",
        }) as AgentConfig,
    }

    // #when - no browserProvider (defaults to playwright)
    const agent = buildAgent(source["test-agent"], TEST_MODEL)

    // #then - agent-browser skill not found, only base prompt remains
    expect(agent.prompt).toBe("Base prompt")
    expect(agent.prompt).not.toContain("agent-browser open")
  })
})

describe("override.category expansion in createBuiltinAgents", () => {
  let providerModelsSpy: ReturnType<typeof spyOn>
  let fetchSpy: ReturnType<typeof spyOn>
  beforeEach(() => {
    providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
    fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
  })
  afterEach(() => {
    providerModelsSpy.mockRestore()
    fetchSpy.mockRestore()
  })

  test("standard agent override with category expands category properties", async () => {
    // #given
    const overrides = {
      oracle: { category: "ultrabrain" } as any,
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL)

    // #then - ultrabrain category: model=opencode/gpt-5.4, variant=xhigh
    expect(agents.oracle).toBeDefined()
    expect(agents.oracle.model).toBe("opencode/gpt-5.4")
    expect(agents.oracle.variant).toBe("xhigh")
  })

  test("standard agent override with category AND direct variant - direct wins", async () => {
    // #given - ultrabrain has variant=xhigh, but direct override says "max"
    const overrides = {
      oracle: { category: "ultrabrain", variant: "max" } as any,
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL)

    // #then - direct variant overrides category variant
    expect(agents.oracle).toBeDefined()
    expect(agents.oracle.variant).toBe("max")
  })

  test("standard agent override with category AND direct reasoningEffort - direct wins", async () => {
    // #given - custom category has reasoningEffort=xhigh, direct override says "low"
    const categories = {
      "test-cat": {
        model: "openai/gpt-5.4",
        reasoningEffort: "xhigh" as const,
      },
    }
    const overrides = {
      oracle: { category: "test-cat", reasoningEffort: "low" } as any,
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL, categories)

    // #then - direct reasoningEffort wins over category
    expect(agents.oracle).toBeDefined()
    expect(agents.oracle.reasoningEffort).toBe("low")
  })

  test("standard agent override with category applies reasoningEffort from category when no direct override", async () => {
    // #given - custom category has reasoningEffort, no direct reasoningEffort in override
    const categories = {
      "reasoning-cat": {
        model: "openai/gpt-5.4",
        reasoningEffort: "high" as const,
      },
    }
    const overrides = {
      oracle: { category: "reasoning-cat" } as any,
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL, categories)

    // #then - category reasoningEffort is applied
    expect(agents.oracle).toBeDefined()
    expect(agents.oracle.reasoningEffort).toBe("high")
  })

  test("sisyphus override with category expands category properties", async () => {
    // #given
    const overrides = {
      sisyphus: { category: "ultrabrain" } as any,
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL)

    // #then - ultrabrain category: model=opencode/gpt-5.4, variant=xhigh
    expect(agents.sisyphus).toBeDefined()
    expect(agents.sisyphus.model).toBe("opencode/gpt-5.4")
    expect(agents.sisyphus.variant).toBe("xhigh")
  })

  test("atlas override with category expands category properties", async () => {
    // #given
    const overrides = {
      atlas: { category: "ultrabrain" } as any,
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL)

    // #then - ultrabrain category: model=opencode/gpt-5.4, variant=xhigh
    expect(agents.atlas).toBeDefined()
    expect(agents.atlas.model).toBe("opencode/gpt-5.4")
    expect(agents.atlas.variant).toBe("xhigh")
  })

  test("override with non-existent category has no effect on config", async () => {
    // #given
    const overrides = {
      oracle: { category: "non-existent-category" } as any,
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL)

    // #then - no category-specific variant/reasoningEffort applied from non-existent category
    expect(agents.oracle).toBeDefined()
    const agentsWithoutOverride = await createBuiltinAgents([], {}, undefined, TEST_DEFAULT_MODEL)
    expect(agents.oracle.model).toBe(agentsWithoutOverride.oracle.model)
  })
})

describe("agent override tools migration", () => {
  let providerModelsSpy: ReturnType<typeof spyOn>
  let fetchSpy: ReturnType<typeof spyOn>
  beforeEach(() => {
    providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
    fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
  })
  afterEach(() => {
    providerModelsSpy.mockRestore()
    fetchSpy.mockRestore()
  })

  test("tools: { x: false } is migrated to permission: { x: deny }", async () => {
    // #given
    const overrides = {
      explore: { tools: { "jetbrains_*": false } } as any,
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL)

    // #then
    expect(agents.explore).toBeDefined()
    const permission = agents.explore.permission as Record<string, string>
    expect(permission["jetbrains_*"]).toBe("deny")
  })

  test("tools: { x: true } is migrated to permission: { x: allow }", async () => {
    // #given
    const overrides = {
      explore: { tools: { "jetbrains_get_*": true } } as any,
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL)

    // #then
    expect(agents.explore).toBeDefined()
    const permission = agents.explore.permission as Record<string, string>
    expect(permission["jetbrains_get_*"]).toBe("allow")
  })

  test("tools config is removed after migration", async () => {
    // #given
    const overrides = {
      explore: { tools: { "some_tool": false } } as any,
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL)

    // #then
    expect(agents.explore).toBeDefined()
    expect((agents.explore as any).tools).toBeUndefined()
  })
})

describe("Deadlock prevention - fetchAvailableModels must not receive client", () => {
   test("createBuiltinAgents should call fetchAvailableModels with undefined client to prevent deadlock", async () => {
     // #given - This test ensures we don't regress on issue #1301
     // Passing client to fetchAvailableModels during createBuiltinAgents (called from config handler)
     // causes deadlock:
     // - Plugin init waits for server response (client.provider.list())
     // - Server waits for plugin init to complete before handling requests
     const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set<string>())
     const cacheSpy = spyOn(shared, "readConnectedProvidersCache").mockReturnValue(null)

     // #when
     await createBuiltinAgents(
       [],
       {},
       undefined,
       TEST_DEFAULT_MODEL,
       undefined,
       undefined,
       []
     )

     // #then - fetchAvailableModels must be called with undefined as first argument (no client)
     // This prevents the deadlock described in issue #1301
     expect(fetchSpy).toHaveBeenCalled()
     const firstCallArgs = fetchSpy.mock.calls[0]
     expect(firstCallArgs[0]).toBeUndefined()

     fetchSpy.mockRestore?.()
     cacheSpy.mockRestore?.()
   })
  test("Hephaestus variant override respects user config over hardcoded default", async () => {
    // #given - user provides variant in config
    const providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
    const overrides = {
      hephaestus: { variant: "high" },
    }

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL)

    // #then - user variant takes precedence over hardcoded "medium"
    expect(agents.hephaestus).toBeDefined()
    expect(agents.hephaestus.variant).toBe("high")
    providerModelsSpy.mockRestore()
    fetchSpy.mockRestore()
  })

  test("Hephaestus uses default variant when no user override provided", async () => {
    // #given - no variant override in config
    const providerModelsSpy = spyOn(connectedProvidersCache, "readProviderModelsCache").mockReturnValue(null)
    const connectedSpy = spyOn(connectedProvidersCache, "readConnectedProvidersCache").mockReturnValue(null)
    const fetchSpy = spyOn(shared, "fetchAvailableModels").mockResolvedValue(new Set())
    const overrides = {}

    // #when
    const agents = await createBuiltinAgents([], overrides, undefined, TEST_DEFAULT_MODEL)

    // #then - default "medium" variant is applied
    expect(agents.hephaestus).toBeDefined()
    expect(agents.hephaestus.variant).toBe("medium")
    providerModelsSpy.mockRestore()
    connectedSpy.mockRestore()
    fetchSpy.mockRestore()
  })
})
