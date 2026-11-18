/**
 * Course progress, kept in this browser only (no accounts on a static site).
 * Keyed by Sanity _ids, so renaming a course or lesson keeps progress.
 *
 * Page hooks (all optional, set by the course components):
 * - [data-course-progress][data-course-id][data-lesson-ids="id,id"]
 *     containers holding [data-progress-bar] and [data-progress-label]
 * - [data-lesson-item][data-lesson-id]   gets data-complete="true"
 * - [data-course-cta][data-course-id][data-lesson-ids]   Start/Continue link
 * - [data-lesson-page]   on a lesson: course/lesson ids, titles, path, quiz flag
 * - [data-lesson-complete]   "Mark as complete" toggle on a lesson
 * - [data-continue-learning][data-courses='{"courseId":["lessonId"]}']
 *     hidden link filled with the latest unfinished course
 * - [data-progress-ui]   hidden until storage works (private mode, no JS)
 */

const STORAGE_KEY = "nsae:learn:v1";

type CourseRecord = {
	completed: string[];
	courseTitle?: string;
	coursePath?: string;
	lastLessonId?: string;
	lastLessonTitle?: string;
	lastLessonPath?: string;
	updatedAt: number;
};
type Store = { courses: Record<string, CourseRecord> };

const load = (): Store | null => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return { courses: {} };
		const parsed = JSON.parse(raw) as Partial<Store>;
		return { courses: parsed.courses ?? {} };
	} catch {
		return null;
	}
};

const save = (store: Store) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
		return true;
	} catch {
		return false;
	}
};

const record = (store: Store, courseId: string): CourseRecord => {
	store.courses[courseId] ??= { completed: [], updatedAt: Date.now() };
	return store.courses[courseId];
};

const ids = (value?: string) => (value ? value.split(",").filter(Boolean) : []);

const completedIn = (store: Store, courseId: string, lessonIds: string[]) => {
	const done = new Set(store.courses[courseId]?.completed ?? []);
	return lessonIds.filter((id) => done.has(id));
};

function renderProgress(store: Store) {
	document
		.querySelectorAll<HTMLElement>("[data-course-progress]")
		.forEach((container) => {
			const courseId = container.dataset.courseId ?? "";
			const lessonIds = ids(container.dataset.lessonIds);
			const done = completedIn(store, courseId, lessonIds).length;
			const total = lessonIds.length;
			const ratio = total > 0 ? done / total : 0;

			const bar = container.querySelector<HTMLElement>("[data-progress-bar]");
			if (bar) bar.style.transform = `scaleX(${ratio})`;
			const track = container.querySelector<HTMLElement>("[role='progressbar']");
			track?.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
			const label = container.querySelector<HTMLElement>("[data-progress-label]");
			if (label) {
				label.textContent =
					done === 0
						? `${total} lesson${total === 1 ? "" : "s"}`
						: done === total
							? "Completed"
							: `${done} of ${total} lessons done`;
			}
			container.dataset.started = String(done > 0);
			container.dataset.finished = String(total > 0 && done === total);
		});

	document.querySelectorAll<HTMLElement>("[data-lesson-item]").forEach((item) => {
		const courseId = item.dataset.courseId ?? "";
		const done = store.courses[courseId]?.completed ?? [];
		item.dataset.complete = String(done.includes(item.dataset.lessonId ?? ""));
	});

	document.querySelectorAll<HTMLAnchorElement>("[data-course-cta]").forEach((cta) => {
		const courseId = cta.dataset.courseId ?? "";
		const lessonIds = ids(cta.dataset.lessonIds);
		const entry = store.courses[courseId];
		const done = completedIn(store, courseId, lessonIds).length;
		const label = cta.querySelector<HTMLElement>("[data-cta-label]");
		if (!entry || done === 0 || !label) return;
		if (done === lessonIds.length) {
			label.textContent = "Review course";
			return;
		}
		if (entry.lastLessonPath) {
			cta.href = entry.lastLessonPath;
			label.textContent = "Continue learning";
		}
	});
}

function renderLessonToggle(store: Store) {
	const page = document.querySelector<HTMLElement>("[data-lesson-page]");
	const toggle = document.querySelector<HTMLButtonElement>("[data-lesson-complete]");
	if (!page || !toggle) return;
	const { courseId = "", lessonId = "" } = page.dataset;
	const done = store.courses[courseId]?.completed.includes(lessonId) ?? false;
	const needsQuiz = page.dataset.requiresQuiz === "true";

	toggle.setAttribute("aria-pressed", String(done));
	toggle.dataset.complete = String(done);
	toggle.disabled = needsQuiz && !done;
	const label = toggle.querySelector<HTMLElement>("[data-toggle-label]");
	if (label) {
		label.textContent = done
			? "Completed"
			: needsQuiz
				? "Pass the quiz to complete"
				: "Mark as complete";
	}
}

function renderContinueLearning(store: Store) {
	document
		.querySelectorAll<HTMLElement>("[data-continue-learning]")
		.forEach((slot) => {
			// Only courses that still exist (rendered into the slot at build time).
			let known = new Map<string, string[]>();
			try {
				known = new Map(
					Object.entries(
						JSON.parse(slot.dataset.courses ?? "{}") as Record<string, string[]>,
					),
				);
			} catch {
				// Malformed data: show nothing.
			}
			const latest = Object.entries(store.courses)
				.filter(([courseId, entry]) => {
					const lessonIds = known.get(courseId);
					return (
						lessonIds &&
						entry.lastLessonPath &&
						completedIn(store, courseId, lessonIds).length < lessonIds.length
					);
				})
				.sort(([, a], [, b]) => b.updatedAt - a.updatedAt)[0]?.[1];

			if (!latest?.lastLessonPath) {
				slot.hidden = true;
				return;
			}
			const link = slot.matches("a[data-continue-link]")
				? (slot as HTMLAnchorElement)
				: slot.querySelector<HTMLAnchorElement>("a[data-continue-link]");
			const course = slot.querySelector<HTMLElement>("[data-continue-course]");
			const lesson = slot.querySelector<HTMLElement>("[data-continue-lesson]");
			if (link) link.href = latest.lastLessonPath;
			if (course) course.textContent = latest.courseTitle ?? "";
			if (lesson) lesson.textContent = latest.lastLessonTitle ?? "";
			slot.hidden = false;
		});
}

function render(store: Store) {
	document
		.querySelectorAll<HTMLElement>("[data-progress-ui]")
		.forEach((el) => {
			el.hidden = false;
		});
	renderProgress(store);
	renderLessonToggle(store);
	renderContinueLearning(store);
}

function setLessonComplete(complete: boolean) {
	const page = document.querySelector<HTMLElement>("[data-lesson-page]");
	const store = load();
	if (!page || !store) return;
	const { courseId = "", lessonId = "" } = page.dataset;
	const entry = record(store, courseId);
	const done = new Set(entry.completed);
	if (complete) done.add(lessonId);
	else done.delete(lessonId);
	entry.completed = [...done];
	entry.updatedAt = Date.now();
	save(store);
	render(store);
}

document.addEventListener("astro:page-load", () => {
	const store = load();
	if (!store) return; // Storage unavailable: progress UI stays hidden.

	const page = document.querySelector<HTMLElement>("[data-lesson-page]");
	if (page) {
		const entry = record(store, page.dataset.courseId ?? "");
		entry.courseTitle = page.dataset.courseTitle;
		entry.coursePath = page.dataset.coursePath;
		entry.lastLessonId = page.dataset.lessonId;
		entry.lastLessonTitle = page.dataset.lessonTitle;
		entry.lastLessonPath = window.location.pathname;
		entry.updatedAt = Date.now();
		if (!save(store)) return;
	}

	render(store);
});

// Delegated once for the session; elements come and go with page swaps.
document.addEventListener("click", (event) => {
	const toggle = (event.target as HTMLElement).closest<HTMLButtonElement>(
		"[data-lesson-complete]",
	);
	if (!toggle || toggle.disabled) return;
	setLessonComplete(toggle.dataset.complete !== "true");
});

document.addEventListener("quiz:complete", (event) => {
	const { passed } = (event as CustomEvent<{ passed: boolean }>).detail ?? {};
	const page = document.querySelector<HTMLElement>("[data-lesson-page]");
	if (passed && page?.dataset.requiresQuiz === "true") setLessonComplete(true);
});

// Side-effect module (imported for its listeners); keeps declarations file-scoped.
export {};
