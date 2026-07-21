import { defineArrayMember, defineField, defineType } from "sanity";

export const blockContentType = defineType({
	title: "Block Content",
	name: "blockContent",
	type: "array",
	validation: (Rule) =>
		Rule.custom((blocks) => {
			if (!Array.isArray(blocks)) return true;

			const quizCount = blocks.filter(
				(block) => (block as { _type?: string })?._type === "quizReference",
			).length;

			return quizCount <= 1
				? true
				: "You can only embed a maximum of 1 Quiz per content section.";
		}),
	of: [
		defineArrayMember({
			type: "block",
			styles: [
				{ title: "Normal", value: "normal" },
				{ title: "H1", value: "h1" },
				{ title: "H2", value: "h2" },
				{ title: "H3", value: "h3" },
				{ title: "H4", value: "h4" },
				{ title: "H5", value: "h5" },
				{ title: "H6", value: "h6" },
				{ title: "Quote", value: "blockquote" },
			],
			lists: [
				{ title: "Bullet", value: "bullet" },
				{ title: "Numbered", value: "number" },
			],
			marks: {
				decorators: [
					{ title: "Strong", value: "strong" },
					{ title: "Emphasis", value: "em" },
					{ title: "Underline", value: "underline" },
					{ title: "Strike-through", value: "strike-through" },
					{ title: "Inline Code", value: "code" },
				],
				annotations: [
					{
						title: "External Link",
						name: "link",
						type: "object",
						fields: [
							defineField({
								title: "URL",
								name: "href",
								type: "url",
								validation: (Rule) =>
									Rule.uri({
										scheme: ["http", "https", "mailto", "tel"],
									}),
							}),
							defineField({
								title: "Open in new tab?",
								name: "blank",
								type: "boolean",
								initialValue: true,
							}),
						],
					},
				],
			},
		}),

		defineArrayMember({
			type: "image",
			options: { hotspot: true },
			fields: [
				defineField({
					name: "alt",
					type: "string",
					title: "Alternative Text",
					description: "Important for SEO and accessability.",
					validation: (Rule) => Rule.required(),
				}),
				defineField({
					name: "caption",
					type: "string",
					title: "Caption",
					description: "Optional text displayed below the image.",
				}),
			],
		}),

		defineArrayMember({
			name: "codeSnippet",
			title: "Code Snippet",
			type: "object",
			fields: [
				defineField({
					name: "language",
					title: "Language",
					type: "string",
					options: {
						list: [
							{ title: "JavaScript / TypeScript", value: "typescript" },
							{ title: "HTML / XML", value: "html" },
							{ title: "CSS / SCSS", value: "css" },
							{ title: "JSON", value: "json" },
							{ title: "Terminal / Bash", value: "bash" },
							{ title: "Markdown", value: "markdown" },
						],
					},
					initialValue: "typescript",
				}),
				defineField({
					name: "filename",
					title: "Filename (Optional)",
					type: "string",
					description: "e.g., 'utils/formatDate.ts'",
				}),
				defineField({
					name: "code",
					title: "Code",
					type: "text",
					rows: 8,
					validation: (Rule) => Rule.required(),
				}),
			],
			preview: {
				select: {
					title: "filename",
					lang: "language",
					code: "code",
				},
				prepare({ title, lang, code }) {
					return {
						title: title || "Code Block",
						subtitle: `Language: ${lang || "text"} • ${code?.slice(0, 30) || ""}...`,
					};
				},
			},
		}),

		defineArrayMember({
			name: "videoEmbed",
			title: "Video / YouTube Embed",
			type: "object",
			fields: [
				defineField({
					name: "url",
					title: "Video URL",
					type: "url",
					description: "Paste a YouTube, Vimeo, or Loom link here.",
					validation: (Rule) =>
						Rule.required().uri({ scheme: ["http", "https"] }),
				}),
				defineField({
					name: "caption",
					title: "Caption (Optional)",
					type: "string",
				}),
			],
			preview: {
				select: {
					url: "url",
					caption: "caption",
				},
				prepare({ url, caption }) {
					return {
						title: caption || "Video Embed",
						subtitle: url,
					};
				},
			},
		}),
		defineArrayMember({
			name: "quizReference",
			title: "Quiz",
			type: "reference",
			to: [{ type: "quizzes" }],
		}),
	],
});
