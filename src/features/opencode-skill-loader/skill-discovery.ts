import type { BrowserAutomationProvider } from "../../config/schema/browser-automation"
import { createBuiltinSkills } from "../builtin-skills/skills"
import { discoverSkills } from "./loader"
import type { LoadedSkill } from "./types"
import type { SkillResolutionOptions } from "./skill-resolution-options"

const cachedSkillsByProvider = new Map<string, LoadedSkill[]>()
const PROVIDER_GATED_SKILL_NAMES = new Set([
	"agent-browser",
	"playwright",
	"playwright-cli",
	"dev-browser",
])
const BROWSER_PROVIDER_SKILL_NAMES: Record<BrowserAutomationProvider, ReadonlySet<string>> = {
	playwright: new Set(["playwright"]),
	"playwright-cli": new Set(["playwright", "playwright-cli"]),
	"agent-browser": new Set(["agent-browser"]),
	"dev-browser": new Set(["dev-browser"]),
}

export function clearSkillCache(): void {
	cachedSkillsByProvider.clear()
}

export async function getAllSkills(options?: SkillResolutionOptions): Promise<LoadedSkill[]> {
	const browserProvider = options?.browserProvider ?? "playwright-cli"
	const cacheKey = browserProvider
	const hasDisabledSkills = options?.disabledSkills && options.disabledSkills.size > 0

	// Skip cache if disabledSkills is provided (varies between calls)
	if (!hasDisabledSkills) {
		const cached = cachedSkillsByProvider.get(cacheKey)
		if (cached) return cached
	}

	const [discoveredSkills, builtinSkillDefinitions] = await Promise.all([
		discoverSkills({ includeClaudeCodePaths: true, directory: options?.directory }),
		Promise.resolve(
			createBuiltinSkills({
				browserProvider: options?.browserProvider,
				disabledSkills: options?.disabledSkills,
			})
		),
	])

	const builtinSkillsAsLoaded: LoadedSkill[] = builtinSkillDefinitions.map((skill) => ({
		name: skill.name,
		definition: {
			name: skill.name,
			description: skill.description,
			template: skill.template,
			model: skill.model,
			agent: skill.agent,
			subtask: skill.subtask,
		},
		scope: "builtin" as const,
		license: skill.license,
		compatibility: skill.compatibility,
		metadata: skill.metadata as Record<string, string> | undefined,
		allowedTools: skill.allowedTools,
		mcpConfig: skill.mcpConfig,
	}))

	const allowedSkillNames = BROWSER_PROVIDER_SKILL_NAMES[browserProvider]

	// Filter discovered skills to exclude provider-gated names that don't match the selected provider
	const filteredDiscoveredSkills = discoveredSkills.filter((skill) => {
		if (!PROVIDER_GATED_SKILL_NAMES.has(skill.name)) {
			return true
		}

		return allowedSkillNames.has(skill.name)
	})

	const discoveredNames = new Set(filteredDiscoveredSkills.map((skill) => skill.name))
	const uniqueBuiltins = builtinSkillsAsLoaded.filter((skill) => !discoveredNames.has(skill.name))

	let allSkills = [...filteredDiscoveredSkills, ...uniqueBuiltins]

	// Filter discovered skills by disabledSkills (builtin skills are already filtered by createBuiltinSkills)
	if (hasDisabledSkills) {
		allSkills = allSkills.filter((skill) => !options!.disabledSkills!.has(skill.name))
	} else {
		cachedSkillsByProvider.set(cacheKey, allSkills)
	}

	return allSkills
}
