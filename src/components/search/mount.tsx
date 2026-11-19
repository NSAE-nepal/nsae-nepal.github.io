import { createRoot, type Root } from "react-dom/client";
import { OPEN_SEARCH_EVENT, SearchDialog } from "./SearchDialog";

let root: Root | null = null;

// The view-transition router replaces <body>, taking our host element with it,
// so drop the root before a swap and lazily recreate it on the next open.
document.addEventListener("astro:before-swap", () => {
  root?.unmount();
  root = null;
});

export function openSearch() {
  if (root) {
    window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
    return;
  }

  const host = document.createElement("div");
  host.dataset.searchRoot = "";
  document.body.append(host);

  root = createRoot(host);
  root.render(<SearchDialog defaultOpen />);
}
