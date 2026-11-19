import type { Post } from "@/sanity/lib/queries/posts";

type PostLike = Pick<Post, "_id" | "type" | "publishedAt"> & {
	categories?: ({ _id: string } | null)[] | null;
	authors?: ({ _id: string } | null)[] | null;
};

const ids = (list?: ({ _id: string } | null)[] | null) =>
	new Set((list ?? []).flatMap((item) => (item?._id ? [item._id] : [])));

const newestFirst = (a: PostLike, b: PostLike) =>
	new Date(b.publishedAt ?? 0).getTime() -
	new Date(a.publishedAt ?? 0).getTime();

/**
 * Pick posts to suggest after `current`:
 * 1. posts sharing categories (x3 each) or authors (x2 each), +1 if same type;
 * 2. then the latest posts of the same type;
 * 3. then the latest posts of any type.
 * Never includes `current` itself or duplicates.
 */
export function getRelatedPosts<T extends PostLike>(
	current: PostLike,
	all: T[],
	limit = 3,
): T[] {
	const categories = ids(current.categories);
	const authors = ids(current.authors);
	const others = all.filter((post) => post._id !== current._id);

	const scored = others
		.map((post) => {
			const sharedCategories = [...ids(post.categories)].filter((id) =>
				categories.has(id),
			).length;
			const sharedAuthors = [...ids(post.authors)].filter((id) =>
				authors.has(id),
			).length;
			const affinity = sharedCategories * 3 + sharedAuthors * 2;
			return {
				post,
				affinity,
				score: affinity + (post.type === current.type ? 1 : 0),
			};
		})
		.filter(({ affinity }) => affinity > 0)
		.sort((a, b) => b.score - a.score || newestFirst(a.post, b.post))
		.map(({ post }) => post);

	const sameType = others
		.filter((post) => post.type === current.type)
		.sort(newestFirst);
	const anyType = [...others].sort(newestFirst);

	const picked = new Map<string, T>();
	for (const post of [...scored, ...sameType, ...anyType]) {
		if (picked.size >= limit) break;
		picked.set(post._id, post);
	}
	return [...picked.values()];
}
