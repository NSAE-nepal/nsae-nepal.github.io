import { defineField, defineType } from "sanity";

export const minutesType = defineType({
	name: "minutes",
	title: "Meeting Minutes",
	type: "document",
	fields: [
		defineField({
			name: "title",
			title: "Meeting Title / Topic",
			type: "string",
			validation: (Rule) =>
				Rule.required().min(1).error("Title/Topic of the meeting is required."),
		}),
		defineField({
			name: "slug",
			title: "Slug",
			type: "slug",
			options: {
				source: "title",
				maxLength: 96,
				isUnique: (value, context) => context.defaultIsUnique(value, context),
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "pubDate",
			title: "Meeting Date",
			type: "datetime",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "updatedDate",
			title: "Updated Date",
			type: "datetime",
		}),
		defineField({
			name: "type",
			title: "Meeting Type",
			type: "string",
			options: {
				list: [
					{ title: "AGM", value: "agm" },
					{ title: "Executive", value: "executive" },
					{ title: "General", value: "general" },
					{ title: "Emergency", value: "emergency" },
					{ title: "Sub-Committee", value: "sub-committee" },
					{ title: "Other", value: "other" },
				],
			},
			initialValue: "general",
		}),
		defineField({
			name: "location",
			title: "Location",
			type: "string",
			initialValue: "Virtual/Remote",
		}),
		defineField({
			name: "chairperson",
			title: "Chairperson",
			type: "string",
		}),
		defineField({
			name: "secretary",
			title: "Secretary",
			type: "string",
		}),
		defineField({
			name: "attendees",
			title: "Attendees",
			type: "array",
			of: [{ type: "string" }],
		}),
		defineField({
			name: "absent",
			title: "Absent Members",
			type: "array",
			of: [{ type: "string" }],
		}),
		defineField({
			name: "downloadUrl",
			title: "Downloadable Document / Attachment URL",
			type: "url",
			validation: (Rule) =>
				Rule.uri({
					scheme: ["http", "https"],
				}),
		}),
		defineField({
			name: "recordedBy",
			title: "Recorded By (Author)",
			type: "reference",
			to: [{ type: "author" }],
		}),

		defineField({
			name: "body",
			type: "blockContent",
		}),
	],
	preview: {
		select: {
			title: "title",
			date: "pubDate",
			type: "type",
		},
		prepare({ title, date, type }) {
			const formattedDate = date
				? new Date(date).toLocaleDateString()
				: "No date";
			return {
				title,
				subtitle: `${type?.toUpperCase() || "GENERAL"} • ${formattedDate}`,
			};
		},
	},
});
