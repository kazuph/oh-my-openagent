import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"

import {
  clearLastSelectedMainModel,
  loadLastSelectedMainModel,
  saveLastSelectedMainModel,
} from "./last-selected-main-model-state"

describe("last-selected-main-model-state", () => {
  let tempDataDir: string
  let previousDataHome: string | undefined

  beforeEach(() => {
    tempDataDir = mkdtempSync(join(tmpdir(), "omo-last-model-"))
    previousDataHome = process.env.XDG_DATA_HOME
    process.env.XDG_DATA_HOME = tempDataDir
    clearLastSelectedMainModel()
  })

  afterEach(() => {
    clearLastSelectedMainModel()
    if (previousDataHome === undefined) {
      delete process.env.XDG_DATA_HOME
    } else {
      process.env.XDG_DATA_HOME = previousDataHome
    }
    rmSync(tempDataDir, { recursive: true, force: true })
  })

  test("persists and reloads the last selected main model", () => {
    saveLastSelectedMainModel({
      providerID: "openai",
      modelID: "gpt-5.4",
    })

    expect(loadLastSelectedMainModel()).toEqual({
      providerID: "openai",
      modelID: "gpt-5.4",
    })
  })

  test("returns null when no saved model exists", () => {
    expect(loadLastSelectedMainModel()).toBeNull()
  })
})
