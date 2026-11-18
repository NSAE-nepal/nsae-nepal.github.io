import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getPosts } from "@/sanity/lib/queries/posts";
import { SITE_DESCRIPTION, SITE_TITLE } from "../consts";

const BASE_PATH: Record<string, string> = {
	blog: "/blog",
	notice: "/notices",
};

export async function GET(context: APIContext) {
	const posts = (await getPosts()) ?? [];

	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site ?? "https://www.nsae.org.np",
		items: posts
			.filter((post) => post.slug && post.publishedAt)
			.map((post) => {
				const authors = post.authors
					?.map((author) => author?.name)
					.filter(Boolean)
					.join(", ");

				return {
					title: post.title,
					pubDate: new Date(post.publishedAt),
					// Sanity returns null for empty fields; the RSS schema only accepts undefined.
					description: post.description || post.subtitle || undefined,
					link: `${BASE_PATH[post.type] ?? "/blog"}/${post.slug}/`,
					categories: (post.categories ?? [])
						.map((category) => category?.title)
						.filter((title): title is string => Boolean(title)),
					author: authors || undefined,
				};
			}),
	});
}
