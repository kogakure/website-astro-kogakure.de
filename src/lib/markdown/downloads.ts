import { defineHastPlugin } from 'satteri';
import { downloadEvent } from '../analytics/analytics.ts';

/** Links to a file in `/downloads/` carry Umami's event attributes: a click counts as a download */
export const hastDownloads = () =>
	defineHastPlugin({
		name: 'downloads',
		element: {
			filter: ['a'],
			visit(node, ctx) {
				const href = node.properties.href;
				const event = typeof href === 'string' ? downloadEvent(href) : undefined;
				if (!event) return;
				for (const [name, value] of Object.entries(event))
					ctx.setProperty(node, name, value);
			},
		},
	});
