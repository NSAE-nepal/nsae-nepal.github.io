import { loadQuery } from "../load-query";

export type SocialPlatform = {
	handle?: string;
	link?: string;
};

export type Socials = {
	linkedin?: SocialPlatform;
	x?: SocialPlatform;
	facebook?: SocialPlatform;
	youtube?: SocialPlatform;
	bluesky?: SocialPlatform;
	github?: SocialPlatform;
};

export type ContactsDetails = {
	_id: string;
	address?: string;
	addressLink?: string;
	phoneNumbers?: string[];
	emails?: string[];
	socials?: Socials;
};

export async function getContactsDetails(): Promise<ContactsDetails> {
	const CONTACTS_QUERY = `
*[
  _type == "contacts" &&
  !(_id in path("drafts.**"))
][0]{
  _id,
  address,
  addressLink,
  phoneNumbers,
  emails,
  socials
}
`;

	const { data } = await loadQuery<ContactsDetails>({
		query: CONTACTS_QUERY,
	});

	return data;
}
