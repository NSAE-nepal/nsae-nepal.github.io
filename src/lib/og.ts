/**
 * Build-time Open Graph card renderer (1200x630 PNG) using satori + resvg.
 * Used by src/pages/og/[...path].png.ts for pages without a cover image.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import sharp from "sharp";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

// Brand colours (approximations of the theme's oklch tokens in global.css).
const PRIMARY = "#22b05a";
const FOREGROUND = "#1c1c1c";
const MUTED = "#6b6b6b";
const BACKGROUND = "#ffffff";
const SECONDARY = "#f4f4f4";

// Resolve from the project root: at build time this module runs from a
// bundled chunk, so paths relative to import.meta.url would not point at src/.
const fromRoot = (path: string) => readFile(resolve(process.cwd(), path));
const fontFile = (name: string) => fromRoot(`src/assets/fonts/og/${name}`);

// Load fonts and the logo once per build, not once per image.
let assets: Promise<{
  regular: Buffer;
  semibold: Buffer;
  logo: string;
}> | null = null;

function loadAssets() {
  assets ??= (async () => {
    const [regular, semibold, logoPng] = await Promise.all([
      fontFile("SourceSans3-Regular.ttf"),
      fontFile("SourceSans3-SemiBold.ttf"),
      sharp(await fromRoot("src/assets/nsae-logo.png"))
        .resize(176, 176)
        .png()
        .toBuffer(),
    ]);
    return {
      regular,
      semibold,
      logo: `data:image/png;base64,${logoPng.toString("base64")}`,
    };
  })();
  return assets;
}

// Minimal hyperscript for satori's element tree (no React needed).
type Node = { type: string; props: Record<string, unknown> };
const h = (
  type: string,
  style: Record<string, unknown>,
  children?: unknown,
  props: Record<string, unknown> = {},
): Node => ({ type, props: { style, children, ...props } });

/** Shorten to at most `max` characters, breaking at a word boundary. */
const truncate = (text: string, max: number) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.-]+$/, "")}…`;
};

export type OgCard = {
  /** Small label above the title, e.g. "Blog", "Event". */
  kicker: string;
  title: string;
  /** Bottom-left meta line, e.g. a formatted date. */
  meta?: string;
};

export async function renderOgPng({ kicker, title, meta }: OgCard) {
  const { regular, semibold, logo } = await loadAssets();
  const text = truncate(title, 120);
  const titleSize = text.length > 80 ? 54 : text.length > 45 ? 64 : 76;

  // Satori adds padding/borders on top of an element's width/height, so the
  // root has neither: a fixed-width accent bar plus a padded column that
  // fills the remaining space.
  const content = h(
    "div",
    {
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      flexGrow: 1,
      padding: "64px 72px",
    },
    [
      // Header: logo + organisation name
      h("div", { display: "flex", alignItems: "center", gap: 24 }, [
        h("img", { width: 88, height: 88 }, undefined, { src: logo }),
        h("div", { display: "flex", flexDirection: "column" }, [
          h("div", { fontSize: 40, fontWeight: 600, lineHeight: 1 }, "NSAE"),
          h(
            "div",
            { fontSize: 24, color: MUTED, marginTop: 6 },
            "Nepalese Society of Agricultural Engineers",
          ),
        ]),
      ]),
      // Kicker + title
      h("div", { display: "flex", flexDirection: "column", gap: 20 }, [
        h(
          "div",
          {
            display: "flex",
            alignSelf: "flex-start",
            padding: "6px 18px",
            borderRadius: 999,
            backgroundColor: PRIMARY,
            color: "#ffffff",
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
          },
          kicker,
        ),
        h(
          "div",
          {
            fontSize: titleSize,
            fontWeight: 600,
            lineHeight: 1.1,
            letterSpacing: -1,
          },
          text,
        ),
      ]),
      // Footer: meta + domain
      h(
        "div",
        {
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: 24,
          borderTop: `2px solid ${SECONDARY}`,
          fontSize: 26,
          color: MUTED,
        },
        [h("div", {}, meta ?? ""), h("div", { color: FOREGROUND }, "nsae.org.np")],
      ),
    ],
  );

  const tree = h(
    "div",
    {
      width: OG_WIDTH,
      height: OG_HEIGHT,
      display: "flex",
      backgroundColor: BACKGROUND,
      fontFamily: "Source Sans 3",
      color: FOREGROUND,
    },
    [
      h("div", {
        width: 20,
        height: OG_HEIGHT,
        flexShrink: 0,
        backgroundColor: PRIMARY,
      }),
      content,
    ],
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: [
      { name: "Source Sans 3", data: regular, weight: 400, style: "normal" },
      { name: "Source Sans 3", data: semibold, weight: 600, style: "normal" },
    ],
  });

  return new Resvg(svg, { fitTo: { mode: "width", value: OG_WIDTH } })
    .render()
    .asPng();
}
