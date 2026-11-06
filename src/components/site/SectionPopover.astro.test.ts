import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import SectionPopover from './SectionPopover.astro';

const props = {
	heading: 'Abschnitte',
	sections: [
		{ id: 'eins', text: 'Was ist Ninjutsu?' },
		{ id: 'zwei', text: 'Die Schriftzeichen' },
	],
	countLabel: '2 Abschnitte',
	positionLabels: ['Abschnitt 1 von 2', 'Abschnitt 2 von 2'],
};

describe('SectionPopover', () => {
	it('opens the sections in the native popover, the count before the first', async () => {
		const html = await renderAstro(SectionPopover, props);
		expect(html).toMatch(/<button[^>]*popovertarget="where-list"/);
		expect(html).toMatch(/<span data-where-label[^>]*>2 Abschnitte<\/span>/);
		// Named for what it opens: „Abschnitte: 2 Abschnitte“
		expect(html).toMatch(/<span class="sr-only"[^>]*>Abschnitte: <\/span>/);
		expect(html).toMatch(/role="group" aria-labelledby="where-title"/);
		expect(html).toMatch(/id="where-list"[^>]*popover/);
		expect(html).toMatch(/<a href="#eins"[^>]*>Was ist Ninjutsu\?<\/a>/);
		expect(html).toContain('Abschnitt 2 von 2');
	});

	it('has no accessibility violations', async () => {
		const violations = await axeViolations(await renderAstro(SectionPopover, props));
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
