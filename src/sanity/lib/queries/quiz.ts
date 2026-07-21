import { loadQuery } from "../load-query";

export type QuestionType = "single-select" | "multi-select";

export type QuizOption = {
	id: string;
	text: string;
};

export type Question = {
	id: string;
	type: QuestionType;
	question: string;
	points: number;
	required?: boolean;
	options: QuizOption[];
	correctOptionIds: string[];
	hint?: string;
	explanation?: string;
};

export type QuizSettings = {
	shuffleQuestions?: boolean;
	shuffleOptions?: boolean;
	showExplanations?: boolean;
	passingScore: number;
	negativeMarkingPercentage?: number;
};

export type Quiz = {
	_id: string;
	title: string;
	slug: string;
	settings?: QuizSettings;
	questionCount: number;
};

export type QuizDetails = {
	_id: string;
	title: string;
	slug: string;
	settings: QuizSettings;
	questions: Question[];
};

export async function getQuizzes(): Promise<Quiz[]> {
	const QUIZZES_QUERY = `*[
    _type == "quizzes" &&
    !(_id in path("drafts.**"))
  ] | order(_createdAt desc) {
    _id,
    title,
    "slug": slug.current,
    settings {
      shuffleQuestions,
      shuffleOptions,
      showExplanations,
      passingScore,
      negativeMarkingPercentage
    },
    "questionCount": count(questions)
  }`;

	const { data } = await loadQuery<Quiz[]>({
		query: QUIZZES_QUERY,
	});

	return data;
}

export async function getQuizDetails(slug: string): Promise<QuizDetails> {
	const QUIZ_DETAILS_QUERY = `
*[
  _type == "quizzes" &&
  slug.current == $slug &&
  !(_id in path("drafts.**"))
][0]{
  _id,
  title,
  "slug": slug.current,
  settings {
    shuffleQuestions,
    shuffleOptions,
    showExplanations,
    passingScore,
    negativeMarkingPercentage
  },
  questions[] {
    id,
    type,
    question,
    points,
    required,
    options[] {
      id,
      text
    },
    correctOptionIds,
    hint,
    explanation
  }
}
`;

	const { data } = await loadQuery<QuizDetails>({
		query: QUIZ_DETAILS_QUERY,
		params: {
			slug,
		},
	});

	return data;
}
