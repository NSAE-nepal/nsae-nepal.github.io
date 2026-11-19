import type { APIRoute } from "astro";
import * as offline from "@/lib/offline";
import source from "@/service-worker/sw.js?raw";

/**
 * /sw.js: the service worker (src/service-worker/sw.js) with its settings.
 * VERSION changes on every build, so each deploy installs a new worker that
 * re-caches the offline and home pages; the runtime caches carry over.
 */
const VERSION = Date.now().toString(36);

const config = {
	VERSION,
	OFFLINE_PATH: offline.OFFLINE_PATH,
	START_PATH: offline.START_PATH,
	PRECACHE_ALIASES_PATH: offline.PRECACHE_ALIASES_PATH,
	CACHE_PREFIX: offline.CACHE_PREFIX,
	PRECACHE_PREFIX: offline.PRECACHE_PREFIX,
	CACHE_NAMES: offline.CACHE_NAMES,
	MAX_CACHED_PAGES: offline.MAX_CACHED_PAGES,
	MAX_CACHED_ASSETS: offline.MAX_CACHED_ASSETS,
	NETWORK_TIMEOUT_MS: offline.NETWORK_TIMEOUT_MS,
	SAVED_RECORD_PREFIX: offline.SAVED_RECORD_PREFIX,
	OFFLINE_FALLBACK_HEADER: offline.OFFLINE_FALLBACK_HEADER,
};

/**
 * Kill switch (SERVICE_WORKER_ENABLED = false): a worker that deletes the
 * site's caches, unregisters itself and reloads open tabs from the network.
 */
const killSwitch = `
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
	event.waitUntil((async () => {
		for (const name of await caches.keys()) {
			if (name.startsWith(${JSON.stringify(offline.CACHE_PREFIX)})) await caches.delete(name);
		}
		await self.registration.unregister();
		for (const client of await self.clients.matchAll({ type: "window" })) {
			client.navigate(client.url);
		}
	})());
});
`;

export const GET: APIRoute = () =>
	new Response(
		offline.SERVICE_WORKER_ENABLED
			? `const CONFIG = ${JSON.stringify(config)};\n${source}`
			: killSwitch,
		{ headers: { "Content-Type": "text/javascript; charset=utf-8" } },
	);
