// @ts-check
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, passthroughImageService } from 'astro/config';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
	site: 'https://www.kogakure.de',
	trailingSlash: 'always',
	integrations: [react()],
	// Images are pregenerated in fixed WebP sizes, so Astro doesn't process them
	image: {
		service: passthroughImageService(),
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
