/** subset-font ships no types: the options scripts/generate-fonts.ts uses */
declare module 'subset-font' {
	interface SubsetFontOptions {
		targetFormat?: 'sfnt' | 'woff' | 'woff2';
		variationAxes?: Record<string, number | { min: number; max: number; default?: number }>;
		keepFeatures?: string[];
		preserveNameIds?: number[];
		noLayoutClosure?: boolean;
	}

	export default function subsetFont(
		font: Buffer | Uint8Array,
		text: string,
		options?: SubsetFontOptions
	): Promise<Buffer>;
}
