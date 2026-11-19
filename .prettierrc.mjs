// @ts-check
/**
 * Indentation follows what most of the code already uses: tabs in plain
 * TS/JS modules, two spaces in .astro, .tsx, CSS, JSON and Markdown.
 *
 * @type {import("prettier").Config}
 */
export default {
	// Setup follows https://docs.astro.build/en/editor-setup/#prettier.
	// Versions are pinned exactly in package.json so output doesn't drift.
	//
	// prettier-plugin-astro stays on 0.14.x: 1.x switched to a JSX-style AST
	// that prettier-plugin-tailwindcss (0.8.1) doesn't walk, so classes in
	// templates went unsorted. 0.14 also matches how the code is already
	// formatted. Known 0.14 limit: a <script> containing `{` or `<` can't sit
	// inside a template expression ({cond && (...)}); keep such scripts outside.
	// Recheck when the Tailwind plugin supports the 1.x AST.
	//
	// prettier-plugin-tailwindcss MUST stay last (see its compatibility notes).
	plugins: ["prettier-plugin-astro", "prettier-plugin-tailwindcss"],
	// Tailwind v4: the CSS entry point holds the theme and custom variants
	// (e.g. `xs:`), which decide the class order.
	tailwindStylesheet: "./src/styles/global.css",
	// Also sort classes passed to our class helpers.
	tailwindFunctions: ["cn", "cva", "clsx", "twMerge"],
	// Several files use CRLF; keep whatever each file already has.
	endOfLine: "auto",
	overrides: [
		{
			files: "*.astro",
			options: { parser: "astro" },
		},
		{
			files: ["*.ts", "*.mts", "*.js", "*.mjs"],
			options: { useTabs: true },
		},
	],
};
