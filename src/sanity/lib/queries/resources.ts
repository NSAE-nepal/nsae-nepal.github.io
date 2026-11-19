import type { PortableTextBlock } from "sanity";
import { formatFileSize } from "@/lib/courses";
import type { ResourceType } from "@/lib/resources";
import { loadQuery } from "../load-query";

export type ResourceFile = {
	_key: string;
	_type: "resourceFile";
	title?: string;
	url: string;
	filename?: string;
	size?: number;
	extension?: string;
};

export type ResourceLink = {
	_key: string;
	_type: "resourceLink";
	title?: string;
	url: string;
};

export type ResourceAttachment = ResourceFile | ResourceLink;

export type Resource = {
	_id: string;
	title: string;
	slug: string;
	resourceType: ResourceType;
	description?: string;
	publisher?: string;
	year?: number;
	publishedAt: string;
	categories: { _id: string; title: string }[];
	/** Files and links, in Studio order (never empty for listed resources). */
	attachments: ResourceAttachment[];
};

export type ResourceDetails = Resource & {
	body?: PortableTextBlock[];
};

const RESOURCE_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  "resourceType": coalesce(resourceType, "other"),
  description,
  publisher,
  year,
  "publishedAt": coalesce(publishedAt, _createdAt),
  "categories": categories[]->{ _id, title },
  "attachments": attachments[]{
    _key,
    _type,
    title,
    _type == "resourceFile" => {
      "url": file.asset->url,
      "filename": file.asset->originalFilename,
      "size": file.asset->size,
      "extension": file.asset->extension
    },
    _type == "resourceLink" => { url }
  }
`;

/**
 * Drops dangling topic references (deleted or unpublished categories) and
 * attachments without a URL (a file field left empty).
 */
const normalize = <T extends Resource>(resource: T): T => ({
	...resource,
	categories: (resource.categories ?? []).filter((category) => category?.title),
	attachments: (resource.attachments ?? []).filter((item) => item?.url),
});

/** Resources need at least one file or link to be listed. */
const isUsable = (resource: Resource) =>
	Boolean(resource.slug && resource.attachments.length > 0);

/** Every published resource, most recently added first. */
export async function getResources(): Promise<Resource[]> {
	const { data } = await loadQuery<Resource[]>({
		query: `*[_type == "resource" && !(_id in path("drafts.**"))]
      | order(coalesce(publishedAt, _createdAt) desc) { ${RESOURCE_FIELDS} }`,
	});

	return (data ?? []).map(normalize).filter(isUsable);
}

export async function getResourceDetails(slug: string): Promise<ResourceDetails> {
	const { data } = await loadQuery<ResourceDetails>({
		query: `*[
      _type == "resource" &&
      slug.current == $slug &&
      !(_id in path("drafts.**"))
    ][0]{ ${RESOURCE_FIELDS}, body }`,
		params: { slug },
	});

	return normalize(data);
}

const hostname = (url: string) => {
	try {
		return new URL(url).hostname.replace(/^www\./, "");
	} catch {
		return url;
	}
};

/** Display name: its label, else the file name or website. */
export const attachmentTitle = (item: ResourceAttachment) =>
	item.title ||
	(item._type === "resourceFile" ? item.filename : undefined) ||
	hostname(item.url);

/** "PDF · 2.1 MB" for a file, the website ("fao.org") for a link. */
export function attachmentMeta(item: ResourceAttachment) {
	if (item._type === "resourceLink") return hostname(item.url);
	return [item.extension?.toUpperCase(), formatFileSize(item.size)].filter(Boolean).join(" · ");
}

/**
 * Summary for cards and the meta row: the item's own details when there's
 * one ("PDF · 2.1 MB", "External link"), else counts ("2 files · 1 link").
 */
export function resourceFormat(resource: Pick<Resource, "attachments">) {
	const { attachments } = resource;
	if (attachments.length === 1) {
		const [only] = attachments;
		return only._type === "resourceFile" ? attachmentMeta(only) : "External link";
	}
	const files = attachments.filter((item) => item._type === "resourceFile").length;
	const links = attachments.length - files;
	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
	return [files && plural(files, "file"), links && plural(links, "link")]
		.filter(Boolean)
		.join(" · ");
}

/** Up to `count` other resources sharing the most topics, then the same type. */
export function relatedResources(resource: Resource, all: Resource[], count = 3) {
	const topics = new Set(resource.categories.map((category) => category._id));
	return all
		.filter((other) => other._id !== resource._id)
		.map((other) => ({
			other,
			score:
				other.categories.filter((category) => topics.has(category._id)).length * 2 +
				Number(other.resourceType === resource.resourceType),
		}))
		.filter(({ score }) => score > 0)
		.sort((a, b) => b.score - a.score)
		.slice(0, count)
		.map(({ other }) => other);
}
