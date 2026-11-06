import { builtinEnvironments, type Environment } from 'vitest/runtime';

/**
 * happy-dom with Vite's SSR transform: the Astro container needs the server
 * build of `.astro` files, and axe needs a DOM to check the rendered HTML.
 */
export default {
	...builtinEnvironments['happy-dom'],
	name: 'happy-dom-ssr',
	viteEnvironment: 'ssr',
} satisfies Environment;
