// @ts-check
import { satteri } from '@astrojs/markdown-satteri';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, passthroughImageService } from 'astro/config';
import { validateBookIntegration } from './src/integrations/validate-book.ts';
import { BOOK_HAST_PLUGINS, MARKDOWN_FEATURES } from './src/lib/markdown/index.ts';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
	site: 'https://www.kogakure.de',
	trailingSlash: 'always',
	integrations: [validateBookIntegration(), react()],
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
	vite: {
		plugins: [tailwindcss()],
	},
});
