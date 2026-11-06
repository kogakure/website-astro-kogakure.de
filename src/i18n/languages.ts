/**
 * The twelve languages of the book. `code` is the folder in kogakure-texts
 * and the URL prefix; `htmlLang` goes into `lang` and `hreflang`.
 */
export const LANGUAGES = [
	{ code: 'de', htmlLang: 'de', name: 'Deutsch', dir: 'ltr' },
	{ code: 'en', htmlLang: 'en', name: 'English', dir: 'ltr' },
	{ code: 'es', htmlLang: 'es', name: 'Español', dir: 'ltr' },
	{ code: 'fr', htmlLang: 'fr', name: 'Français', dir: 'ltr' },
	{ code: 'pt', htmlLang: 'pt-BR', name: 'Português', dir: 'ltr' },
	{ code: 'it', htmlLang: 'it', name: 'Italiano', dir: 'ltr' },
	{ code: 'nl', htmlLang: 'nl', name: 'Nederlands', dir: 'ltr' },
	{ code: 'ru', htmlLang: 'ru', name: 'Русский', dir: 'ltr' },
	{ code: 'ja', htmlLang: 'ja', name: '日本語', dir: 'ltr' },
	{ code: 'zh', htmlLang: 'zh-Hans', name: '中文', dir: 'ltr' },
	{ code: 'ko', htmlLang: 'ko', name: '한국어', dir: 'ltr' },
	{ code: 'he', htmlLang: 'he', name: 'עברית', dir: 'rtl' },
] as const;

export type Lang = (typeof LANGUAGES)[number]['code'];
export type Language = (typeof LANGUAGES)[number];

export const LANGS: readonly Lang[] = LANGUAGES.map(({ code }) => code);

/** German lives at the root, with the German slugs of the old site */
export const DEFAULT_LANG: Lang = 'de';

export const isLang = (value: string | undefined): value is Lang => LANGS.includes(value as Lang);

export function language(lang: Lang): Language {
	const found = LANGUAGES.find(({ code }) => code === lang);
	if (!found) throw new Error(`Unknown language: ${lang}`);
	return found;
}
