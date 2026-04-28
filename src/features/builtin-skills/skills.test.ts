import { describe, test, expect } from "bun:test"
import { createBuiltinSkills } from "./skills"

describe("createBuiltinSkills", () => {
	test("returns only local-only built-in skills by default", () => {
		// #given - default options

		// #when
		const skills = createBuiltinSkills()

		// #then
		expect(skills.map((skill) => skill.name)).toEqual([
			"frontend-ui-ux",
			"git-master",
			"ai-slop-remover",
			"librarian",
		])
	})

	test("does not auto-load external browser or review skills", () => {
		// given

		// when
		const skills = createBuiltinSkills()

		// then
		expect(skills.map((skill) => skill.name)).not.toContain("playwright")
		expect(skills.map((skill) => skill.name)).not.toContain("playwright-cli")
		expect(skills.map((skill) => skill.name)).not.toContain("agent-browser")
		expect(skills.map((skill) => skill.name)).not.toContain("dev-browser")
		expect(skills.map((skill) => skill.name)).not.toContain("review-work")
	})

	test("browserProvider does not change the local-only built-in set", () => {
		// given
		const defaultSkills = createBuiltinSkills()
		const agentBrowserSkills = createBuiltinSkills({ browserProvider: "agent-browser" })
		const playwrightCliSkills = createBuiltinSkills({ browserProvider: "playwright-cli" })

		// then
		expect(agentBrowserSkills).toEqual(defaultSkills)
		expect(playwrightCliSkills).toEqual(defaultSkills)
	})

	test("should exclude local-only skills when they are in disabledSkills", () => {
		// #given
		const options = { disabledSkills: new Set(["git-master"]) }

		// #when
		const skills = createBuiltinSkills(options)

		// #then
		expect(skills.map((s) => s.name)).not.toContain("git-master")
		expect(skills.map((s) => s.name)).toContain("frontend-ui-ux")
		expect(skills.map((s) => s.name)).toContain("ai-slop-remover")
		expect(skills.map((s) => s.name)).toContain("librarian")
		expect(skills.length).toBe(3)
	})

	test("should return an empty array when all local-only built-ins are disabled", () => {
		// #given
		const options = {
			disabledSkills: new Set(["frontend-ui-ux", "git-master", "ai-slop-remover"]),
			// librarian remains opt-in unless explicitly disabled too
		}

		// #when
		const skills = createBuiltinSkills(options)

		// #then
		expect(skills.length).toBe(1)
		expect(skills[0]?.name).toBe("librarian")
	})

	test("should return all local-only skills when disabledSkills set is empty", () => {
		// #given
		const options = { disabledSkills: new Set<string>() }

		// #when
		const skills = createBuiltinSkills(options)

		// #then
		expect(skills.length).toBe(4)
	})

	test("ai-slop-remover skill has correct structure", () => {
		// #given - default options

		// #when
		const skills = createBuiltinSkills()
		const aiSlopRemover = skills.find((s) => s.name === "ai-slop-remover")

		// #then
		expect(aiSlopRemover).toBeDefined()
		expect(aiSlopRemover!.description).toContain("AI-generated code smells")
		expect(aiSlopRemover!.template).toContain("DETECTION CRITERIA")
		expect(aiSlopRemover!.template).toContain("SAFETY RULES")
	})
})
