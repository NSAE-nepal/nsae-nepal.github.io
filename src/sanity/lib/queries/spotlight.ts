import type { PortableTextBlock } from "sanity";
import { loadQuery } from "../load-query";
import type { SocialLink } from "./authors";

export type SpotlightMember = {
	_id: string;
	name: string;
	slug?: string;
	prefix?: string[];
	position?: string;
	company?: string;
	profileImage?: string;
	profileImageAlt?: string;
	bio?: string;
	portfolio?: string;
	socials?: Record<string, SocialLink | undefined>;
};

export type SpotlightProject = {
	_key: string;
	title: string;
	year?: string;
	location?: string;
	summary?: string;
	image?: string;
	imageAlt?: string;
};

export type Spotlight = {
	_id: string;
	headline: string;
	slug: string;
	summary: string;
	specializations: string[];
	location?: string;
	coverImage?: string;
	coverImageAlt?: string;
	featured: boolean;
	publishedAt: string;
	member: SpotlightMember;
};

export type SpotlightDetails = Spotlight & {
	projects: SpotlightProject[];
	body?: PortableTextBlock[];
};

export const spotlightPath = (spotlight: { slug: string }) => `/spotlight/${spotlight.slug}/`;

/** Specialization tags in the shape the shared `Categories` badges expect. */
export const specializationTags = (spotlight: { specializations: string[] }) =>
	spotlight.specializations.map((title) => ({ _id: title, title }));
export const SPOTLIGHTS_PATH = "/spotlight/page/1/";

const SPOTLIGHT_FIELDS = `
  _id,
  headline,
  "slug": slug.current,
  summary,
  "specializations": coalesce(specializations, []),
  location,
  "coverImage": coverImage.asset->url,
  "coverImageAlt": coverImage.alt,
  "featured": coalesce(featured, false),
  "publishedAt": coalesce(publishedAt, _createdAt),
  "member": member->{
    _id,
    name,
    "slug": slug.current,
    prefix,
    position,
    company,
    "profileImage": profileImage.asset->url,
    "profileImageAlt": profileImage.alt,
    bio,
    portfolio,
    socials
  }
`;

const PUBLISHED = `_type == "spotlight" && !(_id in path("drafts.**")) && defined(slug.current)`;

/** Spotlights whose member reference resolves, newest first. */
export async function getSpotlights(): Promise<Spotlight[]> {
	const { data } = await loadQuery<Spotlight[]>({
		query: `*[${PUBLISHED}] | order(publishedAt desc) { ${SPOTLIGHT_FIELDS} }`,
	});
	// A deleted or unpublished member comes back as null.
	return (data ?? []).filter((spotlight) => spotlight.member?.name);
}

export async function getSpotlightDetails(slug: string): Promise<SpotlightDetails> {
	const { data } = await loadQuery<SpotlightDetails>({
		query: `*[${PUBLISHED} && slug.current == $slug][0]{
      ${SPOTLIGHT_FIELDS},
      body,
      "projects": coalesce(projects[defined(title)]{
        _key,
        title,
        year,
        location,
        summary,
        "image": image.asset->url,
        "imageAlt": image.alt
      }, [])
    }`,
		params: { slug },
	});
	return data;
}

/** Most recent featured spotlight (the home page section), if any. */
export async function getFeaturedSpotlight(): Promise<Spotlight | undefined> {
	return (await getSpotlights()).find((spotlight) => spotlight.featured);
}
