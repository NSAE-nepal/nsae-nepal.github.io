// blockContentSimple.ts
import { defineArrayMember, defineField, defineType } from "sanity";

export const blockContentSimpleType = defineType({
	name: "blockContentSimple",
	title: "Block Content (Simple)",
	type: "array",
	of: [
		defineArrayMember({
			type: "block",
			styles: [
				{ title: "Normal", value: "normal" },
				{ title: "H2", value: "h2" },
				{ title: "H3", value: "h3" },
				{ title: "H4", value: "h4" },
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
					{ title: "Inline Code", value: "code" },
				],
				annotations: [
					{
						title: "External Link",
						name: "link",
						type: "object",
						fields: [
							defineField({
								name: "href",
								title: "URL",
								type: "url",
							}),
							defineField({
								name: "blank",
								title: "Open in new tab",
								type: "boolean",
								initialValue: true,
							}),
						],
					},
				],
			},
		}),
	],
});
