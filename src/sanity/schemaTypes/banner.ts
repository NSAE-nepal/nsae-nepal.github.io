import { defineField, defineType } from "sanity";

export const bannerType = defineType({
	name: "banners",
	title: "Banners",
	type: "document",
	fields: [
		defineField({
			name: "title",
			title: "Title",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "subtitle",
			title: "Subtitle",
			type: "string",
		}),
		defineField({
			name: "backgroundImage",
			title: "Background Image",
			type: "image",
			options: { hotspot: true },
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "contentPosition",
			title: "Content Position",
			type: "string",
			options: {
				list: [
					{ title: "Left", value: "left" },
					{ title: "Right", value: "right" },
				],
				layout: "radio",
			},
			initialValue: "left",
		}),
		defineField({
			name: "description",
			title: "Description",
			type: "text",
			rows: 3,
		}),
		defineField({
			name: "buttonText",
			title: "Button Text",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "buttonLink",
			title: "Button Link",
			type: "string",
			initialValue: "#",
		}),
		defineField({
			name: "buttonState",
			title: "Button State",
			type: "string",
			options: {
				list: [
					{ title: "Active", value: "active" },
					{ title: "Inactive", value: "inactive" },
				],
				layout: "radio",
			},
			initialValue: "active",
		}),
		defineField({
			name: "showBanner",
			title: "Show Banner",
			type: "boolean",
			initialValue: true,
		}),
		defineField({
			name: "countdownTarget",
			title: "Countdown Target Date",
			type: "datetime",
			description:
				"Setting a date automatically turns this banner into a countdown variant.",
		}),
	],
	preview: {
		select: {
			title: "title",
			subtitle: "subtitle",
			media: "backgroundImage",
			countdown: "countdownTarget",
		},
		prepare({ title, subtitle, media, countdown }) {
			const variant = countdown ? "Countdown" : "Default";
			return {
				title: title || "Untitled Banner",
				subtitle: `[${variant}] ${subtitle || ""}`,
				media,
			};
		},
	},
});
