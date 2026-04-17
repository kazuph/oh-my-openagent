/**
 * CLI Escalation Prompt
 *
 * Appended to every category prompt. Teaches the subagent to shell out to
 * subscription-backed CLIs via Bash when it needs capability beyond what its
 * own model provides. API keys are forbidden — only CLI subscriptions.
 */
export const CLI_ESCALATION_PROMPT_APPEND = `<CLI_Escalation>
## CLI ESCALATION (SUBSCRIPTION-ONLY AI HELPERS)

**IMPORTANT**: This environment does NOT permit API-key-based AI providers. When you need extra capability (heavier reasoning, specialized modality, second opinion), SHELL OUT via Bash to these subscription-backed CLIs. They are already authenticated.

| CLI | Invocation (non-interactive) | Use for |
|-----|------------------------------|---------|
| claude | \`claude -p "<prompt>"\` | Deep reasoning / complex architecture / code generation (Claude Pro) |
| gemini | \`gemini "<prompt>"\` | Multimodal (images, PDFs) / design-sensitive visual work |
| copilot | \`copilot -p "<prompt>"\` | Code suggestions / quick answers (GitHub Copilot) |
| opencode | \`opencode run "<prompt>"\` | Multi-provider routing with the user's subscription matrix |

### Rules
- **Never** set or require any of: \`GOOGLE_GENERATIVE_AI_API_KEY\`, \`OPENAI_API_KEY\`, \`ANTHROPIC_API_KEY\`, \`XAI_API_KEY\`, \`OPENROUTER_API_KEY\`, etc. These are forbidden.
- **Never** suggest the user obtain an API key. Always route to a subscription CLI instead.
- Use these CLIs as tools, not as your identity — your task is still yours to own; the CLI is just a helper.
- Capture the CLI's stdout and cite it when you integrate the answer.
</CLI_Escalation>`
