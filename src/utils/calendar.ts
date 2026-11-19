import type { Event } from "@/sanity/lib/queries/events";

type CalendarEvent = Pick<
	Event,
	"title" | "slug" | "subtitle" | "eventStart" | "eventEnd" | "location"
>;

const ONE_HOUR = 60 * 60 * 1000;

/** UTC timestamp in iCalendar / Google Calendar basic format: 20260205T031500Z */
export const toCalendarDate = (date: Date) =>
	date
		.toISOString()
		.replace(/[-:]/g, "")
		.replace(/\.\d{3}/, "");

const getRange = (event: CalendarEvent) => {
	const start = new Date(event.eventStart);
	const end = event.eventEnd
		? new Date(event.eventEnd)
		: new Date(start.getTime() + ONE_HOUR);
	return { start, end };
};

export const eventUrl = (event: CalendarEvent, site: URL | string) =>
	new URL(`/events/${event.slug}/`, site).toString();

/** Human-readable location for calendar entries (no meeting passwords). */
export const formatEventLocation = (event: CalendarEvent) => {
	const location = event.location;
	if (!location) return "";

	const venue = [
		location.venueName,
		location.address,
		location.city,
		location.state,
	]
		.filter(Boolean)
		.join(", ");

	switch (location.type) {
		case "online":
			return location.meetingUrl ?? "Online";
		case "hybrid":
			return [venue, location.meetingUrl && `Online: ${location.meetingUrl}`]
				.filter(Boolean)
				.join(" / ");
		default:
			return venue;
	}
};

const describe = (event: CalendarEvent, site: URL | string) =>
	[event.subtitle, `Details: ${eventUrl(event, site)}`]
		.filter(Boolean)
		.join("\n\n");

/** Escape a TEXT value per RFC 5545 §3.3.11. */
const escapeText = (value: string) =>
	value
		.replace(/\\/g, "\\\\")
		.replace(/;/g, "\\;")
		.replace(/,/g, "\\,")
		.replace(/\r?\n/g, "\\n");

/** Fold a content line to at most 75 octets per RFC 5545 §3.1. */
const foldLine = (line: string) => {
	const encoder = new TextEncoder();
	const parts: string[] = [];
	let current = "";
	let currentBytes = 0;

	for (const char of line) {
		const bytes = encoder.encode(char).length;
		// Continuation lines start with a space, which counts toward the limit.
		const limit = parts.length === 0 ? 75 : 74;
		if (currentBytes + bytes > limit) {
			parts.push(current);
			current = "";
			currentBytes = 0;
		}
		current += char;
		currentBytes += bytes;
	}
	parts.push(current);

	return parts.join("\r\n ");
};

/** A single-event .ics file. */
export function buildICS(
	event: CalendarEvent,
	site: URL | string,
	now = new Date(),
) {
	const { start, end } = getRange(event);
	const location = formatEventLocation(event);
	const host = new URL(site).hostname.replace(/^www\./, "");

	const lines = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//NSAE//Events//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:PUBLISH",
		"BEGIN:VEVENT",
		`UID:${event.slug}@${host}`,
		`DTSTAMP:${toCalendarDate(now)}`,
		`DTSTART:${toCalendarDate(start)}`,
		`DTEND:${toCalendarDate(end)}`,
		`SUMMARY:${escapeText(event.title)}`,
		`DESCRIPTION:${escapeText(describe(event, site))}`,
		location && `LOCATION:${escapeText(location)}`,
		`URL:${eventUrl(event, site)}`,
		"END:VEVENT",
		"END:VCALENDAR",
	].filter((line): line is string => Boolean(line));

	return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

/** "Add to Google Calendar" link with the event pre-filled. */
export function googleCalendarUrl(event: CalendarEvent, site: URL | string) {
	const { start, end } = getRange(event);
	const params = new URLSearchParams({
		action: "TEMPLATE",
		text: event.title,
		dates: `${toCalendarDate(start)}/${toCalendarDate(end)}`,
		details: describe(event, site),
		location: formatEventLocation(event),
	});
	return `https://calendar.google.com/calendar/render?${params}`;
}
