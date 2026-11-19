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
- `bun run lint` – ESLint (`eslint.config.js`: TypeScript, `eslint-plugin-astro` incl. `<script>` blocks, jsx-a11y via the ESLint 10 fork `eslint-plugin-jsx-a11y-x`, react-hooks for `.tsx`); must stay at 0 errors, CI runs it
- `bun run format` / `bun run format:check` – Prettier with `prettier-plugin-astro` 0.14 + `prettier-plugin-tailwindcss` (class sorting, also inside `cn()`/`cva()`), pinned exactly; see `.prettierrc.mjs` for why the Astro plugin isn't on 1.x and its one limit (no `<script>` with `{`/`<` inside a `{…}` template expression). Tabs in `.ts`/`.js`/`.mjs`, 2 spaces elsewhere, `endOfLine: "auto"` so CRLF files keep CRLF. The repo isn't fully formatted yet, so CI doesn't run `format:check`; format only the files you touch
- `bun run dev:full` – dev server + Pagefind server (search works in dev only after one `build`)

## Architecture

### Content: Sanity

- Sanity project and dataset come from `PUBLIC_SANITY_PROJECT_ID` / `PUBLIC_SANITY_DATASET` (`.env` locally, repository secrets in CI); both the client in `astro.config.mjs` (`@sanity/astro`) and the Studio config in `sanity.config.ts` read them. Never hardcode the project ID.
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
- `src/layouts/PageLayout.astro` (props: `title`, `description`, `image` = local import or Sanity URL for social previews, `type` = `website`|`article`; named slot `head`). `BaseHead.astro` appends ` | NSAE` to titles. `ArticleLayout.astro` is the shared long-form shell: back link, title/subtitle, meta row, hero, prose body + TOC, share bar, "Keep reading" grid and reading progress. `PostLayout.astro` (blog/notices) and `/resources/[slug]` use it. Astro counts a slot passed inside a condition as present, so pass a placeholder or check rendered output (as `ArticleLayout` does for `related`).
- Portable Text rendering: `src/components/PortableText.astro` maps block types to `Portable*.astro` components.
- Listings with filters: list markup lives in `src/components/pages/{blog,notices,minutes,careers,resources}/*Listing.astro`, shared by `/<section>/page/[page]` and the filtered routes `/blog|notices/category/[category]/page/[page]` and `/minutes|careers|resources/type/[type]/page/[page]`. Category slugs are derived from titles (`src/lib/categories.ts`); `FilterChips.astro` hides itself when there are no options.
- Opportunities board = Sanity `careers` type, URLs stay under `/careers`: jobs, scholarships, fellowships, grants, trainings, calls for papers, tenders. The `opportunityType` list lives in `src/lib/opportunities.ts`, which the schema also imports, so keep that file import-free. Docs without a type count as jobs (`coalesce` in GROQ). Open/closed/"closing soon" (7 days or less) come from `getOpportunityStatus()` in `src/utils/datetime.ts`, which works in Nepal calendar days at build time. `getVacancies()` sorts open items first. `JobPosting` JSON-LD is emitted only for open jobs.
- Resource library: Sanity `resource` docs (Studio "Learning & Resources" group) with an ordered `attachments` array of `resourceFile` / `resourceLink` items (at least one), each with an optional label. Types live in `src/lib/resources.ts`, which is import-free because the schema imports it. Routes are `/resources/page/[page]`, `/resources/type/[type]/page/[page]` and `/resources/[slug]`. Queries and helpers (`resourceFormat()`, `relatedResources()`) are in `src/sanity/lib/queries/resources.ts`. Detail pages use `ArticleLayout`, and the `body` uses the same `blockContent` as posts. Downloads use `downloadUrl()` (Sanity `?dl=`). `ResourceAttachments.astro` lists them on the detail page; cards act directly only when there is a single item. `getStaticPaths` can't call helpers defined in the same frontmatter, so import them.
- Committees: `/past-committee/page/[page]` (full-width `CommitteeCard`, newest marked "Current") and `/past-committee/[iteration]/` (office bearers, then other members via `officeBearers()` / `otherMembers()` in `src/sanity/lib/queries/committee.ts`; older/newer links; searchable as `type:Committee`). `ordinal()` lives in `src/lib/utils.ts`.
- Member spotlight: Sanity `spotlight` docs reference an `author` (the person). They hold a headline, summary, specializations, location, cover, `projects[]`, a blog-style `body` and a `featured` flag. Routes are `/spotlight/page/[page]` and `/spotlight/[slug]`; the detail page uses `ArticleLayout`, with projects and an "About the member" box in the body. The home page shows the latest featured one via `sections/MemberSpotlight.astro`, and author pages link to their spotlights. The byline links to `/authors/<slug>` only when that author has posts. Queries live in `src/sanity/lib/queries/spotlight.ts`.
- Events listing splits upcoming (all, on page 1) from past (paginated) at build time; `/events/<slug>.ics` + Google Calendar links come from `src/utils/calendar.ts`.
- Event recaps: the Studio "After the Event" group holds `recapSummary`, `attendance`, `gallery` (images with required alt), `recordings` (video URLs) and `materials` (`courseResource` files). `src/components/pages/events/EventRecap.astro` renders them on the event page only once `getEventStatus().hasEnded` and the query's `hasRecap` is true; listings show a "Recap" badge. `EventGallery.astro` = build-optimised thumbnails + a native `<dialog>` lightbox that loads full-size images from Sanity's CDN on demand.
- Authors: `/authors/[slug]` exists only for authors with at least one published post (`getAuthorsWithPosts`); bylines link there. Use `formatName()`/`formatPrefix()` from `src/lib/utils.ts` for name prefixes.
- Related posts: `getRelatedPosts()` in `src/lib/related-posts.ts`, passed to `PostLayout` as `related`.
- RSS: `src/pages/rss.xml.ts` (Sanity posts).
- Courses: Sanity `course` (modules → ordered `lesson` refs) and `lesson` docs (`src/sanity/schemaTypes/courses.ts`; Studio "Learning" group). One query, `getCourses()`, returns every course with its syllabus; lesson bodies come from `getLessonDetails()`. Routes: `/courses/page/[page]`, `/courses/[course]/`, `/courses/[course]/[lesson]/`; helpers in `src/lib/courses.ts`. Courses are public and English-only. Tutorials are blog posts in a "Tutorial" category (linked from the courses page).
- Course progress is client-side only (`src/scripts/course-progress.ts`, `localStorage` keyed by Sanity `_id`s), driven by `data-*` hooks in `src/components/pages/courses/*`. Progress UI starts `hidden` and is revealed only when storage works. A lesson containing a quiz completes when `Quiz.astro` dispatches `quiz:complete` with `passed: true`.
- Engagement bits: `ShareBar.astro` (native share + WhatsApp/Facebook/LinkedIn/X/copy) on detail pages; `NewBadge.astro` + `src/scripts/visit-tracker.ts` mark items published since the previous visit; post reading time comes from `READING_MINUTES_FIELD` in GROQ; home shows the next events via `sections/UpcomingEvents.astro`.
- Social preview cards: `src/pages/og/[...path].png.ts` renders `/og/<section>/<slug>.png` at build time via `src/lib/og.ts` (satori + resvg); detail pages fall back to them when there's no cover image.
- Structured data: builders in `src/lib/structured-data.ts`, rendered with `<JsonLd slot="head" data={...} />`.

### Components

- Astro components in `src/components/astro/` (Button, Badge, Card/*, Avatar, Pagination, …), page sections in `src/components/sections/`, shadcn/React UI in `src/components/ui/`.
- `Card/ClickableCard.astro` is a stretched-link card: requires `href` and `label`; nested links/buttons keep working.
- Search: Pagefind. `Header.astro` renders a static trigger; `src/components/search/mount.tsx` lazy-loads the React `SearchDialog` on click or Ctrl/Cmd+K. Mark page content with `data-pagefind-body` / `data-pagefind-meta`, and tag detail pages with `data-pagefind-filter="type:<Type>"` (the dialog builds its type chips from these).
- Header: fixed bottom pill nav + "More" menu (native Popover API).

### Client-side scripts and animation

- `ClientRouter` (view transitions) is enabled, so module `<script>`s run once per session. Put per-page setup in an `astro:page-load` listener and clean up on `astro:before-swap`.
- GSAP + Lenis smooth scroll. Always import GSAP from `@/utils/gsap-init` (registers plugins and makes all tweens instant under `prefers-reduced-motion`). Wrap page animations in `gsap.context()` and `revert()` on `astro:before-swap`.
- Elements hidden until animated use Tailwind `opacity-0` / `invisible`; `BaseHead.astro` has a `<noscript>` fallback that reveals them. Don't hide content with inline styles.

### Styling

- Tailwind CSS 4 (`src/styles/global.css`, theme tokens as CSS variables, dark mode via `.dark` class), `class-variance-authority` for variants, `cn()` in `src/lib/utils.ts`.
- Font: Source Sans 3 variable woff2 subsets in `public/fonts/`; static TTF instances for OG image generation in `src/assets/fonts/og/` (satori can't use variable fonts).

### Conventions

- `@/*` path alias → `src/*`; strict TypeScript (TypeScript 6 until `astro check` supports 7).
- Several files use CRLF line endings; preserve each file's existing line endings when editing.
