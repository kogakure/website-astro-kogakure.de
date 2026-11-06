import type { Element } from 'hast';
import { defineHastPlugin } from 'satteri';
import { hasClass } from './context.ts';

/**
 * Info boxes (`<aside class="banner">`) become notes named by their bold
 * title: `role="note"` keeps them from being complementary landmarks inside
 * `<main>`, and the title paragraph gets the class `banner-title`.
 * A factory, so the ids count from 1 on every page.
 */
export const hastBanners = () => {
	let count = 0;
	return defineHastPlugin({
		name: 'banners',
		element: {
			filter: ['aside'],
			visit(node, ctx) {
				if (!hasClass(node, 'banner')) return;
				ctx.setProperty(node, 'role', 'note');
				const title = node.children.find(
					(child): child is Element => child.type === 'element'
				);
				if (!title || !isTitle(title)) return;
				const id = `banner-${++count}`;
				ctx.setProperty(title, 'id', id);
				ctx.setProperty(title, 'className', ['banner-title']);
				ctx.setProperty(node, 'ariaLabelledBy', id);
			},
		},
	});
};

/** A paragraph that holds nothing but one `<strong>` */
function isTitle(node: Element): boolean {
	if (node.tagName !== 'p') return false;
	const content = node.children.filter(
		(child) => child.type !== 'text' || child.value.trim() !== ''
	);
	const only = content[0];
	return content.length === 1 && only?.type === 'element' && only.tagName === 'strong';
}
