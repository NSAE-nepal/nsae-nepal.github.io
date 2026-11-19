import { DocumentPdfIcon } from "@sanity/icons/DocumentPdf";
import { LinkIcon } from "@sanity/icons/Link";
import { defineArrayMember, defineField, defineType } from "sanity";
import {
	RESOURCE_TYPES,
	type ResourceType,
	resourceTypeLabel,
} from "../../lib/resources";

export const resourceType = defineType({
	name: "resource",
	title: "Resource library",
	type: "document",
	icon: DocumentPdfIcon,
	fields: [
		defineField({
			name: "title",
			title: "Title",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "slug",
			title: "Slug",
			type: "slug",
			options: { source: "title", maxLength: 96 },
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "resourceType",
			title: "Type",
			type: "string",
			options: {
				list: RESOURCE_TYPES.map(({ value, label }) => ({
					title: label,
					value,
				})),
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "description",
			title: "Short Description",
			description: "What it is and who it's for. Shown on cards and in search.",
			type: "text",
			rows: 3,
			validation: (Rule) =>
				Rule.required().max(300).warning("Keep it under 300 characters."),
		}),
		defineField({
			name: "categories",
			title: "Topics",
			description: "e.g. Irrigation, Farm Machinery, Post-Harvest.",
			type: "array",
			of: [
				defineArrayMember({ type: "reference", to: [{ type: "category" }] }),
			],
		}),
		defineField({
			name: "publisher",
			title: "Publisher / Author",
			description: "Organization or person that produced it.",
			type: "string",
		}),
		defineField({
			name: "year",
			title: "Year",
			type: "number",
			validation: (Rule) =>
				Rule.integer()
					.min(1950)
					.max(new Date().getFullYear() + 1),
		}),
		defineField({
			name: "attachments",
			title: "Files & Links",
			description:
				"Add one or more downloads and/or external links, in the order they should appear.",
			type: "array",
			of: [
				defineArrayMember({
					name: "resourceFile",
					title: "File",
					type: "object",
					icon: DocumentPdfIcon,
					fields: [
						defineField({
							name: "title",
							title: "Label",
							description:
								'Optional, e.g. "Full report" or "Annex 2". Defaults to the file name.',
							type: "string",
						}),
						defineField({
							name: "file",
							title: "File",
							type: "file",
							validation: (Rule) => Rule.required(),
						}),
					],
					preview: {
						select: { title: "title", filename: "file.asset.originalFilename" },
						prepare: ({ title, filename }) => ({
							title: title || filename || "File",
							subtitle: title ? filename : "File",
						}),
					},
				}),
				defineArrayMember({
					name: "resourceLink",
					title: "Link",
					type: "object",
					icon: LinkIcon,
					fields: [
						defineField({
							name: "title",
							title: "Label",
							description:
								'Optional, e.g. "Online edition" or "Download page". Defaults to the website name.',
							type: "string",
						}),
						defineField({
							name: "url",
							title: "URL",
							type: "url",
							validation: (Rule) =>
								Rule.required().uri({ scheme: ["http", "https"] }),
						}),
					],
					preview: {
						select: { title: "title", url: "url" },
						prepare: ({ title, url }) => ({
							title: title || url || "Link",
							subtitle: url,
						}),
					},
				}),
			],
			validation: (Rule) =>
				Rule.required().min(1).error("Add at least one file or link."),
		}),
		defineField({
			name: "body",
			title: "Details",
			description:
				"Optional: summary, contents, how to use it. Same editor as blog posts; three or more headings add a table of contents.",
			type: "blockContent",
		}),
		defineField({
			name: "publishedAt",
			title: "Added On",
			type: "datetime",
			initialValue: () => new Date().toISOString(),
			validation: (Rule) => Rule.required(),
		}),
	],
	orderings: [
		{
			title: "Recently added",
			name: "publishedAtDesc",
			by: [{ field: "publishedAt", direction: "desc" }],
		},
	],
	preview: {
		select: {
			title: "title",
			resourceType: "resourceType",
			publisher: "publisher",
			year: "year",
		},
		prepare({ title, resourceType, publisher, year }) {
			return {
				title,
				subtitle: [
					resourceTypeLabel((resourceType ?? "other") as ResourceType),
					publisher,
					year,
				]
					.filter(Boolean)
					.join(" • "),
			};
		},
	},
});
