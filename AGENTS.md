# AGENTS.md

A static Create React App site (TypeScript, Redux Toolkit, MUI) with no backend. Its data is JSON
in `public/`. See `README.md` for what the site does and how its data files are shaped.

## Package manager: Bun

- Use Bun (pinned by `"packageManager": "bun@1.4.5"` in `package.json`). Don't use yarn or npm,
  and don't commit a `yarn.lock` or `package-lock.json`: `bun.lock` is the only lockfile.
- `bun install` to install, `bun add <pkg>` / `bun add -d <pkg>` to add a dependency.
- Run this project's `build` and `test` scripts with `bun run build` and `bun run test`. A bare
  `bun build` or `bun test` runs Bun's own bundler or test runner instead.
- `bun start`, `bun images`, `bun details`, `bun ingredients` and `bun places` are safe without
  `run`, since Bun has no built-in commands with those names.
- Bun blocks dependency postinstall scripts it doesn't trust. The only ones blocked are core-js's
  donation banners, which the build doesn't need. Don't `bun pm trust` them.

## Runtimes

- The data scripts in `scripts/` run on Bun (`bun scripts/<file>.js`). `bun details --chrome`
  relies on Bun's built-in `WebSocket`.
- `react-scripts` (`start`, `build`, `test`) still runs on Node through its `#!/usr/bin/env node`
  shebang, so Node 20+ must be installed for those.

## Map

- The places map imports MapLibre's CSP build (`maplibre-gl/dist/maplibre-gl-csp`). The
  `prestart` and `prebuild` scripts copy its worker into `public/` (gitignored). Don't switch back
  to the plain `maplibre-gl` import: CRA's Babel breaks its inlined worker in production builds
  ("_ is not defined"), although `bun start` works fine.

## Checking a change

- `bun run build` must pass. There are no test files, so `bun run test` exits with "No tests
  found"; that isn't a failure you caused.
- The data scripts only fetch recipes that are missing data, so running them without `--force`
  changes nothing when everything is up to date.

## Deploy and CI

- Cloudflare Workers Builds deploys every push to `main` as a static-assets Worker. `wrangler.jsonc`
  holds its build command and points it at `build/`, with single-page-app fallback.
- The site is served only at `recipes.alexander-rw.com`, a custom domain declared in `wrangler.jsonc`
  (`workers_dev` is off). Cloudflare owns that hostname's DNS record, so don't add one by hand.
- `.github/workflows/fetch-recipes.yml` runs when `public/recipes-dinner.json` changes. It runs
  `bun images` and `bun details --chrome` and commits what they fetch.
- When changing how the project is installed, built or run, update `wrangler.jsonc`, the workflow,
  `README.md` and this file together.
