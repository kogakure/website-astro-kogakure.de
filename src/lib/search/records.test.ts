import { describe, expect, it } from 'vitest';
import { glossaryRecords } from './records';

const glossaryPage = (lang: string, slug: string, title: string) => ({
	lang,
	slug,
	data: { translationKey: 'glossaryPage', title },
});

describe('glossaryRecords', () => {
	it('makes every entry a result of its own at its anchor, in its language', () => {
		const records = glossaryRecords(
			[
				glossaryPage('de', 'glossar', 'Glossar'),
				glossaryPage('pt', 'glossary', 'Glossário'),
				{
					lang: 'de',
					slug: 'kamae',
					data: { translationKey: 'kamaePage', title: 'Kamae' },
				},
			],
			{
				de: {
					entries: [
						{
							title: 'kunoichi',
							sort: 'Kunoichi',
							japanese: 'くノ一',
							translation: 'Frau',
							description: 'Weibliche <em>Ninja</em>.',
						},
						{ title: 'Ainu', sort: 'Ainu', description: 'Volk im Norden Japans.' },
					],
				},
				pt: { entries: [{ title: 'kunoichi', sort: 'Kunoichi', japanese: 'くノ一' }] },
			}
		);
		expect(records).toEqual([
			{
				url: '/glossar/#kunoichi',
				content: 'kunoichi. くノ一. Frau. Weibliche Ninja.',
				language: 'de',
				meta: { title: 'kunoichi くノ一', chapter: 'Glossar' },
			},
			{
				url: '/glossar/#ainu',
				content: 'Ainu. Volk im Norden Japans.',
				language: 'de',
				meta: { title: 'Ainu', chapter: 'Glossar' },
			},
			{
				url: '/pt/glossary/#kunoichi',
				content: 'kunoichi. くノ一',
				// As Pagefind writes <html lang="pt-BR">
				language: 'pt-br',
				meta: { title: 'kunoichi くノ一', chapter: 'Glossário' },
			},
		]);
	});

	it('skips a language without a glossary page', () => {
		expect(glossaryRecords([], { de: { entries: [{ title: 'Ainu', sort: 'Ainu' }] } })).toEqual(
			[]
		);
	});
});
