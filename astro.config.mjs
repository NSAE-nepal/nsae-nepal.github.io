// @ts-check

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { loadEnv } from "vite";

const isDev = process.argv.includes("dev");

// Same variables as sanity.config.ts (the Studio), so the site and the Studio
// always talk to the same project. Read from .env locally, secrets in CI.
const env = loadEnv(isDev ? "development" : "production", process.cwd(), "");
const sanityProjectId = env.PUBLIC_SANITY_PROJECT_ID;
const sanityDataset = env.PUBLIC_SANITY_DATASET;
if (!sanityProjectId || !sanityDataset) {
	throw new Error(
		"PUBLIC_SANITY_PROJECT_ID and PUBLIC_SANITY_DATASET must be set (copy .env.example to .env).",
	);
}

// https://astro.build/config
export default defineConfig({
	site: "https://www.nsae.org.np",
	image: {
		domains: [
			"res.cloudinary.com",
			"cdn.prod.website-files.com",
			"cdn.sanity.io",
		],
	},
	markdown: {
		shikiConfig: {
			themes: {
				light: "github-light",
				dark: "github-dark",
			},
		},
	},
	integrations: [
		mdx(),
		sitemap({
			filter: (page) => !page.includes("/studio"),
		}),
		react(),
		sanity({
			projectId: sanityProjectId,
			dataset: sanityDataset,
			useCdn: false,
			apiVersion: "2025-02-19",
			studioBasePath: "/studio",
		}),
	],
	vite: {
		plugins: [tailwindcss()],
		build: {
			rollupOptions: {
				external: ["/pagefind/pagefind.js"],
			},
		},
		server: isDev
			? {
					proxy: {
						"/pagefind": {
							target: "http://localhost:1414",
							changeOrigin: true,
							configure: (proxy, options) => {
								proxy.on("error", (err, req, res) => {
									console.log("proxy error", err);
								});
								proxy.on("proxyReq", (proxyReq, req, res) => {
									console.log("Proxying:", req.method, req.url);
								});
							},
						},
					},
				}
			: undefined,
	},
	prefetch: true,
	redirects: {
		"/blog": "/blog/page/1",
		"/notices": "/notices/page/1",
		"/careers": "/careers/page/1",
		"/past-committee": "/past-committee/page/1",
		"/minutes": "/minutes/page/1",
		"/events": "/events/page/1",
		"/courses": "/courses/page/1",
		"/resources": "/resources/page/1",
		"/spotlight": "/spotlight/page/1",
	},
	devToolbar: {
		enabled: true,
		placement: "bottom-left",
	},
});
