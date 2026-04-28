import type { BuiltinSkill } from "../types"

const CURRENT_YEAR = new Date().getFullYear()
const PREVIOUS_YEAR = CURRENT_YEAR - 1

export const librarianSkill: BuiltinSkill = {
  name: "librarian",
  description:
    "External reference research skill for official docs, OSS examples, GitHub history, and permalink-backed evidence. Load when working with unfamiliar libraries, remote repositories, or best-practice questions.",
  template: `# Librarian Skill

Use this skill when you need **external references** rather than only this repository.

Goal: answer questions about external libraries, frameworks, and OSS projects with **evidence** and **permalinks**.

## Use Cases

- How do I use [library]?
- What is the best practice for [framework feature]?
- Why does [external dependency] behave this way?
- Find production examples of [library] usage
- Trace OSS implementation details or issue history

## Date Awareness

- Verify the current year from environment context before searching
- Prefer ${CURRENT_YEAR}+ information over outdated ${PREVIOUS_YEAR} references when they conflict
- When you search, include current-version language rather than stale examples

## Request Classification

Classify the request first:

- **TYPE A: CONCEPTUAL** - docs and usage patterns
- **TYPE B: IMPLEMENTATION** - source code and permalinks
- **TYPE C: CONTEXT** - issue / PR / blame / history
- **TYPE D: COMPREHENSIVE** - mixed docs + code + history

## TYPE A: Conceptual

1. Find the official documentation URL
2. Verify version-specific docs when the user names a version
3. Inspect sitemap pages if available to map the docs structure
4. Fetch the most relevant pages
5. Cross-check with real OSS usage examples

## TYPE B: Implementation

1. Clone the target repo into a temp directory
2. Capture the commit SHA for stable permalinks
3. Search for the implementation with repo-local tools
4. Read the relevant files
5. Construct GitHub permalinks with line ranges

## TYPE C: Context and History

1. Search issues and PRs
2. Inspect git history and blame
3. Check release notes when version behavior matters
4. Explain why behavior changed with evidence

## TYPE D: Comprehensive

1. Do the documentation pass first
2. Search code from multiple angles
3. Gather history and issue context
4. Synthesize docs, code, and history into one answer

## Evidence Requirements

Every material claim must be tied to a concrete source:

\`\`\`markdown
**Claim**: [assertion]

**Evidence** ([source](https://github.com/owner/repo/blob/<sha>/path#L10-L20)):
\`\`\`typescript
// relevant code excerpt
\`\`\`

**Explanation**: [why this evidence supports the claim]
\`\`\`

## Permalink Format

\`\`\`
https://github.com/<owner>/<repo>/blob/<commit-sha>/<filepath>#L<start>-L<end>
\`\`\`

## Research Rules

- Prefer official docs over blogs and tutorials
- Prefer current versions over stale examples
- Skip beginner tutorials unless the user explicitly wants them
- For code examples, prefer established OSS projects over snippets with no provenance
- When using GitHub examples, capture the exact commit SHA before citing
- Use temp directories for cloned repositories

## Output Shape

1. State the answer directly
2. Group findings by docs / code / history when relevant
3. Include permalinks or official doc URLs for every important claim
4. End with the concrete recommendation or implication for the current task`,
}
