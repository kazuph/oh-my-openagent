import { existsSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"

import type { DependencyInfo } from "../types"
import { spawnWithTimeout } from "../spawn-with-timeout"

async function checkBinaryExists(binary: string): Promise<{ exists: boolean; path: string | null }> {
  try {
    const path = Bun.which(binary)
    if (path) {
      return { exists: true, path }
    }
  } catch {
    // intentionally empty - binary not found
  }
  return { exists: false, path: null }
}

async function getBinaryVersion(binary: string): Promise<string | null> {
  try {
    const result = await spawnWithTimeout([binary, "--version"], { stdout: "pipe", stderr: "pipe" })
    if (result.timedOut || result.exitCode !== 0) return null
    return result.stdout.trim().split("\n")[0] ?? null
  } catch {
    return null
  }
}

export async function checkAstGrepCli(): Promise<DependencyInfo> {
  const binaryCheck = await checkBinaryExists("sg")
  const altBinaryCheck = !binaryCheck.exists ? await checkBinaryExists("ast-grep") : null

  const binary = binaryCheck.exists ? binaryCheck : altBinaryCheck
  if (!binary || !binary.exists) {
    return {
      name: "AST-Grep CLI",
      required: false,
      installed: false,
      version: null,
      path: null,
      installHint: "Install: npm install -g @ast-grep/cli",
    }
  }

  const version = await getBinaryVersion(binary.path!)

  return {
    name: "AST-Grep CLI",
    required: false,
    installed: true,
    version,
    path: binary.path,
  }
}

export async function checkAstGrepNapi(): Promise<DependencyInfo> {
  // Try dynamic import first (works in bunx temporary environments)
  try {
    await import("@ast-grep/napi")
    return {
      name: "AST-Grep NAPI",
      required: false,
      installed: true,
      version: null,
      path: null,
    }
  } catch {
    // Fallback: check common installation paths
    const { existsSync } = await import("fs")
    const { join } = await import("path")
    const { homedir } = await import("os")

    const pathsToCheck = [
      join(homedir(), ".config", "opencode", "node_modules", "@ast-grep", "napi"),
      join(process.cwd(), "node_modules", "@ast-grep", "napi"),
    ]

    for (const napiPath of pathsToCheck) {
      if (existsSync(napiPath)) {
        return {
          name: "AST-Grep NAPI",
          required: false,
          installed: true,
          version: null,
          path: napiPath,
        }
      }
    }

    return {
      name: "AST-Grep NAPI",
      required: false,
      installed: false,
      version: null,
      path: null,
      installHint: "Will use CLI fallback if available",
    }
  }
}
