import { describe, expect, test } from "bun:test";
import { maybeCreateSisyphusConfig } from "./sisyphus-agent";
import type { AgentOverrides } from "../types";
import type { CategoryConfig } from "../../config/schema";

describe("maybeCreateSisyphusConfig", () => {
  describe("#given GPT model with user override allowing apply_patch", () => {
    test("#when config is created #then user permission is preserved", () => {
      // given
      const agentOverrides: AgentOverrides = {
        sisyphus: {
          permission: {
            apply_patch: "allow",
          },
        },
      };
      const mergedCategories: Record<string, CategoryConfig> = {};

      // when
      const config = maybeCreateSisyphusConfig({
        disabledAgents: [],
        agentOverrides,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config).toBeDefined();
      expect(config?.permission).toHaveProperty("apply_patch", "allow");
    });
  });

  describe("#given non-GPT model with user override", () => {
    test("#when config is created #then apply_patch is not forced to deny", () => {
      // given
      const agentOverrides: AgentOverrides = {
        sisyphus: {
          permission: {
            apply_patch: "allow",
          },
        },
      };
      const mergedCategories: Record<string, CategoryConfig> = {};

      // when
      const config = maybeCreateSisyphusConfig({
        disabledAgents: [],
        agentOverrides,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config).toBeDefined();
      // Claude models should allow the user override
      expect(config?.permission).toHaveProperty("apply_patch", "allow");
    });
  });

  describe("#given generic GPT model with user override allowing apply_patch", () => {
    test("#when config is created #then user permission is preserved", () => {
      // given
      const agentOverrides: AgentOverrides = {
        sisyphus: {
          permission: {
            apply_patch: "allow",
          },
        },
      };
      const mergedCategories: Record<string, CategoryConfig> = {};

      // when
      const config = maybeCreateSisyphusConfig({
        disabledAgents: [],
        agentOverrides,
        availableAgents: [],
        availableSkills: [],
        availableCategories: [],
        mergedCategories,
        useTaskSystem: false,
      });

      // then
      expect(config).toBeDefined();
      expect(config?.permission).toHaveProperty("apply_patch", "allow");
    });
  });
});
