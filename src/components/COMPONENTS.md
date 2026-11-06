# Components

Pages are built only from these components. Add every new component here, with its folder, purpose and props.

## `site/`: Astro components for the site's structure

| Component        | Purpose                                         | Props                                                    |
| ---------------- | ----------------------------------------------- | -------------------------------------------------------- |
| `SkipLink.astro` | First focusable link; jumps to the main content | `label` (required, localised), `target` (default `main`) |

## `ui/`: shadcn/ui on Base UI

None yet. Add with `pnpm dlx shadcn@latest add <name>` and restyle to the design tokens (no rounded corners, no cards).
