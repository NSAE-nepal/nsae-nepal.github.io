import type { APIContext, GetStaticPaths } from "astro";
import { type Event, getEvents } from "@/sanity/lib/queries/events";
import { buildICS } from "@/utils/calendar";

// One downloadable calendar file per event: /events/<slug>.ics
export const getStaticPaths: GetStaticPaths = async () => {
  const events = (await getEvents()) ?? [];
  return events
    .filter((event) => event.slug)
    .map((event) => ({ params: { slug: event.slug }, props: { event } }));
};

export function GET({ props, site }: APIContext<{ event: Event }>) {
  return new Response(buildICS(props.event, site ?? "https://www.nsae.org.np"), {
    headers: { "Content-Type": "text/calendar; charset=utf-8" },
  });
}
