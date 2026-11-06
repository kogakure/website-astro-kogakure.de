import { LANGS, type Lang } from '../../i18n/languages.ts';
import { HOME, homePath, routeOf } from '../../i18n/routes.ts';

export interface RoutedPage {
	lang: Lang;
	slug: string;
	translationKey: string;
}

/** The URL of every language version of one page */
export type Alternates = Record<Lang, string>;

/**
 * All twelve language versions of every page, keyed by translationKey (the
 * homepages by `home`). Feeds the language switch, hreflang and the tests.
 * Throws if a page is missing in a language: every page exists in all twelve.
 */
export function buildAlternates(pages: readonly RoutedPage[]): Map<string, Alternates> {
	const partial = new Map<string, Partial<Alternates>>([
		[HOME, Object.fromEntries(LANGS.map((lang) => [lang, homePath(lang)]))],
	]);
	for (const { lang, slug, translationKey } of pages) {
		const versions = partial.get(translationKey) ?? {};
		if (versions[lang]) throw new Error(`${translationKey} appears twice in ${lang}`);
		versions[lang] = routeOf(lang, slug, translationKey);
		partial.set(translationKey, versions);
	}

	const alternates = new Map<string, Alternates>();
	for (const [key, versions] of partial) {
		const missing = LANGS.filter((lang) => !versions[lang]);
		if (missing.length > 0) throw new Error(`${key} is missing in ${missing.join(', ')}`);
		alternates.set(key, versions as Alternates);
	}
	return alternates;
}
