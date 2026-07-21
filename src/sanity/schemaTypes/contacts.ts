import { defineField, defineType } from "sanity";

const SOCIAL_PLATFORMS = [
  "linkedin",
  "x",
  "facebook",
  "youtube",
  "bluesky",
  "github",
] as const;

export const contactsType = defineType({
  name: "contacts",
  title: "Contacts Information",
  type: "document",
  fields: [
    defineField({
      name: "address",
      title: "Address",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "addressLink",
      title: "Google Maps / Address URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({
          scheme: ["http", "https"],
        }),
    }),
    defineField({
      name: "phoneNumbers",
      title: "Phone Numbers",
      type: "array",
      of: [{ type: "string" }],
    }),
    defineField({
      name: "emails",
      title: "Email Addresses",
      type: "array",
      of: [
        {
          type: "string",
          validation: (Rule) => Rule.email(),
        },
      ],
    }),
    defineField({
      name: "socials",
      title: "Social Media Links",
      type: "object",
      fields: SOCIAL_PLATFORMS.map((platform) =>
        defineField({
          name: platform,
          title: platform.charAt(0).toUpperCase() + platform.slice(1),
          type: "object",
          fields: [
            defineField({
              name: "handle",
              title: "Handle / Username",
              type: "string",
            }),
            defineField({
              name: "link",
              title: "Profile Link",
              type: "url",
              validation: (Rule) =>
                Rule.uri({
                  scheme: ["http", "https"],
                }),
            }),
          ],
        }),
      ),
    }),
  ],
  preview: {
    prepare() {
      return {
        title: "Contact & Social Details",
      };
    },
  },
});
