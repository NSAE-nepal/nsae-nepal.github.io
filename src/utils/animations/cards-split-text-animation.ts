import { gsap, SplitText } from "@/utils/gsap-init";
import type { PageScope } from "@/utils/page-script";

export interface CardSplitTextAnimationOptions {
	/** Where to look for cards. */
	root?: ParentNode;
	cardSelector?: string;
	targetSelector?: string;
	initialAnimation?: {
		y?: number;
		autoAlpha?: number;
		duration?: number;
		ease?: string;
		stagger?: number;
	};
	hoverAnimation?: {
		duration?: number;
		ease?: string;
		stagger?: number;
	};
	hoverOutAnimation?: {
		duration?: number;
		ease?: string;
		stagger?: number;
	};
}

const defaultOptions: Required<Omit<CardSplitTextAnimationOptions, "root">> = {
	cardSelector: ".split-card",
	targetSelector: ".split-target",
	initialAnimation: {
		y: 20,
		autoAlpha: 0,
		duration: 0.6,
		ease: "power2.out",
		stagger: 0.05,
	},
	hoverAnimation: {
		duration: 0.4,
		ease: "power3.out",
		stagger: 0.04,
	},
	hoverOutAnimation: {
		duration: 0.3,
		ease: "power3.in",
		stagger: 0.03,
	},
};

/** Set on a card's split target while it is set up, so it is never split twice. */
const READY_ATTR = "data-split-ready";

/**
 * Splits each card title into words, plays a short entrance and wires the
 * hover/focus underline. Cards that are already set up are skipped. Returns a
 * cleanup function that removes the listeners and reverts the splits.
 */
export function initCardSplitTextAnimation(
	options: CardSplitTextAnimationOptions = {},
): () => void {
	const { root = document, ...rest } = options;
	const config = { ...defaultOptions, ...rest };

	const cards = root.querySelectorAll(config.cardSelector);
	const cleanupFunctions: Array<() => void> = [];

	cards.forEach((card) => {
		const target = card.querySelector<HTMLElement>(config.targetSelector);
		if (!target || target.hasAttribute(READY_ATTR)) return;
		target.setAttribute(READY_ATTR, "");

		const split = SplitText.create(target, {
			type: "words",
			wordsClass: "split-word",
		});

		const words = split.words;
		let isInitialAnimComplete = false;

		const entrance = gsap.from(words, {
			...config.initialAnimation,
			onComplete: () => {
				isInitialAnimComplete = true;
			},
		});

		const handleMouseEnter = () => {
			if (!isInitialAnimComplete) return;

			gsap.set(words, { "--transform-origin": "left center" });
			gsap.to(words, {
				"--underline-scale": 1,
				...config.hoverAnimation,
				overwrite: "auto",
			});
		};

		const handleMouseLeave = () => {
			if (!isInitialAnimComplete) return;

			gsap.set(words, { "--transform-origin": "right center" });
			gsap.to(words, {
				"--underline-scale": 0,
				...config.hoverOutAnimation,
				overwrite: true,
			});
		};

		// Inside a ClickableCard the content ignores pointer events (the card's
		// stretched link receives them), so listen on the card wrapper instead.
		// Focus events mirror hover for keyboard users.
		const hoverTarget = card.closest(".clickable-card") ?? card;
		const controller = new AbortController();
		const { signal } = controller;

		hoverTarget.addEventListener("mouseenter", handleMouseEnter, { signal });
		hoverTarget.addEventListener("mouseleave", handleMouseLeave, { signal });
		hoverTarget.addEventListener("focusin", handleMouseEnter, { signal });
		hoverTarget.addEventListener("focusout", handleMouseLeave, { signal });

		cleanupFunctions.push(() => {
			controller.abort();
			entrance.kill();
			gsap.killTweensOf(words);
			split.revert();
			target.removeAttribute(READY_ATTR);
		});
	});

	return () => {
		cleanupFunctions.splice(0).forEach((cleanup) => cleanup());
	};
}

/**
 * For a timeline `.add()` in an `onPage` script: starts the card effect when
 * the cards appear, inside the page's context, and cleans it up with the page.
 */
export const startCardHover =
	(
		{ root, ctx, onCleanup }: Pick<PageScope, "root" | "ctx" | "onCleanup">,
		cardSelector?: string,
	) =>
	() =>
		ctx.add(() =>
			onCleanup(initCardSplitTextAnimation({ root, cardSelector })),
		);
