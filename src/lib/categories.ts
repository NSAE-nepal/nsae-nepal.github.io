import type { Category, Post } from "@/sanity/lib/queries/posts";
import { slugify } from "@/sanity/lib/slugify";

export type CategorySummary = {
	slug: string;
	title: string;
	count: number;
};

/** Categories have no slug field in Sanity; derive a stable one from the title. */
export const categorySlug = (category: Pick<Category, "title">) =>
	slugify(category.title ?? "");

const postCategories = (post: Post) =>
	(post.categories ?? []).filter(
		(category): category is Category =>
			Boolean(category?.title) && Boolean(categorySlug(category)),
	);

/** Every category used by `posts`, with post counts, most used first. */
export function summarizeCategories(posts: Post[]): CategorySummary[] {
	const bySlug = new Map<string, CategorySummary>();

	for (const post of posts) {
		// Count each category once per post even if referenced twice.
		const seen = new Set<string>();
		for (const category of postCategories(post)) {
			const slug = categorySlug(category);
			if (seen.has(slug)) continue;
			seen.add(slug);
			const entry = bySlug.get(slug) ?? {
				slug,
				title: category.title,
				count: 0,
			};
			entry.count += 1;
			bySlug.set(slug, entry);
		}
	}

	return [...bySlug.values()].sort(
		(a, b) => b.count - a.count || a.title.localeCompare(b.title),
	);
}

export const postsInCategory = (posts: Post[], slug: string) =>
	posts.filter((post) =>
		postCategories(post).some((category) => categorySlug(category) === slug),
	);

/** Listing URL for a section ("/blog", "/notices"), optionally filtered. */
export const categoryPath = (basePath: string, slug?: string) =>
	slug ? `${basePath}/category/${slug}/page/1/` : `${basePath}/page/1/`;
