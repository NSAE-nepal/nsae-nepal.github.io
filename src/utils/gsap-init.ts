import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

gsap.registerPlugin(ScrollTrigger, SplitText);

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Every animation script imports GSAP through this module, so this is the one
// place to honour "reduce motion": run all tweens and timelines so fast they
// finish within a frame. Elements still reach their final (visible) state and
// interactive logic (carousels, accordions) keeps working, but nothing moves.
// None of our tweens repeat infinitely, so this cannot spin.
if (prefersReducedMotion()) {
  gsap.globalTimeline.timeScale(1000);
}

export { gsap, ScrollTrigger, SplitText };
