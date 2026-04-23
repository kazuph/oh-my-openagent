import { describe, expect, test } from "bun:test"
import { createBuiltinMcps } from "../index"

describe("createBuiltinMcps", () => {
  test("returns no builtin MCPs", () => {
    // given
    // when
    const result = createBuiltinMcps()

    // then
    expect(result).toEqual({})
  })
})
