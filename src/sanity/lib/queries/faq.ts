import { loadQuery } from "../load-query";

export type FaqItem = {
	_key: string;
	question: string;
	answer: string;
};

export type FaqDetails = {
	_id: string;
	items: FaqItem[];
};

export async function getFaqDetails(): Promise<FaqDetails | null> {
	const FAQ_QUERY = `
*[
  _type == "faq" &&
  !(_id in path("drafts.**"))
][0]{
  _id,
  items[] {
    _key,
    question,
    answer
  }
}
`;

	const { data } = await loadQuery<FaqDetails | null>({
		query: FAQ_QUERY,
	});

	return data;
}
