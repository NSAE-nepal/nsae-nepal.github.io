# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Website of NSAE (Nepalese Society of Agricultural Engineers), a non-profit professional organization: blog posts, notices, events, careers, meeting minutes, committees, donations. Static site built with Astro 7, React 19 and Tailwind CSS 4; content comes from **Sanity** (headless CMS). Deployed to GitHub Pages at `https://www.nsae.org.np`.

## Commands

Package manager is **bun** (`bun.lock`).

- `bun run dev` – dev server (Sanity Studio at `/studio`)
- `bun run build` – production build + Pagefind index (`dist/pagefind`)
- `bun run preview` – serve the production build
- `bun run check` – `astro check` type-check (must stay at 0 errors; CI runs it)
- `bun run dev:full` – dev server + Pagefind server (search works in dev only after one `build`)

## Architecture

### Content: Sanity
- Sanity project `zv3un63s`, dataset `production`; client configured in `astro.config.mjs` (`@sanity/astro`), Studio config in `sanity.config.ts`.
- Schemas: `src/sanity/schemaTypes/` (singletons: `home`, `contacts`, `donate`, `faq`).
- GROQ queries + hand-written result types: `src/sanity/lib/queries/*.ts`, all via `loadQuery()` in `src/sanity/lib/load-query.ts`. Queries return image URLs (`asset->url`), not image objects.
- GROQ params: declare every `$param` used in a query. For optional filters pass `null` (e.g. `{ type: type ?? null }`), never omit it, or the query fails to parse.
- There are no Astro content collections; everything is fetched from Sanity at build time.

### Static builds and freshness
- Fully static output. Date-dependent UI (registration open/closed, expired vacancies) is evaluated at build time (`getEventStatus()` in `src/utils/datetime.ts`).
- `.github/workflows/deploy.yml` rebuilds on push to `main`, on a Sanity publish webhook (`repository_dispatch: sanity-publish`) and daily at 00:15 UTC. See README for the webhook setup.
- `.github/workflows/ci.yml` runs `astro check` + build on pull requests.

### Images
- Remote (Sanity) images: always pass the URL through `sanityImage(url, { width, height? })` from `src/sanity/lib/url-for-image.ts` before `<Image inferSize>`; use ~2x the rendered CSS width, and add `widths`/`sizes` for large images. Never pass raw `asset->url` values (originals can be 7000px+).
- Rich-text images: `src/components/PortableTextImage.astro`.
- All images need alt text.

### Pages and layout
- File-based routing in `src/pages/`. Listings are paginated at `/<section>/page/[page]` (`PAGE_SIZE = 10` in `src/consts.ts`); `/blog`, `/notices`, … are redirects defined in `astro.config.mjs`.
- `src/layouts/PageLayout.astro` (props: `title`, `description`, `image` = local import or Sanity URL for social previews, `type` = `website`|`article`; named slot `head`). `BaseHead.astro` appends ` | NSAE` to titles. `PostLayout.astro` wraps blog/notice pages.
- Portable Text rendering: `src/components/PortableText.astro` maps block types to `Portable*.astro` components.
- RSS: `src/pages/rss.xml.ts` (Sanity posts).

### Components
- Astro components in `src/components/astro/` (Button, Badge, Card/*, Avatar, Pagination, …), page sections in `src/components/sections/`, shadcn/React UI in `src/components/ui/`.
- `Card/ClickableCard.astro` is a stretched-link card: requires `href` and `label`; nested links/buttons keep working.
- Search: Pagefind. `Header.astro` renders a static trigger; `src/components/search/mount.tsx` lazy-loads the React `SearchDialog` on click or Ctrl/Cmd+K. Mark page content with `data-pagefind-body` / `data-pagefind-meta`.
- Header: fixed bottom pill nav + "More" menu (native Popover API).

### Client-side scripts and animation
- `ClientRouter` (view transitions) is enabled, so module `<script>`s run once per session. Put per-page setup in an `astro:page-load` listener and clean up on `astro:before-swap`.
- GSAP + Lenis smooth scroll. Always import GSAP from `@/utils/gsap-init` (registers plugins and makes all tweens instant under `prefers-reduced-motion`). Wrap page animations in `gsap.context()` and `revert()` on `astro:before-swap`.
- Elements hidden until animated use Tailwind `opacity-0` / `invisible`; `BaseHead.astro` has a `<noscript>` fallback that reveals them. Don't hide content with inline styles.

### Styling
- Tailwind CSS 4 (`src/styles/global.css`, theme tokens as CSS variables, dark mode via `.dark` class), `class-variance-authority` for variants, `cn()` in `src/lib/utils.ts`.
- Font: Source Sans 3 variable woff2 subsets in `public/fonts/` (TTF sources in `src/assets/fonts/`).

### Conventions
- `@/*` path alias → `src/*`; strict TypeScript (TypeScript 6 until `astro check` supports 7).
- Several files use CRLF line endings; preserve each file's existing line endings when editing.
