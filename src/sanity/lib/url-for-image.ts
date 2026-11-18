// ./src/sanity/lib/url-for-image.ts
import { sanityClient } from "sanity:client";
import {
  createImageUrlBuilder,
  type SanityImageSource,
} from "@sanity/image-url";
export const imageBuilder = createImageUrlBuilder(sanityClient);
export function urlForImage(source: SanityImageSource) {
  return imageBuilder.image(source);
}

type SanityImageOptions = {
  /** Output width in px; use ~2x the largest rendered CSS width. */
  width: number;
  /** When set, the image is cropped (respecting the hotspot) to this height. */
  height?: number;
  quality?: number;
};

/**
 * Resize a Sanity CDN image URL (as returned by `asset->url` in our GROQ
 * queries) on Sanity's side, so the build never downloads multi-megapixel
 * originals and `<Image inferSize>` probes a small file. Non-Sanity URLs are
 * returned unchanged.
 */
export function sanityImage(src: string, options: SanityImageOptions): string;
export function sanityImage(
  src: string | undefined | null,
  options: SanityImageOptions,
): string | undefined;
export function sanityImage(
  src: string | undefined | null,
  { width, height, quality = 90 }: SanityImageOptions,
) {
  if (!src) return undefined;
  if (!src.startsWith("https://cdn.sanity.io/images/")) return src;

  const builder = urlForImage(src).width(width).quality(quality);

  return height
    ? builder.height(height).fit("crop").url()
    : builder.fit("max").url();
}
