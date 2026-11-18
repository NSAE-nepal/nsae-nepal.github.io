import { loadQuery } from "../load-query";
import { type Post, READING_MINUTES_FIELD } from "./posts";

export type SocialLink = {
	handle?: string;
	link?: string;
};

export type AuthorDetails = {
	_id: string;
	name: string;
	slug: string;
	prefix?: string[];
	position?: string;
	company?: string;
	profileImage?: string;
	profileImageAlt?: string;
	neaRegNo?: string;
	necRegNo?: string;
	bio?: string;
	portfolio?: string;
	socials?: Partial<
		Record<"linkedin" | "x" | "facebook" | "youtube" | "bluesky", SocialLink>
	>;
	posts: Post[];
};

// Same post shape as getPosts() so author pages can reuse the post cards.
const POST_FIELDS = `
  _id,
  title,
  subtitle,
  "slug": slug.current,
  type,
  description,
  publishedAt,
  featured,
  showToc,
  ${READING_MINUTES_FIELD},
  "heroImage": heroImage.asset->url,
  "heroImageAlt": heroImage.alt,
  "authors": authors[]->{
    _id,
    name,
    "slug": slug.current,
    "profileImage": profileImage.asset->url
  },
  "categories": categories[]->{
    _id,
    title,
  }
`;

const AUTHOR_FIELDS = `
  _id,
  name,
  "slug": slug.current,
  prefix,
  position,
  company,
  "profileImage": profileImage.asset->url,
  "profileImageAlt": profileImage.alt,
  neaRegNo,
  necRegNo,
  bio,
  portfolio,
  socials,
  "posts": *[
    _type == "posts" &&
    references(^._id) &&
    !(_id in path("drafts.**"))
  ] | order(publishedAt desc) { ${POST_FIELDS} }
`;

/** Authors with at least one published post (only they get a public page). */
export async function getAuthorsWithPosts(): Promise<AuthorDetails[]> {
	const { data } = await loadQuery<AuthorDetails[]>({
		query: `*[
      _type == "author" &&
      defined(slug.current) &&
      !(_id in path("drafts.**")) &&
      count(*[_type == "posts" && references(^._id) && !(_id in path("drafts.**"))]) > 0
    ] | order(name asc) { ${AUTHOR_FIELDS} }`,
	});
	return data ?? [];
}
