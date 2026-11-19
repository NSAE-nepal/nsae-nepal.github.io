// @ts-check
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import astro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y-x";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
	globalIgnores(["dist/", ".astro/", "node_modules/", "public/", "plans/"]),

	js.configs.recommended,
	tseslint.configs.recommended,

	// .astro files: Astro rules plus the jsx-a11y rules adapted to Astro
	// templates. eslint-plugin-astro loads `eslint-plugin-jsx-a11y-x` (the
	// ESLint 10 compatible fork) on its own.
	astro.configs["flat/recommended"],
	astro.configs["flat/jsx-a11y-recommended"],

	// React islands (search dialog, shadcn UI).
	{
		files: ["**/*.tsx"],
		...jsxA11y.configs.recommended,
	},
	{
		files: ["**/*.tsx"],
		...reactHooks.configs.flat["recommended-latest"],
	},

	// Everything that ships to the browser, plus Node for configs and build-time code.
	{
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
		},
	},

	// TypeScript (and `astro check`) already reports undefined names, and the
	// core rule doesn't know ambient types such as Astro's `ImageMetadata`.
	{
		files: ["**/*.ts", "**/*.tsx", "**/*.astro"],
		rules: { "no-undef": "off" },
	},

	{
		files: ["**/*.astro"],
		rules: {
			// Tailwind's preflight removes list bullets, and Safari/VoiceOver
			// then drops list semantics, so `role="list"` is deliberate.
			"astro/jsx-a11y/no-redundant-roles": [
				"error",
				{ ul: ["list"], ol: ["list"] },
			],
		},
	},

	{
		rules: {
			// `_`-prefixed names are intentionally unused (destructuring, callbacks).
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					caughtErrors: "none",
					ignoreRestSiblings: true,
				},
			],
		},
	},

	// Turn off every rule that would fight Prettier. Must stay last.
	prettier,
);
