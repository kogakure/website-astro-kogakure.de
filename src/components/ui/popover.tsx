import { Popover as PopoverPrimitive } from '@base-ui/react/popover';
import { cn } from '@/lib/utils';

/*
 * shadcn/ui's Popover on Base UI, restyled to the Gekiga tokens: the
 * reading paper with a hairline in the rule colour, a 1px corner and the
 * popover shadow (DESIGN.md, Elevation). It opens and closes at once.
 */

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
	return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
	return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverContent({
	className,
	align = 'end',
	alignOffset = 0,
	side = 'bottom',
	sideOffset = 8,
	...props
}: PopoverPrimitive.Popup.Props &
	Pick<PopoverPrimitive.Positioner.Props, 'align' | 'alignOffset' | 'side' | 'sideOffset'>) {
	return (
		<PopoverPrimitive.Portal>
			<PopoverPrimitive.Positioner
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
				collisionPadding={16}
				className="isolate z-50"
			>
				<PopoverPrimitive.Popup
					data-slot="popover-content"
					className={cn(
						'z-50 flex max-h-(--available-height) w-[min(26rem,calc(100vw-2*var(--gutter)))] flex-col overflow-y-auto rounded-hairline border border-rule bg-popover px-5 py-4 text-popover-foreground shadow-popover outline-hidden',
						className
					)}
					{...props}
				/>
			</PopoverPrimitive.Positioner>
		</PopoverPrimitive.Portal>
	);
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
	return (
		<PopoverPrimitive.Title
			data-slot="popover-title"
			className={cn(
				'm-0 mb-1.5 font-mono text-[0.875rem] font-normal text-text-3',
				className
			)}
			{...props}
		/>
	);
}

export { Popover, PopoverContent, PopoverTitle, PopoverTrigger };
