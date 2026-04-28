/**
 * Ultrawork message module - planner agents get planner instructions, everything
 * else uses the default message.
 *
 * Routing:
 * 1. Planner agents (prometheus, plan) → planner.ts
 * 2. All other agents/models → default.ts
 */

export {
  isPlannerAgent,
  isNonOmoAgent,
  getUltraworkSource,
} from "./source-detector";
export type { UltraworkSource } from "./source-detector";
export {
  ULTRAWORK_PLANNER_SECTION,
  getPlannerUltraworkMessage,
} from "./planner";
export {
  ULTRAWORK_DEFAULT_MESSAGE,
  getDefaultUltraworkMessage,
} from "./default";

import { getUltraworkSource } from "./source-detector";
import { getPlannerUltraworkMessage } from "./planner";
import { getDefaultUltraworkMessage } from "./default";

/**
 * Gets the appropriate ultrawork message based on agent and model context.
 */
export function getUltraworkMessage(
  agentName?: string,
  modelID?: string,
): string {
  const source = getUltraworkSource(agentName, modelID);

  switch (source) {
    case "planner":
      return getPlannerUltraworkMessage();
    case "default":
    default:
      return getDefaultUltraworkMessage();
  }
}
