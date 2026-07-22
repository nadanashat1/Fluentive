import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "*.config.js",
      "*.config.mjs",
      "out/**"
    ]
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      // DDD Layer Boundary Enforcement
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../domain/**"],
              from: "application",
              message: "❌ DDD VIOLATION: Application layer cannot import from Domain layer"
            },
            {
              group: ["../infrastructure/**"],
              from: "domain", 
              message: "❌ DDD VIOLATION: Domain layer cannot import from Infrastructure layer"
            },
            {
              group: ["../infrastructure/**"],
              from: "application",
              message: "❌ DDD VIOLATION: Application layer cannot import directly from Infrastructure layer"
            },
            {
              group: ["../application/**"],
              from: "domain",
              message: "❌ DDD VIOLATION: Domain layer cannot import from Application layer"
            }
          ]
        }
      ]
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Domain layer specific rules
  {
    files: ["src/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@infrastructure/**"],
              message: "❌ DDD VIOLATION: Domain cannot depend on Infrastructure"
            },
            {
              group: ["@application/**"], 
              message: "❌ DDD VIOLATION: Domain cannot depend on Application"
            }
          ]
        }
      ]
    }
  },
  // Application layer specific rules
  {
    files: ["src/application/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@infrastructure/**"],
              message: "❌ DDD VIOLATION: Application should use interfaces, not direct Infrastructure"
            }
          ]
        }
      ]
    }
  }
];

export default eslintConfig;
