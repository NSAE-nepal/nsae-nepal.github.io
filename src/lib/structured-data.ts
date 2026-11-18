/**
 * schema.org JSON-LD builders. Render with `src/components/seo/JsonLd.astro`.
 * Undefined fields are dropped by JSON.stringify, so optional data can be
 * passed through as-is.
 */
import type { PortableTextBlock } from "sanity";
import { SITE_DESCRIPTION } from "@/consts";
import type { VacancyDetails } from "@/sanity/lib/queries/careers";
import type { ContactsDetails } from "@/sanity/lib/queries/contacts";
import type { EventDetails, LocationDetails } from "@/sanity/lib/queries/events";
import type { PostDetails } from "@/sanity/lib/queries/posts";
import { sanityImage } from "@/sanity/lib/url-for-image";

const ORG_NAME = "Nepalese Society of Agricultural Engineers";
const CONTEXT = "https://schema.org";

type Site = URL | string;

const abs = (path: string, site: Site) => new URL(path, site).toString();
const orgId = (site: Site) => abs("/#organization", site);
const image = (src: string | undefined) =>
  src ? sanityImage(src, { width: 1200 }) : undefined;
const nonEmpty = <T>(list: (T | undefined | null | false | "")[]) => {
  const filtered = list.filter(Boolean) as T[];
  return filtered.length > 0 ? filtered : undefined;
};

/** Plain text from Portable Text blocks (paragraph text only). */
export function toPlainText(blocks: PortableTextBlock[] | undefined) {
  if (!blocks) return "";
  return blocks
    .filter((block) => block._type === "block")
    .map((block) =>
      ((block.children as { text?: string }[] | undefined) ?? [])
        .map((child) => child.text ?? "")
        .join(""),
    )
    .filter(Boolean)
    .join("\n\n");
}

/** Short reference to NSAE as publisher/organizer. */
const orgRef = (site: Site) => ({
  "@type": "Organization",
  "@id": orgId(site),
  name: ORG_NAME,
  url: abs("/", site),
  logo: abs("/nsae-logo.png", site),
});

export function organizationLd(site: Site, contacts?: ContactsDetails | null) {
  const sameAs = nonEmpty(
    Object.values(contacts?.socials ?? {}).map((social) => social?.link),
  );

  return [
    {
      "@context": CONTEXT,
      "@type": "NGO",
      "@id": orgId(site),
      name: ORG_NAME,
      alternateName: "NSAE",
      url: abs("/", site),
      logo: abs("/nsae-logo.png", site),
      description: SITE_DESCRIPTION,
      foundingDate: "1990",
      email: contacts?.emails?.[0],
      telephone: contacts?.phoneNumbers?.[0],
      address: contacts?.address
        ? {
            "@type": "PostalAddress",
            streetAddress: contacts.address,
            addressCountry: "NP",
          }
        : undefined,
      sameAs,
    },
    {
      "@context": CONTEXT,
      "@type": "WebSite",
      name: "NSAE",
      url: abs("/", site),
      publisher: { "@id": orgId(site) },
    },
  ];
}

const ATTENDANCE_MODE: Record<LocationDetails["type"], string> = {
  in_person: "https://schema.org/OfflineEventAttendanceMode",
  online: "https://schema.org/OnlineEventAttendanceMode",
  hybrid: "https://schema.org/MixedEventAttendanceMode",
};

function eventLocation(location: LocationDetails | undefined, pageUrl: string) {
  if (!location) return undefined;

  const place = {
    "@type": "Place",
    name: location.venueName ?? location.city,
    address: {
      "@type": "PostalAddress",
      streetAddress: location.address,
      addressLocality: location.city,
      addressRegion: location.state,
      addressCountry: "NP",
    },
  };
  const virtual = {
    "@type": "VirtualLocation",
    url: location.meetingUrl ?? pageUrl,
  };

  if (location.type === "online") return virtual;
  if (location.type === "hybrid") return [place, virtual];
  return place;
}

function eventPerformers(instructors: EventDetails["instructors"]) {
  return nonEmpty(
    (instructors ?? []).flatMap((instructor) => {
      switch (instructor._type) {
        case "instructorNsaeMember":
          return instructor.nsaeMember
            ? [{ "@type": "Person", name: instructor.nsaeMember.name }]
            : [];
        case "instructorExternal":
          return [{ "@type": "Person", name: instructor.name }];
        case "instructorOrganization":
          return [
            {
              "@type": "Organization",
              name: instructor.organizationName,
              url: instructor.website,
            },
          ];
        default:
          return [];
      }
    }),
  );
}

export function eventLd(
  event: EventDetails,
  site: Site,
  { isRegistrationOpen }: { isRegistrationOpen: boolean },
) {
  const pageUrl = abs(`/events/${event.slug}/`, site);

  return {
    "@context": CONTEXT,
    "@type": "Event",
    name: event.title,
    description: event.subtitle ?? (toPlainText(event.body).slice(0, 500) || undefined),
    url: pageUrl,
    startDate: event.eventStart,
    endDate: event.eventEnd,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: event.location
      ? ATTENDANCE_MODE[event.location.type]
      : undefined,
    location: eventLocation(event.location, pageUrl),
    image: nonEmpty([image(event.coverImage)]),
    organizer: orgRef(site),
    performer: eventPerformers(event.instructors),
    offers: event.registrationLink
      ? {
          "@type": "Offer",
          url: event.registrationLink,
          availability: isRegistrationOpen
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
          validThrough: event.registrationDeadline,
        }
      : undefined,
  };
}

const EMPLOYMENT_TYPE: Record<VacancyDetails["type"], string> = {
  "Full-time": "FULL_TIME",
  "Part-time": "PART_TIME",
  Contract: "CONTRACTOR",
  Internship: "INTERN",
};

export function jobPostingLd(vacancy: VacancyDetails, site: Site) {
  const isRemote = /remote/i.test(vacancy.location ?? "");
  const body = toPlainText(vacancy.body);
  const description = [vacancy.description, body].filter(Boolean).join("\n\n");

  return {
    "@context": CONTEXT,
    "@type": "JobPosting",
    title: vacancy.title,
    description: description || vacancy.title,
    url: abs(`/careers/${vacancy.slug}/`, site),
    datePosted: vacancy.postedDate,
    validThrough: vacancy.closingDate,
    employmentType: EMPLOYMENT_TYPE[vacancy.type],
    hiringOrganization: vacancy.company?.name
      ? {
          "@type": "Organization",
          name: vacancy.company.name,
          sameAs: vacancy.company.website,
          logo: vacancy.company.logo,
        }
      : orgRef(site),
    ...(isRemote
      ? {
          jobLocationType: "TELECOMMUTE",
          applicantLocationRequirements: { "@type": "Country", name: "Nepal" },
        }
      : {
          jobLocation: {
            "@type": "Place",
            address: {
              "@type": "PostalAddress",
              addressLocality: vacancy.location,
              addressCountry: "NP",
            },
          },
        }),
  };
}

export function articleLd(post: PostDetails, site: Site) {
  const section = post.type === "notice" ? "notices" : "blog";
  const pageUrl = abs(`/${section}/${post.slug}/`, site);

  return {
    "@context": CONTEXT,
    "@type": post.type === "notice" ? "NewsArticle" : "BlogPosting",
    // Google truncates headlines beyond 110 characters.
    headline: post.title.length > 110 ? `${post.title.slice(0, 107)}...` : post.title,
    description: post.description ?? post.subtitle,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    datePublished: post.publishedAt,
    image: nonEmpty([image(post.heroImage)]),
    author: nonEmpty(
      (post.authors ?? []).map(
        (author) =>
          author && {
            "@type": "Person",
            name: author.name,
            url: author.slug ? abs(`/authors/${author.slug}/`, site) : undefined,
          },
      ),
    ) ?? orgRef(site),
    publisher: orgRef(site),
    articleSection: nonEmpty((post.categories ?? []).map((category) => category?.title)),
  };
}

export function breadcrumbLd(items: { name: string; path: string }[], site: Site) {
  return {
    "@context": CONTEXT,
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: abs(item.path, site),
    })),
  };
}
