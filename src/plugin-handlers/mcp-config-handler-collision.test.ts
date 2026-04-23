/// <reference types="bun-types" />

import { describe, test, expect } from "bun:test"
import type { OhMyOpenCodeConfig } from "../config"

function createPluginConfig(overrides: Partial<OhMyOpenCodeConfig> = {}): OhMyOpenCodeConfig {
  return {
    disabled_mcps: [],
    ...overrides,
  } as OhMyOpenCodeConfig
}

const EMPTY_PLUGIN_COMPONENTS = {
  commands: {},
  skills: {},
  agents: {},
  mcpServers: {},
  hooksConfigs: [],
  plugins: [],
  errors: [],
}

async function importFreshMcpConfigHandlerModule(): Promise<typeof import("./mcp-config-handler")> {
  return import(`./mcp-config-handler?test=${Date.now()}-${Math.random()}`)
}

describe("applyMcpConfig collision handling", () => {
  test("keeps explicit user MCPs", async () => {
    //#given
    const userMcp = {
      userServer: { type: "remote", url: "https://user.example.com", enabled: true },
    }

    const config: Record<string, unknown> = { mcp: userMcp }
    const pluginConfig = createPluginConfig()

    //#when
    const { applyMcpConfig } = await importFreshMcpConfigHandlerModule()
    await applyMcpConfig({ config, pluginConfig, pluginComponents: EMPTY_PLUGIN_COMPONENTS })

    //#then
    const mergedMcp = config.mcp as Record<string, Record<string, unknown>>
    expect(mergedMcp).toHaveProperty("userServer")
    expect(mergedMcp.userServer.enabled).toBe(true)
  })

  test("does not inject colliding MCPs from external sources", async () => {
    //#given
    const userMcp = {
      sharedServer: { type: "remote", url: "https://user.example.com", enabled: true },
    }

    const config: Record<string, unknown> = { mcp: userMcp }
    const pluginConfig = createPluginConfig()

    //#when
    const { applyMcpConfig } = await importFreshMcpConfigHandlerModule()
    await applyMcpConfig({ config, pluginConfig, pluginComponents: EMPTY_PLUGIN_COMPONENTS })

    //#then
    const mergedMcp = config.mcp as Record<string, Record<string, unknown>>
    expect(mergedMcp.sharedServer.url).toBe("https://user.example.com")
  })

  test("preserves enabled:false from user config", async () => {
    //#given
    const userMcp = {
      sharedServer: { type: "remote", url: "https://user.example.com", enabled: false },
    }

    const config: Record<string, unknown> = { mcp: userMcp }
    const pluginConfig = createPluginConfig()

    //#when
    const { applyMcpConfig } = await importFreshMcpConfigHandlerModule()
    await applyMcpConfig({ config, pluginConfig, pluginComponents: EMPTY_PLUGIN_COMPONENTS })

    //#then
    const mergedMcp = config.mcp as Record<string, Record<string, unknown>>
    expect(mergedMcp.sharedServer.enabled).toBe(false)
    expect(mergedMcp.sharedServer.url).toBe("https://user.example.com")
  })
})
