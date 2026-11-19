import {
	IconBooks,
	IconBriefcase,
	IconCalendar,
	IconFileText,
	IconHeart,
	IconHome,
	IconInfoCircle,
	IconMail,
	IconPhoto,
	IconUserStar,
} from "@tabler/icons-react";
import { navigate } from "astro:transitions/client";
import { useEffect, useRef, useState } from "react";
import {
	Command,
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";

export const OPEN_SEARCH_EVENT = "nsae:open-search";

interface PagefindMeta {
	title: string;
	image?: string;
	image_alt?: string;
	sub_title?: string;
	date?: string;
}

interface PagefindResult {
	id: string;
	data: () => Promise<{
		url: string;
		content: string;
		meta: PagefindMeta;
	}>;
}

interface Pagefind {
	search: (
		query: string | null,
		options?: { filters?: Record<string, string> },
	) => Promise<{ results: PagefindResult[] }>;
	filters?: () => Promise<Record<string, Record<string, number>>>;
	init?: () => Promise<void>;
}

interface SearchResultItem {
	url: string;
	title: string;
	subtitle?: string;
	excerpt: string;
	image?: string;
	date?: string;
}

const SUGGESTIONS = [
	{ href: "/blog/page/1", label: "Blogs", Icon: IconFileText },
	{ href: "/notices/page/1", label: "Notices", Icon: IconFileText },
	{ href: "/events/page/1", label: "Events", Icon: IconCalendar },
	{ href: "/minutes/page/1", label: "Minutes", Icon: IconFileText },
	{ href: "/resources/page/1", label: "Resources", Icon: IconBooks },
	{ href: "/careers/page/1", label: "Opportunities", Icon: IconBriefcase },
	{ href: "/spotlight/page/1", label: "Member Spotlight", Icon: IconUserStar },
];

const ABOUT_LINKS = [
	{ href: "/", label: "Home", Icon: IconHome },
	{ href: "/about", label: "About us", Icon: IconInfoCircle },
	{ href: "/contact", label: "Contact", Icon: IconMail },
	{ href: "/donate", label: "Donate", Icon: IconHeart },
];

// Shared across mounts so Pagefind is only downloaded once per page session.
let pagefindPromise: Promise<Pagefind> | null = null;

function loadPagefind(): Promise<Pagefind> {
	pagefindPromise ??= import(
		/* @vite-ignore */
		`${import.meta.env.BASE_URL}pagefind/pagefind.js`
	).then(async (pf: Pagefind) => {
		await pf.init?.();
		return pf;
	});
	pagefindPromise.catch(() => {
		pagefindPromise = null;
	});
	return pagefindPromise;
}

const formatDate = (dateStr?: string) => {
	if (!dateStr) return null;
	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return dateStr;
	return date.toLocaleDateString("en-US", {
		timeZone: "Asia/Kathmandu",
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

/**
 * The search dialog. Mounted on demand by `./mount.tsx` the first time the
 * user opens search, so its React + cmdk bundle stays off the initial load.
 */
export function SearchDialog({ defaultOpen = false }: { defaultOpen?: boolean }) {
	const [open, setOpen] = useState(defaultOpen);
	const [search, setSearch] = useState("");
	const [results, setResults] = useState<SearchResultItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [pagefind, setPagefind] = useState<Pagefind | null>(null);
	// Content types from `data-pagefind-filter="type:…"` on detail pages.
	const [types, setTypes] = useState<string[]>([]);
	const [typeFilter, setTypeFilter] = useState<string | null>(null);
	const isSearching = Boolean(search || typeFilter);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		const handleOpen = () => setOpen(true);
		window.addEventListener(OPEN_SEARCH_EVENT, handleOpen);
		return () => window.removeEventListener(OPEN_SEARCH_EVENT, handleOpen);
	}, []);

	useEffect(() => {
		if (!open || pagefind) return;
		loadPagefind()
			.then(async (pf) => {
				setPagefind(pf);
				const filters = (await pf.filters?.()) ?? {};
				setTypes(Object.keys(filters.type ?? {}).sort());
			})
			.catch((err) => console.error("Failed to load Pagefind", err));
	}, [open, pagefind]);

	useEffect(() => {
		// Results only render while searching, so nothing to clear here.
		if (!isSearching || !pagefind) return;

		let cancelled = false;
		const debounce = setTimeout(async () => {
			setIsLoading(true);
			try {
				// A type filter with no text lists everything of that type.
				const searchResults = await pagefind.search(
					search || null,
					typeFilter ? { filters: { type: typeFilter } } : undefined,
				);
				const data = await Promise.all(
					searchResults.results.slice(0, 10).map(async (result) => {
						const resultData = await result.data();
						let cleanContent = resultData.content;

						if (resultData.meta.title) {
							cleanContent = cleanContent.replace(resultData.meta.title, "");
						}
						if (resultData.meta.sub_title) {
							cleanContent = cleanContent.replace(
								resultData.meta.sub_title,
								"",
							);
						}
						cleanContent = cleanContent.replace(/\s+/g, " ").trim();

						return {
							url: resultData.url,
							title: resultData.meta.title || "Untitled",
							subtitle: resultData.meta.sub_title,
							image: resultData.meta.image,
							date: resultData.meta.date,
							excerpt: cleanContent
								? cleanContent.substring(0, 500) +
									(cleanContent.length > 500 ? "..." : "")
								: "No preview available",
						};
					}),
				);
				if (!cancelled) setResults(data);
			} catch (error) {
				console.error("Search error:", error);
				if (!cancelled) setResults([]);
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		}, 300);

		return () => {
			cancelled = true;
			clearTimeout(debounce);
		};
	}, [search, typeFilter, isSearching, pagefind]);

	const handleSelect = (url: string) => {
		setOpen(false);
		navigate(url);
	};

	return (
		<CommandDialog
			title="Search"
			description="Search pages, blogs, notices and events"
			className="lg:max-w-3xl top-[10vh] max-h-[85vh] overflow-hidden flex flex-col"
			open={open}
			onOpenChange={setOpen}
		>
			<Command shouldFilter={false}>
				<CommandInput
					ref={inputRef}
					placeholder="Search pages, blogs, events..."
					value={search}
					onValueChange={setSearch}
				/>
				{types.length > 1 && (
					<div
						role="group"
						aria-label="Filter by type"
						className="flex flex-wrap gap-1.5 border-b px-3 py-2"
					>
						{types.map((type) => {
							const active = typeFilter === type;
							return (
								<button
									key={type}
									type="button"
									aria-pressed={active}
									onClick={() => {
										setTypeFilter(active ? null : type);
										// Keep typing in the search box after picking a filter.
										inputRef.current?.focus();
									}}
									className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wider transition-colors cursor-pointer ${
										active
											? "border-primary bg-primary text-primary-foreground"
											: "border-border text-muted-foreground hover:border-primary hover:text-primary"
									}`}
								>
									{type}
								</button>
							);
						})}
					</div>
				)}
				<CommandList
					className="max-h-[60vh] overflow-y-auto"
					data-lenis-prevent
				>
					{!isSearching && (
						<>
							<CommandGroup heading="Suggestions">
								<div className="grid grid-cols-2 gap-1 p-1">
									{SUGGESTIONS.map(({ href, label, Icon }) => (
										<CommandItem
											key={href}
											onSelect={() => handleSelect(href)}
											className="justify-start"
										>
											<Icon className="mr-2 h-4 w-4" />
											<span>{label}</span>
										</CommandItem>
									))}
								</div>
							</CommandGroup>
							<CommandSeparator />
							<CommandGroup heading="Want to know us">
								<div className="grid grid-cols-2 gap-1 p-1">
									{ABOUT_LINKS.map(({ href, label, Icon }) => (
										<CommandItem
											key={href}
											onSelect={() => handleSelect(href)}
											className="justify-start"
										>
											<Icon className="mr-2 h-4 w-4" />
											<span>{label}</span>
										</CommandItem>
									))}
								</div>
							</CommandGroup>
						</>
					)}

					{isSearching && (
						<>
							{(isLoading || !pagefind) && (
								<CommandEmpty>Searching...</CommandEmpty>
							)}
							{!isLoading && pagefind && results.length === 0 && (
								<CommandEmpty>No results found.</CommandEmpty>
							)}
							{!isLoading && results.length > 0 && (
								<CommandGroup heading="Search Results">
									{results.map((result) => (
										<CommandItem
											key={result.url}
											value={result.url}
											onSelect={() => handleSelect(result.url)}
											className="flex items-start gap-3 py-3"
										>
											<div className="shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-border">
												{result.image ? (
													<img
														src={result.image}
														alt=""
														loading="lazy"
														className="w-full h-full object-cover"
													/>
												) : (
													<IconPhoto className="text-muted-foreground w-8 h-8 opacity-50" />
												)}
											</div>

											<div className="flex flex-col gap-0.5 flex-1 min-w-0">
												<div className="flex items-center justify-between w-full">
													<span className="font-medium truncate">
														{result.title}
													</span>
													{result.date && (
														<span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
															{formatDate(result.date)}
														</span>
													)}
												</div>

												{result.subtitle && (
													<span className="text-xs text-muted-foreground/80 font-medium truncate italic">
														{result.subtitle}
													</span>
												)}

												<span className="text-xs text-muted-foreground line-clamp-4 mt-1">
													{result.excerpt}
												</span>
											</div>
										</CommandItem>
									))}
								</CommandGroup>
							)}
						</>
					)}
				</CommandList>
			</Command>
		</CommandDialog>
	);
}
