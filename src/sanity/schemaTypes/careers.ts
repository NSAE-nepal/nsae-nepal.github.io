import { defineField, defineType } from "sanity";
import {
	OPPORTUNITY_TYPES,
	type OpportunityType,
	opportunityTypeLabel,
} from "../../lib/opportunities";

type OpportunityDocument = {
	opportunityType?: OpportunityType;
	postedDate?: string;
};

// Documents created before opportunity types existed are jobs.
const isJob = (document: unknown) =>
	((document as OpportunityDocument | undefined)?.opportunityType ?? "job") ===
	"job";

export const careerType = defineType({
	name: "careers",
	title: "Opportunities",
	type: "document",
	fields: [
		defineField({
			name: "title",
			title: "Title",
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
			name: "opportunityType",
			title: "Opportunity Type",
			type: "string",
			options: {
				list: OPPORTUNITY_TYPES.map(({ value, label }) => ({
					title: label,
					value,
				})),
			},
			initialValue: "job",
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
			hidden: ({ document }) => !isJob(document),
			validation: (Rule) =>
				Rule.custom((value, context) =>
					isJob(context.document) && !value
						? "Employment type is required for jobs."
						: true,
				),
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
			title: "Closing Date / Deadline",
			description: "Stays open through this whole day (Nepal time).",
			type: "datetime",
			validation: (Rule) =>
				Rule.custom((closingDate, context) => {
					const document = context.document as OpportunityDocument | undefined;
					if (closingDate && document?.postedDate) {
						if (new Date(closingDate) <= new Date(document.postedDate)) {
							return "Closing date must be after the posted date.";
						}
					}
					return true;
				}),
		}),
		defineField({
			name: "value",
			title: "Salary / Amount",
			description:
				'Optional, e.g. "NPR 60,000/month", "Full tuition", "Up to NPR 500,000", "Fee: NPR 2,000".',
			type: "string",
		}),
		defineField({
			name: "applyUrl",
			title: "Application Link",
			description:
				"Where to apply or submit (a form, portal or mailto: link). Leave empty if the details explain how to apply.",
			type: "url",
			validation: (Rule) => Rule.uri({ scheme: ["http", "https", "mailto"] }),
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
			title: "Organization",
			description: "The employer, funder or organizer.",
			type: "object",
			validation: (Rule) => Rule.required(),
			fields: [
				defineField({
					name: "name",
					title: "Name",
					type: "string",
					validation: (Rule) =>
						Rule.required().min(1).error("Organization name cannot be empty."),
				}),
				defineField({
					name: "logo",
					title: "Logo",
					type: "image",
					options: { hotspot: true },
				}),
				defineField({
					name: "website",
					title: "Website",
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
			title: "Details",
			type: "blockContent",
		}),
	],
	preview: {
		select: {
			title: "title",
			subtitle: "company.name",
			status: "status",
			opportunityType: "opportunityType",
		},
		prepare({ title, subtitle, status, opportunityType }) {
			const kind = opportunityTypeLabel(opportunityType ?? "job");
			return {
				title,
				subtitle: `${kind} • ${subtitle || "Internal"} • [${status?.toUpperCase() || "OPEN"}]`,
			};
		},
	},
});
