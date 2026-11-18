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

/** Display label for a meeting type: "agm" -> "AGM", "sub-committee" -> "Sub committee". */
export function minutesTypeLabel(type: string) {
	if (type === "agm") return "AGM";
	return type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ");
}

/** Meeting types present in `minutes`, with counts, most common first. */
export function summarizeMinutesTypes(minutes: Minutes[]) {
	const counts = new Map<string, number>();
	for (const minute of minutes) {
		const type = minute.type ?? "other";
		counts.set(type, (counts.get(type) ?? 0) + 1);
	}
	return [...counts]
		.map(([value, count]) => ({ value, label: minutesTypeLabel(value), count }))
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}
