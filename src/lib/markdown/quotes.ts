import { defineHastPlugin, type PluginFactoryContext } from 'satteri';
import type { Lang } from '../../i18n/languages.ts';
import { documentLang, text } from './context.ts';

/** Outer and inner quotation marks per language: [open, close, open, close] */
export const QUOTES: Record<Lang, readonly [string, string, string, string]> = {
	de: ['„', '“', '‚', '‘'],
	en: ['“', '”', '‘', '’'],
	es: ['«', '»', '“', '”'],
	fr: ['« ', ' »', '“', '”'],
	pt: ['“', '”', '‘', '’'],
	it: ['«', '»', '“', '”'],
	nl: ['“', '”', '‘', '’'],
	ru: ['«', '»', '„', '“'],
	ja: ['「', '」', '『', '』'],
	zh: ['“', '”', '‘', '’'],
	ko: ['“', '”', '‘', '’'],
	he: ['„', '”', '‚', '’'],
};

const quotesFor = (lang: string | undefined, fallback: Lang) =>
	QUOTES[(lang?.split('-')[0] ?? '') as Lang] ?? QUOTES[fallback];

/** A `lang` that sets quotation marks: romanized Japanese (`ja-Latn`) takes those of the text around it */
const quoteLang = (value: unknown): string | undefined =>
	typeof value === 'string' && !/-Latn\b/i.test(value) ? value : undefined;

/**
 * Writes the quotation marks of the language into every `<q>`, as text: they
 * survive copying, reader views and the search index, and `<q lang="ja">`
 * inside a German sentence gets 「」. CSS sets `q { quotes: none }`. Nested
 * quotes take the inner pair.
 */
export const hastQuotes = (factory?: Pick<PluginFactoryContext, 'fileURL'>) => {
	const pageLang = documentLang({ fileURL: factory?.fileURL });
	return defineHastPlugin({
		name: 'quotes',
		element: {
			filter: ['q'],
			visit(node, ctx) {
				let depth = 0;
				let lang = quoteLang(node.properties.lang);
				for (
					let parent = ctx.parent(node);
					parent?.type === 'element';
					parent = ctx.parent(parent)
				) {
					if (parent.tagName === 'q') depth++;
					lang ??= quoteLang(parent.properties.lang);
				}
				const [open, close, innerOpen, innerClose] = quotesFor(lang, pageLang);
				const inner = depth % 2 === 1;
				ctx.prependChild(node, text(inner ? innerOpen : open));
				ctx.appendChild(node, text(inner ? innerClose : close));
			},
		},
	});
};
