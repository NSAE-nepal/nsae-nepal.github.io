import { gsap } from "@/utils/gsap-init";

export type PageScope = {
	/** The element matched by the root selector. */
	root: HTMLElement;
	/** Pass to addEventListener / fetch; aborted on teardown. */
	signal: AbortSignal;
	/**
	 * The page's gsap.context. Wrap work created later (timeline callbacks,
	 * event handlers) in `ctx.add(() => …)` so it is reverted too.
	 */
	ctx: gsap.Context;
	/** Register extra cleanup (timers, observers, returned cleanup functions). */
	onCleanup: (fn: () => void) => void;
};

/**
 * The standard way to write a page or section script under ClientRouter.
 *
 * A module `<script>` runs once per session, so its listeners keep firing on
 * every page visited afterwards. `onPage` runs `setup` on each
 * `astro:page-load` where `rootSelector` matches, inside a gsap.context scoped
 * to that root (selector strings only match its descendants, so pass `root`
 * itself where you mean the root, e.g. as a ScrollTrigger trigger), and tears
 * everything down on `astro:before-swap`: listeners registered with `signal`,
 * `onCleanup` callbacks (in reverse order), then the context's tweens,
 * ScrollTriggers and SplitTexts.
 */
export function onPage(
	rootSelector: string,
	setup: (scope: PageScope) => void,
): void {
	let teardown: (() => void) | undefined;

	const runTeardown = () => {
		const fn = teardown;
		teardown = undefined;
		fn?.();
	};

	document.addEventListener("astro:page-load", () => {
		// In case a swap event was missed; a no-op otherwise.
		runTeardown();

		const root = document.querySelector<HTMLElement>(rootSelector);
		if (!root) return;

		const controller = new AbortController();
		const cleanups: Array<() => void> = [];
		const ctx = gsap.context(() => {}, root);

		teardown = () => {
			controller.abort();
			for (const fn of cleanups.splice(0).reverse()) {
				try {
					fn();
				} catch (error) {
					console.error(`[onPage ${rootSelector}] cleanup failed`, error);
				}
			}
			ctx.revert();
		};

		// Catch inside ctx.add: GSAP doesn't restore its active context when the
		// function throws, which would capture every later tween on the site.
		ctx.add(() => {
			try {
				setup({
					root,
					signal: controller.signal,
					ctx,
					onCleanup: (fn) => cleanups.push(fn),
				});
			} catch (error) {
				// One broken section must not stop the others from setting up.
				console.error(`[onPage ${rootSelector}] setup failed`, error);
			}
		});
	});

	document.addEventListener("astro:before-swap", runTeardown);
}
