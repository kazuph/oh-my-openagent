import { describe, expect, test } from "bun:test"

import { inferEffectiveModel } from "./infer-effective-model"

describe("inferEffectiveModel", () => {
  test("returns configured model when present", () => {
    expect(
      inferEffectiveModel({
        model: "qwen-local/qwen3.6-35b-a3b-tqplus-q4km",
        provider: {
          "qwen-local": {
            models: {
              "ignored-model": {},
            },
          },
        },
      }),
    ).toBe("qwen-local/qwen3.6-35b-a3b-tqplus-q4km")
  })

  test("infers first provider model when config.model is missing", () => {
    expect(
      inferEffectiveModel({
        provider: {
          "qwen-local": {
            models: {
              "qwen3.6-35b-a3b-tqplus-q4km": {},
              "qwen3.6-27b-tqplus-q4km": {},
            },
          },
          lmstudio: {
            models: {
              "google/gemma-4-26b-a4b": {},
            },
          },
        },
      }),
    ).toBe("qwen-local/qwen3.6-35b-a3b-tqplus-q4km")
  })

  test("returns undefined when no provider models exist", () => {
    expect(
      inferEffectiveModel({
        provider: {
          "qwen-local": {
            models: {},
          },
        },
      }),
    ).toBeUndefined()
  })
})
