import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadEvent, EVENTS, trackEvent } from './analytics';

describe('downloadEvent', () => {
	it('names the file of a download link', () => {
		expect(downloadEvent('/downloads/iga-ninja-font.zip')).toEqual({
			'data-umami-event': EVENTS.download,
			'data-umami-event-file': 'iga-ninja-font.zip',
		});
		expect(downloadEvent('/downloads/iga-ninja-font.zip?v=2')?.['data-umami-event-file']).toBe(
			'iga-ninja-font.zip'
		);
	});

	it('leaves the downloads page and other links alone', () => {
		expect(downloadEvent('/downloads/')).toBeUndefined();
		expect(downloadEvent('/en/downloads/')).toBeUndefined();
		expect(downloadEvent('/kamae/')).toBeUndefined();
		expect(downloadEvent('https://example.com/downloads/a.zip')).toBeUndefined();
	});
});

describe('trackEvent', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('hands the event to Umami', () => {
		const track = vi.fn<(name: string, data?: object) => void>();
		vi.stubGlobal('umami', { track });
		trackEvent(EVENTS.mode, { mode: 'dark' });
		expect(track).toHaveBeenCalledWith('mode-switch', { mode: 'dark' });
	});

	it('does nothing without Umami and never throws', () => {
		expect(() => trackEvent(EVENTS.language, { from: 'de', to: 'en' })).not.toThrow();
		vi.stubGlobal('umami', {
			track: () => {
				throw new Error('blocked');
			},
		});
		expect(() => trackEvent(EVENTS.search)).not.toThrow();
	});
});
