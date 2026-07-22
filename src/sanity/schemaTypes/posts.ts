import { defineField, defineType } from "sanity";

export const postType = defineType({
	name: "posts",
	type: "document",
	fields: [
		defineField({
			name: "title",
			type: "string",
		}),
		defineField({
			name: "subtitle",
			title: "Subtitle",
			type: "string",
		}),
		defineField({
			name: "slug",
			type: "slug",
			options: {
				source: "title",
				maxLength: 96,
				isUnique: (value, context) => context.defaultIsUnique(value, context),
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "type",
			title: "Type",
			type: "string",
			options: {
				list: [
					{ title: "Blog", value: "blog" },
					{ title: "Notice", value: "notice" },
				],
				layout: "dropdown",
			},
			initialValue: "blog",
		}),
		defineField({
			name: "description",
			title: "Description",
			type: "text",
			rows: 3,
		}),
		defineField({
			name: "authors",
			title: "Authors",
			type: "array",
			of: [{ type: "reference", to: { type: "author" } }],
		}),
		defineField({
			name: "heroImage",
			type: "image",
			options: {
				hotspot: true,
			},
			fields: [
				{
					name: "alt",
					type: "string",
					title: "Alternative Text",
				},
			],
		}),
		defineField({
			name: "tags",
			title: "Tags",
			type: "array",
			of: [{ type: "string" }],
			options: {
				layout: "tags",
			},
		}),
		defineField({
			name: "categories",
			type: "array",
			of: [{ type: "reference", to: { type: "category" } }],
		}),
		defineField({
			name: "publishedAt",
			type: "datetime",
		}),
		defineField({
			name: "featured",
			title: "Featured Post",
			type: "boolean",
			initialValue: false,
		}),
		defineField({
			name: "pagefind",
			title: "Include in Pagefind Search",
			type: "boolean",
			initialValue: true,
		}),
		defineField({
			name: "body",
			type: "blockContent",
		}),
	],
	preview: {
		select: {
			title: "title",
			// CHANGED: Select up to 4 author names using array dot-notation
			author0: "authors.0.name",
			author1: "authors.1.name",
			author2: "authors.2.name",
			author3: "authors.3.name",
			// FIXED: Was referencing "mainImage", but your image field is named "heroImage"
			media: "heroImage",
		},
		prepare(selection) {
			const { title, author0, author1, author2, author3, media } = selection;
			// Filter out undefined author slots and join the remaining names
			const authors = [author0, author1, author2, author3].filter(Boolean);
			const subtitle = authors.length > 0 ? `by ${authors.join(", ")}` : "";

			return {
				title,
				subtitle,
				media,
			};
		},
	},
});
