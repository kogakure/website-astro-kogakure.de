/**
 * The figures of a page, read from its Markdown: the opener of an article
 * and the plates' captions come from here.
 */
import { findOpener } from '@/lib/images/images';

export interface PageFigure {
	src: string;
	alt: string;
	/** The caption as HTML */
	caption: string;
}

const FIGURE =
	/<figure>\s*<img\b[^>]*?\bsrc="([^"]+)"[^>]*?\balt="([^"]*)"[^>]*>\s*(?:<figcaption>([\s\S]*?)<\/figcaption>\s*)?<\/figure>/g;

export const pageFigures = (markdown: string): PageFigure[] =>
	[...markdown.matchAll(FIGURE)].map(([, src = '', alt = '', caption = '']) => ({
		src,
		alt,
		caption: caption.trim(),
	}));

/** The article's opener: its first painting (findOpener) */
export function openerFigure(markdown: string): PageFigure | undefined {
	const figures = pageFigures(markdown);
	const src = findOpener(figures.map((figure) => figure.src));
	return figures.find((figure) => figure.src === src);
}
