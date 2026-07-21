import { defineField, defineType } from "sanity";

export const quizType = defineType({
	name: "quizzes",
	title: "Quizzes",
	type: "document",
	fields: [
		defineField({
			name: "title",
			title: "Quiz Title",
			type: "string",
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "slug",
			title: "Slug",
			type: "slug",
			options: {
				source: "title",
				maxLength: 96,
				isUnique: (value, context) => context.defaultIsUnique(value, context),
			},
			validation: (Rule) => Rule.required(),
		}),
		defineField({
			name: "settings",
			title: "Quiz Settings",
			type: "object",
			validation: (Rule) => Rule.required(),
			fields: [
				defineField({
					name: "shuffleQuestions",
					title: "Shuffle Questions",
					type: "boolean",
					initialValue: false,
				}),
				defineField({
					name: "shuffleOptions",
					title: "Shuffle Options",
					type: "boolean",
					initialValue: false,
				}),
				defineField({
					name: "showExplanations",
					title: "Show Explanations",
					type: "boolean",
					initialValue: true,
				}),
				defineField({
					name: "passingScore",
					title: "Passing Score",
					type: "number",
					validation: (Rule) => Rule.required().min(0).max(100),
				}),
				defineField({
					name: "negativeMarkingPercentage",
					title: "Negative Marking Percentage (%)",
					type: "number",
					description:
						"Optional. If set, all questions must have the exact same point value.",
					validation: (Rule) => Rule.integer().min(0).max(100),
				}),
			],
		}),
		defineField({
			name: "questions",
			title: "Questions",
			type: "array",
			validation: (Rule) =>
				Rule.required()
					.min(1)
					.custom((questions, context) => {
						const doc = context.document as
							| { settings?: { negativeMarkingPercentage?: number } }
							| undefined;

						const negativeMarking = doc?.settings?.negativeMarkingPercentage;

						if (
							negativeMarking !== undefined &&
							negativeMarking !== null &&
							Array.isArray(questions) &&
							questions.length > 0
						) {
							const firstPoints = (questions[0] as { points?: number })?.points;
							const allEqual = questions.every(
								(q) => (q as { points?: number })?.points === firstPoints,
							);

							if (!allEqual) {
								return "When negative marking is specified, all questions must have the exact same point value.";
							}
						}

						return true;
					}),
			of: [
				{
					type: "object",
					name: "questionItem",
					title: "Question",
					fields: [
						defineField({
							name: "id",
							title: "Question ID",
							type: "string",
							description: "Unique identifier (e.g. q1, q2)",
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "type",
							title: "Question Type",
							type: "string",
							options: {
								list: [
									{ title: "Single Select", value: "single-select" },
									{ title: "Multi Select", value: "multi-select" },
								],
								layout: "radio",
							},
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "question",
							title: "Question Text",
							type: "text",
							rows: 3,
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: "points",
							title: "Points",
							type: "number",
							validation: (Rule) => Rule.required().min(0),
						}),
						defineField({
							name: "required",
							title: "Is Required?",
							type: "boolean",
							initialValue: false,
						}),
						defineField({
							name: "options",
							title: "Options",
							type: "array",
							validation: (Rule) => Rule.required().min(2),
							of: [
								{
									type: "object",
									name: "optionItem",
									title: "Option",
									fields: [
										defineField({
											name: "id",
											title: "Option ID",
											type: "string",
											description: "e.g. opt-1, opt-a",
											validation: (Rule) => Rule.required(),
										}),
										defineField({
											name: "text",
											title: "Option Text",
											type: "string",
											validation: (Rule) => Rule.required(),
										}),
									],
									preview: {
										select: {
											id: "id",
											text: "text",
										},
										prepare({ id, text }) {
											return {
												title: text || "Untitled Option",
												subtitle: id ? `ID: ${id}` : "",
											};
										},
									},
								},
							],
						}),
						defineField({
							name: "correctOptionIds",
							title: "Correct Option IDs",
							type: "array",
							of: [{ type: "string" }],
							description:
								"List of Option IDs that correspond to the correct answer(s)",
							validation: (Rule) =>
								Rule.required()
									.min(1)
									.custom((correctOptionIds, context) => {
										if (!correctOptionIds || !Array.isArray(correctOptionIds)) {
											return true;
										}

										// context.parent gives access to the parent "questionItem" object
										const parent = context.parent as
											| {
													type?: string;
													options?: Array<{ id?: string }>;
											  }
											| undefined;

										const questionType = parent?.type;
										const options = parent?.options || [];

										// 1. Enforce single-select constraint
										if (
											questionType === "single-select" &&
											correctOptionIds.length > 1
										) {
											return "Single-select questions can only have exactly 1 correct option.";
										}

										// 2. Ensure all correctOptionIds exist in the options array
										const validOptionIds = new Set(
											options
												.map((opt) => opt?.id)
												.filter((id): id is string => Boolean(id)),
										);

										const invalidIds = correctOptionIds.filter(
											(id) => !validOptionIds.has(id),
										);

										if (invalidIds.length > 0) {
											return `The following ID(s) do not match any option: ${invalidIds.join(", ")}`;
										}

										return true;
									}),
						}),
						defineField({
							name: "hint",
							title: "Hint",
							type: "string",
						}),
						defineField({
							name: "explanation",
							title: "Explanation",
							type: "text",
							rows: 3,
						}),
					],
					preview: {
						select: {
							title: "question",
							type: "type",
							points: "points",
						},
						prepare({ title, type, points }) {
							return {
								title: title || "Untitled Question",
								subtitle: `${type || "single-select"} • ${points ?? 0} pts`,
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
			questions: "questions",
		},
		prepare({ title, questions }) {
			const count = Array.isArray(questions) ? questions.length : 0;
			return {
				title: title || "Untitled Quiz",
				subtitle: `${count} question${count === 1 ? "" : "s"}`,
			};
		},
	},
});
