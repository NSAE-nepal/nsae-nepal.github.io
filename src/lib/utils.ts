import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
