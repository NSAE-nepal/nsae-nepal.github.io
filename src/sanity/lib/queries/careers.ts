import type { PortableTextBlock } from "sanity";
import type { OpportunityType } from "@/lib/opportunities";
import { getOpportunityStatus } from "@/utils/datetime";
import { loadQuery } from "../load-query";

export type EmploymentType =
	"Full-time" | "Part-time" | "Contract" | "Internship";

export type VacancyStatus = "open" | "closed";

export type Company = {
	name: string;
	logo?: string;
	website?: string;
};

export type Vacancy = {
	_id: string;
	title: string;
	slug: string;
	opportunityType: OpportunityType;
	location?: string;
	/** Employment type; only set for jobs. */
	type?: EmploymentType;
	status: VacancyStatus;
	postedDate: string;
	closingDate?: string;
	value?: string;
	applyUrl?: string;
	description?: string;
	company: Company;
};

export type VacancyDetails = {
	_id: string;
	title: string;
	slug: string;
	opportunityType: OpportunityType;
	location?: string;
	/** Employment type; only set for jobs. */
	type?: EmploymentType;
	status: VacancyStatus;
	postedDate: string;
	closingDate?: string;
	value?: string;
	applyUrl?: string;
	description?: string;
	company: Company;
	body?: PortableTextBlock[];
};

/**
 * Every opportunity, newest first, with the ones still open (as of the build)
 * ahead of closed and expired ones.
 */
export async function getVacancies(status?: VacancyStatus): Promise<Vacancy[]> {
	const VACANCIES_QUERY = `*[
    _type == "careers" &&
    !(_id in path("drafts.**")) &&
    (!defined($status) || status == $status)
  ] | order(postedDate desc) {
    _id,
    title,
    "slug": slug.current,
    "opportunityType": coalesce(opportunityType, "job"),
    location,
    type,
    status,
    postedDate,
    closingDate,
    value,
    applyUrl,
    description,
    "company": {
      "name": company.name,
      "logo": company.logo.asset->url,
      "website": company.website
    }
  }`;

	const { data } = await loadQuery<Vacancy[]>({
		query: VACANCIES_QUERY,
		params: { status: (status ?? null) as unknown as string },
	});

	const isClosed = (vacancy: Vacancy) => getOpportunityStatus(vacancy).isClosed;
	return [...(data ?? [])].sort(
		(a, b) => Number(isClosed(a)) - Number(isClosed(b)),
	);
}

export async function getVacancyDetails(slug: string): Promise<VacancyDetails> {
	const VACANCY_DETAILS_QUERY = `
*[
  _type == "careers" &&
  slug.current == $slug &&
  !(_id in path("drafts.**"))
][0]{
  _id,
  title,
  "slug": slug.current,
  "opportunityType": coalesce(opportunityType, "job"),
  location,
  type,
  status,
  postedDate,
  closingDate,
  value,
  applyUrl,
  description,
  body,
  "company": {
    "name": company.name,
    "logo": company.logo.asset->url,
    "website": company.website
  }
}
`;

	const { data } = await loadQuery<VacancyDetails>({
		query: VACANCY_DETAILS_QUERY,
		params: {
			slug,
		},
	});

	return data;
}
