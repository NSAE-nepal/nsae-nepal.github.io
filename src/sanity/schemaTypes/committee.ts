import { defineField, defineType } from "sanity";

const UNIQUE_POSITIONS = [
	"president",
	"vice-president",
	"secretary",
	"joint-secretary",
	"treasurer",
] as const;

export const committeeType = defineType({
	name: "committee",
	title: "Committee",
	type: "document",
	fields: [
		defineField({
			name: "title",
			title: "Committee Title",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "committeeIteration",
			title: "Committee Iteration",
			type: "number",
			description: "Iteration number (e.g. 1, 2, 3...)",
			validation: (Rule) =>
				Rule.required()
					.integer()
					.min(1)
					.max(40)
					.error("Committee iteration must be an integer between 1 and 40."),
		}),

		defineField({
			name: "committeeMembers",
			title: "Committee Members",
			type: "array",
			validation: (Rule) =>
				Rule.required().custom((members) => {
					if (!Array.isArray(members)) return "Committee members are required.";

					const errors: string[] = [];
					for (const pos of UNIQUE_POSITIONS) {
						const count = members.filter(
							(m) => (m as { position?: string })?.position === pos,
						).length;

						if (count === 0) {
							errors.push(
								`Committee must have exactly one '${pos}'. None found.`,
							);
						} else if (count > 1) {
							errors.push(
								`Committee can only have one '${pos}'. Found ${count}.`,
							);
						}
					}

					return errors.length > 0 ? errors.join("\n") : true;
				}),
			of: [
				{
					type: "object",
					name: "committeeMember",
					title: "Committee Member",
					fields: [
						defineField({
							name: "name",
							title: "Full Name",
							type: "string",
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "position",
							title: "Position",
							type: "string",
							options: {
								list: [
									{ title: "President", value: "president" },
									{ title: "Vice-President", value: "vice-president" },
									{ title: "Secretary", value: "secretary" },
									{ title: "Joint-Secretary", value: "joint-secretary" },
									{ title: "Treasurer", value: "treasurer" },
									{ title: "Member", value: "member" },
									{ title: "Corporate Member", value: "corporate-member" },
								],
							},
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "membership",
							title: "Membership Status",
							type: "string",
							options: {
								list: [
									{ title: "Life Member", value: "life-member" },
									{ title: "General Member", value: "general-member" },
									{ title: "Honorary Member", value: "honorary-member" },
									{ title: "Student Member", value: "student-member" },
									{ title: "Associate Member", value: "associate-member" },
									{ title: "Corporate Member", value: "corporate-member" },
								],
							},
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
							name: "profileImage",
							title: "Profile Image",
							type: "image",
							options: { hotspot: true },
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
							name: "neaRegNo",
							title: "NEA Registration No.",
							type: "string",
						}),
						defineField({
							name: "necRegNo",
							title: "NEC Registration No.",
							type: "string",
						}),
					],
					preview: {
						select: {
							title: "name",
							position: "position",
							media: "profileImage",
						},
						prepare({ title, position, media }) {
							return {
								title: title || "Unnamed Member",
								subtitle: position
									? position.replace("-", " ").toUpperCase()
									: "",
								media,
							};
						},
					},
				},
			],
		}),
	],
	preview: {
		select: {
			title: "title",
			iteration: "committeeIteration",
			members: "committeeMembers",
		},
		prepare({ title, iteration, members }) {
			const count = Array.isArray(members) ? members.length : 0;
			return {
				title: title || "Untitled Committee",
				subtitle: `Iteration #${iteration || "N/A"} • ${count} members`,
			};
		},
	},
});
