# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NSAE (Nepalese Society of Agricultural Engineers) is a professional website built with Astro 5, React, and Tailwind CSS. The site serves as a non-profit professional organization platform featuring blog posts, events, resources, committee members, and career opportunities.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production (includes Pagefind search indexing)
- `npm run preview` - Preview production build locally
- `npm run astro` - Run Astro CLI commands

## Architecture

### Core Framework
- **Astro 5** - Static site generator with island architecture
- **React** - Used for interactive components via @astrojs/react integration
- **Tailwind CSS 4** - Utility-first CSS framework with Vite integration
- **GSAP** - Framework-agnostic JavaScript animation library
- **Lenis** - Smooth scrolling used with GSAP
- **Pagefind** - Used for indexing and searching
- **TypeScript** - Type safety throughout the project

### Content Management
The site uses Astro's content collections for structured data management:

- **Posts** (`src/content/posts/`) - Blog posts, news, and notices
- **Resources** (`src/content/resources/`) - Downloads, reports, press releases
- **Events** (`src/content/events/`) - Upcoming and past events
- **Careers** (`src/content/careers/`) - Job opportunities
- **Minutes** (`src/content/minutes/`) - Meeting minutes
- **Committee** (`src/content/committee/`) - Committee member profiles
- **Authors** (`src/content/authors/`) - Post authors
- **Banners** (`src/content/banners/`) - Event banners
- **FAQ** (`src/content/faq.json`) - Frequently asked question about NSAE
- **Contacts** (`src/content/contacts.json`) - NSAE contact details for contacts page
- **Categories** (`src/content/categories.json`) - for categorizing different contents like Post, Event, Notices,Minutes, News, Resources

Content schemas are defined in `src/content.config.ts` using Zod validation.

### Component Structure
- **Astro Components** (`src/components/astro/`) - Server-side rendered components
- **React Components** - Interactive client-side components
- **Layout Components** (`src/layouts/`) - Page layout templates
- **UI Components** - Reusable components like Cards, Buttons, Avatar, etc.

### Key Features
- **Pagination** - Automated pagination for content collections (PAGE_SIZE = 3)
- **Search** - Pagefind integration for site search
- **RSS Feed** - Automatic RSS feed generation
- **Sitemap** - Automatic sitemap generation
- **Image Optimization** - Sharp integration for image processing

### Routing
- File-based routing in `src/pages/`
- Dynamic routes for paginated content (e.g., `/blog/page/[page]`)
- URL redirects configured in `astro.config.mjs`

### Styling
- Tailwind CSS 4 with custom configuration
- Component variants using class-variance-authority
- Utility classes for consistent spacing and design

### Development Notes
- Uses `@/*` path alias for `src/` directory
- Strict TypeScript configuration
- Content collections provide type-safe content access
- All images require alt text for accessibility
- Site configured for `https://nsae.org.np`