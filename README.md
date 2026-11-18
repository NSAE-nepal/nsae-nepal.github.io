# NSAE website

Website of the **Nepalese Society of Agricultural Engineers (NSAE)**: [www.nsae.org.np](https://www.nsae.org.np).

Built with [Astro](https://astro.build), React and Tailwind CSS. Content is managed in [Sanity](https://www.sanity.io) and the site is deployed as a static build to GitHub Pages.

## Getting started

Requirements: [bun](https://bun.sh) 1.4+.

```sh
bun install
cp .env.example .env   # fill in the values
bun run dev            # http://localhost:4321, Sanity Studio at /studio
```

| Script | What it does |
| --- | --- |
| `bun run dev` | Development server |
| `bun run build` | Production build into `dist/` plus the Pagefind search index |
| `bun run preview` | Serve the production build locally |
| `bun run check` | Type-check (`astro check`) |
| `bun run dev:full` | Dev server + Pagefind server, so search works in dev (run `build` once first) |

### Environment variables

| Variable | Purpose |
| --- | --- |
| `PUBLIC_SANITY_PROJECT_ID` | Sanity project ID, used by both the site's queries and the embedded Studio (required) |
| `PUBLIC_SANITY_DATASET` | Sanity dataset, usually `production` (required) |
| `PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (not currently read by the code) |

The same values are configured as repository secrets for the GitHub Actions workflows.

## Editing content

Content editors work in Sanity Studio at [`/studio`](https://www.nsae.org.np/studio). Publishing a document triggers a rebuild (see below); the change is live a few minutes later.

## Deployment

`.github/workflows/deploy.yml` builds and deploys to GitHub Pages when:

- code is pushed to `main`
- content is published in Sanity (webhook, below)
- once a day at 00:15 UTC (≈ 06:00 NPT), so date-based UI such as "Register Now" buttons and closed vacancies stays current
- it is started manually from the Actions tab

Pull requests run `.github/workflows/ci.yml` (type-check and build).

### Sanity publish webhook (one-time setup)

1. In GitHub, create a **fine-grained personal access token** limited to this repository with **Contents: Read and write** permission. (A GitHub App token works too.)
2. In [sanity.io/manage](https://www.sanity.io/manage) → project → **API → Webhooks → Create webhook**:
   - **URL:** `https://api.github.com/repos/NSAE-nepal/nsae-nepal.github.io/dispatches`
   - **Dataset:** `production`
   - **Trigger on:** Create, Update, Delete
   - **HTTP method:** `POST`
   - **HTTP headers:**
     - `Authorization: Bearer <token from step 1>`
     - `Accept: application/vnd.github+json`
   - **Projection:** `{"event_type": "sanity-publish"}`
   - Leave **Drafts** and **Versions** unchecked so only published changes trigger a deploy.
3. Publish any document and check that a "Deploy to GitHub Pages" run appears under **Actions**.

The token expires; renew it and update the webhook header before then.

## Project structure

```
src/
  pages/              routes (listings paginated at /<section>/page/<n>)
  layouts/            PageLayout, PostLayout
  components/         Astro components, sections, search, shadcn ui
  sanity/
    schemaTypes/      Sanity schemas
    lib/queries/      GROQ queries + result types
    lib/url-for-image.ts  sanityImage() for right-sized CDN images
  utils/              date helpers, GSAP setup, animations
  styles/global.css   Tailwind theme
public/               static files (fonts, icons, robots.txt)
```

See [`CLAUDE.md`](./CLAUDE.md) for architecture notes and conventions.
