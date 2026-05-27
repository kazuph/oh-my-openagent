import { existsSync, mkdirSync, readFileSync, unlinkSync } from "node:fs"
import { dirname, join } from "node:path"

import type { SessionModel } from "./session-model-state"
import { getDataDir } from "./data-path"
import { log } from "./logger"
import { CACHE_DIR_NAME } from "./plugin-identity"
import { writeFileAtomically } from "./write-file-atomically"

const LAST_SELECTED_MAIN_MODEL_FILE = "last-selected-main-model.json"

function getLastSelectedMainModelStatePath(): string {
  return join(getDataDir(), CACHE_DIR_NAME, LAST_SELECTED_MAIN_MODEL_FILE)
}

function isSessionModel(value: unknown): value is SessionModel {
  if (!value || typeof value !== "object") return false

  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.providerID === "string" &&
    candidate.providerID.length > 0 &&
    typeof candidate.modelID === "string" &&
    candidate.modelID.length > 0
  )
}

export function loadLastSelectedMainModel(): SessionModel | null {
  const filePath = getLastSelectedMainModelStatePath()
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const parsed: unknown = JSON.parse(readFileSync(filePath, "utf-8"))
    if (!isSessionModel(parsed)) {
      log("[last-selected-main-model-state] Ignoring invalid state payload", {
        filePath,
      })
      return null
    }
    return parsed
  } catch (error) {
    log("[last-selected-main-model-state] Failed to read state", {
      filePath,
      error: String(error),
    })
    return null
  }
}

function isOpusModel(model: SessionModel): boolean {
  return model.modelID.toLowerCase().includes("opus")
}

export function saveLastSelectedMainModel(model: SessionModel): void {
  if (isOpusModel(model)) {
    return
  }
  const filePath = getLastSelectedMainModelStatePath()

  try {
    mkdirSync(dirname(filePath), { recursive: true })
    writeFileAtomically(filePath, `${JSON.stringify(model, null, 2)}\n`)
  } catch (error) {
    log("[last-selected-main-model-state] Failed to write state", {
      filePath,
      error: String(error),
      model,
    })
  }
}

export function clearLastSelectedMainModel(): void {
  const filePath = getLastSelectedMainModelStatePath()
  if (!existsSync(filePath)) {
    return
  }

  try {
    unlinkSync(filePath)
  } catch (error) {
    log("[last-selected-main-model-state] Failed to clear state", {
      filePath,
      error: String(error),
    })
  }
}
