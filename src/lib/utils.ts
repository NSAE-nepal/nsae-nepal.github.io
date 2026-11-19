import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

const NAME_PREFIXES: Record<string, string> = {
	er: "Er.",
	dr: "Dr.",
	prof_dr: "Prof. Dr.",
	mr: "Mr.",
	ms: "Ms.",
};

/** Sanity prefix values (e.g. ["er", "dr"]) as display text: "Er. Dr." */
export function formatPrefix(prefix?: string[] | string | null) {
	const values = Array.isArray(prefix) ? prefix : prefix ? [prefix] : [];
	return values.map((value) => NAME_PREFIXES[value] ?? value).join(" ");
}

/** Name with its formatted prefix, e.g. "Er. Subash Adhikari". */
export function formatName(name: string, prefix?: string[] | string | null) {
	const formatted = formatPrefix(prefix);
	return formatted ? `${formatted} ${name}` : name;
}

/** English ordinal: 1 → "1st", 12 → "12th", 22 → "22nd". */
export function ordinal(n: number) {
	const tens = n % 100;
	const suffix =
		tens >= 11 && tens <= 13
			? "th"
			: (({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ??
				"th");
	return `${n}${suffix}`;
}

/** "6 min read" for a reading-time estimate; empty when unknown. */
export function formatReadingTime(minutes?: number | null) {
	if (minutes == null) return "";
	return `${Math.max(1, Math.round(minutes))} min read`;
}
