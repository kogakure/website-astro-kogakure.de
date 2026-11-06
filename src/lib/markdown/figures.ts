import type { Element } from 'hast';
import { defineHastPlugin } from 'satteri';

/** What the image manifest knows about an image URL */
export interface ImageInfo {
	/** The generated file that replaces the URL of the text */
	src: string;
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
 * lazy and async, with the generated file, size and `srcset` from `lookup`
 * (the image manifest). The figure gets the image's kind (`data-kind`, its
 * folder below /images/), for its ink edge (prose.css). Markdown can't render Astro components, so this
 * plugin is the Picture of the texts.
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
				// The kind of image (article, calligraphy, ken, …) decides its ink edge
				const kind =
					typeof img.properties.src === 'string'
						? /^\/images\/([^/]+)\//.exec(img.properties.src)?.[1]
						: undefined;
				if (kind) ctx.setProperty(node, 'dataKind', kind);
				const info =
					typeof img.properties.src === 'string'
						? lookup?.(img.properties.src)
						: undefined;
				if (!info) return;
				ctx.setProperty(img, 'src', info.src);
				ctx.setProperty(img, 'width', info.width);
				ctx.setProperty(img, 'height', info.height);
				if (info.srcset) ctx.setProperty(img, 'srcSet', info.srcset);
				if (info.sizes) ctx.setProperty(img, 'sizes', info.sizes);
			},
		},
	});
