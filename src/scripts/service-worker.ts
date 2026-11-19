/**
 * Registers /sw.js in production builds (`bun run build` / `preview`). In dev,
 * or with the kill switch off, removes any worker a production build left on
 * this origin, so dev pages are never served from its caches.
 */
import { CACHE_PREFIX, SERVICE_WORKER_ENABLED } from "@/lib/offline";

const supported = "serviceWorker" in navigator;
const enabled = supported && import.meta.env.PROD && SERVICE_WORKER_ENABLED;

if (enabled) {
	const register = () => {
		navigator.serviceWorker.register("/sw.js").catch((error) => {
			console.warn("[offline] service worker registration failed", error);
		});
	};
	// After the page has loaded, so the worker's own downloads don't compete.
	if (document.readyState === "complete") register();
	else addEventListener("load", register, { once: true });
} else if (supported) {
	navigator.serviceWorker.getRegistrations().then(async (registrations) => {
		if (registrations.length === 0) return;
		await Promise.all(registrations.map((r) => r.unregister()));
		if ("caches" in window) {
			for (const name of await caches.keys()) {
				if (name.startsWith(CACHE_PREFIX)) await caches.delete(name);
			}
		}
	});
}

/** The active worker, or null where offline support isn't available. */
export async function activeWorker(): Promise<ServiceWorker | null> {
	if (!enabled || !("caches" in window)) return null;
	try {
		return (await navigator.serviceWorker.ready).active;
	} catch {
		return null;
	}
}

export type WorkerReply = {
	type: "progress" | "done" | "error";
	[key: string]: unknown;
};

/**
 * Send a message to the worker and resolve with its final reply ("done" or
 * "error"); "progress" replies go to `onProgress`.
 */
export function askWorker(
	worker: ServiceWorker,
	message: Record<string, unknown>,
	onProgress?: (reply: WorkerReply) => void,
): Promise<WorkerReply> {
	return new Promise((resolve) => {
		const channel = new MessageChannel();
		channel.port1.onmessage = (event: MessageEvent<WorkerReply>) => {
			if (event.data?.type === "progress") {
				onProgress?.(event.data);
				return;
			}
			channel.port1.close();
			resolve(event.data);
		};
		worker.postMessage(message, [channel.port2]);
	});
}
