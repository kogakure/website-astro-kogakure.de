import { axeViolations, describeViolations } from '@/test/a11y';
import { renderAstro } from '@/test/render';
import { describe, expect, it } from 'vitest';
import MotionList from './MotionList.astro';
import { MOTION } from './tokens';

describe('MotionList', () => {
	it('draws the curve of an easing and a track as long as each duration', async () => {
		const html = await renderAstro(MotionList, { title: 'Bewegung', tokens: MOTION });
		expect(html).toContain('d="M0 1 C0.16 0 0.3 0 1 0"');
		expect(html.match(/class="curve"/g)).toHaveLength(3);
		expect(html.match(/class="track"/g)).toHaveLength(MOTION.length);
		expect(html).toContain('--ms: 3400ms; --share: 1; --easing: var(--ease-rest)');
		expect(html).toContain('--ms: 300ms; --share: 0.08823529411764706');
	});

	it('has no accessibility violations', async () => {
		const html = await renderAstro(MotionList, { title: 'Bewegung', tokens: MOTION });
		const violations = await axeViolations(html);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
