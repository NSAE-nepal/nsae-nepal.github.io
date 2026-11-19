import type { PortableTextBlock } from "sanity";
import { loadQuery } from "../load-query";
import type { Event } from "./events";
import type { Authors, Category } from "./posts";

export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type CourseResource = {
	_key: string;
	title: string;
	url?: string;
	filename?: string;
	size?: number;
};

export type LessonSummary = {
	_id: string;
	title: string;
	slug: string;
	summary?: string;
	/** Editor-set duration, else estimated from the text. Null when unknown. */
	minutes: number | null;
	hasQuiz: boolean;
};

export type CourseModule = {
	_key: string;
	title: string;
	description?: string;
	lessons: LessonSummary[];
};

export type Course = {
	_id: string;
	title: string;
	slug: string;
	summary: string;
	description?: PortableTextBlock[];
	coverImage?: string;
	coverImageAlt?: string;
	level: CourseLevel;
	featured: boolean;
	publishedAt: string;
	instructors: Authors[];
	categories: Category[];
	outcomes?: string[];
	prerequisites?: string[];
	modules: CourseModule[];
	relatedEvents: Event[];
	resources: CourseResource[];
};

export type LessonDetails = LessonSummary & {
	body: PortableTextBlock[];
	attachments: CourseResource[];
};

const RESOURCE_FIELDS = `
  _key,
  title,
  "url": file.asset->url,
  "filename": file.asset->originalFilename,
  "size": file.asset->size
`;

const LESSON_SUMMARY_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  summary,
  "minutes": coalesce(durationMinutes, round(length(pt::text(body)) / 1000)),
  "hasQuiz": count(body[_type == "quizReference" && defined(@->slug.current)]) > 0
`;

const COURSE_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  summary,
  description,
  "coverImage": coverImage.asset->url,
  "coverImageAlt": coverImage.alt,
  level,
  "featured": coalesce(featured, false),
  publishedAt,
  "instructors": instructors[]->{
    _id,
    name,
    "slug": slug.current,
    prefix,
    position,
    company,
    "profileImage": profileImage.asset->url
  },
  "categories": categories[]->{ _id, title },
  outcomes,
  prerequisites,
  "modules": modules[]{
    _key,
    title,
    description,
    "lessons": lessons[]->{ ${LESSON_SUMMARY_FIELDS} }
  },
  "relatedEvents": relatedEvents[]->{
    _id,
    title,
    "slug": slug.current,
    subtitle,
    eventType,
    "coverImage": coverImage.asset->url,
    "coverImageAlt": coverImage.alt,
    eventStart,
    eventEnd,
    location,
    registrationLink,
    registrationDeadline,
    publishedAt
  },
  "resources": resources[]{ ${RESOURCE_FIELDS} }
`;

/**
 * Drop dangling references (deleted/unpublished lessons, authors, events come
 * back as null) and default empty arrays so pages can map freely.
 */
const normalizeCourse = (course: Course): Course => ({
	...course,
	instructors: (course.instructors ?? []).filter(Boolean),
	categories: (course.categories ?? []).filter(Boolean),
	relatedEvents: (course.relatedEvents ?? []).filter((event) => event?.slug),
	resources: (course.resources ?? []).filter((resource) => resource?.url),
	modules: (course.modules ?? [])
		.filter(Boolean)
		.map((module) => ({
			...module,
			lessons: (module.lessons ?? []).filter((lesson) => lesson?.slug),
		}))
		.filter((module) => module.lessons.length > 0),
});

/** Every published course with its syllabus (no lesson bodies). */
export async function getCourses(): Promise<Course[]> {
	const { data } = await loadQuery<Course[]>({
		query: `*[
      _type == "course" &&
      defined(slug.current) &&
      !(_id in path("drafts.**"))
    ] | order(featured desc, publishedAt desc) { ${COURSE_FIELDS} }`,
	});
	// A course whose lessons are all unpublished has nothing to open yet.
	return (data ?? [])
		.map(normalizeCourse)
		.filter((course) =>
			course.modules.some((module) => module.lessons.length > 0),
		);
}

export async function getLessonDetails(
	slug: string,
): Promise<LessonDetails | null> {
	const { data } = await loadQuery<LessonDetails | null>({
		query: `*[
      _type == "lesson" &&
      slug.current == $slug &&
      !(_id in path("drafts.**"))
    ][0]{
      ${LESSON_SUMMARY_FIELDS},
      body[] {
        ...,
        _type == "quizReference" => {
          _type,
          "slug": @->slug.current
        }
      },
      "attachments": attachments[]{ ${RESOURCE_FIELDS} }
    }`,
		params: { slug },
	});
	if (!data) return null;
	return {
		...data,
		// A quiz block whose quiz was deleted has no slug; drop it rather than
		// failing the build in Quiz.astro.
		body: (data.body ?? []).filter(
			(block) =>
				block._type !== "quizReference" ||
				Boolean((block as { slug?: string }).slug),
		),
		attachments: (data.attachments ?? []).filter((resource) => resource?.url),
	};
}
