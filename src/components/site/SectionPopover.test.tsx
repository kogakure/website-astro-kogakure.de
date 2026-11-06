// @vitest-environment happy-dom
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations, describeViolations } from '@/test/a11y';
import SectionPopover from './SectionPopover';

const props = {
	heading: 'Abschnitte',
	sections: [
		{ id: 'eins', text: 'Was ist Ninjutsu?' },
		{ id: 'zwei', text: 'Die Schriftzeichen' },
	],
	countLabel: '2 Abschnitte',
	positionLabels: ['Abschnitt 1 von 2', 'Abschnitt 2 von 2'],
};

describe('SectionPopover', () => {
	it('shows the count before the first section', () => {
		render(<SectionPopover {...props} />);
		expect(screen.getByRole('button')).toHaveTextContent('2 Abschnitte');
	});

	it('follows the reading position', () => {
		render(<SectionPopover {...props} />);
		act(() => {
			dispatchEvent(new CustomEvent('sectionchange', { detail: { index: 1, total: 2 } }));
		});
		expect(screen.getByRole('button')).toHaveTextContent('Abschnitt 2 von 2');
	});

	it('opens the sections, marks the current one and closes when one is chosen', async () => {
		render(<SectionPopover {...props} />);
		act(() => {
			dispatchEvent(new CustomEvent('sectionchange', { detail: { index: 0, total: 2 } }));
		});
		fireEvent.click(screen.getByRole('button'));
		const link = await screen.findByRole('link', { name: 'Was ist Ninjutsu?' });
		expect(link).toHaveAttribute('href', '#eins');
		expect(link).toHaveAttribute('aria-current', 'location');
		expect(screen.getByText('Abschnitte')).toBeInTheDocument();
		fireEvent.click(link);
		await act(async () => {});
		expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
	});

	it('has no accessibility violations', async () => {
		const { container } = render(<SectionPopover {...props} />);
		const violations = await axeViolations(container.innerHTML);
		expect(violations, describeViolations(violations)).toHaveLength(0);
	});
});
