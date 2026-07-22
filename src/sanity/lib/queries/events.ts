import type { PortableTextBlock } from "sanity";
import { loadQuery } from "../load-query";

export type ScheduleItem = {
	_key: string;
	day: string;
	dayLabel?: string;
	sessionTitle: string;
	startTime: string;
	endTime: string;
	description?: string;
	speaker?: string;
	location?: string;
};

export type LocationType = "in_person" | "online" | "hybrid";

export type LocationDetails = {
	type: LocationType;
	venueName?: string;
	address?: string;
	city?: string;
	state?: string;
	mapsLink?: string;
	meetingUrl?: string;
	meetingId?: string;
	meetingPassword?: string;
};

export type ContactPerson = {
	_key: string;
	name: string;
	role?: string;
	email: string;
	phone?: string;
	isPrimary?: boolean;
};

export type EventRole =
	| "speaker"
	| "panelist"
	| "moderator"
	| "guest"
	| "instructor";

export type InstructorNsaeMember = {
	_type: "instructorNsaeMember";
	_key: string;
	eventRole?: EventRole;
	nsaeMember: {
		_id: string;
		name: string;
		profileImage?: string;
		position?: string;
		company?: string;
	};
};

export type InstructorExternal = {
	_type: "instructorExternal";
	_key: string;
	name: string;
	position?: string;
	company?: string;
	profileImage?: string;
	eventRole?: EventRole;
};

export type Representative = {
	_key: string;
	name: string;
	position?: string;
	profileImage?: string;
	eventRole?: EventRole;
};

export type InstructorOrganization = {
	_type: "instructorOrganization";
	_key: string;
	organizationName: string;
	website?: string;
	logo?: string;
	description?: string;
	representatives?: Representative[];
};

export type Instructor =
	| InstructorNsaeMember
	| InstructorExternal
	| InstructorOrganization;

export type EventCategoryType =
	| "training"
	| "workshop"
	| "expo"
	| "competitions"
	| "conference"
	| "seminars_webinars"
	| "others";

export type Event = {
	_id: string;
	title: string;
	slug: string;
	subtitle?: string;
	eventType: EventCategoryType;
	coverImage?: string;
	coverImageAlt?: string;
	eventStart: string;
	eventEnd: string;
	location?: LocationDetails;
	registrationLink?: string;
	registrationDeadline?: string;
	publishedAt?: string;
};

export type EventDetails = Event & {
	eventSchedule?: ScheduleItem[];
	instructors?: Instructor[];
	contactPersons?: ContactPerson[];
	body?: PortableTextBlock[];
};

export async function getEvents(): Promise<Event[]> {
	const EVENTS_QUERY = `*[
    _type == "events" &&
    !(_id in path("drafts.**"))
  ] | order(eventStart desc) {
    _id,
    title,
    "slug": slug.current,
    subtitle,
    eventType,
    "coverImage": coverImage.asset->url,
    "coverImageAlt": coverImage.alt,
    eventStart,
    eventEnd,
    location,
    registrationLink,
    registrationDeadline,
    publishedAt
  }`;

	const { data } = await loadQuery<Event[]>({
		query: EVENTS_QUERY,
	});

	return data;
}

export async function getEventDetails(slug: string): Promise<EventDetails> {
	const EVENT_DETAILS_QUERY = `
*[
  _type == "events" &&
  slug.current == $slug &&
  !(_id in path("drafts.**"))
][0]{
  _id,
  title,
  "slug": slug.current,
  subtitle,
  eventType,
  "coverImage": coverImage.asset->url,
  "coverImageAlt": coverImage.alt,
  eventStart,
  eventEnd,
  location,
  eventSchedule,
  contactPersons,
  registrationLink,
  registrationDeadline,
  publishedAt,
  body,
  instructors[] {
    _type,
    _key,
    _type == "instructorNsaeMember" => {
      eventRole,
      "nsaeMember": nsaeMember->{
        _id,
        name,
		position,
		company,
        "profileImage": profileImage.asset->url
      }
    },
    _type == "instructorExternal" => {
      name,
      position,
      company,
      "profileImage": profileImage.asset->url,
      eventRole
    },
    _type == "instructorOrganization" => {
      organizationName,
      website,
      "logo": logo.asset->url,
      description,
      representatives[] {
        _key,
        name,
        position,
        "profileImage": profileImage.asset->url,
        eventRole
      }
    }
  }
}
`;

	const { data } = await loadQuery<EventDetails>({
		query: EVENT_DETAILS_QUERY,
		params: {
			slug,
		},
	});

	return data;
}
