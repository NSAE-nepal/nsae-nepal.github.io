/* global CONFIG */
/**
 * NSAE service worker: offline pages and "Save for offline" courses.
 *
 * Served as /sw.js by src/pages/sw.js.ts, which prepends
 * `const CONFIG = {...}` (the settings in src/lib/offline.ts plus a per-build
 * VERSION). Plain JavaScript, shipped as written: it isn't bundled or
 * type-checked, so keep it dependency-free.
 *
 * - Install: the offline page and the home page (the app's start_url), with
 *   their assets. The home page is best effort; the offline page is required.
 * - Pages (navigations, ClientRouter/prefetch fetches, any extensionless
 *   path): network-first; after NETWORK_TIMEOUT_MS or offline, the cached
 *   copy, else the offline page.
 * - /_astro/ and /fonts/ (content-hashed): cache-first, kept across deploys
 *   so cached pages keep their CSS, scripts and images.
 * - Other static files (icons, images): stale-while-revalidate.
 * - Not handled: other origins, non-GET, /studio, /pagefind/ and anything
 *   else with a file extension (.ics, .xml).
 */

const {
	VERSION,
	OFFLINE_PATH,
	START_PATH,
	PRECACHE_ALIASES_PATH,
	CACHE_PREFIX,
	PRECACHE_PREFIX,
	CACHE_NAMES,
	MAX_CACHED_PAGES,
	MAX_CACHED_ASSETS,
	NETWORK_TIMEOUT_MS,
	SAVED_RECORD_PREFIX,
	OFFLINE_FALLBACK_HEADER,
} = CONFIG;

const PRECACHE = PRECACHE_PREFIX + VERSION;
const KNOWN_CACHES = new Set([PRECACHE, ...Object.values(CACHE_NAMES)]);

const BYPASS = /^\/(?:studio(?:\/|$)|pagefind\/)/;
const HASHED = /^\/(?:_astro|fonts)\//;
const STATIC_FILE =
	/\.(?:png|jpe?g|webp|avif|gif|svg|ico|woff2?|webmanifest)$/i;
const HAS_EXTENSION = /\.[a-z0-9]+$/i;
/** /_astro/ and /fonts/ URLs in HTML and CSS. */
const ASSET_URL = /\/(?:_astro|fonts)\/[^\s"'(),<>\\&?#]+/g;
/** Static imports between bundled chunks (dynamic ones, e.g. search, stay online-only). */
const CHUNK_IMPORT = /(?:\bfrom|\bimport)\s*["'](\.{1,2}\/[^"']+?\.js)["']/g;
const MATCH = { ignoreSearch: true, ignoreVary: true };

// ---------------------------------------------------------------- lifecycle

self.addEventListener("install", (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(PRECACHE);
			const aliases = await precachePage(cache, OFFLINE_PATH);
			try {
				Object.assign(aliases, await precachePage(cache, START_PATH));
			} catch {
				// Not worth failing the install over; it's cached once visited.
			}
			await cache.put(
				PRECACHE_ALIASES_PATH,
				new Response(JSON.stringify(aliases), {
					headers: { "Content-Type": "application/json" },
				}),
			);
			await self.skipWaiting();
		})(),
	);
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			for (const name of await caches.keys()) {
				if (name.startsWith(CACHE_PREFIX) && !KNOWN_CACHES.has(name)) {
					await caches.delete(name);
				}
			}
			await self.registration.navigationPreload?.enable();
			await self.clients.claim();
		})(),
	);
});

// -------------------------------------------------------------------- fetch

self.addEventListener("fetch", (event) => {
	const { request } = event;
	if (request.method !== "GET") return;
	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (BYPASS.test(url.pathname)) {
		// Navigation preload already started this request; use it.
		if (request.mode === "navigate") {
			event.respondWith(
				Promise.resolve(event.preloadResponse).then(
					(preloaded) => preloaded || fetch(request),
				),
			);
		}
		return;
	}

	if (isPage(request, url)) {
		handlePage(event, url);
	} else if (HASHED.test(url.pathname)) {
		event.respondWith(cacheFirst(event, url));
	} else if (STATIC_FILE.test(url.pathname)) {
		event.respondWith(staleWhileRevalidate(event));
	}
});

function isPage(request, url) {
	return (
		request.mode === "navigate" ||
		(request.headers.get("Accept") ?? "").includes("text/html") ||
		!HAS_EXTENSION.test(url.pathname)
	);
}

function handlePage(event, url) {
	const { request } = event;
	const network = (async () => {
		const preloaded =
			request.mode === "navigate" ? await event.preloadResponse : undefined;
		const response = preloaded || (await fetch(request));
		return {
			response,
			copy: isStorablePage(response) ? response.clone() : null,
		};
	})();
	event.waitUntil(
		network.then(({ copy }) => copy && storePage(url, copy)).catch(() => {}),
	);
	event.respondWith(respondToPage(network, url));
}

async function respondToPage(network, url) {
	const fromNetwork = network.then(({ response }) => response);
	fromNetwork.catch(() => {});
	try {
		return await withTimeout(fromNetwork, NETWORK_TIMEOUT_MS);
	} catch {
		const cached = await matchPage(url);
		if (cached) return cached;
		try {
			return await fromNetwork;
		} catch {
			return offlineFallback();
		}
	}
}

function isStorablePage(response) {
	return (
		response.ok &&
		response.type === "basic" &&
		(response.headers.get("Content-Type") ?? "").includes("text/html")
	);
}

async function storePage(url, response) {
	// A followed redirect (e.g. /about → /about/) is stored under its target,
	// and as a plain response: browsers reject redirected responses for navigations.
	const key = pageKey(response.redirected ? new URL(response.url) : url);
	const copy = new Response(await response.blob(), {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers,
	});
	const cache = await caches.open(CACHE_NAMES.pages);
	await cache.delete(key); // re-insert so the cache stays in recently-used order
	await cache.put(key, copy);
	await trim(CACHE_NAMES.pages, MAX_CACHED_PAGES);
}

/** Recently visited copy first, then saved courses and the precache. */
async function matchPage(url) {
	const pages = await caches.open(CACHE_NAMES.pages);
	const key = pageKey(url);
	const keys = [key, key.endsWith("/") ? key.slice(0, -1) : `${key}/`];
	for (const candidate of keys) {
		const hit =
			(await pages.match(candidate, MATCH)) ??
			(await caches.match(candidate, MATCH));
		if (hit) return hit;
	}
	return undefined;
}

async function offlineFallback() {
	const page = await caches.match(OFFLINE_PATH, MATCH);
	if (!page) {
		return new Response("You are offline.", {
			status: 503,
			headers: { "Content-Type": "text/plain; charset=utf-8" },
		});
	}
	const headers = new Headers(page.headers);
	headers.set(OFFLINE_FALLBACK_HEADER, "1");
	return new Response(page.body, {
		status: 503,
		statusText: "Offline",
		headers,
	});
}

async function cacheFirst(event, url) {
	const { request } = event;
	const cached = await caches.match(request, MATCH);
	if (cached) return cached;
	try {
		const response = await fetch(request);
		if (response.ok && response.type === "basic") {
			const copy = response.clone();
			event.waitUntil(
				caches
					.open(CACHE_NAMES.assets)
					.then((cache) => cache.put(request, copy))
					.then(() => trim(CACHE_NAMES.assets, MAX_CACHED_ASSETS))
					.catch(() => {}),
			);
		}
		return response;
	} catch (error) {
		// Offline: a saved course may hold another width of the same image.
		const alias = await findAlias(url.pathname);
		const hit = alias && (await caches.match(alias, MATCH));
		if (hit) return hit;
		throw error;
	}
}

async function staleWhileRevalidate(event) {
	const { request } = event;
	const cached = await caches.match(request, MATCH);
	const network = fetch(request).then((response) => {
		if (response.ok && response.type === "basic") {
			const copy = response.clone();
			event.waitUntil(
				caches
					.open(CACHE_NAMES.assets)
					.then((cache) => cache.put(request, copy))
					.then(() => trim(CACHE_NAMES.assets, MAX_CACHED_ASSETS))
					.catch(() => {}),
			);
		}
		return response;
	});
	if (cached) {
		event.waitUntil(network.catch(() => {}));
		return cached;
	}
	return network;
}

// ------------------------------------------------------- saved courses

self.addEventListener("message", (event) => {
	const port = event.ports[0];
	const data = event.data;
	if (!port || !data || typeof data !== "object") return;

	let job;
	if (data.type === "save-course") {
		job = serialize(() => saveCourse(data.course, port));
	} else if (data.type === "remove-course") {
		job = serialize(() => removeCourse(data.id, port));
	} else {
		return;
	}
	event.waitUntil(
		job.catch((error) => {
			port.postMessage({
				type: "error",
				message: String(error?.message ?? error),
			});
		}),
	);
});

let queue = Promise.resolve();
/** One save/remove at a time, so clean-up never races a download. */
function serialize(task) {
	const run = queue.then(task, task);
	queue = run.catch(() => {});
	return run;
}

async function saveCourse(course, port) {
	const { id, title, path, pages, imageWidth } = course ?? {};
	if (
		typeof id !== "string" ||
		!Array.isArray(pages) ||
		!pages.every(isLocalPath) ||
		!isLocalPath(path)
	) {
		throw new Error("Invalid course");
	}

	const cache = await caches.open(CACHE_NAMES.saved);
	const assets = new Set();
	const aliases = {};
	let bytes = 0;
	try {
		for (const [index, page] of pages.entries()) {
			port.postMessage({
				type: "progress",
				phase: "pages",
				done: index,
				total: pages.length,
			});
			const response = await fetch(page, { cache: "no-cache" });
			if (!isStorablePage(response)) {
				throw new Error(`${page}: ${response.status}`);
			}
			const blob = await response.blob();
			bytes += blob.size;
			await cache.put(page, new Response(blob, { headers: response.headers }));
			const found = assetsInHtml(await blob.text(), imageWidth);
			found.assets.forEach((asset) => assets.add(asset));
			Object.assign(aliases, found.aliases);
		}
		port.postMessage({
			type: "progress",
			phase: "assets",
			done: pages.length,
			total: pages.length,
		});
		const stored = await storeAssets(cache, [...assets]);
		bytes += stored.bytes;

		const record = {
			id,
			title: String(title ?? ""),
			path,
			pages,
			assets: stored.assets,
			aliases,
			bytes,
			savedAt: Date.now(),
		};
		await cache.put(
			SAVED_RECORD_PREFIX + encodeURIComponent(id),
			new Response(JSON.stringify(record), {
				headers: { "Content-Type": "application/json" },
			}),
		);
		savedRecordsMemo = null;
		port.postMessage({ type: "done", record });
	} catch (error) {
		await collectGarbage(); // drop the partial download
		throw error;
	}
}

async function removeCourse(id, port) {
	const cache = await caches.open(CACHE_NAMES.saved);
	await cache.delete(SAVED_RECORD_PREFIX + encodeURIComponent(String(id)));
	savedRecordsMemo = null;
	await collectGarbage();
	port.postMessage({ type: "done" });
}

/** Delete anything in the saved cache that no course record still needs. */
async function collectGarbage() {
	const cache = await caches.open(CACHE_NAMES.saved);
	const keep = new Set();
	for (const record of await savedRecords()) {
		keep.add(SAVED_RECORD_PREFIX + encodeURIComponent(record.id));
		record.pages.forEach((page) => keep.add(page));
		record.assets.forEach((asset) => keep.add(asset));
	}
	for (const request of await cache.keys()) {
		if (!keep.has(new URL(request.url).pathname)) await cache.delete(request);
	}
}

let savedRecordsMemo = null;
async function savedRecords() {
	savedRecordsMemo ??= (async () => {
		const cache = await caches.open(CACHE_NAMES.saved);
		const records = [];
		for (const request of await cache.keys()) {
			if (!new URL(request.url).pathname.startsWith(SAVED_RECORD_PREFIX))
				continue;
			try {
				records.push(await (await cache.match(request)).json());
			} catch {
				// Unreadable record: its files are cleaned up as unreferenced.
			}
		}
		return records;
	})();
	return savedRecordsMemo;
}

/**
 * Fetch a page and its assets into the precache. Images get one srcset
 * width (the worker can't know the screen); returns the aliases for the rest.
 * Assets already cached (e.g. by the previous worker) aren't downloaded again.
 */
async function precachePage(cache, path) {
	const response = await fetch(path, { cache: "reload" });
	if (!isStorablePage(response)) throw new Error(`${path}: ${response.status}`);
	const html = await response.clone().text();
	await cache.put(path, response);
	const found = assetsInHtml(html, 1024);
	await storeAssets(cache, found.assets);
	return found.aliases;
}

let precacheAliasesMemo = null;
async function precacheAliases() {
	precacheAliasesMemo ??= caches
		.open(PRECACHE)
		.then((cache) => cache.match(PRECACHE_ALIASES_PATH))
		.then((response) => (response ? response.json() : {}))
		.catch(() => ({}));
	return precacheAliasesMemo;
}

async function findAlias(pathname) {
	const precached = (await precacheAliases())[pathname];
	if (precached) return precached;
	for (const record of await savedRecords()) {
		if (record.aliases?.[pathname]) return record.aliases[pathname];
	}
	return undefined;
}

// ------------------------------------------------------------- helpers

/**
 * Same-origin build assets a page needs. A responsive image only needs the
 * srcset candidate closest to `imageWidth`; the others become aliases of it.
 */
function assetsInHtml(html, imageWidth) {
	const assets = new Set();
	const aliases = {};
	const grouped = new Set();

	for (const [tag] of html.matchAll(
		/<(?:img|source)\b[^>]*\ssrcset\s*=[^>]*>/gi,
	)) {
		const candidates = parseSrcset(attribute(tag, "srcset")).filter((c) =>
			isLocalPath(c.url),
		);
		if (candidates.length === 0) continue;
		const chosen = pickCandidate(candidates, imageWidth);
		const src = attribute(tag, "src");
		for (const url of [...candidates.map((c) => c.url), src]) {
			if (!url || !isLocalPath(url)) continue;
			grouped.add(url);
			if (url !== chosen) aliases[url] = chosen;
		}
		assets.add(chosen);
	}

	for (const [url] of html.matchAll(ASSET_URL)) {
		if (!grouped.has(url)) assets.add(url);
	}
	return { assets: [...assets], aliases };
}

function attribute(tag, name) {
	const match = tag.match(
		new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"),
	);
	const value = match?.[1] ?? match?.[2];
	return value?.replaceAll("&amp;", "&");
}

function parseSrcset(srcset = "") {
	return srcset
		.split(",")
		.map((part) => part.trim().split(/\s+/))
		.filter(([url]) => url)
		.map(([url, descriptor = "1x"]) => ({
			url,
			value: parseFloat(descriptor) || 1,
			unit: descriptor.endsWith("w") ? "w" : "x",
		}));
}

function pickCandidate(candidates, imageWidth) {
	const sorted = [...candidates].sort((a, b) => a.value - b.value);
	if (sorted[0].unit === "w") {
		const width = Number(imageWidth) || 800;
		return (sorted.find((c) => c.value >= width) ?? sorted.at(-1)).url;
	}
	return (sorted.filter((c) => c.value <= 2).at(-1) ?? sorted[0]).url;
}

/**
 * Cache `paths` plus what they pull in (fonts and images from CSS, chunks a
 * script imports). Best effort: a missing file doesn't fail the download.
 */
async function storeAssets(cache, paths) {
	const seen = new Set(paths);
	const pending = [...paths];
	let bytes = 0;
	while (pending.length > 0) {
		await Promise.all(
			pending.splice(0, 6).map(async (path) => {
				try {
					const response =
						(await caches.match(path, MATCH)) ?? (await fetch(path));
					if (!response.ok) return;
					const blob = await response.blob();
					bytes += blob.size;
					await cache.put(
						path,
						new Response(blob, { headers: response.headers }),
					);

					let found = [];
					if (path.endsWith(".css")) {
						found = [...(await blob.text()).matchAll(ASSET_URL)].map(
							([url]) => url,
						);
					} else if (path.endsWith(".js")) {
						found = [...(await blob.text()).matchAll(CHUNK_IMPORT)].map(
							([, relative]) =>
								new URL(relative, self.location.origin + path).pathname,
						);
					}
					for (const url of found) {
						if (!seen.has(url)) {
							seen.add(url);
							pending.push(url);
						}
					}
				} catch {
					// Skip it; the page still works, minus this file.
				}
			}),
		);
	}
	return { assets: [...seen], bytes };
}

const trimming = new Map();
/** Drop the oldest entries beyond `max`; one run per cache at a time. */
function trim(name, max) {
	if (!trimming.has(name)) {
		trimming.set(
			name,
			(async () => {
				const cache = await caches.open(name);
				const keys = await cache.keys();
				for (const request of keys.slice(0, Math.max(0, keys.length - max))) {
					await cache.delete(request);
				}
			})().finally(() => trimming.delete(name)),
		);
	}
	return trimming.get(name);
}

function pageKey(url) {
	return url.origin + url.pathname;
}

/**
 * A root-relative path that stays on this origin. Checked by resolving it:
 * URLs treat a backslash like "/", so "/\\evil.com" is another site.
 */
function isLocalPath(value) {
	if (typeof value !== "string" || !value.startsWith("/")) return false;
	try {
		const url = new URL(value, self.location.origin);
		return url.origin === self.location.origin && url.pathname === value;
	} catch {
		return false;
	}
}

function withTimeout(promise, ms) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("timeout")), ms);
		promise.then(
			(value) => {
				clearTimeout(timer);
				resolve(value);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}
