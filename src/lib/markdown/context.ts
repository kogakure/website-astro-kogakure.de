import type { Element, ElementContent, Text } from 'hast';
import type { HastVisitorContext } from 'satteri';
import { DEFAULT_LANG, isLang, type Lang } from '../../i18n/languages.ts';

/** The language of a book page, from its path `src/content/book/<lang>/…` */
export function documentLang(ctx: Pick<HastVisitorContext, 'fileURL'>): Lang {
	const lang = ctx.fileURL?.pathname.match(/\/book\/([a-z]{2})\//)?.[1];
	return isLang(lang) ? lang : DEFAULT_LANG;
}

export const text = (value: string): Text => ({ type: 'text', value });

export const element = (
	tagName: string,
	properties: Element['properties'],
	children: ElementContent[]
): Element => ({ type: 'element', tagName, properties, children });

export const hasClass = (node: Readonly<Element>, name: string): boolean => {
	const className = node.properties.className;
	return Array.isArray(className) && className.includes(name);
};
