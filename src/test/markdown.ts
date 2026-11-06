import { markdownToHtml, type HastPluginList, type MarkdownToHtmlResult } from 'satteri';
import { MARKDOWN_FEATURES } from '@/lib/markdown';

/**
 * Renders Markdown like a book page of `lang`, with only the given plugins.
 * Synchronous, because the book's plugins are.
 */
export const renderMarkdown = (markdown: string, plugins: HastPluginList, lang = 'de'): string =>
	(
		markdownToHtml(markdown, {
			features: MARKDOWN_FEATURES,
			hastPlugins: plugins,
			fileURL: new URL(`file:///site/src/content/book/${lang}/page.md`),
		}) as MarkdownToHtmlResult
	).html;
