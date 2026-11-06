import { getViteConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const alias = { '@': fileURLToPath(new URL('./src', import.meta.url)) };

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['src/**/*.{ts,tsx,astro}'],
			exclude: ['src/test/**', 'src/**/*.test.{ts,tsx}', 'src/env.d.ts'],
		},
		projects: [
			{
				resolve: { alias },
				test: {
					name: 'unit',
					environment: 'node',
					setupFiles: ['./src/test/setup.ts'],
					include: ['src/**/*.test.{ts,tsx}'],
					exclude: ['src/**/*.astro.test.ts'],
					globals: true,
				},
			},
			// Astro components, rendered with the container API (needs Astro's Vite config)
			getViteConfig({
				resolve: { alias },
				test: {
					name: 'astro',
					environment: './src/test/happy-dom-ssr.ts',
					setupFiles: ['./src/test/setup.ts'],
					include: ['src/**/*.astro.test.ts'],
					globals: true,
				},
			}),
		],
	},
});
