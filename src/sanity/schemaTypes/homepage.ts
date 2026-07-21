import { defineArrayMember, defineField, defineType } from "sanity";

export const homeType = defineType({
	name: "home",
	title: "Home Page",
	type: "document",
	fields: [
		// ----------------------------------------------------------------------
		// 1. CAROUSEL (Min 1 image enforced)
		// ----------------------------------------------------------------------
		defineField({
			name: "carousel",
			title: "Hero Carousel Images",
			type: "array",
			description: "At least one image is required.",
			validation: (Rule) => Rule.required().min(1),
			of: [
				defineArrayMember({
					type: "image",
					options: { hotspot: true },
					fields: [
						defineField({
							name: "alt",
							title: "Alternative Text",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
					],
				}),
			],
		}),

		// ----------------------------------------------------------------------
		// 2. OBJECTIVES
		// ----------------------------------------------------------------------
		defineField({
			name: "objective",
			title: "Objective Section",
			type: "object",
			validation: (Rule) => Rule.required(),
			fields: [
				defineField({
					name: "summaryText",
					title: "Summary Text",
					type: "text",
					rows: 4,
					validation: (Rule) => Rule.required(),
				}),
				defineField({
					name: "imagePrimary",
					title: "Primary Image",
					type: "image",
					options: { hotspot: true },
					validation: (Rule) => Rule.required(),
					fields: [
						defineField({
							name: "alt",
							title: "Alternative Text",
							type: "string",
						}),
					],
				}),
				defineField({
					name: "imageSecondary",
					title: "Secondary Image",
					type: "image",
					options: { hotspot: true },
					validation: (Rule) => Rule.required(),
					fields: [
						defineField({
							name: "alt",
							title: "Alternative Text",
							type: "string",
						}),
					],
				}),
				defineField({
					name: "videoPrimary",
					title: "Primary Video Link",
					type: "file",
					options: {
						accept: ".mp4",
					},
					validation: (Rule) => Rule.required(),
				}),

				defineField({
					name: "metric1",
					title: "Metric 1",
					type: "object",
					validation: (Rule) => Rule.required(),
					fields: [
						defineField({
							name: "name",
							title: "Name",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "value",
							title: "Value",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "subtitle",
							title: "Subtitle",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
					],
				}),
				defineField({
					name: "metric2",
					title: "Metric 2",
					type: "object",
					validation: (Rule) => Rule.required(),
					fields: [
						defineField({
							name: "name",
							title: "Name",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "value",
							title: "Value",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "subtitle",
							title: "Subtitle",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
					],
				}),
			],
		}),

		// ----------------------------------------------------------------------
		// 3. BYLAWS
		// ----------------------------------------------------------------------
		defineField({
			name: "bylaws",
			title: "Bylaws Section",
			type: "object",
			validation: (Rule) => Rule.required(),
			fields: [
				defineField({
					name: "description",
					title: "Description",
					type: "text",
					rows: 3,
					validation: (Rule) => Rule.required(),
				}),
				defineField({
					name: "file",
					title: "Bylaws Document (PDF/Doc)",
					type: "file",
					options: {
						accept: ".pdf,.doc,.docx",
					},
					validation: (Rule) => Rule.required(),
				}),
			],
		}),

		// ----------------------------------------------------------------------
		// 4. MEMBERSHIP TIERS
		// ----------------------------------------------------------------------
		defineField({
			name: "membership",
			title: "Membership Tiers",
			type: "object",
			fields: [
				defineField({
					name: "general",
					title: "General Membership",
					type: "object",
					validation: (Rule) => Rule.required(),
					fields: [
						defineField({
							name: "benefits",
							title: "Benefits List",
							type: "array",
							validation: (Rule) => Rule.required().min(1),
							of: [{ type: "string" }],
						}),
						defineField({
							name: "joinUrl",
							title: "Join URL",
							type: "url",

							validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
						}),
					],
				}),
				defineField({
					name: "lifetime",
					title: "Lifetime Membership",
					type: "object",
					validation: (Rule) => Rule.required(),
					fields: [
						defineField({
							name: "benefits",
							title: "Benefits List",
							type: "array",
							validation: (Rule) => Rule.required().min(1),
							of: [{ type: "string" }],
						}),
						defineField({
							name: "joinUrl",
							title: "Join URL",
							type: "url",
							validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
						}),
					],
				}),
			],
		}),
	],
	preview: {
		prepare() {
			return {
				title: "Home Page Content",
			};
		},
	},
});
