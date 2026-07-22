import { ThListIcon } from "@sanity/icons/ThList";
import { defineArrayMember, defineField, defineType } from "sanity";

export const tableType = defineType({
	name: "table",
	type: "object",
	title: "Table",
	fields: [
		defineField({
			name: "csvData",
			type: "text",
			title: "Table Data (CSV)",
			description:
				"Paste CSV data here. Comma-separated values, one row per line.",
		}),
		defineField({
			name: "hasHeader",
			type: "boolean",
			title: "First Row is Header",
			description: "Enable if the first row should be treated as a header row",
			initialValue: true,
		}),
	],
	preview: {
		select: {
			csvData: "csvData",
			hasHeader: "hasHeader",
		},
		prepare({ csvData, hasHeader }) {
			const rowCount = csvData
				? csvData.split("\n").filter((line: string) => line.trim() !== "")
						.length
				: 0;
			const headerText = hasHeader && rowCount > 0 ? " (with header)" : "";
			return {
				title: `Table (${rowCount} rows${headerText})`,
			};
		},
	},
});

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
			type: "table",
			icon: ThListIcon,
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
			type: "code",
			title: "Code Snippet",
			options: {
				language: "typescript",
				withFilename: true,
				languageAlternatives: [
					{ title: "TypeScript", value: "typescript" },
					{ title: "JavaScript", value: "javascript" },
					{ title: "Python", value: "python" },
					{ title: "HTML", value: "html" },
					{ title: "CSS", value: "css" },
					{ title: "JSON", value: "json" },
					{ title: "Bash", value: "bash" },
					{ title: "Markdown", value: "markdown" },
				],
			},
		}),

		defineArrayMember({
			title: "Call to Action",
			name: "cta",
			type: "object",
			fields: [
				{
					title: "Text",
					name: "text",
					type: "string",
				},
				{
					title: "URL",
					name: "url",
					type: "url",
				},
				{
					title: "Style",
					name: "style",
					type: "string",
					options: {
						list: [
							{ title: "Primary", value: "primary" },
							{ title: "Secondary", value: "secondary" },
							{ title: "Ghost", value: "ghost" },
						],
					},
					initialValue: "primary",
				},
			],
			preview: {
				select: {
					title: "text",
					subtitle: "url",
				},
			},
		}),
		defineArrayMember({
			title: "Collapsible Section",
			name: "collapsible",
			type: "object",
			fields: [
				{
					title: "Title",
					name: "title",
					type: "string",
				},
				{
					title: "Content",
					name: "content",
					type: "blockContentSimple",
				},
				{
					title: "Open by default",
					name: "defaultOpen",
					type: "boolean",
					initialValue: false,
				},
			],
			preview: {
				select: {
					title: "title",
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
