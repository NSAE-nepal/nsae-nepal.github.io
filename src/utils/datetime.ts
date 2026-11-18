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
