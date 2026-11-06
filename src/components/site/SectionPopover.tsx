/**
 * The position in an article, shown in the top bar when it comes back on
 * narrow screens: „Abschnitt 3 von 6“ with the seal, opening the sections
 * in a popover (shadcn/ui on Base UI: focus moves in, Escape and a click
 * outside close it, focus returns). Follows the reading position that
 * SectionList.astro reports (`sectionchange`). A section chosen closes it.
 */
import { useEffect, useState } from 'react';
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from '@/components/ui/popover';

export interface SectionPopoverProps {
	/** „Abschnitte“ */
	heading: string;
	sections: { id: string; text: string }[];
	/** „6 Abschnitte“: before the first section */
	countLabel: string;
	/** „Abschnitt 1 von 6“, … per section (islands take no functions) */
	positionLabels: string[];
}

export default function SectionPopover({
	heading,
	sections,
	countLabel,
	positionLabels,
}: SectionPopoverProps) {
	const [open, setOpen] = useState(false);
	const [current, setCurrent] = useState(-1);

	useEffect(() => {
		const follow = (event: Event) =>
			setCurrent((event as CustomEvent<{ index: number }>).detail.index);
		addEventListener('sectionchange', follow);
		// The list may have marked the position before this island hydrated: ask again
		dispatchEvent(new Event('sectionrequest'));
		return () => removeEventListener('sectionchange', follow);
	}, []);

	const label = current < 0 ? countLabel : (positionLabels[current] ?? countLabel);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger className="where">
				<span className="seal" aria-hidden="true" />
				<span>{label}</span>
			</PopoverTrigger>
			<PopoverContent>
				<PopoverTitle>{heading}</PopoverTitle>
				<ol className="where-list">
					{sections.map(({ id, text }, i) => (
						<li key={id}>
							<a
								href={`#${id}`}
								aria-current={i === current ? 'location' : undefined}
								onClick={() => setOpen(false)}
							>
								{text}
							</a>
						</li>
					))}
				</ol>
			</PopoverContent>
		</Popover>
	);
}
