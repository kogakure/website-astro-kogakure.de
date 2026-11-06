import { defineHastPlugin } from 'satteri';

/** Han and kana are read per character, everything else per word */
const CHARACTER = /[぀-ヿ㐀-鿿豈-﫿]/gu;
const CHARACTERS_PER_MINUTE = 500;
const WORDS_PER_MINUTE = 220;

/** Minutes to read a text, at least 1 */
export function readingMinutes(content: string): number {
	const characters = content.match(CHARACTER)?.length ?? 0;
	const words = content.replace(CHARACTER, ' ').match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
	return Math.max(1, Math.round(characters / CHARACTERS_PER_MINUTE + words / WORDS_PER_MINUTE));
}

/** Writes `minutesRead` into the page's frontmatter (`remarkPluginFrontmatter`) */
export const hastReadingTime = () =>
	defineHastPlugin({
		name: 'reading-time',
		before(root, ctx) {
			const astro = ctx.data.astro as { frontmatter: Record<string, unknown> } | undefined;
			if (astro) astro.frontmatter.minutesRead = readingMinutes(ctx.textContent(root));
		},
	});
