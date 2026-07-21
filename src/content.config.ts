import { defineCollection, reference } from "astro:content";
import { z } from "astro/zod";
import { glob, file } from "astro/loaders";

// === Blog Collection ===
const postsCollection = defineCollection({
  loader: glob({ base: "./src/content/posts", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      type: z.enum(["blog", "news", "notice"]).default("blog"),
      description: z.string().optional(),
      pubDate: z.coerce.date(),
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
      tags: z.array(z.string()).optional(),
      pagefind: z.boolean().default(true),
      draft: z.boolean().default(false),
      featured: z.boolean().default(false),
      categories: z.array(reference("categories")).optional(),
      authors: z.array(reference("authors")).optional(),
      relatedPosts: z.array(reference("posts")).optional(),
    }),
});

// === Authors Collection ===
const authorsCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*.json", base: "./src/content/authors" }),
  schema: ({ image }) =>
    z.object({
      name: z.string(),
      position: z.string().optional(),
      prefix: z.array(z.enum(["er", "dr", "prof_dr", "mr", "ms"])).optional(),
      profileImage: z.union([image(), z.string().url()]).optional(),
      company: z.string().optional(),
      neaRegNo: z.string().optional(),
      necRegNo: z.string().optional(),
      bio: z.string().optional(),
      portfolio: z.string().url().optional(),
      socials: z
        .object({
          linkedin: z
            .object({
              handle: z.string().optional(),
              link: z.string().url(),
            })
            .optional(),
          x: z
            .object({
              handle: z.string().optional(),
              link: z.string().url(),
            })
            .optional(),
          facebook: z
            .object({
              handle: z.string().optional(),
              link: z.string().url(),
            })
            .optional(),
          youtube: z
            .object({
              handle: z.string().optional(),
              link: z.string().url(),
            })
            .optional(),
          bluesky: z
            .object({
              handle: z.string().optional(),
              link: z.string().url(),
            })
            .optional(),
        })
        .optional(),
    }),
});

const committeeCollection = defineCollection({
  loader: glob({ pattern: "**/[^_]*.json", base: "./src/content/committee" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      draft: z.boolean().default(false),
      committeeIteration: z.number().int().min(1).max(40),
      committeeMembers: z
        .array(
          z.object({
            position: z.enum([
              "president",
              "vice-president",
              "secretary",
              "joint-secretary",
              "treasurer",
              "member",
              "corporate-member",
            ]),
            membership: z
              .enum([
                "life-member",
                "general-member",
                "honorary-member",
                "student-member",
                "associate-member",
                "corporate-member",
              ])
              .optional(),
            name: z.string(),
            prefix: z
              .array(z.enum(["er", "dr", "prof_dr", "mr", "ms"]))
              .optional(),
            profileImage: image().optional(),
            portfolio: z.string().url().optional(),
            neaRegNo: z.string().optional(),
            necRegNo: z.string().optional(),
          }),
        )
        .superRefine((members, ctx) => {
          const uniquePositions = [
            "president",
            "vice-president",
            "secretary",
            "joint-secretary",
            "treasurer",
          ];

          for (const pos of uniquePositions) {
            const count = members.filter((m) => m.position === pos).length;

            if (count === 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Committee must have exactly one '${pos}'. None found.`,
              });
            } else if (count > 1) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Committee can only have one '${pos}'. Found ${count}.`,
              });
            }
          }
        }),
    }),
});

// === FAQ Collection ===
const faqCollection = defineCollection({
  loader: file("src/content/faq.json"),
  schema: z.object({
    id: z.string(),
    question: z.string(),
    answer: z.string(),
  }),
});

const categoriesCollection = defineCollection({
  loader: file("src/content/categories.json"),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string().optional(),
  }),
});

const donateCollection = defineCollection({
  loader: file("src/content/donate.json"),
  schema: ({ image }) =>
    z.object({
      id: z.string(),
      heroImage: z.string(),

      impactAreas: z.array(
        z.object({
          title: z.string(),
          icon: z.string(),
          description: z.string(),
        }),
      ),
      bankDetails: z.object({
        bankName: z.string(),
        accountName: z.string(),
        accountNumber: z.string(),
        branch: z.string(),
        swift: z.string().optional(),
        accountQRCode: image(),
      }),
    }),
});

// === Contacts Collection ===
const contactsCollection = defineCollection({
  loader: file("src/content/contacts.json"),
  schema: z.object({
    id: z.string(),
    address: z.string().optional(),
    addressLink: z.string().url().optional(),
    phoneNumbers: z.array(z.string()).optional(),
    emails: z.array(z.string().email()).optional(),
    socials: z
      .object({
        linkedin: z
          .object({
            handle: z.string().optional(),
            link: z.string().url(),
          })
          .optional(),
        x: z
          .object({
            handle: z.string().optional(),
            link: z.string().url(),
          })
          .optional(),
        facebook: z
          .object({
            handle: z.string().optional(),
            link: z.string().url(),
          })
          .optional(),
        youtube: z
          .object({
            handle: z.string().optional(),
            link: z.string().url(),
          })
          .optional(),
        bluesky: z
          .object({
            handle: z.string().optional(),
            link: z.string().url(),
          })
          .optional(),
        github: z
          .object({
            handle: z.string().optional(),
            link: z.string().url(),
          })
          .optional(),
      })
      .optional(),
  }),
});

const careersCollection = defineCollection({
  loader: glob({ base: "./src/content/careers", pattern: "**/*.{md,mdx}" }),
  schema: z
    .object({
      title: z.string().min(1, "Title must not be empty."),
      location: z.string().optional().default("Remote"),
      type: z.enum(["Full-time", "Part-time", "Contract", "Internship"]),
      postedDate: z.date(),
      closingDate: z.date().optional(),
      draft: z.boolean().default(false),
      description: z.string().max(160).optional(),
      status: z.enum(["open", "closed"]).default("open"),
      company: z
        .object({
          name: z.string().min(1, "Company name cannot be empty."),
          logo: z.string().url().optional(),
          website: z.string().url("Must be a valid URL").optional(),
        })
        .optional(),
    })
    .refine(
      (data) => {
        if (data.closingDate) {
          return data.closingDate > data.postedDate;
        }
        return true;
      },
      {
        message: "Closing date must be after the posted date.",
        path: ["closingDate"],
      },
    ),
});

const minutesCollection = defineCollection({
  loader: glob({ base: "./src/content/minutes", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string().min(1, "Title/Topic of the meeting is required."),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    type: z
      .enum([
        "agm",
        "executive",
        "general",
        "emergency",
        "sub-committee",
        "other",
      ])
      .default("general"),

    location: z.string().default("Virtual/Remote"),
    chairperson: z.string().optional(),
    secretary: z.string().optional(),
    attendees: z.array(z.string()).optional(),
    absent: z.array(z.string()).optional(),
    downloadUrl: z.string().url().optional(),
    draft: z.boolean().default(false),
    recordedBy: reference("authors").optional(),
  }),
});

const scheduleItemSchema = z
  .object({
    day: z.coerce.date().optional(),
    dayLabel: z.string().optional(),
    sessionTitle: z.string(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    description: z.string().optional(),
    speaker: z.string().optional(),
    location: z.string().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "Session end time must be after start time",
    path: ["endTime"],
  });

const locationSchema = z.object({
  type: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  venueName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  mapsLink: z.string().url().optional(),
  meetingUrl: z.string().url().optional(),
  meetingPassword: z.string().optional(),
  meetingId: z.string().optional(),
});

const socialsSchema = z.object({
  linkedin: z.string().url().optional(),
  x: z.string().url().optional(),
  facebook: z.string().url().optional(),
  website: z.string().url().optional(),
});

const instructorSchema = (image: any) =>
  z.discriminatedUnion("instructorType", [
    z.object({
      instructorType: z.literal("nsae_member"),
      nsaeMember: reference("authors"),
      eventRole: z
        .enum(["speaker", "panelist", "moderator", "guest", "instructor"])
        .default("instructor"),
    }),

    z.object({
      instructorType: z.literal("external_person"),
      name: z.string(),
      position: z.string().optional(),
      company: z.string().optional(),
      bio: z.string().optional(),
      profileImage: image().optional(),
      socials: socialsSchema.optional(),
      eventRole: z
        .enum(["speaker", "panelist", "moderator", "guest", "instructor"])
        .default("instructor"),
    }),

    z.object({
      instructorType: z.literal("organization"),
      organizationName: z.string(),
      website: z.string().url().optional(),
      logo: image().optional(),
      description: z.string().optional(),
      representatives: z
        .array(
          z.object({
            name: z.string(),
            position: z.string().optional(),
            email: z.string().email().optional(),
            eventRole: z
              .enum(["speaker", "panelist", "moderator", "guest", "instructor"])
              .default("instructor"),
          }),
        )
        .optional(),
    }),
  ]);

const contactPersonSchema = z.object({
  name: z.string(),
  role: z.string().optional(),
  email: z.string().email(),
  phone: z.string().optional(),
  isPrimary: z.boolean().default(false),
});

const bannersCollection = defineCollection({
  loader: glob({ base: "./src/content/banners", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z
      .object({
        backgroundImage: image(),
        contentPosition: z.enum(["left", "right"]).default("left"),
        subtitle: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        buttonText: z.string(),
        buttonLink: z.string().optional().default("#"),
        buttonState: z.enum(["active", "inactive"]).default("active"),
        showBanner: z.boolean().default(true),
        countdownTarget: z.coerce.date().optional(),
        draft: z.boolean().default(true),
      })
      .transform((data) => {
        return {
          ...data,
          variant: data.countdownTarget ? "countdown" : "default",
        };
      }),
});
const eventsCollection = defineCollection({
  loader: glob({ base: "./src/content/events", pattern: "**/*.{md,mdx}" }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().max(150),
        subtitle: z.string().optional(),
        coverImage: image(),
        eventStart: z.coerce.date(),
        eventEnd: z.coerce.date(),
        eventSchedule: z.array(scheduleItemSchema).optional(),
        location: locationSchema.optional(),
        instructors: z.array(instructorSchema(image)).optional(),
        contactPersons: z.array(contactPersonSchema).optional(),
        registrationLink: z.string().url().optional(),
        registrationDeadline: z.coerce.date().optional(),
        eventType: z
          .enum([
            "training",
            "workshop",
            "expo",
            "competitions",
            "conference",
            "seminars_webinars",
            "others",
          ])
          .default("training"),

        publishedOn: z.coerce.date().optional(),
        draft: z.boolean().default(false),
      })
      .superRefine((data, ctx) => {
        if (
          data.eventStart &&
          data.eventEnd &&
          data.eventEnd <= data.eventStart
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Event end date must be after the start date.",
            path: ["eventEnd"],
          });
        }

        if (data.location) {
          const { type, venueName, meetingUrl } = data.location;

          if ((type === "in_person" || type === "hybrid") && !venueName) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: "Venue Name is required for In-Person or Hybrid events.",
              path: ["location", "venueName"],
            });
          }

          if ((type === "online" || type === "hybrid") && !meetingUrl) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "Meeting URL is recommended for Online or Hybrid events.",
              path: ["location", "meetingUrl"],
            });
          }
        }

        if (
          data.registrationDeadline &&
          data.eventStart &&
          data.registrationDeadline > data.eventStart
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "Registration deadline cannot be after the event start date.",
            path: ["registrationDeadline"],
          });
        }
      }),
});

const quizCollection = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/quizzes" }),
  schema: () =>
    z
      .object({
        id: z.string(),
        title: z.string(),
        settings: z.object({
          shuffleQuestions: z.boolean(),
          shuffleOptions: z.boolean(),
          showExplanations: z.boolean(),
          passingScore: z.number().min(0).max(100),
          negativeMarkingPercentage: z
            .number()
            .int()
            .min(0)
            .max(100)
            .optional(),
        }),
        questions: z.array(
          z.object({
            id: z.string(),
            type: z.enum(["single-select", "multi-select"]),
            question: z.string(),
            points: z.number().min(0),
            required: z.boolean().default(false),
            options: z.array(
              z.object({
                id: z.string(),
                text: z.string(),
              }),
            ),
            correctOptionIds: z.array(z.string()),
            hint: z.string().optional(),
            explanation: z.string().optional(),
          }),
        ),
      })
      .refine(
        (data) => {
          // If negative marking is defined and we have at least one question...
          if (
            data.settings.negativeMarkingPercentage !== undefined &&
            data.questions.length > 0
          ) {
            const firstPointValue = data.questions[0].points;

            return data.questions.every((q) => q.points === firstPointValue);
          }

          return true;
        },
        {
          message:
            "When negative marking is specified, all questions must have the exact same point value.",
          path: ["questions"],
        },
      ),
});

export const collections = {
  authors: authorsCollection,
  faq: faqCollection,
  contacts: contactsCollection,
  posts: postsCollection,
  categories: categoriesCollection,
  committees: committeeCollection,
  careers: careersCollection,
  minutes: minutesCollection,
  events: eventsCollection,
  banners: bannersCollection,
  donate: donateCollection,
  quizzes: quizCollection,
};
