import { gsap, SplitText } from "@/utils/gsap-init";

export interface CardSplitTextAnimationOptions {
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

const defaultOptions: Required<CardSplitTextAnimationOptions> = {
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

export function initCardSplitTextAnimation(
  options: CardSplitTextAnimationOptions = {},
): () => void {
  const config = { ...defaultOptions, ...options };

  const cards = document.querySelectorAll(config.cardSelector);
  const cleanupFunctions: Array<() => void> = [];

  cards.forEach((card) => {
    const target = card.querySelector(config.targetSelector);
    if (!target) return;

    const split = SplitText.create(target as HTMLElement, {
      type: "words",
      wordsClass: "split-word",
    });

    const words = split.words;
    let isInitialAnimComplete = false;

    gsap.from(words, {
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

    hoverTarget.addEventListener("mouseenter", handleMouseEnter);
    hoverTarget.addEventListener("mouseleave", handleMouseLeave);
    hoverTarget.addEventListener("focusin", handleMouseEnter);
    hoverTarget.addEventListener("focusout", handleMouseLeave);

    cleanupFunctions.push(() => {
      hoverTarget.removeEventListener("mouseenter", handleMouseEnter);
      hoverTarget.removeEventListener("mouseleave", handleMouseLeave);
      hoverTarget.removeEventListener("focusin", handleMouseEnter);
      hoverTarget.removeEventListener("focusout", handleMouseLeave);
      split.revert();
    });
  });

  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
}
