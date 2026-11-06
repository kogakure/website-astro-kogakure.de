import type { Element } from 'hast';
import { defineHastPlugin } from 'satteri';

/** What the image manifest (SI-472) knows about an image URL */
export interface ImageInfo {
	width: number;
	height: number;
	srcset?: string;
	sizes?: string;
}

export interface FigureOptions {
	lookup?: (src: string) => ImageInfo | undefined;
}

/**
 * The `<img>` of every `<figure>` in a text becomes a responsive picture:
 * lazy and async, and with the manifest's size and `srcset` once the image
 * pipeline (SI-472) provides `lookup`. Markdown can't render Astro
 * components, so this plugin is the Picture of the texts.
 */
export const hastFigures = ({ lookup }: FigureOptions = {}) =>
	defineHastPlugin({
		name: 'figures',
		element: {
			filter: ['figure'],
			visit(node, ctx) {
				const img = node.children.find(
					(child): child is Element => child.type === 'element' && child.tagName === 'img'
				);
				if (!img) return;
				ctx.setProperty(img, 'loading', 'lazy');
				ctx.setProperty(img, 'decoding', 'async');
				const info =
					typeof img.properties.src === 'string'
						? lookup?.(img.properties.src)
						: undefined;
				if (!info) return;
				ctx.setProperty(img, 'width', info.width);
				ctx.setProperty(img, 'height', info.height);
				if (info.srcset) ctx.setProperty(img, 'srcSet', info.srcset);
				if (info.sizes) ctx.setProperty(img, 'sizes', info.sizes);
			},
		},
	});
