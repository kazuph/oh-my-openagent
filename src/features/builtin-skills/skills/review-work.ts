import type { BuiltinSkill } from "../types"

export const reviewWorkSkill: BuiltinSkill = {
	name: "review-work",
	description:
		"Post-implementation review orchestrator. Runs 5 parallel local review lanes using verified local AI CLIs instead of provider-managed sub-agents, so missing env vars such as CLOUDFLARE_GATEWAY_ID do not block reviews. Uses direct codex, claude, or gemini one-shot commands. Covers goal verification, QA, code quality, security, and context mining. All 5 must pass for review to pass. MUST USE after completing any significant implementation work. Triggers: 'review work', 'review my work', 'review changes', 'QA my work', 'verify implementation', 'check my work', 'validate changes', 'post-implementation review'.",
	template: `# Review Work - 5-Lane Local Review Orchestrator

Run 5 complementary review lanes in parallel using **local AI CLIs**. Do **not** use provider-managed \`task(...)\` sub-agents for this skill.

Why: some environments fail immediately when a provider-specific variable such as \`CLOUDFLARE_GATEWAY_ID\` is missing. Review work must still run even when those integrations are unavailable.

## Review Lanes

| # | Lane | Primary question | Preferred runner type |
|---|------|------------------|-----------------------|
| 1 | Goal & Constraint Verification | Did we build what was asked, within the stated rules? | Any local reviewer |
| 2 | QA via App Execution | Does the implementation actually work when run? | Tool-capable local reviewer |
| 3 | Code Quality Review | Is the code correct, maintainable, and consistent? | Any local reviewer |
| 4 | Security Review | Did the changes introduce vulnerabilities? | Any local reviewer |
| 5 | Context Mining | Did we miss relevant history, docs, issues, or neighboring code? | Tool-capable local reviewer |

All 5 lanes must pass for the review to pass. If even one lane fails, the overall review fails.

---

## Hard Rules

- Never require Cloudflare Gateway or any provider-only environment variable just to run review-work.
- Never launch provider-managed background sub-agents with \`task(...)\` for this skill.
- Use only verified direct local CLIs:
  - \`command codex ... exec\`
  - \`CLAUDECODE= command claude --dangerously-skip-permissions --print\`
  - \`gemini --approval-mode=yolo -o json\`
- Use non-interactive one-shot execution only. No interactive REPLs.
- QA and Context Mining lanes should prefer a tool-capable runner (direct \`codex exec --full-auto\`).
- If no tool-capable runner exists, do that lane yourself with bash/read/search tools and mark confidence accordingly. Do not fail just because a provider integration is missing.

---

## Phase 0: Gather Review Context

Extract these inputs from the conversation and repository before launching lanes:

- **GOAL**: The original user objective.
- **CONSTRAINTS**: Requirements, non-goals, API contracts, coding rules, UX requirements, compatibility constraints.
- **BACKGROUND**: Why this work was needed, related decisions, linked issues, or prior discussion.
- **CHANGED_FILES**: Collect via \`git diff --name-only\`.
- **DIFF**: Collect via \`git diff\`.
- **FILE_CONTENTS**: Read full changed files plus neighboring files that show existing patterns.
- **RUN_COMMAND**: Determine how to start the app or run the relevant checks.

Prefer conversation history first. Only ask the user if a critical detail is truly missing.

---

## Phase 1: Load CLI Runner Rules

Invoke \`skill("another-ai")\` once if available, then follow its direct CLI execution rules:

- direct CLI invocation, no wrapper scripts required
- codex with \`--skip-git-repo-check\`
- codex output captured with \`-o\`
- gemini output captured with \`-o json | jq -r '.response'\`
- claude nested call with \`CLAUDECODE=\`

If \`another-ai\` is unavailable, still use the same direct command patterns below.

---

## Phase 2: Detect Available Local Reviewers

Check which runners exist before assigning lanes:

\`\`\`bash
for cmd in codex claude gemini; do
  if command -v "$cmd" >/dev/null 2>&1; then
    echo "$cmd: yes"
  else
    echo "$cmd: no"
  fi
done
\`\`\`

Use this preference order:

1. **Direct tool-capable CLI**: \`command codex ... exec --full-auto\`
2. **Direct text-only CLIs**: \`command claude --print\`, \`gemini -o json\`

Lane assignment guidance:

- Lanes 2 and 5 should use a tool-capable runner when possible.
- Lanes 1, 3, and 4 can use any available local reviewer.
- Spread work across multiple CLIs when practical, but reliability is more important than diversity.

---

## Phase 3: Build Shared Context Once

Create a temp directory and write shared artifacts:

\`\`\`bash
review_dir=$(mktemp -d -t review-work)
changed_files_file="$review_dir/changed-files.txt"
diff_file="$review_dir/diff.patch"
context_file="$review_dir/shared-context.md"

git --no-pager diff --name-only > "$changed_files_file"
git --no-pager diff > "$diff_file"
\`\`\`

Write \`$context_file\` with:

- GOAL
- CONSTRAINTS
- BACKGROUND
- RUN_COMMAND
- changed file list
- pointers to the most important neighboring files

Then create 5 lane-specific prompt files:

- \`lane-1-goal.md\`
- \`lane-2-qa.md\`
- \`lane-3-quality.md\`
- \`lane-4-security.md\`
- \`lane-5-context.md\`

Each prompt should include:

1. the lane brief below
2. the shared context
3. the changed files list
4. the diff
5. any full file contents needed for accurate review

---

## Phase 4: Launch 5 Lanes in Parallel

Start all 5 lanes in one shell turn using background jobs and \`wait\`.

### Known-good direct command fallbacks

Use these when wrapper commands are unavailable or undocumented:

\`\`\`bash
# codex: tool-capable, best default for QA and context mining
outfile=$(mktemp -t codex-review)
command codex \
  --sandbox workspace-write \
  --config sandbox_workspace_write.network_access=true \
  --dangerously-bypass-approvals-and-sandbox \
  exec --skip-git-repo-check --full-auto -o "$outfile" "$(cat "$prompt_file")" >/dev/null 2>&1
cat "$outfile"

# claude: text-only fallback
CLAUDECODE= command claude --dangerously-skip-permissions --print "$(cat "$prompt_file")" > "$outfile"
cat "$outfile"

# gemini: text-only fallback
/opt/homebrew/bin/mise exec -- gemini --approval-mode=yolo -o json "$(cat "$prompt_file")" 2>/dev/null \
  | jq -r '.response' > "$outfile"
cat "$outfile"
\`\`\`

Use the known-good direct commands above. Do not invent undocumented wrapper commands.

### Launch pattern

\`\`\`bash
# Example shape - adapt runner per lane
run_lane lane-1-goal "$review_dir/lane-1-goal.md" > "$review_dir/lane-1.out" &
pid1=$!

run_lane lane-2-qa "$review_dir/lane-2-qa.md" > "$review_dir/lane-2.out" &
pid2=$!

run_lane lane-3-quality "$review_dir/lane-3-quality.md" > "$review_dir/lane-3.out" &
pid3=$!

run_lane lane-4-security "$review_dir/lane-4-security.md" > "$review_dir/lane-4.out" &
pid4=$!

run_lane lane-5-context "$review_dir/lane-5-context.md" > "$review_dir/lane-5.out" &
pid5=$!

wait "$pid1" "$pid2" "$pid3" "$pid4" "$pid5"
\`\`\`

If a lane has no usable CLI runner, execute that lane yourself immediately rather than blocking the full review.

---

## Lane Briefs

Use these reviewer prompts inside the lane-specific prompt files.

### Lane 1: Goal & Constraint Verification

Question: "Did we build exactly what the user asked, within the stated constraints?"

Checklist:

1. Break the goal into explicit and implied requirements.
2. Mark each requirement as ACHIEVED, PARTIAL, or MISSED.
3. Verify every stated constraint against concrete code evidence.
4. Flag scope creep or unnecessary abstraction.
5. Walk through at least 5 edge cases mentally.

Required output:

\`\`\`
<verdict>PASS or FAIL</verdict>
<confidence>HIGH / MEDIUM / LOW</confidence>
<summary>1-3 sentence overall assessment</summary>
<goal_breakdown>
- [ACHIEVED/PARTIAL/MISSED] Requirement
- Evidence: ...
</goal_breakdown>
<blocking_issues>Only blocking issues. Empty if PASS.</blocking_issues>
\`\`\`

### Lane 2: QA via App Execution

Question: "Does it actually work when run?"

Checklist:

1. Brainstorm scenarios first: happy path, boundaries, error paths, regressions, state transitions, integrations.
2. Add at least 5 more scenarios after self-review.
3. Prefer actually running the app, tests, or CLI.
4. Capture concrete evidence for failures.
5. If the app cannot be started, report immediate FAIL.

Required output:

\`\`\`
<verdict>PASS or FAIL</verdict>
<confidence>HIGH / MEDIUM / LOW</confidence>
<summary>1-3 sentence overall assessment</summary>
<scenario_coverage>
Total scenarios: N
P0: X tested, Y passed
P1: X tested, Y passed
P2: X tested, Y passed
</scenario_coverage>
<blocking_issues>P0/P1 failures only. Empty if PASS.</blocking_issues>
\`\`\`

### Lane 3: Code Quality Review

Question: "Is the code well-written, correct, and consistent with the codebase?"

Checklist:

1. Correctness and edge cases
2. Pattern consistency with neighboring files
3. Naming and readability
4. Error handling and logging
5. Type safety
6. Performance and coupling
7. Test quality and API design

Required output:

\`\`\`
<verdict>PASS or FAIL</verdict>
<confidence>HIGH / MEDIUM / LOW</confidence>
<summary>1-3 sentence overall assessment</summary>
<findings>
- [CRITICAL/MAJOR/MINOR/NITPICK] Category: Description
- File: path
- Suggestion: ...
</findings>
<blocking_issues>CRITICAL and MAJOR items only. Empty if PASS.</blocking_issues>
\`\`\`

### Lane 4: Security Review

Question: "Did these changes introduce vulnerabilities or risky security regressions?"

Checklist:

1. Input validation and injection risks
2. Auth and authorization gaps
3. Secret handling and data exposure
4. Unsafe file or network operations
5. Dependency or supply-chain risks
6. Error leakage and over-broad permissions

Required output:

\`\`\`
<verdict>PASS or FAIL</verdict>
<severity>CRITICAL / HIGH / MEDIUM / LOW / NONE</severity>
<summary>1-3 sentence overall assessment</summary>
<findings>
- [CRITICAL/HIGH/MEDIUM/LOW] Category: Description
- File: path
- Remediation: ...
</findings>
<blocking_issues>CRITICAL and HIGH items only. Empty if PASS.</blocking_issues>
\`\`\`

### Lane 5: Context Mining

Question: "Did we miss any repo history, docs, issues, or related code that should have informed the implementation?"

Search guidance:

1. Git history: \`git log\`, \`git blame\`, recent commits for changed files
2. GitHub: issues, PRs, comments if \`gh\` is available
3. Docs and READMEs
4. Related tests, config, imports, and sibling modules
5. TODO, FIXME, migration, and deprecation notes

Required output:

\`\`\`
<verdict>PASS or FAIL</verdict>
<confidence>HIGH / MEDIUM / LOW</confidence>
<summary>1-3 sentence overall assessment</summary>
<sources_searched>
- [SEARCHED/SKIPPED] Source - details
</sources_searched>
<discovered_context>
- Source: ...
- Finding: ...
- Impact: BLOCKING / IMPORTANT / FYI
</discovered_context>
<blocking_issues>Only BLOCKING items. Empty if PASS.</blocking_issues>
\`\`\`

---

## Phase 5: Collect Results

After all 5 lanes complete:

1. Read every output file.
2. Extract the verdict, confidence/severity, summary, and blocking issues.
3. If a lane crashed because a runner was missing, rerun that lane with the next fallback runner.
4. Only treat the review as infrastructure-blocked if **no local CLI path exists at all**.

Track results in a table:

| # | Review Area | Runner | Verdict | Notes |
|---|-------------|--------|---------|-------|
| 1 | Goal & Constraint Verification | pending | pending | - |
| 2 | QA via App Execution | pending | pending | - |
| 3 | Code Quality Review | pending | pending | - |
| 4 | Security Review | pending | pending | - |
| 5 | Context Mining | pending | pending | - |

---

## Phase 6: Deliver Verdict

Verdict logic:

- ALL 5 lanes PASS -> **REVIEW PASSED**
- ANY lane FAILS -> **REVIEW FAILED**

Final report format:

\`\`\`markdown
# Review Work - Final Report

## Overall Verdict: PASSED / FAILED

| # | Review Area | Runner | Verdict | Confidence / Severity |
|---|-------------|--------|---------|------------------------|
| 1 | Goal & Constraint Verification | <runner> | PASS/FAIL | HIGH/MED/LOW |
| 2 | QA via App Execution | <runner> | PASS/FAIL | HIGH/MED/LOW |
| 3 | Code Quality Review | <runner> | PASS/FAIL | HIGH/MED/LOW |
| 4 | Security Review | <runner> | PASS/FAIL | CRITICAL/HIGH/MEDIUM/LOW/NONE |
| 5 | Context Mining | <runner> | PASS/FAIL | HIGH/MED/LOW |

## Executive Summary

2-4 sentences summarizing whether the implementation is ready and why.

## Blocking Issues

List every blocking issue from failing lanes. If none, say "None."

## Lane Details

### 1. Goal & Constraint Verification
<summary + findings>

### 2. QA via App Execution
<summary + scenario coverage>

### 3. Code Quality Review
<summary + findings>

### 4. Security Review
<summary + findings>

### 5. Context Mining
<summary + discoveries>
\`\`\`

Clean up temp files when finished.`
}
