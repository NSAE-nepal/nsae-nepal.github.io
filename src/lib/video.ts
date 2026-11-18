/**
 * Turns a pasted video link (YouTube, Vimeo, Loom) into embed details.
 * Returns null for anything unrecognised, so callers can fall back to a plain
 * link instead of failing the build.
 */
export type VideoProvider = "youtube" | "vimeo" | "loom";

export type VideoEmbed = {
	provider: VideoProvider;
	providerName: string;
	id: string;
	/** Player URL, loaded only when the visitor presses play. */
	embedUrl: string;
	/** Poster image, when the provider offers one without an API call. */
	thumbnail?: string;
};

const YOUTUBE_HOSTS = new Set([
	"youtube.com",
	"m.youtube.com",
	"music.youtube.com",
	"youtube-nocookie.com",
]);
const YOUTUBE_ID = /^[\w-]{11}$/;

/** "90", "90s", "1m30s", "1h2m3s" → seconds. */
const parseStart = (value: string | null) => {
	if (!value) return 0;
	if (/^\d+$/.test(value)) return Number(value);
	const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/);
	if (!match) return 0;
	const [, h = "0", m = "0", s = "0"] = match;
	return Number(h) * 3600 + Number(m) * 60 + Number(s);
};

function youtube(url: URL, host: string): VideoEmbed | null {
	let id: string | null = null;
	if (host === "youtu.be") {
		id = url.pathname.split("/")[1] ?? null;
	} else if (YOUTUBE_HOSTS.has(host)) {
		const [, first, second] = url.pathname.split("/");
		id =
			first === "watch"
				? url.searchParams.get("v")
				: ["embed", "shorts", "live", "v"].includes(first ?? "")
					? (second ?? null)
					: null;
	}
	if (!id || !YOUTUBE_ID.test(id)) return null;

	const params = new URLSearchParams({ autoplay: "1", rel: "0" });
	const start = parseStart(url.searchParams.get("t") ?? url.searchParams.get("start"));
	if (start > 0) params.set("start", String(start));
	return {
		provider: "youtube",
		providerName: "YouTube",
		id,
		// The no-cookie domain doesn't set tracking cookies until playback.
		embedUrl: `https://www.youtube-nocookie.com/embed/${id}?${params}`,
		// hqdefault exists for every video (maxresdefault doesn't).
		thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
	};
}

function vimeo(url: URL, host: string): VideoEmbed | null {
	if (host !== "vimeo.com" && host !== "player.vimeo.com") return null;
	const parts = url.pathname.split("/").filter(Boolean);
	const index = parts.findIndex((part) => /^\d+$/.test(part));
	if (index === -1) return null;
	const id = parts[index];
	// Unlisted videos carry a privacy hash: vimeo.com/123/abc or ?h=abc.
	const hash =
		url.searchParams.get("h") ??
		(host === "vimeo.com" && /^[\da-f]+$/i.test(parts[index + 1] ?? "")
			? parts[index + 1]
			: null);

	const params = new URLSearchParams({ autoplay: "1", dnt: "1" });
	if (hash) params.set("h", hash);
	return {
		provider: "vimeo",
		providerName: "Vimeo",
		id,
		embedUrl: `https://player.vimeo.com/video/${id}?${params}`,
	};
}

function loom(url: URL, host: string): VideoEmbed | null {
	if (host !== "loom.com") return null;
	const [, kind, id] = url.pathname.split("/");
	if (!["share", "embed"].includes(kind ?? "") || !id || !/^[\da-f]{32}$/i.test(id)) {
		return null;
	}
	return {
		provider: "loom",
		providerName: "Loom",
		id,
		embedUrl: `https://www.loom.com/embed/${id}?autoplay=1`,
	};
}

export function parseVideoUrl(value: string | undefined | null): VideoEmbed | null {
	if (!value) return null;
	let url: URL;
	try {
		url = new URL(value.trim());
	} catch {
		return null;
	}
	if (url.protocol !== "https:" && url.protocol !== "http:") return null;
	const host = url.hostname.replace(/^www\./, "");
	return youtube(url, host) ?? vimeo(url, host) ?? loom(url, host);
}
