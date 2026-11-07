import { glossaryLetters } from '@/lib/book/glossary';
import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import Glossary from './Glossary.astro';

const props = {
	letters: glossaryLetters(
		[
			{
				title: 'aikidō',
				sort: 'Aikido',
				japanese: '合気道',
				translation: 'Der Weg der Harmonie',
			},
			{
				title: 'Buddha',
				sort: 'Buddha',
				sanskrit: 'बुद्ध',
				description: 'Japanisch <em>butsu</em>, <q>erwacht</q>.',
			},
			{ title: 'Dao', sort: 'Dao', chinese: '道', description: 'Der Weg.' },
		],
		'de'
	),
	quotes: ['„', '“'] as const,
	origins: { chinese: 'Chinesisch', sanskrit: 'Sanskrit' },
};

describe('Glossary', () => {
	it('sets each initial as a heading and each entry as an anchor in a definition list', async () => {
		const html = await renderAstro(Glossary, props);
		expect(html).toMatch(/<div class="glossary-letter"[^>]*>\s*<h2 id="a"[^>]*>A<\/h2>/);
		expect(html.match(/<dl/g)).toHaveLength(3);
		expect(html).toMatch(/<div class="entry"[^>]*id="aikido"/);
		expect(html).toMatch(/<dfn lang="ja-Latn"[^>]*>aikidō<\/dfn>/);
	});

	it('gives every entry its script, the meaning in quotation marks and the origin', async () => {
		const html = await renderAstro(Glossary, props);
		expect(html).toMatch(/<span class="entry-script"[^>]*lang="ja"[^>]*>\s*合気道/);
		expect(html).toMatch(/<q[^>]*>\s*„\s*Der Weg der Harmonie\s*“\s*<\/q>/);
		expect(html).toMatch(/<dfn lang="sa-Latn"[^>]*>Buddha/);
		expect(html).toMatch(
			/<em[^>]*>Sanskrit<\/em>\. Japanisch <em>butsu<\/em>, <q>„erwacht“<\/q>/
		);
		expect(html).toMatch(/<em[^>]*>Chinesisch<\/em>\. Der Weg\./);
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(await renderAstro(Glossary, props));
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
