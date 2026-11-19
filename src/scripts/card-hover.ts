/**
 * Card title hover underline (`.split-card` / `.split-target`) for cards that
 * no page script animates itself. Sections that reveal their cards with their
 * own timeline mark themselves `[data-manual-card-anim]` and start the effect
 * when the cards appear. Imported once from PageLayout.
 */
import { initCardSplitTextAnimation } from "@/utils/animations/cards-split-text-animation";

let cleanup: (() => void) | undefined;

const teardown = () => {
	cleanup?.();
	cleanup = undefined;
};

document.addEventListener("astro:page-load", () => {
	teardown();
	cleanup = initCardSplitTextAnimation({
		cardSelector: ".split-card:not([data-manual-card-anim] *)",
	});
});

document.addEventListener("astro:before-swap", teardown);
