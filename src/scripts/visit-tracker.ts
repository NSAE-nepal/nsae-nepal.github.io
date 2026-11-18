/**
 * Remembers when the visitor was last here so listings can mark newer items
 * with a "New" badge (see NewBadge.astro). Browser-only, nothing leaves the
 * device.
 *
 * A "visit" ends after 30 minutes without a page view; items published after
 * the end of the previous visit count as new. The baseline stays fixed for the
 * whole visit, across tabs, so badges don't vanish while you browse.
 */
const STORAGE_KEY = "nsae:visits:v1";
const VISIT_GAP_MS = 30 * 60 * 1000;

type VisitState = { baseline: number | null; lastSeen: number };

const readState = (): VisitState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<VisitState>;
    if (typeof parsed.lastSeen !== "number") return null;
    return {
      baseline: typeof parsed.baseline === "number" ? parsed.baseline : null,
      lastSeen: parsed.lastSeen,
    };
  } catch {
    return null;
  }
};

const writeState = (state: VisitState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage blocked (private mode, site data disabled): badges just stay off.
  }
};

/** Records this page view and returns the "new since" timestamp, if any. */
const recordVisit = (now = Date.now()): number | null => {
  const previous = readState();
  if (!previous) {
    writeState({ baseline: null, lastSeen: now });
    return null;
  }
  const baseline =
    now - previous.lastSeen > VISIT_GAP_MS ? previous.lastSeen : previous.baseline;
  writeState({ baseline, lastSeen: now });
  return baseline;
};

const revealNewBadges = (baseline: number | null) => {
  if (baseline === null) return;
  document.querySelectorAll<HTMLElement>("[data-new-badge]").forEach((badge) => {
    const published = Date.parse(badge.dataset.published ?? "");
    if (Number.isFinite(published) && published > baseline) {
      badge.hidden = false;
    }
  });
};

document.addEventListener("astro:page-load", () => {
  revealNewBadges(recordVisit());
});

// Side-effect module (imported for its listeners); keeps declarations file-scoped.
export {};
