import { codeInput } from "@sanity/code-input";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schema } from "./src/sanity/schemaTypes";

const SINGLETON_TYPES = ["contacts", "donate", "faq", "home"];
// Grouped under their own desk items below instead of the generic list.
const GROUPED_TYPES = ["posts", "course", "lesson", "resource"];

export default defineConfig({
	projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
	dataset: import.meta.env.PUBLIC_SANITY_DATASET,
	plugins: [
		codeInput(),
		structureTool({
			structure: (S) =>
				S.list()
					.title("Content")
					.items([
						S.listItem()
							.title("Contacts Information")
							.id("contacts")
							.child(
								S.document().schemaType("contacts").documentId("contacts"),
							),

						S.listItem()
							.title("Donate Page")
							.id("donate")
							.child(S.document().schemaType("donate").documentId("donate")),

						S.listItem()
							.title("FAQ Section")
							.id("faq")
							.child(S.document().schemaType("faq").documentId("faq")),

						S.listItem()
							.title("Home Page")
							.id("home")
							.child(S.document().schemaType("home").documentId("home")),

						S.divider(),

						S.listItem()
							.title("Posts")
							.child(
								S.list()
									.title("Posts")
									.items([
										S.listItem()
											.title("Blogs")
											.child(
												S.documentList()
													.title("Blog Posts")
													.filter('_type == "posts" && type == "blog"'),
											),
										S.listItem()
											.title("Notices")
											.child(
												S.documentList()
													.title("Notices")
													.filter('_type == "posts" && type == "notice"'),
											),
										S.listItem()
											.title("All Posts")
											.child(S.documentTypeList("posts").title("All Posts")),
									]),
							),

						S.listItem()
							.title("Learning & Resources")
							.child(
								S.list()
									.title("Learning & Resources")
									.items([
										S.documentTypeListItem("course").title("Courses"),
										S.documentTypeListItem("lesson").title("All lessons"),
										S.listItem()
											.title("Lessons not in a course")
											.child(
												S.documentList()
													.title("Lessons not in a course")
													.filter(
														'_type == "lesson" && !(_id in *[_type == "course"].modules[].lessons[]._ref)',
													),
											),
										S.divider(),
										S.documentTypeListItem("resource").title(
											"Resource library",
										),
									]),
							),

						...S.documentTypeListItems().filter((listItem) => {
							const id = listItem.getId() || "";
							return (
								!SINGLETON_TYPES.includes(id) && !GROUPED_TYPES.includes(id)
							);
						}),
					]),
		}),
	],
	schema: {
		...schema,
		templates: (templates) =>
			templates.filter(
				({ schemaType }) => !SINGLETON_TYPES.includes(schemaType),
			),
	},
	document: {
		actions: (input, context) => {
			if (SINGLETON_TYPES.includes(context.schemaType)) {
				return input.filter(
					({ action }) =>
						action && !["delete", "duplicate", "unpublish"].includes(action),
				);
			}
			return input;
		},
	},
});
