import { beforeEach, describe, expect, it, vi } from 'vitest';
import { firstVisit as direct, type FirstVisitConfig } from './first-visit';
import { FALLBACK_LANG, FIRST_VISIT_KEY, LANGS, LANGUAGE_KEY } from './languages';
import { homePath } from './routes';

const config: FirstVisitConfig = {
	homes: Object.fromEntries(LANGS.map((lang) => [lang, homePath(lang)])),
	root: 'de',
	fallback: FALLBACK_LANG,
	choiceKey: LANGUAGE_KEY,
	seenKey: FIRST_VISIT_KEY,
};

// The homepage inlines the function's source (FirstVisit.astro): it must run without its module
const inlined = new Function(`return ${direct.toString()}`)() as typeof direct;

const CHROME = 'Mozilla/5.0 (Macintosh) AppleWebKit/537.36 Chrome/140.0 Safari/537.36';

let firstVisit = direct;

function visit({
	languages = ['de-DE'],
	stored = {},
	hash = '',
	search = '',
	userAgent = CHROME,
	storage = true,
}: {
	languages?: string[];
	stored?: Record<string, string>;
	hash?: string;
	search?: string;
	userAgent?: string;
	storage?: boolean;
} = {}) {
	const items = new Map(Object.entries(stored));
	const replace = vi.fn<(url: string) => void>();
	const localStorage = storage
		? {
				getItem: (key: string) => items.get(key) ?? null,
				setItem: (key: string, value: string) => void items.set(key, value),
			}
		: {
				getItem: () => {
					throw new Error('SecurityError');
				},
				setItem: () => {
					throw new Error('SecurityError');
				},
			};
	firstVisit(config, {
		localStorage,
		navigator: { languages, userAgent },
		location: { hash, search, replace },
	});
	return { to: replace.mock.calls[0]?.[0], items };
}

describe.for([
	['firstVisit', direct],
	['firstVisit, inlined', inlined],
] as const)('%s', ([, fn]) => {
	beforeEach(() => {
		firstVisit = fn;
	});

	it('sends a browser that asks for one of the languages to its homepage', () => {
		expect(visit({ languages: ['fr-FR', 'fr', 'en'] }).to).toBe('/fr/');
		expect(visit({ languages: ['ja'] }).to).toBe('/ja/');
	});

	it('keeps German readers on /', () => {
		expect(visit({ languages: ['de-AT', 'en'] }).to).toBeUndefined();
	});

	it('takes the first language of the browser it knows', () => {
		expect(visit({ languages: ['pl', 'cs', 'pt-PT', 'en'] }).to).toBe('/pt/');
	});

	it('matches regional and script variants and Hebrew’s old code', () => {
		expect(visit({ languages: ['zh-TW'] }).to).toBe('/zh/');
		expect(visit({ languages: ['iw-IL'] }).to).toBe('/he/');
		expect(visit({ languages: ['KO-kr'] }).to).toBe('/ko/');
	});

	it('sends everyone else to English', () => {
		expect(visit({ languages: ['pl-PL', 'tr'] }).to).toBe('/en/');
	});

	it('looks only once', () => {
		const { items } = visit({ languages: ['es'] });
		expect(items.get(FIRST_VISIT_KEY)).toBe('1');
		expect(visit({ languages: ['es'], stored: Object.fromEntries(items) }).to).toBeUndefined();
	});

	it('follows the reader’s own choice over the browser’s languages', () => {
		expect(visit({ languages: ['fr'], stored: { [LANGUAGE_KEY]: 'de' } }).to).toBeUndefined();
		expect(
			visit({ languages: ['de'], stored: { [LANGUAGE_KEY]: 'ko', [FIRST_VISIT_KEY]: '1' } })
				.to
		).toBe('/ko/');
	});

	it('never moves a deep link to a part of the homepage', () => {
		expect(visit({ languages: ['en'], hash: '#geschichte' }).to).toBeUndefined();
		expect(
			visit({ languages: ['en'], hash: '#geschichte', stored: { [LANGUAGE_KEY]: 'en' } }).to
		).toBeUndefined();
	});

	it('leaves crawlers on the German page', () => {
		const googlebot =
			'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html) Chrome/140.0';
		expect(visit({ languages: ['en-US'], userAgent: googlebot }).to).toBeUndefined();
	});

	it('does nothing without localStorage, so / stays reachable', () => {
		expect(visit({ languages: ['en'], storage: false }).to).toBeUndefined();
	});

	it('ignores a stored value that is no language', () => {
		expect(visit({ languages: ['it'], stored: { [LANGUAGE_KEY]: 'xx' } }).to).toBe('/it/');
	});

	it('keeps the query', () => {
		expect(visit({ languages: ['en'], search: '?utm_source=mastodon' }).to).toBe(
			'/en/?utm_source=mastodon'
		);
	});

	it('knows no language from the prototype', () => {
		expect(visit({ languages: ['it'], stored: { [LANGUAGE_KEY]: 'constructor' } }).to).toBe(
			'/it/'
		);
		expect(visit({ languages: ['toString', '__proto__'] }).to).toBe('/en/');
	});
});
