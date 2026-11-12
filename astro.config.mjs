// @ts-check
import { satteri } from '@astrojs/markdown-satteri';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, envField, passthroughImageService } from 'astro/config';
import { pwaIntegration } from './src/integrations/pwa.ts';
import { searchIntegration } from './src/integrations/search.ts';
import { validateBookIntegration } from './src/integrations/validate-book.ts';
import { BOOK_HAST_PLUGINS, MARKDOWN_FEATURES } from './src/lib/markdown/index.ts';
import { SITE_URL } from './src/lib/seo/seo.ts';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
	site: SITE_URL,
	trailingSlash: 'always',
	integrations: [validateBookIntegration(), react(), searchIntegration(), pwaIntegration()],
	markdown: {
		processor: satteri({
			features: MARKDOWN_FEATURES,
			hastPlugins: BOOK_HAST_PLUGINS,
		}),
	},
	// Images are pregenerated in fixed WebP sizes, so Astro doesn't process them
	image: {
		service: passthroughImageService(),
	},
	env: {
		schema: {
			// Umami's script (src/lib/analytics): set by the Docker build only
			ANALYTICS: envField.boolean({ context: 'server', access: 'public', default: false }),
		},
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
