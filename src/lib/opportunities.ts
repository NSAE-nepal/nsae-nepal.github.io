/**
 * Opportunity kinds shown on the careers board. Shared by the Sanity schema
 * (src/sanity/schemaTypes/careers.ts) and the site, so keep this file free of
 * imports: the Studio bundles it too. Values double as URL segments.
 */
export const OPPORTUNITY_TYPES = [
  { value: "job", label: "Job" },
  { value: "scholarship", label: "Scholarship" },
  { value: "fellowship", label: "Fellowship" },
  { value: "grant", label: "Grant" },
  { value: "training", label: "Training" },
  { value: "call-for-papers", label: "Call for papers" },
  { value: "tender", label: "Tender" },
  { value: "other", label: "Other" },
] as const;

export type OpportunityType = (typeof OPPORTUNITY_TYPES)[number]["value"];

export type OpportunityTypeSummary = {
  value: OpportunityType;
  label: string;
  count: number;
};

/** How many days before the closing date an item counts as "closing soon". */
export const CLOSING_SOON_DAYS = 7;

export const opportunityTypeLabel = (type: OpportunityType) =>
  OPPORTUNITY_TYPES.find((option) => option.value === type)?.label ?? "Other";

export const opportunityPath = (item: { slug: string }) =>
  `/careers/${item.slug}/`;

/** Listing URL, optionally filtered to one opportunity type. */
export const opportunitiesPath = (type?: OpportunityType) =>
  type ? `/careers/type/${type}/page/1/` : "/careers/page/1/";

/** Types present in `items`, with counts, in the order of OPPORTUNITY_TYPES. */
export function summarizeOpportunityTypes(
  items: { opportunityType: OpportunityType }[],
): OpportunityTypeSummary[] {
  const counts = new Map<OpportunityType, number>();
  for (const item of items) {
    counts.set(item.opportunityType, (counts.get(item.opportunityType) ?? 0) + 1);
  }
  return OPPORTUNITY_TYPES.filter(({ value }) => counts.has(value)).map(
    ({ value, label }) => ({ value, label, count: counts.get(value)! }),
  );
}
