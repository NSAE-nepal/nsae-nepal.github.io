import Lenis, { type ScrollToOptions } from "lenis";
import { gsap, prefersReducedMotion, ScrollTrigger } from "@/utils/gsap-init";

/**
 * The site's single Lenis (smooth scroll) instance, driven by GSAP's ticker so
 * ScrollTrigger stays in sync. Off under `prefers-reduced-motion`; the helpers
 * below fall back to native scrolling then. Started from BaseHead.
 */
let lenis: Lenis | null = null;

// A single, stable callback so it can actually be removed again.
// GSAP's ticker reports seconds; Lenis expects milliseconds.
const raf = (time: number) => lenis?.raf(time * 1000);

export const getLenis = () => lenis;

export function startLenis() {
	if (lenis || prefersReducedMotion()) return;

	lenis = new Lenis();
	lenis.on("scroll", ScrollTrigger.update);
	gsap.ticker.add(raf);
	gsap.ticker.lagSmoothing(0);
}

/**
 * Smooth scrolling for same-page #hash links (e.g. the table of contents).
 *
 * Lenis' own `anchors` option can't be used: ClientRouter handles the click
 * first (on document) and jumps to the hash synchronously, so Lenis then
 * measures from the new position and scrolls straight back. Starting the
 * Lenis scroll in the capture phase, before ClientRouter, avoids that: Lenis
 * overrides the native jump while it animates, and ClientRouter still updates
 * the URL and history as usual. Lenis honours the target's scroll-margin-top.
 */
function onHashLinkClick(event: MouseEvent) {
	if (
		!lenis ||
		event.defaultPrevented ||
		event.button !== 0 ||
		event.metaKey ||
		event.ctrlKey ||
		event.shiftKey ||
		event.altKey
	) {
		return;
	}
	const link = (event.target as Element | null)?.closest?.("a[href*='#']");
	if (!(link instanceof HTMLAnchorElement) || link.target) return;

	const url = new URL(link.href);
	if (
		url.origin !== location.origin ||
		url.pathname !== location.pathname ||
		url.search !== location.search ||
		!url.hash
	) {
		return;
	}
	const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
	if (target) lenis.scrollTo(target);
}

if (typeof window !== "undefined") {
	window.addEventListener("click", onHashLinkClick, { capture: true });
}

export function destroyLenis() {
	gsap.ticker.remove(raf);
	lenis?.destroy();
	lenis = null;
}

export type ScrollTargetOptions = Pick<
	ScrollToOptions,
	"offset" | "immediate" | "duration" | "onComplete"
> & {
	/** Where the target lands, as with scrollIntoView. Default "start". */
	block?: "start" | "center" | "nearest";
};

/**
 * Scrolls to an element with Lenis, or natively when Lenis is off. `block`
 * maps to a Lenis offset that matches what scrollIntoView would do.
 */
export function scrollToTarget(
	target: HTMLElement,
	{ block = "start", offset = 0, ...options }: ScrollTargetOptions = {},
) {
	if (!lenis) {
		target.scrollIntoView({
			behavior: prefersReducedMotion() ? "auto" : "smooth",
			block,
		});
		return;
	}

	const rect = target.getBoundingClientRect();
	let blockOffset = 0;
	if (block === "center") {
		blockOffset = -(window.innerHeight - rect.height) / 2;
	} else if (block === "nearest") {
		// Already fully visible: stay put. Otherwise align the nearer edge.
		if (rect.top >= 0 && rect.bottom <= window.innerHeight) return;
		if (rect.bottom > window.innerHeight && rect.height < window.innerHeight) {
			blockOffset = -(window.innerHeight - rect.height);
		}
	}

	lenis.scrollTo(target, { ...options, offset: offset + blockOffset });
}

/** Pause page scrolling (e.g. while a modal is open); inner scrollers keep working. */
export function stopScroll() {
	lenis?.stop();
}

export function startScroll() {
	lenis?.start();
}
