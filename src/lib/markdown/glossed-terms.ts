import type { Element, ElementContent } from 'hast';
import { defineHastPlugin } from 'satteri';
import { element, text } from './context.ts';

const CJK = '[\\u3040-\\u30ff\\u3400-\\u9fff\\uf900-\\ufaff々〆〇]+';
const OPENING = new RegExp(`^ \\((${CJK})(\\)|, )`);

/**
 * Turns `<em>term</em> (漢字, <q>meaning</q>)` in running text into a gloss
 * the design can set inline or in the margin (ported from the prototype's
 * `Glossed.astro`):
 *
 *   <em>term</em><span class="gloss">
 *     <span class="gloss-term" aria-hidden="true">term</span>
 *     <span class="gloss-kanji" lang="ja">漢字</span>
 *     <span class="gloss-meaning"><q>meaning</q></span>
 *   </span>
 *
 * A screen reader hears „tengu 天狗 Himmelhund“; the repeated term is hidden
 * from it. Only paragraphs: captions keep their kanji inline. Terms that are
 * not italic (Hebrew, Korean) and Japanese (no romanization) get no gloss.
 */
export const hastGlossedTerms = () =>
	defineHastPlugin({
		name: 'glossed-terms',
		element: {
			filter: ['p'],
			visit(node, ctx) {
				const children = glossChildren(node.children);
				if (children) ctx.replaceNode(node, { ...node, children });
			},
		},
	});

/** The paragraph's children with glosses, or undefined if it has none */
export function glossChildren(children: readonly ElementContent[]): ElementContent[] | undefined {
	const result: ElementContent[] = [];
	let changed = false;
	for (let i = 0; i < children.length; i++) {
		const child = children[i];
		if (!child) continue;
		const gloss =
			child.type === 'element' && child.tagName === 'em' ? readGloss(children, i) : undefined;
		if (!gloss) {
			result.push(child);
			continue;
		}
		const term = (child as Element).children
			.map((c) => (c.type === 'text' ? c.value : ''))
			.join('');
		result.push(
			child,
			element('span', { className: ['gloss'] }, [
				element('span', { className: ['gloss-term'], ariaHidden: 'true' }, [text(term)]),
				text(' '),
				element('span', { className: ['gloss-kanji'], lang: 'ja' }, [text(gloss.kanji)]),
				...(gloss.meaning.length > 0
					? [text(' '), element('span', { className: ['gloss-meaning'] }, gloss.meaning)]
					: []),
			])
		);
		if (gloss.rest) result.push(text(gloss.rest));
		i = gloss.last;
		changed = true;
	}
	return changed ? result : undefined;
}

interface Gloss {
	kanji: string;
	meaning: ElementContent[];
	/** Text after the closing parenthesis */
	rest: string;
	/** Index of the last child the gloss consumed */
	last: number;
}

function readGloss(children: readonly ElementContent[], emIndex: number): Gloss | undefined {
	const next = children[emIndex + 1];
	if (next?.type !== 'text') return undefined;
	const match = OPENING.exec(next.value);
	if (!match) return undefined;
	const kanji = match[1] ?? '';
	let remainder = next.value.slice(match[0].length);
	if (match[2] === ')') return { kanji, meaning: [], rest: remainder, last: emIndex + 1 };

	// The meaning: text and <q> up to the closing parenthesis, no nested parentheses
	const meaning: ElementContent[] = [];
	for (let i = emIndex + 1; i < children.length; i++) {
		if (i > emIndex + 1) {
			const node = children[i];
			if (node?.type === 'element' && node.tagName === 'q') {
				meaning.push(node);
				continue;
			}
			if (node?.type !== 'text') return undefined;
			remainder = node.value;
		}
		const close = remainder.indexOf(')');
		const open = remainder.indexOf('(');
		if (open !== -1 && (close === -1 || open < close)) return undefined;
		if (close === -1) {
			if (remainder) meaning.push(text(remainder));
			continue;
		}
		if (close > 0) meaning.push(text(remainder.slice(0, close)));
		return { kanji, meaning, rest: remainder.slice(close + 1), last: i };
	}
	return undefined;
}
