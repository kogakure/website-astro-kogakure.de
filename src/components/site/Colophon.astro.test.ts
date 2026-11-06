import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import Colophon from './Colophon.astro';
import LanguageSelect from './LanguageSelect.astro';
import ModeSwitch from './ModeSwitch.astro';

const LANGUAGES = [
	{ code: 'de', lang: 'de', name: 'Deutsch', href: '/', current: true },
	{ code: 'he', lang: 'he', name: 'עברית', href: '/he/' },
];

describe('ModeSwitch', () => {
	const props = {
		legend: 'Darstellung',
		labels: { light: 'Hell', dark: 'Dunkel', system: 'System' },
	};

	it('offers light, dark and the system, the system chosen', async () => {
		const html = await renderAstro(ModeSwitch, props);
		expect(html).toMatch(/<legend[^>]*>Darstellung<\/legend>/);
		expect(html.match(/type="radio"/g)).toHaveLength(3);
		expect(html).toMatch(/value="system" checked/);
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(await renderAstro(ModeSwitch, props));
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});

describe('LanguageSelect', () => {
	const props = { label: 'Sprache', go: 'Wechseln', languages: LANGUAGES };

	it('lists every language in its own name, the current one selected, and a button', async () => {
		const html = await renderAstro(LanguageSelect, props);
		expect(html).toMatch(/<option value="\/" lang="de" selected[^>]*>/);
		expect(html).toMatch(/<option value="\/he\/" lang="he"[^>]*>/);
		// Each language names its body face, fetched once it is chosen
		expect(html).toMatch(
			/lang="he"[^>]*data-font="\/fonts\/frank-ruhl-libre-hebrew-[0-9a-f]+\.woff2"/
		);
		expect(html).toMatch(/<button type="submit"[^>]*>Wechseln<\/button>/);
		expect(html).toContain('<noscript>');
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(await renderAstro(LanguageSelect, props));
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});

describe('Colophon', () => {
	const props = {
		lang: 'de',
		back: { href: '/', label: 'Zum Inhalt des Buches' },
		languages: LANGUAGES,
	};

	it('ends the page with the book, the copyright, the way back and the choices', async () => {
		const html = await renderAstro(Colophon, props);
		expect(html).toContain('<footer class="colophon');
		expect(html).toContain('Hinter Blättern und Bäumen verborgen');
		expect(html).toMatch(/©\s*<span dir="ltr"[^>]*>\s*1999–\d{4}/);
		expect(html).toContain('Zum Inhalt des Buches');
		expect(html).toContain('Darstellung');
		expect(html).toContain('Sprache');
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(await renderAstro(Colophon, props));
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
