/**
 * Resource library kinds. Shared by the Sanity schema
 * (src/sanity/schemaTypes/resources.ts) and the site, so keep this file free
 * of imports: the Studio bundles it too. Values double as URL segments.
 */
export const RESOURCE_TYPES = [
	{ value: "standard", label: "Standard" },
	{ value: "manual", label: "Manual" },
	{ value: "guideline", label: "Guideline" },
	{ value: "policy", label: "Policy & Act" },
	{ value: "report", label: "Report" },
	{ value: "paper", label: "Research paper" },
	{ value: "template", label: "Template" },
	{ value: "dataset", label: "Dataset" },
	{ value: "software", label: "Software & tool" },
	{ value: "presentation", label: "Presentation" },
	{ value: "other", label: "Other" },
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number]["value"];

export type ResourceTypeSummary = {
	value: ResourceType;
	label: string;
	count: number;
};

export const resourceTypeLabel = (type: ResourceType) =>
	RESOURCE_TYPES.find((option) => option.value === type)?.label ?? "Other";

export const resourcePath = (item: { slug: string }) =>
	`/resources/${item.slug}/`;

/** Listing URL, optionally filtered to one resource type. */
export const resourcesPath = (type?: ResourceType) =>
	type ? `/resources/type/${type}/page/1/` : "/resources/page/1/";

/** Link that makes Sanity's CDN serve the file as a download with its name. */
export const downloadUrl = (url: string, filename?: string) =>
	`${url}?dl=${encodeURIComponent(filename ?? "")}`;

/** Types present in `items`, with counts, in the order of RESOURCE_TYPES. */
export function summarizeResourceTypes(
	items: { resourceType: ResourceType }[],
): ResourceTypeSummary[] {
	const counts = new Map<ResourceType, number>();
	for (const item of items) {
		counts.set(item.resourceType, (counts.get(item.resourceType) ?? 0) + 1);
	}
	return RESOURCE_TYPES.filter(({ value }) => counts.has(value)).map(
		({ value, label }) => ({ value, label, count: counts.get(value)! }),
	);
}
