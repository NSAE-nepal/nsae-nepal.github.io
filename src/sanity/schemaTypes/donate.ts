import { defineField, defineType } from "sanity";

export const donateType = defineType({
	name: "donate",
	title: "Donate Page",
	type: "document",
	fields: [
		defineField({
			name: "bankDetails",
			title: "Bank Details",
			type: "object",
			validation: (Rule) => Rule.required(),
			fields: [
				defineField({
					name: "bankName",
					title: "Bank Name",
					type: "string",
					validation: (Rule) => Rule.required(),
				}),
				defineField({
					name: "accountName",
					title: "Account Name",
					type: "string",
					validation: (Rule) => Rule.required(),
				}),
				defineField({
					name: "accountNumber",
					title: "Account Number",
					type: "string",
					validation: (Rule) => Rule.required(),
				}),
				defineField({
					name: "branch",
					title: "Branch",
					type: "string",
					validation: (Rule) => Rule.required(),
				}),
				defineField({
					name: "swift",
					title: "SWIFT / BIC Code",
					type: "string",
				}),
				defineField({
					name: "accountQRCode",
					title: "Account QR Code Image",
					type: "image",
					validation: (Rule) => Rule.required(),
				}),
			],
		}),
	],
	preview: {
		prepare() {
			return {
				title: "Donate Page Content",
			};
		},
	},
});
