import { defineField, defineType } from "sanity";

export const scheduleItemType = defineType({
	name: "scheduleItem",
	title: "Schedule Item",
	type: "object",
	fields: [
		defineField({
			name: "day",
			title: "Day Date",
			type: "date",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "dayLabel",
			title: "Day Label",
			type: "string",
			description: "e.g., 'Day 1', 'Morning Session'",
		}),
		defineField({
			name: "sessionTitle",
			title: "Session Title",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "startTime",
			title: "Start Time",
			type: "datetime",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "endTime",
			title: "End Time",
			type: "datetime",
			validation: (Rule) =>
				Rule.required().custom((endTime, context) => {
					const doc = context.parent as { startTime?: string };
					if (endTime && doc?.startTime) {
						if (new Date(endTime) <= new Date(doc.startTime)) {
							return "Session end time must be after start time";
						}
					}
					return true;
				}),
		}),
		defineField({
			name: "description",
			title: "Description",
			type: "text",
			rows: 2,
		}),
		defineField({
			name: "speaker",
			title: "Speaker Name",
			type: "string",
		}),
		defineField({
			name: "location",
			title: "Room / Location",
			type: "string",
		}),
	],
	preview: {
		select: {
			title: "sessionTitle",
			start: "startTime",
			speaker: "speaker",
		},
		prepare({ title, start, speaker }) {
			const timeStr = start
				? new Date(start).toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})
				: "";
			return {
				title: title || "Untitled Session",
				subtitle: `${timeStr} ${speaker ? `• ${speaker}` : ""}`,
			};
		},
	},
});

export const locationDetailsType = defineType({
	name: "locationDetails",
	title: "Location Details",
	type: "object",
	fieldsets: [
		{
			name: "venueAndMap",
			options: { columns: 2 },
		},
		{
			name: "cityAndState",
			options: { columns: 2 },
		},
		{
			name: "meetingCredentials",
			options: { columns: 2 },
		},
	],
	fields: [
		defineField({
			name: "type",
			title: "Location Type",
			type: "string",
			options: {
				list: [
					{ title: "In Person", value: "in_person" },
					{ title: "Online", value: "online" },
					{ title: "Hybrid", value: "hybrid" },
				],
				layout: "radio",
			},
			initialValue: "in_person",
		}),

		defineField({
			name: "venueName",
			title: "Venue Name",
			type: "string",
			fieldset: "venueAndMap",
			hidden: ({ parent }) => parent?.type === "online",
			validation: (Rule) =>
				Rule.custom((venueName, context) => {
					const doc = context.parent as { type?: string };
					if (
						(doc?.type === "in_person" || doc?.type === "hybrid") &&
						!venueName
					) {
						return "Venue Name is required for In-Person or Hybrid events.";
					}
					return true;
				}),
		}),
		defineField({
			name: "mapsLink",
			title: "Google Maps Link",
			type: "url",
			fieldset: "venueAndMap",
			hidden: ({ parent }) => parent?.type === "online",
			validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
		}),
		defineField({
			name: "address",
			title: "Street Address",
			type: "string",
			hidden: ({ parent }) => parent?.type === "online",
		}),
		defineField({
			name: "city",
			title: "City",
			type: "string",
			fieldset: "cityAndState",
			hidden: ({ parent }) => parent?.type === "online",
		}),
		defineField({
			name: "state",
			title: "State / Province",
			type: "string",
			fieldset: "cityAndState",
			hidden: ({ parent }) => parent?.type === "online",
		}),

		defineField({
			name: "meetingUrl",
			title: "Meeting URL",
			type: "url",
			hidden: ({ parent }) => parent?.type === "in_person",
			validation: (Rule) =>
				Rule.uri({ scheme: ["http", "https"] }).custom(
					(meetingUrl, context) => {
						const doc = context.parent as { type?: string };
						if (
							(doc?.type === "online" || doc?.type === "hybrid") &&
							!meetingUrl
						) {
							return "Meeting URL is recommended for Online or Hybrid events.";
						}
						return true;
					},
				),
		}),
		defineField({
			name: "meetingId",
			title: "Meeting ID",
			type: "string",
			fieldset: "meetingCredentials",
			hidden: ({ parent }) => parent?.type === "in_person",
		}),
		defineField({
			name: "meetingPassword",
			title: "Meeting Password",
			type: "string",
			fieldset: "meetingCredentials",
			hidden: ({ parent }) => parent?.type === "in_person",
		}),
	],
});

export const contactPersonType = defineType({
	name: "contactPerson",
	title: "Contact Person",
	type: "object",
	fields: [
		defineField({
			name: "name",
			title: "Name",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "role",
			title: "Role / Title",
			type: "string",
		}),
		defineField({
			name: "email",
			title: "Email Address",
			type: "string",
			validation: (Rule) => Rule.required().email(),
		}),
		defineField({
			name: "phone",
			title: "Phone Number",
			type: "string",
		}),
		defineField({
			name: "isPrimary",
			title: "Primary Contact?",
			type: "boolean",
			initialValue: false,
		}),
	],
	preview: {
		select: {
			title: "name",
			role: "role",
			isPrimary: "isPrimary",
		},
		prepare({ title, role, isPrimary }) {
			return {
				title: `${isPrimary ? "★ " : ""}${title || "Unnamed Contact"}`,
				subtitle: role || "",
			};
		},
	},
});

const EVENT_ROLES = [
	{ title: "Speaker", value: "speaker" },
	{ title: "Panelist", value: "panelist" },
	{ title: "Moderator", value: "moderator" },
	{ title: "Guest", value: "guest" },
	{ title: "Instructor", value: "instructor" },
];

export const instructorNsaeMemberType = defineType({
	name: "instructorNsaeMember",
	title: "NSAE Member Instructor",
	type: "object",
	fields: [
		defineField({
			name: "eventRole",
			title: "Event Role",
			type: "string",
			options: { list: EVENT_ROLES },
			initialValue: "instructor",
		}),
		defineField({
			name: "nsaeMember",
			title: "NSAE Member",
			type: "reference",
			to: [{ type: "author" }],
			validation: (Rule) => Rule.required(),
		}),
	],
	preview: {
		select: {
			title: "nsaeMember.name",
			role: "eventRole",
			media: "nsaeMember.image",
		},
		prepare({ title, role, media }) {
			return {
				title: title || "Unnamed NSAE Member",
				subtitle: `Role: ${role?.toUpperCase() || "INSTRUCTOR"}`,
				media,
			};
		},
	},
});

export const instructorExternalType = defineType({
	name: "instructorExternal",
	title: "External Instructor",
	type: "object",
	fields: [
		defineField({
			name: "eventRole",
			title: "Event Role",
			type: "string",
			options: { list: EVENT_ROLES },
			initialValue: "instructor",
		}),
		defineField({
			name: "name",
			title: "Name",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "position",
			title: "Position",
			type: "string",
		}),
		defineField({
			name: "company",
			title: "Company",
			type: "string",
		}),
		defineField({
			name: "profileImage",
			title: "Profile Image",
			type: "image",
			options: { hotspot: true },
		}),
	],
	preview: {
		select: {
			title: "name",
			company: "company",
			role: "eventRole",
			media: "profileImage",
		},
		prepare({ title, company, role, media }) {
			return {
				title: title || "Unnamed External Person",
				subtitle: `${company ? `${company} • ` : ""}${role?.toUpperCase() || "INSTRUCTOR"}`,
				media,
			};
		},
	},
});

export const instructorOrganizationType = defineType({
	name: "instructorOrganization",
	title: "Organization Partner / Instructor",
	type: "object",
	fields: [
		defineField({
			name: "organizationName",
			title: "Organization Name",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "website",
			title: "Website",
			type: "url",
			validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
		}),
		defineField({
			name: "logo",
			title: "Logo",
			type: "image",
			options: { hotspot: true },
		}),
		defineField({
			name: "representatives",
			title: "Representatives",
			type: "array",
			of: [
				{
					type: "object",
					name: "representative",
					fields: [
						defineField({
							name: "eventRole",
							title: "Event Role",
							type: "string",
							options: { list: EVENT_ROLES },
							initialValue: "instructor",
						}),
						defineField({
							name: "name",
							title: "Name",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "position",
							title: "Position",
							type: "string",
						}),
						defineField({
							name: "profileImage",
							title: "Profile Image",
							type: "image",
							options: { hotspot: true },
						}),
					],
				},
			],
		}),
	],
	preview: {
		select: {
			title: "organizationName",
			media: "logo",
		},
		prepare({ title, media }) {
			return {
				title: title || "Unnamed Organization",
				subtitle: "Organization Partner",
				media,
			};
		},
	},
});

export const eventType = defineType({
	name: "events",
	title: "Events",
	type: "document",
	groups: [
		{ name: "general", title: "General Info", default: true },
		{ name: "datetime", title: "Dates & Location" },
		{ name: "program", title: "Schedule & Speakers" },
		{ name: "registration", title: "Registration & Contact" },
		{ name: "content", title: "Description" },
	],
	fieldsets: [
		{
			name: "eventTimes",
			title: "Event Timing",
			options: { columns: 2 },
		},
	],
	fields: [
		defineField({
			name: "title",
			title: "Title",
			type: "string",
			group: "general",
			validation: (Rule) => Rule.required().max(150),
		}),
		defineField({
			name: "slug",
			title: "Slug",
			type: "slug",
			group: "general",
			options: {
				source: "title",
				maxLength: 96,
				isUnique: (value, context) => context.defaultIsUnique(value, context),
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "subtitle",
			title: "Subtitle",
			type: "string",
			group: "general",
		}),
		defineField({
			name: "eventType",
			title: "Event Type",
			type: "string",
			group: "general",
			options: {
				list: [
					{ title: "Training", value: "training" },
					{ title: "Workshop", value: "workshop" },
					{ title: "Expo", value: "expo" },
					{ title: "Competitions", value: "competitions" },
					{ title: "Conference", value: "conference" },
					{ title: "Seminars / Webinars", value: "seminars_webinars" },
					{ title: "Others", value: "others" },
				],
			},
			initialValue: "training",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "coverImage",
			title: "Cover Image",
			type: "image",
			group: "general",
			options: { hotspot: true },
			validation: (Rule) => Rule.required(),
			fields: [
				defineField({
					name: "alt",
					title: "Alternative Text",
					type: "string",
				}),
			],
		}),
		defineField({
			name: "publishedAt",
			title: "Published at Date",
			type: "datetime",
			group: "general",
		}),

		defineField({
			name: "eventStart",
			title: "Event Start Date & Time",
			type: "datetime",
			group: "datetime",
			fieldset: "eventTimes",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "eventEnd",
			title: "Event End Date & Time",
			type: "datetime",
			fieldset: "eventTimes",
			group: "datetime",
			validation: (Rule) =>
				Rule.required().custom((eventEnd, context) => {
					const doc = context.document as { eventStart?: string };
					if (eventEnd && doc?.eventStart) {
						if (new Date(eventEnd) <= new Date(doc.eventStart)) {
							return "Event end date must be after the start date.";
						}
					}
					return true;
				}),
		}),
		defineField({
			name: "location",
			title: "Location Details",
			type: "locationDetails",
			group: "datetime",
		}),

		defineField({
			name: "eventSchedule",
			title: "Event Schedule",
			type: "array",
			group: "program",
			of: [{ type: "scheduleItem" }],
		}),
		defineField({
			name: "instructors",
			title: "Instructors & Guests",
			type: "array",
			group: "program",
			description:
				"Add NSAE Members, External People, or Partner Organizations",
			of: [
				{ type: "instructorNsaeMember" },
				{ type: "instructorExternal" },
				{ type: "instructorOrganization" },
			],
		}),

		defineField({
			name: "contactPersons",
			title: "Contact Persons",
			type: "array",
			group: "registration",
			of: [{ type: "contactPerson" }],
		}),
		defineField({
			name: "registrationLink",
			title: "Registration URL",
			type: "url",
			group: "registration",
			validation: (Rule) => Rule.uri({ scheme: ["http", "https"] }),
		}),
		defineField({
			name: "registrationDeadline",
			title: "Registration Deadline",
			type: "datetime",
			group: "registration",
			validation: (Rule) =>
				Rule.custom((deadline, context) => {
					const doc = context.document as { eventStart?: string };
					if (deadline && doc?.eventStart) {
						if (new Date(deadline) > new Date(doc.eventStart)) {
							return "Registration deadline cannot be after the event start date.";
						}
					}
					return true;
				}),
		}),

		defineField({
			name: "body",
			title: "Event Description & Content",
			type: "array",
			group: "content",
			of: [{ type: "block" }, { type: "image", options: { hotspot: true } }],
		}),
	],
	preview: {
		select: {
			title: "title",
			start: "eventStart",
			type: "eventType",
			media: "coverImage",
		},
		prepare({ title, start, type, media }) {
			const dateStr = start ? new Date(start).toLocaleDateString() : "No Date";
			return {
				title: title || "Untitled Event",
				subtitle: `${type ? type.toUpperCase() : "EVENT"} • ${dateStr}`,
				media,
			};
		},
	},
});
