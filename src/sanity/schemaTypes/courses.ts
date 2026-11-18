import { defineArrayMember, defineField, defineType } from "sanity";

/**
 * Courses: an ordered set of lessons grouped into modules.
 * Lesson order lives only on the course (modules[].lessons[]), so editors
 * reorder by dragging; each lesson belongs to at most one course.
 */

const LEVELS = [
	{ title: "Beginner", value: "beginner" },
	{ title: "Intermediate", value: "intermediate" },
	{ title: "Advanced", value: "advanced" },
];

type Ref = { _ref?: string };
type CourseModule = { lessons?: Ref[] };

/** Published id for a document id that may be a draft. */
const publishedId = (id: string) => id.replace(/^drafts\./, "");

export const courseModuleType = defineType({
	name: "courseModule",
	title: "Module",
	type: "object",
	fields: [
		defineField({
			name: "title",
			title: "Module title",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "description",
			title: "Short description",
			type: "text",
			rows: 2,
		}),
		defineField({
			name: "lessons",
			title: "Lessons",
			description: "Drag to reorder. A lesson can only be used in one course.",
			type: "array",
			of: [
				defineArrayMember({
					type: "reference",
					to: [{ type: "lesson" }],
					options: {
						// Hide lessons that another course already uses.
						filter: ({ document }) => {
							const id = publishedId(document._id);
							return {
								filter: `!(_id in *[
									_type == "course" &&
									!(_id in [$id, "drafts." + $id])
								].modules[].lessons[]._ref)`,
								params: { id },
							};
						},
					},
				}),
			],
			validation: (Rule) => Rule.required().min(1).unique(),
		}),
	],
	preview: {
		select: { title: "title", lessons: "lessons" },
		prepare({ title, lessons }) {
			const count = Array.isArray(lessons) ? lessons.length : 0;
			return {
				title: title || "Untitled module",
				subtitle: `${count} lesson${count === 1 ? "" : "s"}`,
			};
		},
	},
});

export const courseType = defineType({
	name: "course",
	title: "Courses",
	type: "document",
	groups: [
		{ name: "overview", title: "Overview", default: true },
		{ name: "syllabus", title: "Syllabus" },
		{ name: "extras", title: "Extras" },
	],
	fields: [
		defineField({
			name: "title",
			type: "string",
			group: "overview",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "slug",
			type: "slug",
			group: "overview",
			options: { source: "title", maxLength: 96 },
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "summary",
			title: "Summary",
			description: "One or two sentences, shown on course cards and in search results.",
			type: "text",
			rows: 3,
			group: "overview",
			validation: (Rule) => Rule.required().max(240),
		}),
		defineField({
			name: "description",
			title: "About this course",
			type: "blockContentSimple",
			group: "overview",
		}),
		defineField({
			name: "coverImage",
			title: "Cover image",
			type: "image",
			group: "overview",
			options: { hotspot: true },
			fields: [
				defineField({
					name: "alt",
					type: "string",
					title: "Alternative text",
					validation: (Rule) => Rule.required(),
				}),
			],
		}),
		defineField({
			name: "level",
			type: "string",
			group: "overview",
			options: { list: LEVELS, layout: "radio", direction: "horizontal" },
			initialValue: "beginner",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "instructors",
			type: "array",
			group: "overview",
			of: [defineArrayMember({ type: "reference", to: [{ type: "author" }] })],
		}),
		defineField({
			name: "categories",
			type: "array",
			group: "overview",
			of: [defineArrayMember({ type: "reference", to: [{ type: "category" }] })],
		}),
		defineField({
			name: "outcomes",
			title: "What you'll learn",
			description: "Short outcomes, e.g. \"Size a drip irrigation system for a 1 ha plot\".",
			type: "array",
			group: "syllabus",
			of: [defineArrayMember({ type: "string" })],
		}),
		defineField({
			name: "prerequisites",
			type: "array",
			group: "syllabus",
			of: [defineArrayMember({ type: "string" })],
		}),
		defineField({
			name: "modules",
			type: "array",
			group: "syllabus",
			of: [defineArrayMember({ type: "courseModule" })],
			validation: (Rule) =>
				Rule.required()
					.min(1)
					.custom((modules) => {
						const refs = ((modules ?? []) as CourseModule[])
							.flatMap((module) => module.lessons ?? [])
							.map((lesson) => lesson._ref)
							.filter(Boolean);
						return new Set(refs).size === refs.length
							? true
							: "A lesson appears in more than one module.";
					}),
		}),
		defineField({
			name: "relatedEvents",
			title: "Related events",
			description: "Live trainings or workshops that go with this course.",
			type: "array",
			group: "extras",
			of: [defineArrayMember({ type: "reference", to: [{ type: "events" }] })],
		}),
		defineField({
			name: "resources",
			title: "Course resources",
			description: "Downloads for the whole course (handbooks, templates, data sheets).",
			type: "array",
			group: "extras",
			of: [defineArrayMember({ type: "courseResource" })],
		}),
		defineField({
			name: "featured",
			type: "boolean",
			group: "extras",
			initialValue: false,
		}),
		defineField({
			name: "publishedAt",
			type: "datetime",
			group: "extras",
			initialValue: () => new Date().toISOString(),
			validation: (Rule) => Rule.required(),
		}),
	],
	orderings: [
		{
			title: "Published, newest",
			name: "publishedAtDesc",
			by: [{ field: "publishedAt", direction: "desc" }],
		},
	],
	preview: {
		select: { title: "title", level: "level", media: "coverImage", modules: "modules" },
		prepare({ title, level, media, modules }) {
			const count = Array.isArray(modules)
				? (modules as CourseModule[]).reduce(
						(sum, module) => sum + (module.lessons?.length ?? 0),
						0,
					)
				: 0;
			return {
				title: title || "Untitled course",
				subtitle: [level, `${count} lesson${count === 1 ? "" : "s"}`]
					.filter(Boolean)
					.join(" · "),
				media,
			};
		},
	},
});

export const courseResourceType = defineType({
	name: "courseResource",
	title: "Resource",
	type: "object",
	fields: [
		defineField({
			name: "title",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "file",
			type: "file",
			validation: (Rule) => Rule.required(),
		}),
	],
	preview: { select: { title: "title", subtitle: "file.asset.originalFilename" } },
});

export const lessonType = defineType({
	name: "lesson",
	title: "Lessons",
	type: "document",
	fields: [
		defineField({
			name: "title",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "slug",
			type: "slug",
			options: { source: "title", maxLength: 96 },
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "summary",
			type: "text",
			rows: 2,
			description: "Shown under the lesson title and in the syllabus.",
		}),
		defineField({
			name: "durationMinutes",
			title: "Duration (minutes)",
			description: "Leave empty to estimate from the text.",
			type: "number",
			validation: (Rule) => Rule.integer().min(1),
		}),
		defineField({
			name: "body",
			title: "Lesson content",
			description: "Text, images, video embeds, code, tables and at most one quiz.",
			type: "blockContent",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "attachments",
			type: "array",
			of: [defineArrayMember({ type: "courseResource" })],
		}),
	],
	preview: {
		select: { title: "title", minutes: "durationMinutes" },
		prepare({ title, minutes }) {
			return {
				title: title || "Untitled lesson",
				subtitle: minutes ? `${minutes} min` : undefined,
			};
		},
	},
});
