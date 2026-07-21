import type { PortableTextBlock } from "sanity";
import { loadQuery } from "../load-query";

export type MinutesType =
	| "agm"
	| "executive"
	| "general"
	| "emergency"
	| "sub-committee"
	| "other";

export type RecordedBy = {
	_id: string;
	name: string;
	profileImage?: string;
};

export type Minutes = {
	_id: string;
	title: string;
	slug: string;
	pubDate: string;
	updatedDate?: string;
	type: MinutesType;
	location?: string;
	chairperson?: string;
	secretary?: string;
	attendees?: string[];
	absent?: string[];
	downloadUrl?: string;
	recordedBy?: RecordedBy;
};

export type MinutesDetails = Minutes & {
	body?: PortableTextBlock[];
};

export async function getMinutes(): Promise<Minutes[]> {
	const MINUTES_QUERY = `*[
    _type == "minutes" &&
    !(_id in path("drafts.**"))
  ] | order(pubDate desc) {
    _id,
    title,
    "slug": slug.current,
    pubDate,
    updatedDate,
    type,
    location,
    chairperson,
    secretary,
    attendees,
    absent,
    downloadUrl,
    "recordedBy": recordedBy->{
      _id,
      name,
      "profileImage": profileImage.asset->url
    }
  }`;

	const { data } = await loadQuery<Minutes[]>({
		query: MINUTES_QUERY,
	});

	return data;
}

export async function getMinutesDetails(slug: string): Promise<MinutesDetails> {
	const MINUTES_DETAILS_QUERY = `
*[
  _type == "minutes" &&
  slug.current == $slug &&
  !(_id in path("drafts.**"))
][0]{
  _id,
  title,
  "slug": slug.current,
  pubDate,
  updatedDate,
  type,
  location,
  chairperson,
  secretary,
  attendees,
  absent,
  downloadUrl,
  body,
  "recordedBy": recordedBy->{
    _id,
    name,
    "profileImage": profileImage.asset->url
  }
}
`;

	const { data } = await loadQuery<MinutesDetails>({
		query: MINUTES_DETAILS_QUERY,
		params: {
			slug,
		},
	});

	return data;
}
