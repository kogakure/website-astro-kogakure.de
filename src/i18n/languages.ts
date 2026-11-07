/**
 * The twelve languages of the book. `code` is the folder in kogakure-texts
 * and the URL prefix; `htmlLang` goes into `lang` and `hreflang`, `ogLocale`
 * into `og:locale`.
 */
export const LANGUAGES = [
	{ code: 'de', htmlLang: 'de', name: 'Deutsch', dir: 'ltr', ogLocale: 'de_DE' },
	{ code: 'en', htmlLang: 'en', name: 'English', dir: 'ltr', ogLocale: 'en_US' },
	{ code: 'es', htmlLang: 'es', name: 'Español', dir: 'ltr', ogLocale: 'es_ES' },
	{ code: 'fr', htmlLang: 'fr', name: 'Français', dir: 'ltr', ogLocale: 'fr_FR' },
	{ code: 'pt', htmlLang: 'pt-BR', name: 'Português', dir: 'ltr', ogLocale: 'pt_BR' },
	{ code: 'it', htmlLang: 'it', name: 'Italiano', dir: 'ltr', ogLocale: 'it_IT' },
	{ code: 'nl', htmlLang: 'nl', name: 'Nederlands', dir: 'ltr', ogLocale: 'nl_NL' },
	{ code: 'ru', htmlLang: 'ru', name: 'Русский', dir: 'ltr', ogLocale: 'ru_RU' },
	{ code: 'ja', htmlLang: 'ja', name: '日本語', dir: 'ltr', ogLocale: 'ja_JP' },
	{ code: 'zh', htmlLang: 'zh-Hans', name: '中文', dir: 'ltr', ogLocale: 'zh_CN' },
	{ code: 'ko', htmlLang: 'ko', name: '한국어', dir: 'ltr', ogLocale: 'ko_KR' },
	{ code: 'he', htmlLang: 'he', name: 'עברית', dir: 'rtl', ogLocale: 'he_IL' },
] as const;

export type Lang = (typeof LANGUAGES)[number]['code'];
export type Language = (typeof LANGUAGES)[number];

export const LANGS: readonly Lang[] = LANGUAGES.map(({ code }) => code);

/** German lives at the root, with the German slugs of the old site */
export const DEFAULT_LANG: Lang = 'de';

/** localStorage key of the reader's own choice of language: it always wins (SI-478) */
export const LANGUAGE_KEY = 'kogakure-lang';

/** localStorage key set once the browser's language has been looked at on `/` (SI-478) */
export const FIRST_VISIT_KEY = 'kogakure-lang-detected';

/** The language of readers whose browser asks for none of the twelve */
export const FALLBACK_LANG: Lang = 'en';

/** The eleven languages with a URL prefix */
export const PREFIXED_LANGS: readonly Lang[] = LANGS.filter((lang) => lang !== DEFAULT_LANG);

export const isLang = (value: string | undefined): value is Lang => LANGS.includes(value as Lang);

export function language(lang: Lang): Language {
	const found = LANGUAGES.find(({ code }) => code === lang);
	if (!found) throw new Error(`Unknown language: ${lang}`);
	return found;
}

/** The options of the language select: every language in its own name, linking to the page in it */
export const languageChoices = (alternates: Readonly<Record<Lang, string>>, current: Lang) =>
	LANGUAGES.map(({ code, htmlLang, name }) => ({
		code,
		lang: htmlLang,
		name,
		href: alternates[code],
		current: code === current,
	}));
