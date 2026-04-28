import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"

describe("experimental.session.compacting handler", () => {
  function createCompactingHandler(hooks: {
    compactionContextInjector?: {
      capture: (sessionID: string) => Promise<void>
      inject: (sessionID: string) => string
    }
    compactionTodoPreserver?: { capture: (sessionID: string) => Promise<void> }
    claudeCodeHooks?: {
      "experimental.session.compacting"?: (
        input: { sessionID: string },
        output: { context: string[] },
      ) => Promise<void>
    }
  }) {
    return async (
      _input: { sessionID: string },
      output: { context: string[] },
    ): Promise<void> => {
      await hooks.compactionContextInjector?.capture(_input.sessionID)
      await hooks.compactionTodoPreserver?.capture(_input.sessionID)
      await hooks.claudeCodeHooks?.["experimental.session.compacting"]?.(
        _input,
        output,
      )
      if (hooks.compactionContextInjector) {
        output.context.push(hooks.compactionContextInjector.inject(_input.sessionID))
      }
    }
  }

  //#given all three hooks are present
  //#when compacting handler is invoked
  //#then all hooks are called in order: capture → PreCompact → contextInjector
  it("calls claudeCodeHooks PreCompact alongside other hooks", async () => {
    const callOrder: string[] = []

    const handler = createCompactingHandler({
      compactionContextInjector: {
        capture: mock(async () => {
          callOrder.push("checkpointCapture")
        }),
        inject: mock((sessionID: string) => {
          callOrder.push("contextInjector")
          return `context-for-${sessionID}`
        }),
      },
      compactionTodoPreserver: {
        capture: mock(async () => { callOrder.push("capture") }),
      },
      claudeCodeHooks: {
        "experimental.session.compacting": mock(async () => {
          callOrder.push("preCompact")
        }),
      },
    })

    const output = { context: [] as string[] }
    await handler({ sessionID: "ses_test" }, output)

    expect(callOrder).toEqual(["checkpointCapture", "capture", "preCompact", "contextInjector"])
    expect(output.context).toEqual(["context-for-ses_test"])
  })

  //#given claudeCodeHooks injects context during PreCompact
  //#when compacting handler is invoked
  //#then injected context from PreCompact is preserved in output
  it("preserves context injected by PreCompact hooks", async () => {
    const handler = createCompactingHandler({
      claudeCodeHooks: {
        "experimental.session.compacting": async (_input, output) => {
          output.context.push("precompact-injected-context")
        },
      },
    })

    const output = { context: [] as string[] }
    await handler({ sessionID: "ses_test" }, output)

    expect(output.context).toContain("precompact-injected-context")
  })

  //#given claudeCodeHooks is null (no claude code hooks configured)
  //#when compacting handler is invoked
  //#then handler completes without error and other hooks still run
  it("handles null claudeCodeHooks gracefully", async () => {
    const captureMock = mock(async () => {})
    const checkpointCaptureMock = mock(async () => {})
    const contextMock = mock(() => "injected-context")

    const handler = createCompactingHandler({
      compactionContextInjector: {
        capture: checkpointCaptureMock,
        inject: contextMock,
      },
      compactionTodoPreserver: { capture: captureMock },
      claudeCodeHooks: undefined,
    })

    const output = { context: [] as string[] }
    await handler({ sessionID: "ses_test" }, output)

    expect(checkpointCaptureMock).toHaveBeenCalledWith("ses_test")
    expect(captureMock).toHaveBeenCalledWith("ses_test")
    expect(contextMock).toHaveBeenCalledWith("ses_test")
    expect(output.context).toEqual(["injected-context"])
  })

  //#given compactionContextInjector is null
  //#when compacting handler is invoked
  //#then handler does not early-return, PreCompact hooks still execute
  it("does not early-return when compactionContextInjector is null", async () => {
    const preCompactMock = mock(async () => {})

    const handler = createCompactingHandler({
      claudeCodeHooks: {
        "experimental.session.compacting": preCompactMock,
      },
      compactionContextInjector: undefined,
    })

    const output = { context: [] as string[] }
    await handler({ sessionID: "ses_test" }, output)

    expect(preCompactMock).toHaveBeenCalled()
    expect(output.context).toEqual([])
  })
})

const mockInitConfigContext = mock(() => {})
const mockDetectExternalSkillPlugin = mock(() => ({ detected: false, pluginName: null }))
const mockGetSkillPluginConflictWarning = mock(() => "")
const mockInjectServerAuthIntoClient = mock(() => {})
const mockLogLegacyPluginStartupWarning = mock(() => {})
const mockLoadPluginConfig = mock(() => ({}))
const mockIsTmuxIntegrationEnabled = mock(
  (pluginConfig: { tmux?: { enabled?: boolean } | undefined }) => pluginConfig.tmux?.enabled ?? false,
)
const mockIsInteractiveBashEnabled = mock(() => false)
const mockCreateRuntimeTmuxConfig = mock(() => ({
  enabled: false,
  layout: "tiled" as const,
  main_pane_size: 60,
  main_pane_min_width: 80,
  agent_pane_min_width: 40,
  isolation: "inline" as const,
}))
const mockCreateManagers = mock(() => ({
  backgroundManager: { shutdown: async () => {} },
  skillMcpManager: { disconnectAll: async () => {} },
  configHandler: async () => {},
}))
const mockCreateTools = mock(async () => ({
  mergedSkills: [],
  availableSkills: [],
  filteredTools: {},
}))
const mockCreateHooks = mock(() => ({
  disposeHooks: () => {},
  compactionContextInjector: undefined,
  compactionTodoPreserver: undefined,
  claudeCodeHooks: undefined,
}))
const mockCreatePluginDispose = mock(() => async () => {})
const mockCreatePluginInterface = mock(() => ({}))
const mockStartTmuxCheck = mock(() => {})

let OhMyOpenCodePlugin: (typeof import("./index"))["default"]

function installIndexModuleMocks(): void {
  mock.module("./cli/config-manager/config-context", () => ({
    initConfigContext: mockInitConfigContext,
  }))

  mock.module("./shared/external-plugin-detector", () => ({
    detectExternalSkillPlugin: mockDetectExternalSkillPlugin,
    getSkillPluginConflictWarning: mockGetSkillPluginConflictWarning,
  }))

  mock.module("./shared", () => ({
    injectServerAuthIntoClient: mockInjectServerAuthIntoClient,
    log: mock(() => {}),
    logLegacyPluginStartupWarning: mockLogLegacyPluginStartupWarning,
  }))

  mock.module("./plugin-config", () => ({
    loadPluginConfig: mockLoadPluginConfig,
  }))

  mock.module("./create-runtime-tmux-config", () => ({
    createRuntimeTmuxConfig: mockCreateRuntimeTmuxConfig,
    isTmuxIntegrationEnabled: mockIsTmuxIntegrationEnabled,
    isInteractiveBashEnabled: mockIsInteractiveBashEnabled,
  }))

  mock.module("./create-managers", () => ({
    createManagers: mockCreateManagers,
  }))

  mock.module("./create-tools", () => ({
    createTools: mockCreateTools,
  }))

  mock.module("./create-hooks", () => ({
    createHooks: mockCreateHooks,
  }))

  mock.module("./plugin-dispose", () => ({
    createPluginDispose: mockCreatePluginDispose,
  }))

  mock.module("./plugin-interface", () => ({
    createPluginInterface: mockCreatePluginInterface,
  }))

  mock.module("./plugin-state", () => ({
    createModelCacheState: mock(() => ({})),
  }))

  mock.module("./shared/first-message-variant", () => ({
    createFirstMessageVariantGate: mock(() => ({
      shouldOverride: () => false,
      markApplied: () => {},
      markSessionCreated: () => {},
      clear: () => {},
    })),
  }))

  mock.module("./tools/interactive-bash", () => ({
    interactive_bash: {},
    startBackgroundCheck: mockStartTmuxCheck,
  }))

}

async function importFreshIndexModule(): Promise<typeof import("./index")> {
  return import(`./index?test=${Date.now()}-${Math.random()}`)
}

describe("OhMyOpenCodePlugin", () => {
  beforeEach(async () => {
    mock.restore()
    installIndexModuleMocks()
    ;({ default: OhMyOpenCodePlugin } = await importFreshIndexModule())
    mockInitConfigContext.mockClear()
    mockDetectExternalSkillPlugin.mockClear()
    mockGetSkillPluginConflictWarning.mockClear()
    mockInjectServerAuthIntoClient.mockClear()
    mockLogLegacyPluginStartupWarning.mockClear()
    mockLoadPluginConfig.mockClear()
    mockIsTmuxIntegrationEnabled.mockClear()
    mockIsInteractiveBashEnabled.mockClear()
    mockCreateRuntimeTmuxConfig.mockClear()
    mockCreateManagers.mockClear()
    mockCreateTools.mockClear()
    mockCreateHooks.mockClear()
    mockCreatePluginDispose.mockClear()
    mockCreatePluginInterface.mockClear()
    mockStartTmuxCheck.mockClear()
  })

  afterEach(() => {
    mock.restore()
  })

  it("still loads when plugin config contains unused legacy fields", async () => {
    // given
    mockLoadPluginConfig.mockReturnValue({
      auto_update: true,
      legacy_remote_mcp: true,
    })

    // when
    const result = await OhMyOpenCodePlugin({
      directory: "/tmp/project",
      client: {},
    } as Parameters<typeof OhMyOpenCodePlugin>[0])

    // then
    expect(result).toMatchObject({ name: "oh-my-openagent" })
  })

  it("still loads when optional legacy fields are absent", async () => {
    // given
    mockLoadPluginConfig.mockReturnValue({})

    // when
    const result = await OhMyOpenCodePlugin({
      directory: "/tmp/project",
      client: {},
    } as Parameters<typeof OhMyOpenCodePlugin>[0])

    // then
    expect(result).toMatchObject({ name: "oh-my-openagent" })
  })
})
