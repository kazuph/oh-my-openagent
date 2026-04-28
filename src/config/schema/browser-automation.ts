import { z } from "zod"

export const BrowserAutomationProviderSchema = z.enum([
  "playwright",
  "agent-browser",
  "dev-browser",
  "playwright-cli",
])

export const BrowserAutomationConfigSchema = z.object({
  /**
   * Browser automation provider preference for discovered browser skills.
   * OMO no longer auto-bundles browser automation skills by default.
   * - "playwright": Prefer a discovered Claude Code/OpenCode skill named "playwright"
   * - "playwright-cli": Prefer discovered "playwright-cli" or canonical "playwright" skills - default
   * - "agent-browser": Prefer a discovered "agent-browser" skill
   * - "dev-browser": Prefer a discovered "dev-browser" skill
   */
  provider: BrowserAutomationProviderSchema.default("playwright-cli"),
})

export type BrowserAutomationProvider = z.infer<
  typeof BrowserAutomationProviderSchema
>
export type BrowserAutomationConfig = z.infer<typeof BrowserAutomationConfigSchema>
