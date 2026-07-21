import { loadQuery } from "../load-query";

export type Home = {
	carousel: {
		image: string;
		alt: string;
	}[];
	objective: {
		summaryText: string;
		imagePrimary: {
			url: string;
			alt: string;
		};
		imageSecondary: {
			url: string;
			alt: string;
		};
		videoPrimary: string;
		metric1: {
			name: string;
			value: string;
			subtitle: string;
		};
		metric2: {
			name: string;
			value: string;
			subtitle: string;
		};
	};
	bylaws: {
		description: string;
		file: string;
	};
	membership: {
		general: {
			benefits: string[];
			joinUrl?: string;
		};
		lifetime: {
			benefits: string[];
			joinUrl?: string;
		};
	};
};

export async function getHomePage(): Promise<Home> {
	const HOME_QUERY = `
*[
  _type == "home" &&
  !(_id in path("drafts.**"))
][0]{
  "carousel": carousel[]{
    "image": asset->url,
    alt,
  },
  objective{
    summaryText,
    "imagePrimary": {
      "url": imagePrimary.asset->url,
      "alt": imagePrimary.alt
    },
    "imageSecondary": {
      "url": imageSecondary.asset->url,
      "alt": imageSecondary.alt
    },
    "videoPrimary": videoPrimary.asset->url,
    metric1,
    metric2
  },
  bylaws{
    description,
    "file": file.asset->url
  },
  membership{
    general,
    lifetime
  }
}
`;

	const { data } = await loadQuery<Home>({
		query: HOME_QUERY,
	});

	return data;
}
