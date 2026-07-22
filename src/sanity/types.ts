import type { PortableTextBlock } from "@portabletext/types";
import type { Slug } from "@sanity/types";

export interface SanityImage {
	_type: "image";
	asset?: { _ref: string; _type: "reference" };
	hotspot?: { x: number; y: number; height: number; width: number };
	crop?: { top: number; bottom: number; left: number; right: number };
	alt?: string;
	/** Original image width in pixels, from asset metadata */
	width: number;
	/** Original image height in pixels, from asset metadata */
	height: number;
	/** Low-quality image placeholder (base64 data URL) */
	lqip?: string;
}

export interface Seo {
	metaTitle?: string;
	metaDescription?: string;
	ogImage?: SanityImage;
}

export type Post = {
	_id: string;
	title: string;
	subtitle?: string;
	slug: string;
	type: "blog" | "notice";
	description?: string;
	publishedAt: string;
	featured: boolean;
	heroImage?: string;
	heroImageAlt?: string;
};
