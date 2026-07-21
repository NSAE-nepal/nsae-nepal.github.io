import { loadQuery } from "../load-query";

export type ImpactArea = {
	_key: string;
	title: string;
	icon?: string;
	description: string;
};

export type BankDetails = {
	bankName: string;
	accountName: string;
	accountNumber: string;
	branch: string;
	swift?: string;
	accountQRCode: string;
};

export type DonateDetails = {
	_id: string;
	bankDetails: BankDetails;
};

export async function getDonateDetails(): Promise<DonateDetails> {
	const DONATE_QUERY = `
*[
  _type == "donate" &&
  !(_id in path("drafts.**"))
][0]{
  _id,
  "heroImage": heroImage.asset->url,
  "heroImageAlt": heroImage.alt,
  impactAreas[] {
    _key,
    title,
    icon,
    description
  },
  bankDetails {
    bankName,
    accountName,
    accountNumber,
    branch,
    swift,
    "accountQRCode": accountQRCode.asset->url
  }
}
`;

	const { data } = await loadQuery<DonateDetails>({
		query: DONATE_QUERY,
	});

	return data;
}
