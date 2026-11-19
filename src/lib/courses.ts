import type {
	Course,
	CourseLevel,
	LessonSummary,
} from "@/sanity/lib/queries/courses";

export const coursePath = (course: Pick<Course, "slug">) =>
	`/courses/${course.slug}/`;

export const lessonPath = (
	course: Pick<Course, "slug">,
	lesson: Pick<LessonSummary, "slug">,
) => `/courses/${course.slug}/${lesson.slug}/`;

export const LEVEL_LABELS: Record<CourseLevel, string> = {
	beginner: "Beginner",
	intermediate: "Intermediate",
	advanced: "Advanced",
};

/** All lessons in syllabus order. */
export const courseLessons = (course: Pick<Course, "modules">) =>
	course.modules.flatMap((module) => module.lessons);

/** Lessons count as at least a minute so totals never read "0 min". */
const lessonMinutes = (lesson: LessonSummary) =>
	Math.max(1, lesson.minutes ?? 0);

export function courseStats(course: Pick<Course, "modules">) {
	const lessons = courseLessons(course);
	return {
		lessonCount: lessons.length,
		moduleCount: course.modules.length,
		quizCount: lessons.filter((lesson) => lesson.hasQuiz).length,
		totalMinutes: lessons.reduce(
			(sum, lesson) => sum + lessonMinutes(lesson),
			0,
		),
	};
}

/** "45 min", "2 h", "1 h 30 min" */
export function formatDuration(minutes: number) {
	const rounded = Math.max(1, Math.round(minutes));
	const hours = Math.floor(rounded / 60);
	const rest = rounded % 60;
	if (hours === 0) return `${rest} min`;
	return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/** Previous/next lesson around `lessonId`, crossing module boundaries. */
export function lessonNeighbours(
	course: Pick<Course, "modules">,
	lessonId: string,
) {
	const lessons = courseLessons(course);
	const index = lessons.findIndex((lesson) => lesson._id === lessonId);
	return {
		index,
		total: lessons.length,
		previous: index > 0 ? lessons[index - 1] : undefined,
		next:
			index >= 0 && index < lessons.length - 1 ? lessons[index + 1] : undefined,
	};
}

/** "2.4 MB" */
export function formatFileSize(bytes?: number) {
	if (!bytes) return "";
	const units = ["B", "KB", "MB", "GB"];
	let value = bytes;
	let unit = 0;
	while (value >= 1024 && unit < units.length - 1) {
		value /= 1024;
		unit += 1;
	}
	return `${value.toFixed(value < 10 && unit > 0 ? 1 : 0)} ${units[unit]}`;
}
