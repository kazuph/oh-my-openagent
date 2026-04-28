import { describe, expect, test } from "bun:test"

import { BUILTIN_SERVERS, LSP_INSTALL_HINTS } from "./server-definitions"

describe("server-definitions", () => {
  test("core language built-ins use their primary language servers", () => {
    expect(BUILTIN_SERVERS.typescript?.command).toEqual([
      "typescript-language-server",
      "--stdio",
    ])
    expect(BUILTIN_SERVERS.gopls?.command).toEqual(["gopls"])
    expect(BUILTIN_SERVERS.rust?.command).toEqual(["rust-analyzer"])
    expect(BUILTIN_SERVERS["ruby-lsp"]?.command).toEqual(["ruby-lsp"])
  })

  test("ruby-lsp built-in uses the ruby-lsp executable", () => {
    expect(BUILTIN_SERVERS["ruby-lsp"]).toEqual({
      command: ["ruby-lsp"],
      extensions: [".rb", ".rake", ".gemspec", ".ru"],
    })
  })

  test("ruby-lsp install hint matches the built-in server id", () => {
    expect(LSP_INSTALL_HINTS["ruby-lsp"]).toBe("gem install ruby-lsp")
  })
})
