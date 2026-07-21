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
	name: string;
	position: CommitteePosition;
	membership?: MembershipStatus;
	prefix?: NamePrefix[];
	profileImage?: string;
	portfolio?: string;
	neaRegNo?: string;
	necRegNo?: string;
};

export type Committee = {
	_id: string;
	title: string;
	committeeIteration: number;
	memberCount: number;
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
    "memberCount": count(committeeMembers)
  }`;

	const { data } = await loadQuery<Committee[]>({
		query: COMMITTEES_QUERY,
	});

	return data;
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
