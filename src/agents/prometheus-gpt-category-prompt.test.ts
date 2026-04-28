import { describe, expect, test } from "bun:test"
import { PROMETHEUS_PLAN_TEMPLATE } from "./prometheus/plan-template"

describe("PROMETHEUS plan template category guidance", () => {
  test("points planners at available categories rather than a free-form name", () => {
    expect(PROMETHEUS_PLAN_TEMPLATE).not.toContain("Category: `[name]`")
    expect(PROMETHEUS_PLAN_TEMPLATE).toContain(
      "Category**: `[visual-engineering | ultrabrain | artistry | quick | unspecified-low | unspecified-high | writing]`",
    )
  })
})
