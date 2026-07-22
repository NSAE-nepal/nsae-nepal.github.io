import { defineField, defineType } from "sanity";

export const careerType = defineType({
	name: "careers",
	title: "Careers / Job Listings",
	type: "document",
	fields: [
		defineField({
			name: "title",
			title: "Job Title",
			type: "string",
			validation: (Rule) =>
				Rule.required().min(1).error("Title must not be empty."),
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
			name: "location",
			title: "Location",
			type: "string",
			initialValue: "Remote",
		}),
		defineField({
			name: "type",
			title: "Employment Type",
			type: "string",
			options: {
				list: [
					{ title: "Full-time", value: "Full-time" },
					{ title: "Part-time", value: "Part-time" },
					{ title: "Contract", value: "Contract" },
					{ title: "Internship", value: "Internship" },
				],
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "status",
			title: "Status",
			type: "string",
			options: {
				list: [
					{ title: "Open", value: "open" },
					{ title: "Closed", value: "closed" },
				],
				layout: "radio",
			},
			initialValue: "open",
		}),
		defineField({
			name: "postedDate",
			title: "Posted Date",
			type: "datetime",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "closingDate",
			title: "Closing Date",
			type: "datetime",
			validation: (Rule) =>
				Rule.custom((closingDate, context) => {
					const document = context.document as { postedDate?: string };
					if (closingDate && document?.postedDate) {
						if (new Date(closingDate) <= new Date(document.postedDate)) {
							return "Closing date must be after the posted date.";
						}
					}
					return true;
				}),
		}),
		defineField({
			name: "description",
			title: "Short Description",
			type: "text",
			rows: 2,
			validation: (Rule) =>
				Rule.max(160).warning(
					"Descriptions should ideally be under 160 characters.",
				),
		}),
		defineField({
			name: "company",
			title: "Company Information",
			type: "object",
			validation: (Rule) => Rule.required(),
			fields: [
				defineField({
					name: "name",
					title: "Company Name",
					type: "string",
					validation: (Rule) =>
						Rule.required().min(1).error("Company name cannot be empty."),
				}),
				defineField({
					name: "logo",
					title: "Company Logo",
					type: "image",
					options: { hotspot: true },
				}),
				defineField({
					name: "website",
					title: "Company Website",
					type: "url",
					validation: (Rule) =>
						Rule.uri({
							scheme: ["http", "https"],
						}),
				}),
			],
		}),
		defineField({
			name: "body",
			type: "blockContent",
		}),
	],
	preview: {
		select: {
			title: "title",
			subtitle: "company.name",
			status: "status",
		},
		prepare({ title, subtitle, status }) {
			return {
				title,
				subtitle: `${subtitle || "Internal"} • [${status?.toUpperCase() || "OPEN"}]`,
			};
		},
	},
});
