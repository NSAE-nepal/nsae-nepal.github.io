import type { APIContext, GetStaticPaths } from "astro";
import { type OgCard, renderOgPng } from "@/lib/og";
import { opportunityTypeLabel } from "@/lib/opportunities";
import { courseStats, formatDuration, LEVEL_LABELS } from "@/lib/courses";
import { getVacancies } from "@/sanity/lib/queries/careers";
import { getCourses } from "@/sanity/lib/queries/courses";
import { getEvents } from "@/sanity/lib/queries/events";
import { getPosts } from "@/sanity/lib/queries/posts";
import { formatDate } from "@/utils/datetime";

/**
 * Generated social preview cards at /og/<section>/<slug>.png. Detail pages
 * use these when they have no cover image of their own (see `ogImagePath`).
 */
export const getStaticPaths: GetStaticPaths = async () => {
  const [posts, events, vacancies, courses] = await Promise.all([
    getPosts(),
    getEvents(),
    getVacancies(),
    getCourses(),
  ]);

  const date = (value?: string) =>
    value ? formatDate(new Date(value)) : undefined;

  const cards: { path: string; card: OgCard }[] = [
    ...(posts ?? []).map((post) => ({
      path: `${post.type === "notice" ? "notices" : "blog"}/${post.slug}`,
      card: {
        kicker: post.type === "notice" ? "Notice" : "Blog",
        title: post.title,
        meta: date(post.publishedAt),
      },
    })),
    ...(events ?? []).map((event) => ({
      path: `events/${event.slug}`,
      card: {
        kicker: "Event",
        title: event.title,
        meta: date(event.eventStart),
      },
    })),
    ...(vacancies ?? []).map((vacancy) => ({
      path: `careers/${vacancy.slug}`,
      card: {
        kicker: opportunityTypeLabel(vacancy.opportunityType),
        title: vacancy.title,
        meta: [vacancy.company?.name, vacancy.value ?? vacancy.type]
          .filter(Boolean)
          .join(" · "),
      },
    })),
    ...(courses ?? []).map((course) => {
      const { lessonCount, totalMinutes } = courseStats(course);
      return {
        path: `courses/${course.slug}`,
        card: {
          kicker: "Course",
          title: course.title,
          meta: [
            LEVEL_LABELS[course.level],
            `${lessonCount} lesson${lessonCount === 1 ? "" : "s"}`,
            formatDuration(totalMinutes),
          ]
            .filter(Boolean)
            .join(" · "),
        },
      };
    }),
  ];

  return cards
    .filter(({ path }) => !path.endsWith("/undefined") && !path.endsWith("/"))
    .map(({ path, card }) => ({ params: { path }, props: { card } }));
};

export async function GET({ props }: APIContext<{ card: OgCard }>) {
  const png = await renderOgPng(props.card);
  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
}
