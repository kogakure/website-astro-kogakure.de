import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
	it('joins class names and drops falsy values', () => {
		const active = false;
		expect(cn('a', active && 'b', undefined, 'c')).toBe('a c');
	});

	it('lets the last conflicting Tailwind utility win', () => {
		expect(cn('p-2 text-sm', 'p-4')).toBe('text-sm p-4');
	});
});
