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

describe("applyMcpConfig", () => {
  test("preserves enabled:false from user config", async () => {
    //#given
    const userMcp = {
      firecrawl: { type: "remote", url: "https://firecrawl.example.com", enabled: false },
      exa: { type: "remote", url: "https://exa.example.com", enabled: true },
    }

    const config: Record<string, unknown> = { mcp: userMcp }
    const pluginConfig = createPluginConfig()

    //#when
    const { applyMcpConfig } = await import("./mcp-config-handler")
    await applyMcpConfig({ config, pluginConfig, pluginComponents: EMPTY_PLUGIN_COMPONENTS })

    //#then
    const mergedMcp = config.mcp as Record<string, Record<string, unknown>>
    expect(mergedMcp.firecrawl.enabled).toBe(false)
    expect(mergedMcp.exa.enabled).toBe(true)
  })

  test("applies disabled_mcps to user MCPs", async () => {
    //#given
    const config: Record<string, unknown> = {
      mcp: {
        playwright: { type: "local", command: ["npx", "@playwright/mcp"], enabled: true },
        keepme: { type: "local", command: ["npx", "keepme"], enabled: true },
      },
    }
    const pluginConfig = createPluginConfig({ disabled_mcps: ["playwright"] as any })

    //#when
    const { applyMcpConfig } = await import("./mcp-config-handler")
    await applyMcpConfig({
      config,
      pluginConfig,
      pluginComponents: {
        ...EMPTY_PLUGIN_COMPONENTS,
        mcpServers: {
          "plugin:custom": { type: "local", command: ["npx", "custom"], enabled: true },
        },
      },
    })

    //#then
    const mergedMcp = config.mcp as Record<string, Record<string, unknown>>
    expect(mergedMcp).not.toHaveProperty("playwright")
    expect(mergedMcp).toHaveProperty("keepme")
  })

  test("keeps explicit user MCPs and does not add hidden MCPs", async () => {
    //#given
    const config: Record<string, unknown> = {
      mcp: {
        exa: { type: "remote", url: "https://exa.example.com", enabled: true },
      },
    }
    const pluginConfig = createPluginConfig()

    //#when
    const { applyMcpConfig } = await import("./mcp-config-handler")
    await applyMcpConfig({ config, pluginConfig, pluginComponents: EMPTY_PLUGIN_COMPONENTS })

    //#then
    expect(config.mcp).toEqual({
      exa: { type: "remote", url: "https://exa.example.com", enabled: true },
    })
  })

  test("works when no user MCPs have enabled:false", async () => {
    //#given
    const userMcp = {
      exa: { type: "remote", url: "https://exa.example.com", enabled: true },
    }

    const config: Record<string, unknown> = { mcp: userMcp }
    const pluginConfig = createPluginConfig()

    //#when
    const { applyMcpConfig } = await import("./mcp-config-handler")
    await applyMcpConfig({ config, pluginConfig, pluginComponents: EMPTY_PLUGIN_COMPONENTS })

    //#then
    const mergedMcp = config.mcp as Record<string, Record<string, unknown>>
    expect(mergedMcp.exa.enabled).toBe(true)
    expect(Object.keys(mergedMcp)).toEqual(["exa"])
  })

  test("does not inject plugin MCPs", async () => {
    //#given
    const config: Record<string, unknown> = { mcp: {} }
    const pluginConfig = createPluginConfig()

    //#when
    const { applyMcpConfig } = await import("./mcp-config-handler")
    await applyMcpConfig({
      config,
      pluginConfig,
      pluginComponents: {
        ...EMPTY_PLUGIN_COMPONENTS,
        mcpServers: {
          "plugin:custom": { type: "local", command: ["npx", "custom"], enabled: true },
        },
      },
    })

    //#then
    const mergedMcp = config.mcp as Record<string, Record<string, unknown>>
    expect(mergedMcp).toEqual({})
  })
})
