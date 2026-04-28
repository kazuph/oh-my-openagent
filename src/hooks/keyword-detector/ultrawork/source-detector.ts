/**
 * Agent detection utilities for ultrawork message routing.
 *
 * Routing logic:
 * 1. Planner agents (prometheus, plan) → planner.ts
 * 2. Everything else → default.ts
 */

/**
 * Checks if agent is a planner-type agent.
 * Planners don't need ultrawork injection (they ARE the planner).
 */
export function isPlannerAgent(agentName?: string): boolean {
  if (!agentName) return false
  const lowerName = agentName.toLowerCase()
  if (lowerName.includes("prometheus") || lowerName.includes("planner")) return true

  const normalized = lowerName.replace(/[_-]+/g, " ")
  return /\bplan\b/.test(normalized)
}

/**
 * Checks if agent is a non-OMO agent (e.g., OpenCode's built-in Builder/Plan).
 * Non-OMO agents should not receive keyword injection (search-mode, analyze-mode, etc.).
 */
export function isNonOmoAgent(agentName?: string): boolean {
  if (!agentName) return false
  const lowerName = agentName.toLowerCase()
  return lowerName.includes("builder") || lowerName === "plan"
}

/** Ultrawork message source type */
export type UltraworkSource = "planner" | "default"

/**
 * Determines which ultrawork message source to use.
 */
export function getUltraworkSource(
  agentName?: string,
  _modelID?: string
): UltraworkSource {
  // Priority 1: Planner agents
  if (isPlannerAgent(agentName)) {
    return "planner"
  }

  return "default"
}
