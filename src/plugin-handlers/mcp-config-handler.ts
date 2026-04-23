import type { OhMyOpenCodeConfig } from "../config";
import type { PluginComponents } from "./plugin-components-loader";

type McpEntry = Record<string, unknown>;

function isDisabledMcpEntry(value: unknown): value is McpEntry & { enabled: false } {
  return typeof value === "object" && value !== null && (value as McpEntry).enabled === false;
}

function captureUserDisabledMcps(
  userMcp: Record<string, unknown> | undefined
): Set<string> {
  const disabled = new Set<string>();
  if (!userMcp) return disabled;

  for (const [name, value] of Object.entries(userMcp)) {
    if (isDisabledMcpEntry(value)) {
      disabled.add(name);
    }
  }

  return disabled;
}

export async function applyMcpConfig(params: {
  config: Record<string, unknown>;
  pluginConfig: OhMyOpenCodeConfig;
  pluginComponents: PluginComponents;
}): Promise<void> {
  const userMcp = params.config.mcp as Record<string, unknown> | undefined;
  const userDisabledMcps = captureUserDisabledMcps(userMcp);
  const disabledMcps = new Set(params.pluginConfig.disabled_mcps ?? []);
  const merged = { ...(userMcp ?? {}) } as Record<string, McpEntry>;

  for (const name of userDisabledMcps) {
    if (merged[name]) {
      merged[name] = { ...merged[name], enabled: false };
    }
  }

  for (const name of disabledMcps) {
    delete merged[name];
  }

  params.config.mcp = merged;
}
