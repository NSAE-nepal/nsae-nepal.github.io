import { UserIcon } from "@sanity/icons/User";
import { defineArrayMember, defineField, defineType } from "sanity";

const imageWithAlt = (name: string, title: string, description?: string) =>
	defineField({
		name,
		title,
		description,
		type: "image",
		options: { hotspot: true },
		fields: [
			defineField({
				name: "alt",
				title: "Alternative Text",
				description: "Describe the photo for people who can't see it.",
				type: "string",
				validation: (Rule) => Rule.required(),
			}),
		],
	});

export const spotlightType = defineType({
	name: "spotlight",
	title: "Member Spotlight",
	type: "document",
	icon: UserIcon,
	fields: [
		defineField({
			name: "member",
			title: "Member",
			description:
				"The person featured. Add them under Authors first if they aren't there (name, photo, position, bio, socials).",
			type: "reference",
			to: [{ type: "author" }],
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "headline",
			title: "Headline",
			description: 'e.g. "Bringing solar irrigation to Terai smallholders".',
			type: "string",
			validation: (Rule) => Rule.required().max(120),
		}),
		defineField({
			name: "slug",
			title: "Slug",
			type: "slug",
			options: { source: "headline", maxLength: 96 },
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "summary",
			title: "Summary",
			description: "One or two sentences for cards, the home page and search results.",
			type: "text",
			rows: 3,
			validation: (Rule) => Rule.required().max(280),
		}),
		defineField({
			name: "specializations",
			title: "Specializations",
			description: 'Short tags, e.g. "Irrigation", "Farm machinery".',
			type: "array",
			of: [defineArrayMember({ type: "string" })],
			options: { layout: "tags" },
		}),
		defineField({
			name: "location",
			title: "Based In",
			description: 'e.g. "Chitwan" or "Kathmandu".',
			type: "string",
		}),
		imageWithAlt(
			"coverImage",
			"Cover Photo",
			"Ideally the member at work. Falls back to their profile photo.",
		),
		defineField({
			name: "projects",
			title: "Projects",
			description: "Work worth highlighting, most notable first.",
			type: "array",
			of: [
				defineArrayMember({
					name: "spotlightProject",
					title: "Project",
					type: "object",
					fields: [
						defineField({
							name: "title",
							title: "Title",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "year",
							title: "Year",
							type: "string",
							description: 'e.g. "2024" or "2021–2023".',
						}),
						defineField({ name: "location", title: "Location", type: "string" }),
						defineField({
							name: "summary",
							title: "Summary",
							type: "text",
							rows: 3,
						}),
						imageWithAlt("image", "Photo"),
					],
					preview: {
						select: { title: "title", year: "year", media: "image" },
						prepare: ({ title, year, media }) => ({ title, subtitle: year, media }),
					},
				}),
			],
		}),
		defineField({
			name: "body",
			title: "Story",
			description: "The full profile or interview. Same editor as blog posts.",
			type: "blockContent",
		}),
		defineField({
			name: "featured",
			title: "Show on Home Page",
			description: "The most recent featured spotlight appears on the home page.",
			type: "boolean",
			initialValue: true,
		}),
		defineField({
			name: "publishedAt",
			title: "Published On",
			type: "datetime",
			initialValue: () => new Date().toISOString(),
			validation: (Rule) => Rule.required(),
		}),
	],
	orderings: [
		{
			title: "Newest first",
			name: "publishedAtDesc",
			by: [{ field: "publishedAt", direction: "desc" }],
		},
	],
	preview: {
		select: {
			title: "headline",
			name: "member.name",
			media: "coverImage",
			memberImage: "member.profileImage",
			featured: "featured",
		},
		prepare: ({ title, name, media, memberImage, featured }) => ({
			title,
			subtitle: [name, featured ? "On home page" : undefined].filter(Boolean).join(" • "),
			media: media ?? memberImage,
		}),
	},
});
