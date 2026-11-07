/**
 * shadcn/ui's dialog on Base UI, restyled to the Gekiga tokens: the reading
 * paper on a veil of the page's ground, a hairline frame with a 1px corner,
 * the popover shadow, a short fade (none with reduced motion). Base UI traps
 * the focus, closes on Escape and a click outside and locks the scroll.
 */
import { Dialog as DialogPrimitive } from '@base-ui/react/dialog';
import { cn } from '@/lib/utils';

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
	return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
	return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({ className, ...props }: DialogPrimitive.Close.Props) {
	return (
		<DialogPrimitive.Close
			data-slot="dialog-close"
			className={cn(
				'cursor-pointer border-0 bg-transparent px-1 font-mono text-[0.9375rem] text-text-3 [min-block-size:2.75rem] hover:text-text',
				className
			)}
			{...props}
		/>
	);
}

const fade =
	'transition-opacity duration-(--duration-state) ease-out data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none';

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
	return (
		<DialogPrimitive.Backdrop
			data-slot="dialog-overlay"
			className={cn('fixed inset-0 z-50 bg-ground/85', fade, className)}
			{...props}
		/>
	);
}

/** The dialog's paper, in a portal over the veil; it has no close button of its own */
function DialogContent({ className, children, ...props }: DialogPrimitive.Popup.Props) {
	return (
		<DialogPortal>
			<DialogOverlay />
			<DialogPrimitive.Popup
				data-slot="dialog-content"
				className={cn(
					'fixed [inset-inline:0] z-50 mx-auto rounded-hairline border border-rule bg-ground-read text-text shadow-popover outline-none [inline-size:calc(100%-2*var(--gutter))]',
					fade,
					className
				)}
				{...props}
			>
				{children}
			</DialogPrimitive.Popup>
		</DialogPortal>
	);
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
	return (
		<DialogPrimitive.Title
			data-slot="dialog-title"
			className={cn('m-0 font-mono text-[0.9375rem] font-normal text-text-3', className)}
			{...props}
		/>
	);
}

export { Dialog, DialogClose, DialogContent, DialogOverlay, DialogPortal, DialogTitle };
