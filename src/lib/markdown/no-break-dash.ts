import { defineHastPlugin } from 'satteri';
import { text } from './context.ts';

/**
 * A no-break space before a spaced dash keeps the dash at the end of the line
 * („Inrō – Reiseapotheke“ broke before the dash in the stress test, SI-465).
 */
export const noBreakDash = (value: string): string => value.replace(/ +([–—])/g, ' $1');

export const hastNoBreakDash = () =>
	defineHastPlugin({
		name: 'no-break-dash',
		text(node) {
			const value = noBreakDash(node.value);
			if (value !== node.value) return text(value);
		},
	});
