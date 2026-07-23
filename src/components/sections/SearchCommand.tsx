import {
	IconBriefcase,
	IconCalendar,
	IconFileText,
	IconHeart,
	IconHome,
	IconInfoCircle,
	IconMail,
	IconPhoto,
	IconSearch,
} from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
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
		word_count: number;
		filters: Record<string, string>;
		meta: PagefindMeta;
		anchors: Array<{
			element: string;
			id: string;
			text: string;
			location: number;
		}>;
		weighted_locations: Array<{
			weight: number;
			balanced_score: number;
			location: number;
		}>;
	}>;
}

interface PagefindSearchResults {
	results: PagefindResult[];
}
interface SearchResultItem {
	url: string;
	title: string;
	subtitle?: string;
	excerpt: string;
	image?: string;
	date?: string;
}

interface Pagefind {
	search: (query: string) => Promise<PagefindSearchResults>;
	init?: () => Promise<void>;
}

export function SearchCommand() {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState("");
	const [results, setResults] = useState<SearchResultItem[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [pagefind, setPagefind] = useState<Pagefind | null>(null);

	useEffect(() => {
		const performSearch = async () => {
			if (!search || !pagefind) {
				setResults([]);
				return;
			}

			setIsLoading(true);
			try {
				const searchResults = await pagefind.search(search);

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

				setResults(data);
			} catch (error) {
				console.error("Search error:", error);
				setResults([]);
			} finally {
				setIsLoading(false);
			}
		};

		const debounce = setTimeout(performSearch, 300);
		return () => clearTimeout(debounce);
	}, [search, pagefind]);

	const handleSelect = (url: string) => {
		setOpen(false);
		window.location.href = url;
	};

	const formatDate = (dateStr?: string) => {
		if (!dateStr) return null;
		try {
			return new Date(dateStr).toLocaleDateString("en-US", {
				year: "numeric",
				month: "short",
				day: "numeric",
			});
		} catch (e) {
			return dateStr;
		}
	};

	const handleOpen = useCallback(async () => {
		setOpen(true);

		if (pagefind) return;

		try {
			const pf = await import(
				/* @vite-ignore */
				`${import.meta.env.BASE_URL}pagefind/pagefind.js`
			);

			await pf.init?.();

			setPagefind(pf);
		} catch (err) {
			console.error("Failed to load Pagefind", err);
		}
	}, [pagefind]);

	useEffect(() => {
		const down = async (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				await handleOpen();
			}
		};

		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, [handleOpen]);

	return (
		<>
			<Button
				onClick={handleOpen}
				className="rounded-full items-center bg-foreground hover:bg-foreground hidden xs:flex  cursor-pointer h-9 px-3 py-2"
			>
				<IconSearch className="w-4 h-4 shrink-0" />
			</Button>

			<CommandDialog
				className="lg:max-w-3xl top-[10vh] max-h-[85vh] overflow-hidden flex flex-col"
				open={open}
				onOpenChange={setOpen}
			>
				<Command shouldFilter={false}>
					<CommandInput
						placeholder="Search pages, blogs, events..."
						value={search}
						onValueChange={setSearch}
					/>
					<CommandList
						className="max-h-[60vh] overflow-y-auto"
						data-lenis-prevent
					>
						{!search && (
							<>
								<CommandGroup heading="Suggestions">
									<div className="grid grid-cols-2 gap-1 p-1">
										<CommandItem
											onSelect={() => handleSelect("/blog")}
											className="justify-start"
										>
											<IconFileText className="mr-2 h-4 w-4" />
											<span>Blogs</span>
										</CommandItem>
										<CommandItem
											onSelect={() => handleSelect("/notices")}
											className="justify-start"
										>
											<IconFileText className="mr-2 h-4 w-4" />
											<span>Notices</span>
										</CommandItem>
										<CommandItem
											onSelect={() => handleSelect("/events")}
											className="justify-start"
										>
											<IconCalendar className="mr-2 h-4 w-4" />
											<span>Events</span>
										</CommandItem>
										<CommandItem
											onSelect={() => handleSelect("/minutes")}
											className="justify-start"
										>
											<IconFileText className="mr-2 h-4 w-4" />
											<span>Minutes</span>
										</CommandItem>
										<CommandItem
											onSelect={() => handleSelect("/careers")}
											className="justify-start"
										>
											<IconBriefcase className="mr-2 h-4 w-4" />
											<span>Careers</span>
										</CommandItem>
									</div>
								</CommandGroup>
								<CommandSeparator />
								<CommandGroup heading="Want to know us">
									<div className="grid grid-cols-2 gap-1 p-1">
										<CommandItem
											onSelect={() => handleSelect("/")}
											className="justify-start"
										>
											<IconHome className="mr-2 h-4 w-4" />
											<span>Home</span>
										</CommandItem>
										<CommandItem
											onSelect={() => handleSelect("/about")}
											className="justify-start"
										>
											<IconInfoCircle className="mr-2 h-4 w-4" />
											<span>About us</span>
										</CommandItem>
										<CommandItem
											onSelect={() => handleSelect("/contact")}
											className="justify-start"
										>
											<IconMail className="mr-2 h-4 w-4" />
											<span>Contact</span>
										</CommandItem>
										<CommandItem
											onSelect={() => handleSelect("/donate")}
											className="justify-start"
										>
											<IconHeart className="mr-2 h-4 w-4" />
											<span>Donate</span>
										</CommandItem>
									</div>
								</CommandGroup>
							</>
						)}

						{search && (
							<>
								{isLoading && <CommandEmpty>Searching...</CommandEmpty>}
								{!isLoading && results.length === 0 && (
									<CommandEmpty>No results found.</CommandEmpty>
								)}
								{!isLoading && results.length > 0 && (
									<CommandGroup heading="Search Results">
										{results.map((result, index) => (
											<CommandItem
												key={index}
												value={result.url}
												onSelect={() => handleSelect(result.url)}
												className="flex items-start gap-3 py-3"
											>
												<div className="shrink-0 w-16 h-16 rounded-md overflow-hidden bg-muted flex items-center justify-center border border-border">
													{result.image ? (
														<img
															src={result.image}
															alt={result.title}
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
		</>
	);
}
