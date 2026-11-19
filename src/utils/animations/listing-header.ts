import { SplitText } from "@/utils/gsap-init";

type Step = {
	/** Timeline position, e.g. "-=0.4". */
	at?: gsap.Position;
	duration?: number;
	ease?: string;
};

export type ListingHeaderOptions = {
	/** The badge pop. */
	badge?: { duration?: number; ease?: string };
	/** The title's word-by-word rise. */
	title?: { at?: gsap.Position; duration?: number; stagger?: number };
	/** The intro paragraph (`.anim-header-desc`); skipped when absent. */
	description?: Step;
	/**
	 * The section heading under the header; skipped when absent, or `false`
	 * when the page sequences it itself.
	 */
	sectionTitle?: (Step & { selector?: string }) | false;
};

/**
 * The shared listing/page header entrance: badge pop, title words rising,
 * intro paragraph, then the first section heading. Expects the markup used on
 * the listings: `.anim-header-badge` (`scale-50 opacity-0`),
 * `.anim-header-title` (`invisible`), `.anim-header-desc` and
 * `.anim-section-title` (`translate-y-4 opacity-0`).
 *
 * Call it inside the page's gsap.context (e.g. from `onPage`) so the SplitText
 * is reverted with it. Appends to `tl` and returns it.
 */
export function animateListingHeader(
	tl: gsap.core.Timeline,
	root: ParentNode,
	options: ListingHeaderOptions = {},
): gsap.core.Timeline {
	const { badge = {}, title = {}, description = {} } = options;

	const badgeEl = root.querySelector(".anim-header-badge");
	if (badgeEl) {
		tl.to(badgeEl, {
			scale: 1,
			opacity: 1,
			duration: badge.duration ?? 0.6,
			ease: badge.ease ?? "back.out(1.5)",
		});
	}

	const titleEl = root.querySelector<HTMLElement>(".anim-header-title");
	if (titleEl) {
		const split = SplitText.create(titleEl, {
			type: "lines, words",
			linesClass: "overflow-hidden",
		});
		tl.set(titleEl, { autoAlpha: 1 }, title.at ?? "-=0.3").from(
			split.words,
			{
				yPercent: 100,
				opacity: 0,
				duration: title.duration ?? 0.8,
				stagger: title.stagger ?? 0.04,
				ease: "power4.out",
			},
			"<",
		);
	}

	const descEl = root.querySelector(".anim-header-desc");
	if (descEl) {
		tl.to(
			descEl,
			{
				y: 0,
				opacity: 1,
				duration: description.duration ?? 0.6,
				...(description.ease && { ease: description.ease }),
			},
			description.at ?? "-=0.4",
		);
	}

	if (options.sectionTitle !== false) {
		const section = options.sectionTitle ?? {};
		const sectionEls = root.querySelectorAll(
			section.selector ?? ".anim-section-title",
		);
		if (sectionEls.length > 0) {
			tl.to(
				sectionEls,
				{
					y: 0,
					opacity: 1,
					duration: section.duration ?? 0.5,
					...(section.ease && { ease: section.ease }),
				},
				section.at ?? "-=0.4",
			);
		}
	}

	return tl;
}
