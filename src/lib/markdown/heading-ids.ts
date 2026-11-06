import { defineHastPlugin } from 'satteri';

/**
 * A URL fragment in any script: Latin loses its diacritics (`Kōga` → `koga`,
 * German umlauts as `ae`/`oe`/`ue`), other scripts keep their letters.
 */
export function headingId(heading: string): string {
	const id = heading
		.toLowerCase()
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/ß/g, 'ss')
		.normalize('NFKD')
		.replace(/[̀-ͯ]/g, '')
		.normalize('NFC')
		.replace(/[^\p{L}\p{N}]+/gu, '-')
		.replace(/^-|-$/g, '');
	return id || 'section';
}

/**
 * Ids for h2–h6, unique within the page (`-2`, `-3` for repeated headings).
 * A factory: Sätteri calls it once per document, so each page starts fresh.
 */
export const hastHeadingIds = () => {
	const used = new Set<string>();
	return defineHastPlugin({
		name: 'heading-ids',
		element: {
			filter: ['h2', 'h3', 'h4', 'h5', 'h6'],
			visit(node, ctx) {
				const base = headingId(ctx.textContent(node));
				let id = base;
				for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
				used.add(id);
				ctx.setProperty(node, 'id', id);
			},
		},
	});
};
