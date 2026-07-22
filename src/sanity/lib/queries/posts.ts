import type { PortableTextBlock } from "sanity";
import { loadQuery } from "../load-query";

export type PostType = "blog" | "notice";

export type Category = {
	_id: string;
	title: string;
};

export type Authors = {
	_id: string;
	name: string;
	profileImage?: string;
};

export type Post = {
	_id: string;
	title: string;
	subtitle?: string;
	slug: string;
	type: "blog" | "notice";
	description?: string;
	publishedAt: string;
	featured: boolean;
	heroImage?: string;
	heroImageAlt?: string;
	authors: Authors[];
	categories: Category[];
	showToc: boolean;
};

export type PostDetails = {
	_id: string;
	title: string;
	subtitle?: string;
	slug: string;
	type: "blog" | "notice";
	description?: string;
	publishedAt: string;
	featured: boolean;
	showToc: boolean;
	heroImage?: string;
	heroImageAlt?: string;
	body: PortableTextBlock[];
	authors: Authors[];
	categories: Category[];
};

export async function getPosts(type?: PostType): Promise<Post[]> {
	const POSTS_QUERY = `*[
		_type == "posts" &&
		!(_id in path("drafts.**")) &&
		(!defined($type) || type == $type)
	] | order(publishedAt desc) {
    _id,
    title,
    subtitle,
    "slug": slug.current,
    type,
    description,
    publishedAt,
    featured,
	showToc,
    "heroImage": heroImage.asset->url,
    "heroImageAlt": heroImage.alt,
	"authors": authors[]->{
    _id,
    name,
    "profileImage": profileImage.asset->url
	},

	"categories": categories[]->{
		_id,
		title,
	}
  }`;
	const { data } = await loadQuery<Post[]>({
		query: POSTS_QUERY,
		params: type ? { type } : {},
	});

	return data;
}

export async function getPostsDetails(slug: string): Promise<PostDetails> {
	const POST_DETAILS_QUERY = `
*[
  _type == "posts" &&
  slug.current == $slug &&
  !(_id in path("drafts.**"))
][0]{
  _id,
  title,
  subtitle,
  "slug": slug.current,
  type,
  description,
  publishedAt,
  featured,
  showToc,
  body[] {
    ...,
    _type == "quizReference" => {
      _type,
      "slug": @->slug.current
    }
  },
  "heroImage": heroImage.asset->url,
  "heroImageAlt": heroImage.alt,
  "authors": authors[]->{
    _id,
    name,
    "profileImage": profileImage.asset->url
  },

  "categories": categories[]->{
    _id,
    title,
  }
}
`;
	const { data } = await loadQuery<PostDetails>({
		query: POST_DETAILS_QUERY,
		params: {
			slug,
		},
	});
	return data;
}
