import { CLOSING_SOON_DAYS } from "@/lib/opportunities";

export const formatDate = (
	date: Date | undefined,
	options: Intl.DateTimeFormatOptions = {},
) => {
	if (!date) return "";
	return date.toLocaleDateString("en-US", {
		timeZone: "Asia/Kathmandu",
		month: "short",
		day: "numeric",
		year: "numeric",
		...options,
	});
};

export const formatTime = (date: Date | undefined) => {
	if (!date) return "";
	return date.toLocaleTimeString("en-US", {
		timeZone: "Asia/Kathmandu",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	});
};

type EventDates = {
	eventStart: string;
	eventEnd?: string;
	registrationLink?: string;
	registrationDeadline?: string;
};

/**
 * Registration/ended state for an event, evaluated at build time.
 * The daily scheduled deploy keeps this current on the static site.
 */
export const getEventStatus = (event: EventDates, now = new Date()) => {
	const endsAt = new Date(event.eventEnd ?? event.eventStart);
	const registrationClosesAt = event.registrationDeadline
		? new Date(event.registrationDeadline)
		: endsAt;

	return {
		hasEnded: endsAt < now,
		isRegistrationOpen:
			Boolean(event.registrationLink) && now < registrationClosesAt,
	};
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight UTC of the calendar day `date` falls on in Nepal, for day maths. */
const nepalDay = (date: Date) =>
	Date.parse(date.toLocaleDateString("en-CA", { timeZone: "Asia/Kathmandu" }));

type OpportunityDates = {
	status?: "open" | "closed";
	closingDate?: string;
};

/**
 * Open/closed state of a careers item, evaluated at build time (the daily
 * deploy keeps it current). An item stays open through its whole closing day
 * in Nepal time.
 */
export const getOpportunityStatus = (
	item: OpportunityDates,
	now = new Date(),
	closingSoonDays = CLOSING_SOON_DAYS,
) => {
	const today = nepalDay(now);
	const closesOn = item.closingDate
		? nepalDay(new Date(item.closingDate))
		: null;
	const hasExpired = closesOn !== null && closesOn < today;
	const isClosed = item.status === "closed" || hasExpired;
	const daysLeft =
		closesOn !== null && !isClosed
			? Math.round((closesOn - today) / DAY_MS)
			: null;

	return {
		isClosed,
		isClosingSoon: daysLeft !== null && daysLeft <= closingSoonDays,
	};
};
