import axe, { type Result, type RunOptions } from 'axe-core';

/**
 * Renders the HTML into the test document and returns the axe violations.
 * Iframe scanning is off (happy-dom has no cross-frame messaging), and so is
 * the `region` rule, which only makes sense for whole pages.
 */
export async function axeViolations(html: string, options: RunOptions = {}): Promise<Result[]> {
	document.body.innerHTML = html;
	const results = await axe.run(document.body, {
		iframes: false,
		...options,
		rules: { region: { enabled: false }, ...options.rules },
	});
	return results.violations;
}

/** Formats violations for a readable test failure. */
export function describeViolations(violations: Result[]): string {
	return violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length}×)`).join('\n');
}
