import type { SchemaTypeDefinition } from "sanity";
import { authorType } from "./authors";
import { bannerType } from "./banner";
import { blockContentType } from "./blockContent";
import { careerType } from "./careers";
import { categoryType } from "./category";
import { committeeType } from "./committee";
import { contactsType } from "./contacts";
import { donateType } from "./donate";
import {
	contactPersonType,
	eventType,
	instructorExternalType,
	instructorNsaeMemberType,
	instructorOrganizationType,
	locationDetailsType,
	scheduleItemType,
} from "./events";
import { faqType } from "./faq";
import { homeType } from "./homepage";
import { minutesType } from "./minutes";
import { postType } from "./posts";
import { quizType } from "./quiz";

export const schema: { types: SchemaTypeDefinition[] } = {
	types: [
		authorType,
		blockContentType,
		categoryType,
		postType,
		faqType,
		donateType,
		contactsType,
		careerType,
		minutesType,
		quizType,
		committeeType,
		bannerType,
		locationDetailsType,
		instructorExternalType,
		instructorNsaeMemberType,
		instructorOrganizationType,
		contactPersonType,
		scheduleItemType,
		eventType,
		homeType,
	],
};
