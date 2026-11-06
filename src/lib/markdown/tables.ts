import { defineHastPlugin } from 'satteri';

/** Header cells of a table head get `scope="col"` */
export const hastTables = () =>
	defineHastPlugin({
		name: 'tables',
		element: {
			filter: ['th'],
			visit(node, ctx) {
				const row = ctx.parent(node);
				const section = row.type === 'element' ? ctx.parent(row) : undefined;
				if (section?.type === 'element' && section.tagName === 'thead')
					ctx.setProperty(node, 'scope', 'col');
			},
		},
	});
