import { afterEach } from 'vitest';

// DOM helpers only exist in the happy-dom environment
if (typeof window !== 'undefined') {
	await import('@testing-library/jest-dom/vitest');

	afterEach(() => {
		document.body.innerHTML = '';
	});
}
