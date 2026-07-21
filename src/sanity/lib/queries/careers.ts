import type { PortableTextBlock } from "sanity";
import { loadQuery } from "../load-query";

export type EmploymentType =
	| "Full-time"
	| "Part-time"
	| "Contract"
	| "Internship";

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
	location?: string;
	type: EmploymentType;
	status: VacancyStatus;
	postedDate: string;
	closingDate?: string;
	description?: string;
	company?: Company;
};

export type VacancyDetails = {
	_id: string;
	title: string;
	slug: string;
	location?: string;
	type: EmploymentType;
	status: VacancyStatus;
	postedDate: string;
	closingDate?: string;
	description?: string;
	company?: Company;
	body?: PortableTextBlock[];
};

export async function getVacancies(status?: VacancyStatus): Promise<Vacancy[]> {
	const VACANCIES_QUERY = `*[
    _type == "careers" &&
    !(_id in path("drafts.**")) &&
    (!defined($status) || status == $status)
  ] | order(postedDate desc) {
    _id,
    title,
    "slug": slug.current,
    location,
    type,
    status,
    postedDate,
    closingDate,
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

	return data;
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
  location,
  type,
  status,
  postedDate,
  closingDate,
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
