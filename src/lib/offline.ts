/**
 * Offline support settings, shared by the service worker (src/pages/sw.js.ts
 * passes them in as `CONFIG`) and the page scripts. Keep this file
 * import-free.
 */

/**
 * Kill switch: set to false and deploy to remove the service worker and its
 * caches from every visitor's browser (see README, "Offline support").
 */
export const SERVICE_WORKER_ENABLED = true;

/** Shown when a page isn't cached; precached by every worker version. */
export const OFFLINE_PATH = "/offline/";

/**
 * The home page, also precached, so the installed app opens offline even if
 * the visitor never came back to it. Same as the manifest's `start_url`.
 */
export const START_PATH = "/";

/** Every cache this site creates starts with this. */
export const CACHE_PREFIX = "nsae-";

/** Per-build cache holding the offline and home pages with their assets. */
export const PRECACHE_PREFIX = `${CACHE_PREFIX}precache-`;

/**
 * Runtime caches. Bump a name's version only when the format of what it
 * stores changes; the worker deletes `nsae-` caches it doesn't know.
 */
export const CACHE_NAMES = {
	/** Recently visited pages (network-first), trimmed to MAX_CACHED_PAGES. */
	pages: `${CACHE_PREFIX}pages-v1`,
	/** Hashed build files and other static files, trimmed to MAX_CACHED_ASSETS. */
	assets: `${CACHE_PREFIX}assets-v1`,
	/** Courses saved for offline: pages, assets and a record per course. Never trimmed. */
	saved: `${CACHE_PREFIX}saved-v1`,
} as const;

export const MAX_CACHED_PAGES = 60;
export const MAX_CACHED_ASSETS = 300;

/** How long a page request waits for the network before using the cached copy. */
export const NETWORK_TIMEOUT_MS = 4000;

/** Precache entry listing the image widths that stand in for others (see SavedCourse.aliases). */
export const PRECACHE_ALIASES_PATH = "/__offline__/precache-aliases";

/** Path prefix of the per-course records kept in the saved cache. */
export const SAVED_RECORD_PREFIX = "/__offline__/saved/";

/** Set on the offline page when the worker serves it in place of another page. */
export const OFFLINE_FALLBACK_HEADER = "X-NSAE-Offline-Fallback";

/** What the worker stores about a course saved for offline. */
export type SavedCourse = {
	id: string;
	title: string;
	/** The course page; `pages` also holds every lesson. */
	path: string;
	pages: string[];
	assets: string[];
	/** Image URLs that weren't downloaded → the srcset candidate that was. */
	aliases: Record<string, string>;
	bytes: number;
	savedAt: number;
};

export const savedRecordPath = (courseId: string) =>
	`${SAVED_RECORD_PREFIX}${encodeURIComponent(courseId)}`;
