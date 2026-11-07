/**
 * No URL of the old site breaks (SI-478): every path in scripts/old-urls.txt
 * answers 200, or 301 to the page given after `→`, which answers 200. Paths
 * marked `! SI-…` aren't there yet and only show up as pending.
 *
 * Against the production image, which serves the redirects (nginx.conf):
 *
 *   pnpm docker:build && pnpm docker:run
 *   pnpm check:old-urls                             # http://localhost:8080
 *   pnpm check:old-urls https://www.kogakure.de     # after the launch
 */
import fs from 'node:fs';

interface Expected {
	path: string;
	/** Where a 301 leads; none for a 200 */
	target?: string;
	/** The issue that brings a path that isn't there yet */
	pending?: string;
}

const base = (process.argv[2] ?? 'http://localhost:8080').replace(/\/$/, '');

const expected: Expected[] = fs
	.readFileSync(new URL('old-urls.txt', import.meta.url), 'utf8')
	.split('\n')
	.map((line) => line.trim())
	.filter((line) => line && !line.startsWith('#'))
	.map((line) => {
		const [path = '', rest = ''] = line.split(/\s+(?=[→!])/);
		if (rest.startsWith('→')) return { path, target: rest.slice(1).trim() };
		if (rest.startsWith('!')) return { path, pending: rest.slice(1).trim() };
		return { path };
	});

const status = async (path: string) => {
	const response = await fetch(`${base}${path}`, { redirect: 'manual' });
	await response.body?.cancel();
	return response;
};

async function check({ path, target, pending }: Expected): Promise<string | undefined> {
	const response = await status(path);
	if (pending) return response.status === 200 ? undefined : `pending (${pending})`;
	if (!target) return response.status === 200 ? undefined : `${response.status}, expected 200`;
	const location = response.headers.get('location');
	const to = location ? new URL(location, `${base}${path}`).pathname : undefined;
	if (response.status !== 301 || to !== target)
		return `${response.status} → ${to ?? '–'}, expected 301 → ${target}`;
	const landing = await status(target);
	return landing.status === 200 ? undefined : `${target} answers ${landing.status}`;
}

const results: { path: string; problem: string | undefined; pending: boolean }[] = [];
for (let i = 0; i < expected.length; i += 10) {
	const batch = expected.slice(i, i + 10);
	results.push(
		...(await Promise.all(
			batch.map(async (entry) => ({
				path: entry.path,
				problem: await check(entry).catch((error: Error) => error.message),
				pending: Boolean(entry.pending),
			}))
		))
	);
}

const failed = results.filter(({ problem, pending }) => problem && !pending);
const waiting = results.filter(({ problem, pending }) => problem && pending);
for (const { path, problem } of [...failed, ...waiting]) console.log(`${path}: ${problem}`);
console.log(
	`${results.length} old URLs against ${base}: ${results.length - failed.length - waiting.length} fine, ` +
		`${failed.length} broken, ${waiting.length} pending`
);
if (failed.length > 0) process.exit(1);
