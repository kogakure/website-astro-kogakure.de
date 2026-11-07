/**
 * Screenshot tests (SI-481) with the browser in the official Playwright
 * image, so the baselines are rendered on Linux on every machine and in CI.
 * The tests run here and drive the browser over a WebSocket; the browser
 * reaches the preview server through Playwright's tunnel (exposeNetwork in
 * playwright.screenshots.config.ts). The image's version is the installed
 * @playwright/test's.
 *
 *   pnpm build
 *   pnpm test:screenshots                       # compare with the baselines
 *   pnpm test:screenshots --update-snapshots    # write new baselines
 *
 * Arguments go on to `playwright test`.
 */
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';

const { version } = JSON.parse(
	fs.readFileSync(
		new URL('../node_modules/@playwright/test/package.json', import.meta.url),
		'utf8'
	)
) as { version: string };
const image = `mcr.microsoft.com/playwright:v${version}-noble`;
const name = 'kogakure-screenshots';
const port = 4339;

const docker = (...args: string[]) => execFileSync('docker', args, { stdio: 'inherit' });

/** Stops the browser; never fails, so the tests' exit code stands */
const stop = () => spawnSync('docker', ['rm', '--force', name], { stdio: 'ignore' });

const ready = async () => {
	for (let i = 0; i < 120; i++) {
		try {
			await fetch(`http://127.0.0.1:${port}/`);
			return;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 1000));
		}
	}
	spawnSync('docker', ['logs', name], { stdio: 'inherit' });
	throw new Error(`The browser in ${image} didn't answer on port ${port}`);
};

// A container left behind by an interrupted run would hold the name and the port
stop();
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
	process.on(signal, () => {
		stop();
		process.exit(130);
	});
}

docker(
	'run',
	'--detach',
	'--rm',
	'--init',
	'--name',
	name,
	'--publish',
	`127.0.0.1:${port}:${port}`,
	// The CI runners' architecture, emulated on Apple silicon: the same build of Chromium everywhere
	'--platform',
	'linux/amd64',
	'--user',
	'pwuser',
	'--workdir',
	'/home/pwuser',
	image,
	'/bin/sh',
	'-c',
	`npx -y playwright@${version} run-server --port ${port} --host 0.0.0.0`
);

let code = 1;
try {
	await ready();
	code = await new Promise<number>((resolve) => {
		spawn(
			'pnpm',
			[
				'exec',
				'playwright',
				'test',
				'--config',
				'playwright.screenshots.config.ts',
				...process.argv.slice(2),
			],
			{
				stdio: 'inherit',
				env: { ...process.env, SCREENSHOT_BROWSER: `ws://127.0.0.1:${port}/` },
			}
		).on('exit', (exit) => resolve(exit ?? 1));
	});
} finally {
	stop();
}
process.exit(code);
