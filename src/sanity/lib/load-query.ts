import { sanityClient } from "sanity:client";
import type { QueryParams } from "sanity";

// The same queries (getPosts(), getEvents(), …) run from many getStaticPaths,
// the OG image route and the home sections. During a production build the
// content can't change, so each distinct query + params is fetched once; the
// promise itself is cached so concurrent callers share one request. The dev
// server always fetches, so Studio edits show up on reload.
const cache = new Map<string, Promise<unknown>>();

async function fetchQuery<QueryResponse>(query: string, params: QueryParams) {
	const { result } = await sanityClient.fetch<QueryResponse>(query, params, {
		filterResponse: false,
	});
	return result;
}

export async function loadQuery<QueryResponse>({
	query,
	params,
}: {
	query: string;
	params?: QueryParams;
}): Promise<{ data: QueryResponse }> {
	const queryParams = params ?? {};
	if (!import.meta.env.PROD) {
		return { data: await fetchQuery<QueryResponse>(query, queryParams) };
	}

	const key = `${query}\u0000${JSON.stringify(queryParams)}`;
	let pending = cache.get(key) as Promise<QueryResponse> | undefined;
	if (!pending) {
		pending = fetchQuery<QueryResponse>(query, queryParams);
		// Don't keep a failed request around; a later call may retry.
		pending.catch(() => cache.delete(key));
		cache.set(key, pending);
	}
	return { data: await pending };
}
