import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import type { AstroComponentFactory } from 'astro/runtime/server/index.js';

/** Renders an Astro component to an HTML string. */
export async function renderAstro(
	component: AstroComponentFactory,
	props: Record<string, unknown> = {},
	slots: Record<string, string> = {}
): Promise<string> {
	const container = await AstroContainer.create();
	return container.renderToString(component, { props, slots });
}
