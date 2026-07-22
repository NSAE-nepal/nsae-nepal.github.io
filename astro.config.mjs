// @ts-check

import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import sanity from "@sanity/astro";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

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
		sitemap(),
		react(),
		sanity({
			projectId: "zv3un63s",
			dataset: "production",
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
		server: {
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
		},
	},
	prefetch: true,
	redirects: {
		"/blog": "/blog/page/1",
		"/notices": "/notices/page/1",
		"/careers": "/careers/page/1",
		"/past-committee": "/past-committee/page/1",
		"/resources": "/resources/page/1",
		"/minutes": "/minutes/page/1",
		"/events": "/events/page/1",
	},
	devToolbar: {
		enabled: true,
		placement: "bottom-left",
	},
});
