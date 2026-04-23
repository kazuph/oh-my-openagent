import os from "os"
import { createHash } from "node:crypto"
import { PUBLISHED_PACKAGE_NAME } from "./plugin-identity"

type PostHogCaptureEvent = {
  distinctId?: string
  event: string
  properties?: Record<string, unknown>
}
type PostHogExceptionProperties = Record<string, unknown>
type PostHogSource = "cli" | "plugin"
type PostHogActivityReason = "run_started" | "plugin_loaded"

type PostHogClient = {
  capture: (message: PostHogCaptureEvent) => void
  captureException: (
    error: unknown,
    distinctId?: string,
    additionalProperties?: PostHogExceptionProperties,
  ) => void
  trackActive: (distinctId: string, reason: PostHogActivityReason) => void
  shutdown: () => Promise<void>
}

const NO_OP_POSTHOG: PostHogClient = {
  capture: () => undefined,
  captureException: () => undefined,
  trackActive: () => undefined,
  shutdown: async () => undefined,
}

function createPostHogClient(_source: PostHogSource): PostHogClient {
  return NO_OP_POSTHOG
}

export function getPostHogDistinctId(): string {
  return createHash("sha256")
    .update(`${PUBLISHED_PACKAGE_NAME}:${os.hostname()}`)
    .digest("hex")
}

export function createCliPostHog(): PostHogClient {
  return createPostHogClient("cli")
}

export function createPluginPostHog(): PostHogClient {
  return createPostHogClient("plugin")
}
