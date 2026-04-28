import { afterEach, describe, expect, mock, spyOn, test } from "bun:test"

import * as serverConfigLoader from "./server-config-loader"
import * as serverInstallation from "./server-installation"
import { findServerForExtension } from "./server-resolution"

describe("server-resolution", () => {
  afterEach(() => {
    mock.restore()
  })

  test("prefers the primary TypeScript server over complementary diagnostics servers", () => {
    spyOn(serverConfigLoader, "getMergedServers").mockReturnValue([
      {
        id: "typescript",
        command: ["typescript-language-server", "--stdio"],
        extensions: [".ts", ".tsx"],
        priority: -100,
        source: "opencode",
      },
      {
        id: "eslint",
        command: ["vscode-eslint-language-server", "--stdio"],
        extensions: [".ts", ".tsx"],
        priority: -100,
        source: "opencode",
      },
      {
        id: "biome",
        command: ["biome", "lsp-proxy", "--stdio"],
        extensions: [".ts", ".tsx"],
        priority: -100,
        source: "opencode",
      },
    ])
    spyOn(serverInstallation, "isServerInstalled").mockReturnValue(true)

    const result = findServerForExtension(".ts")

    expect(result.status).toBe("found")
    if (result.status !== "found") {
      throw new Error("expected a found TypeScript server")
    }
    expect(result.server.id).toBe("typescript")
    expect(result.server.command).toEqual([
      "typescript-language-server",
      "--stdio",
    ])
  })

  test("uses the primary namesake servers for Go, Rust, and Ruby", () => {
    spyOn(serverConfigLoader, "getMergedServers").mockReturnValue([
      {
        id: "gopls",
        command: ["gopls"],
        extensions: [".go"],
        priority: -100,
        source: "opencode",
      },
      {
        id: "rust",
        command: ["rust-analyzer"],
        extensions: [".rs"],
        priority: -100,
        source: "opencode",
      },
      {
        id: "ruby-lsp",
        command: ["ruby-lsp"],
        extensions: [".rb", ".rake", ".gemspec", ".ru"],
        priority: -100,
        source: "opencode",
      },
    ])
    spyOn(serverInstallation, "isServerInstalled").mockReturnValue(true)

    const goResult = findServerForExtension(".go")
    const rustResult = findServerForExtension(".rs")
    const rubyResult = findServerForExtension(".rb")

    expect(goResult.status).toBe("found")
    expect(rustResult.status).toBe("found")
    expect(rubyResult.status).toBe("found")

    if (goResult.status === "found") {
      expect(goResult.server.id).toBe("gopls")
    }
    if (rustResult.status === "found") {
      expect(rustResult.server.id).toBe("rust")
    }
    if (rubyResult.status === "found") {
      expect(rubyResult.server.id).toBe("ruby-lsp")
    }
  })
})
