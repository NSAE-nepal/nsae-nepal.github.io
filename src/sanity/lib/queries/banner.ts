import { loadQuery } from "../load-query";

export type ContentPosition = "left" | "right";

export type ButtonState = "active" | "inactive";

export type Banner = {
	_id: string;
	title: string;
	subtitle?: string;
	backgroundImage: string;
	contentPosition: ContentPosition;
	description?: string;
	buttonText: string;
	buttonLink?: string;
	buttonState: ButtonState;
	showBanner: boolean;
	countdownTarget?: string;
	draft?: boolean;
};

/**
 * Fetch a list of active banners to display on the frontend.
 * By default, this filters out drafts, unpublished items, and banners where `showBanner` is false.
 */
export async function getBanners(includeHidden = false): Promise<Banner[]> {
	const BANNERS_QUERY = `*[
    _type == "banners" &&
    !(_id in path("drafts.**")) &&
    ($includeHidden == true || showBanner == true )
  ] | order(_createdAt desc) {
    _id,
    title,
    subtitle,
    "backgroundImage": backgroundImage.asset->url,
    contentPosition,
    description,
    buttonText,
    buttonLink,
    buttonState,
    showBanner,
    countdownTarget,
    draft
  }`;

	const { data } = await loadQuery<Banner[]>({
		query: BANNERS_QUERY,
		params: { includeHidden },
	});

	return data;
}

export async function getBannerById(id: string): Promise<Banner | null> {
	const BANNER_BY_ID_QUERY = `
*[
  _type == "banners" &&
  _id == $id
][0]{
  _id,
  title,
  subtitle,
  "backgroundImage": backgroundImage.asset->url,
  contentPosition,
  description,
  buttonText,
  buttonLink,
  buttonState,
  showBanner,
  countdownTarget,
  draft
}
`;

	const { data } = await loadQuery<Banner | null>({
		query: BANNER_BY_ID_QUERY,
		params: { id },
	});

	return data;
}
