import { defineField, defineType } from "sanity";

export const authorType = defineType({
  name: "author",
  title: "Author",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "slug",
      options: {
        source: "name",
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "prefix",
      title: "Prefix",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Er.", value: "er" },
          { title: "Dr.", value: "dr" },
          { title: "Prof. Dr.", value: "prof_dr" },
          { title: "Mr.", value: "mr" },
          { title: "Ms.", value: "ms" },
        ],
      },
    }),
    defineField({
      name: "position",
      title: "Position / Role",
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
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alternative Text",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "neaRegNo",
      title: "NEA Registration No.",
      type: "string",
    }),
    defineField({
      name: "necRegNo",
      title: "NEC Registration No.",
      type: "string",
    }),
    defineField({
      name: "bio",
      title: "Bio",
      type: "text", // Use "array" with "block" if you prefer rich text formatting
      rows: 4,
    }),
    defineField({
      name: "portfolio",
      title: "Portfolio URL",
      type: "url",
      validation: (Rule) =>
        Rule.uri({
          scheme: ["http", "https"],
        }),
    }),
    defineField({
      name: "socials",
      title: "Social Links",
      type: "object",
      fields: [
        ...["linkedin", "x", "facebook", "youtube", "bluesky"].map((platform) =>
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
      ],
    }),
  ],
  preview: {
    select: {
      title: "name",
      subtitle: "position",
      media: "profileImage",
    },
  },
});
