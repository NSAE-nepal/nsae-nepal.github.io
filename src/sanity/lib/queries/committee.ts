import { loadQuery } from "../load-query";

export type CommitteePosition =
	| "president"
	| "vice-president"
	| "secretary"
	| "joint-secretary"
	| "treasurer"
	| "member"
	| "corporate-member";

export type MembershipStatus =
	| "life-member"
	| "general-member"
	| "honorary-member"
	| "student-member"
	| "associate-member"
	| "corporate-member";

export type NamePrefix = "er" | "dr" | "prof_dr" | "mr" | "ms";

export type CommitteeMember = {
	_key: string;
	name: string;
	position: CommitteePosition;
	membership?: MembershipStatus;
	prefix?: NamePrefix[];
	profileImage?: string;
	portfolio?: string;
	neaRegNo?: string;
	necRegNo?: string;
};

export type CommitteeMemberPreview = {
	_key: string;
	name: string;
	position?: CommitteePosition;
	prefix?: NamePrefix[];
	profileImage?: string;
};

/** Office-bearer positions, in order of seniority. */
export const OFFICE_BEARER_POSITIONS = [
	"president",
	"vice-president",
	"secretary",
	"joint-secretary",
	"treasurer",
] as const satisfies readonly CommitteePosition[];

export const positionLabel = (position: string) =>
	position
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

const isOfficeBearer = (position?: string) =>
	(OFFICE_BEARER_POSITIONS as readonly string[]).includes(position ?? "");

/** The committee's office bearers, most senior first. */
export function officeBearers<T extends { position?: string }>(members: T[]) {
	return OFFICE_BEARER_POSITIONS.flatMap((position) =>
		members.filter((member) => member.position === position),
	);
}

/** Everyone else (members, corporate members), in Studio order. */
export function otherMembers<T extends { position?: string }>(members: T[]) {
	return members.filter((member) => !isOfficeBearer(member.position));
}

export type Committee = {
	_id: string;
	title: string;
	committeeIteration: number;
	memberCount: number;
	/** Everyone on the committee, in Studio order. */
	members: CommitteeMemberPreview[];
};

export type CommitteeDetails = {
	_id: string;
	title: string;
	committeeIteration: number;
	committeeMembers: CommitteeMember[];
};

export async function getCommittees(): Promise<Committee[]> {
	const COMMITTEES_QUERY = `*[
    _type == "committee" &&
    !(_id in path("drafts.**"))
  ] | order(committeeIteration desc) {
    _id,
    title,
    committeeIteration,
    "memberCount": count(committeeMembers),
    "members": committeeMembers[defined(name)]{
      _key,
      name,
      position,
      prefix,
      "profileImage": profileImage.asset->url
    }
  }`;

	const { data } = await loadQuery<Committee[]>({
		query: COMMITTEES_QUERY,
	});

	return (data ?? []).map((committee) => ({
		...committee,
		memberCount: committee.memberCount ?? 0,
		members: committee.members ?? [],
	}));
}

export async function getCommitteeDetails(
	iteration: number,
): Promise<CommitteeDetails> {
	const COMMITTEE_DETAILS_QUERY = `
*[
  _type == "committee" &&
  committeeIteration == $iteration &&
  !(_id in path("drafts.**"))
][0]{
  _id,
  title,
  committeeIteration,
  committeeMembers[] {
    _key,
    name,
    position,
    membership,
    prefix,
    "profileImage": profileImage.asset->url,
    portfolio,
    neaRegNo,
    necRegNo
  }
}
`;

	const { data } = await loadQuery<CommitteeDetails>({
		query: COMMITTEE_DETAILS_QUERY,
		params: {
			iteration,
		},
	});

	return data;
}

export async function getLatestCommitteeDetails(): Promise<CommitteeDetails> {
	const LATEST_COMMITTEE_QUERY = `
*[
  _type == "committee" &&
  !(_id in path("drafts.**"))
] | order(committeeIteration desc)[0]{
  _id,
  title,
  committeeIteration,
  committeeMembers[] {
    _key,
    name,
    position,
    membership,
    prefix,
    "profileImage": profileImage.asset->url,
    portfolio,
    neaRegNo,
    necRegNo
  }
}
`;

	const { data } = await loadQuery<CommitteeDetails>({
		query: LATEST_COMMITTEE_QUERY,
	});

	return data;
}
