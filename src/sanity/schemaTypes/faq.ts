import { defineArrayMember, defineField, defineType } from "sanity";

export const faqType = defineType({
	name: "faq",
	title: "FAQ Section",
	type: "document",
	fields: [
		defineField({
			name: "items",
			title: "Frequently Asked Questions",
			type: "array",
			validation: (Rule) => Rule.required(),
			of: [
				defineArrayMember({
					type: "object",
					name: "faqItem",
					title: "FAQ Item",
					fields: [
						defineField({
							name: "question",
							title: "Question",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "answer",
							title: "Answer",
							type: "text",
							rows: 3,
							validation: (Rule) => Rule.required(),
						}),
					],
					preview: {
						select: {
							title: "question",
							subtitle: "answer",
						},
						prepare({ title, subtitle }) {
							return {
								title: title || "Untitled Question",
								subtitle: subtitle || "No answer provided yet...",
							};
						},
					},
				}),
			],
		}),
	],
	preview: {
		select: {
			title: "title",
			items: "items",
		},
		prepare({ title, items }) {
			const count = Array.isArray(items) ? items.length : 0;
			return {
				title: title || "Untitled FAQ Section",
				subtitle: `${count} question${count === 1 ? "" : "s"}`,
			};
		},
	},
});
