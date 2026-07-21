import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schema } from "./src/sanity/schemaTypes";

const SINGLETON_TYPES = ["contacts", "donate", "faq", "home"];

export default defineConfig({
	projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
	dataset: import.meta.env.PUBLIC_SANITY_DATASET,
	plugins: [
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

						...S.documentTypeListItems().filter(
							(listItem) => !SINGLETON_TYPES.includes(listItem.getId() || ""),
						),
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
