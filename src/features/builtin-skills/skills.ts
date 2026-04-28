import type { BuiltinSkill } from "./types"
import type { BrowserAutomationProvider } from "../../config/schema"

import {
  frontendUiUxSkill,
  gitMasterSkill,
  aiSlopRemoverSkill,
  librarianSkill,
} from "./skills/index"

export interface CreateBuiltinSkillsOptions {
  browserProvider?: BrowserAutomationProvider
  disabledSkills?: Set<string>
}

export function createBuiltinSkills(options: CreateBuiltinSkillsOptions = {}): BuiltinSkill[] {
  const { disabledSkills } = options

  const skills = [frontendUiUxSkill, gitMasterSkill, aiSlopRemoverSkill, librarianSkill]

  if (!disabledSkills) {
    return skills
  }

  return skills.filter((skill) => !disabledSkills.has(skill.name))
}
