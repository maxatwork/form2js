import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const tsconfigRootDir = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/coverage/**",
      "**/node_modules/**",
      ".turbo/**",
      "package-lock.json"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    files: ["**/*.ts", "**/*.cts", "**/*.mts"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir
      }
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          "prefer": "type-imports"
        }
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/prefer-regexp-exec": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/consistent-type-definitions": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "off",
      "@typescript-eslint/prefer-for-of": "off",
      "@typescript-eslint/consistent-indexed-object-style": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/non-nullable-type-assertion-style": "off"
    }
  }
);
