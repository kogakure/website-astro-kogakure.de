# 木隠 kogakure.de

The new website of 木隠 (_kogakure_), an online book about the ninja and ninjutsu, published since 1999. A static [Astro](https://astro.build/) site in twelve languages.

## Development

```sh
mise install          # Node and pnpm, versions in mise.toml
pnpm install
pnpm dev              # http://localhost:4321
```

Checks before a pull request:

```sh
pnpm check && pnpm test && pnpm build && pnpm test:e2e
```

More in [`AGENTS.md`](AGENTS.md) and [`docs/`](docs/).

## Deployment

The `Dockerfile` builds the site and serves it with nginx; it runs on Coolify.

```sh
pnpm docker:build && pnpm docker:run   # http://localhost:8080
```
