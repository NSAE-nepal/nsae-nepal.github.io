/**
 * "Install the app" (web.dev/learn/pwa/installation-prompt).
 *
 * - [data-install-app]: hidden until this browser can install the site, and
 *   again once it is installed or running as the installed app.
 * - [data-install-trigger]: Chromium browsers get their own install dialog
 *   (the deferred `beforeinstallprompt`); iPhone and iPad, which have no
 *   install API, get the "Add to Home Screen" steps ([data-install-ios]).
 *
 * Imported from BaseHead so `beforeinstallprompt` is never missed.
 */
import { startScroll, stopScroll } from "@/utils/lenis";

type InstallPromptEvent = Event & {
	prompt(): Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
let installed = false;

const inBrowserTab = () => matchMedia("(display-mode: browser)").matches;

// iPadOS reports itself as a Mac; touch support tells them apart.
const isAppleMobile = () =>
	/iPad|iPhone|iPod/.test(navigator.userAgent) ||
	(navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

const canInstall = () =>
	!installed && inBrowserTab() && (deferred !== null || isAppleMobile());

function render() {
	const visible = canInstall();
	document.querySelectorAll<HTMLElement>("[data-install-app]").forEach((el) => {
		el.hidden = !visible;
	});
}

function openAppleSteps() {
	const dialog =
		document.querySelector<HTMLDialogElement>("[data-install-ios]");
	if (!dialog || dialog.open) return;
	stopScroll();
	dialog.addEventListener("close", startScroll, { once: true });
	dialog.showModal();
}

addEventListener("beforeinstallprompt", (event) => {
	// Keep the mobile mini-infobar away; our buttons offer the install instead.
	event.preventDefault();
	deferred = event as InstallPromptEvent;
	render();
});

addEventListener("appinstalled", () => {
	installed = true;
	deferred = null;
	render();
});

document.addEventListener("astro:page-load", render);

document.addEventListener("click", async (event) => {
	const target = event.target as Element;

	// Clicking the backdrop closes the steps dialog.
	if (
		target instanceof HTMLDialogElement &&
		target.matches("[data-install-ios]")
	) {
		target.close();
		return;
	}

	if (!target.closest?.("[data-install-trigger]")) return;
	document.querySelector<HTMLElement>("#more-menu:popover-open")?.hidePopover();

	if (deferred) {
		// prompt() works once per event; the browser fires a new one later.
		const prompt = deferred;
		deferred = null;
		render();
		await prompt.prompt();
		if ((await prompt.userChoice).outcome === "accepted") installed = true;
		render();
	} else if (isAppleMobile()) {
		openAppleSteps();
	}
});
