# create-kui-node

Scaffolds a [kui](https://github.com/qxuken/kui) app for Node: JSX views,
Elm-style messages as data, and a real native window — no browser, no
React.

```
npm create @qxuken/kui-node my-app
cd my-app
npm install
npm start
```

That opens a window with a counter, a text field and a context menu.
Nothing to configure first: the initializer and
[`@qxuken/kui`](https://www.npmjs.com/package/@qxuken/kui) both come from
npm, and kui's native addon arrives prebuilt inside the package.

## What you get

```
my-app/
  src/app.tsx        the model, `update` and `view`
  src/main.tsx       opens the window around them
  src/headless.tsx   drives the same app without a window, as a test would
  src/kui.d.ts       types only: registers the app's message type with JSX
  package.json       esbuild for the JSX, typescript for `npm run typecheck`
  tsconfig.json
  README.md          a tour of everything the scaffold shows
```

| script | does |
|---|---|
| `npm start` | builds and opens the window |
| `npm start -- --motion reduced` | the same window, as a user who asked for less motion |
| `npm run headless` | drives the app frame by frame with no window, and exits non-zero on a warning |
| `npm run typecheck` | `tsc` over `src/` |

The app is one `update` over plain-data messages and one `view` that
declares the frame from scratch, and both drivers run the same pair: the
headless one is how the app is tested. The generated README walks through
what the counter demonstrates — a modal context menu, accessibility names,
the OS's light and dark and accent colour, reduced motion, `teardown` on
quit — and the full prop and event reference ships with the library as
`node_modules/@qxuken/kui/props.md`, with `howto.md` beside it.

## Requirements

- Node 20 or newer.
- One of the platforms the addon is prebuilt for: linux-x64, linux-arm64,
  darwin-arm64, darwin-x64, win32-x64. Anywhere else, build `kui-node` from
  the [kui repository](https://github.com/qxuken/kui) and point
  `KUI_NODE_LIB` at the result.
- On Linux, ALSA's runtime library (`libasound2`, or `libasound2t64` on
  Debian trixie and Ubuntu 24.04 onward): the addon links it for audio, and
  without it even `npm run headless` fails at load. A window also needs a
  font and the usual X11 or Wayland client libraries. macOS and Windows
  need nothing extra.

`npm create @qxuken/kui-node` with no directory makes `kui-app`; the
package name is taken from the directory, and a directory that exists and
is not empty is refused.

## The kui version

`template/package.json` names the minimum `@qxuken/kui` the scaffold needs,
as a range: `^0.1.0-alpha.35`. A floor is all that is. Every kui release
so far is an alpha, and both `^0.1.0-alpha.35` and `~0.1.0-alpha.35` admit
every later alpha of the same `0.1.0` — npm's semver treats the two alike
for prereleases of one version tuple — so a fresh scaffold installs the
newest. An app that wants the kui it tested against edits the line to an
exact version (`"0.1.0-alpha.35"`) and commits `package-lock.json`, which
is what holds the version either way. `npm view @qxuken/kui version` says
where the floor has floated to.

## Versions before npmjs

npmjs has the initializer from 0.14.1 and `@qxuken/kui` from
0.1.0-alpha.35. Every version of both, the earlier ones included, is on
the Forgejo npm registry the project grew up on. To use that one, scope
it — Forgejo does not proxy npmjs, so a plain `registry=` line would send
esbuild and typescript there too and fail:

```
npm config set @qxuken:registry https://drydock9.qxuken.dev/api/packages/qxuken/npm/
```

## Working on the template

`template/` is copied verbatim; `_gitignore` becomes the `.gitignore` npm
would otherwise drop from the tarball. `npm create` only accepts registry
names, so test a checkout with `node /path/to/kui-node-template/index.mjs
demo` — the same code path as the bin.

A template change that uses a new kui API waits on that kui release:
publish the library first, then tag here. CI installs the scaffold for
real and cannot resolve a floor that is not published.

Releases are tags: `npm version <x.y.z>` (commits and tags `v<x.y.z>`),
then `git push --follow-tags origin main`. The tag runs two pipelines:

- **Forgejo**, [ci.yml](.forgejo/workflows/ci.yml): scaffolds, installs,
  runs headless and typechecks on every push, and on a `v*` tag publishes
  to the Forgejo npm registry with the `PACKAGES_TOKEN` secret.
- **GitHub**, [release.yml](.github/workflows/release.yml): the same check,
  then the package staged on npmjs with the `NPM_TOKEN` secret, a granular
  token for the `@qxuken` scope that can stage and not publish.

A staged version is hidden until a maintainer with 2FA approves it, with
npm 11.15 or newer (`npm install -g npm@11`):

```
npm stage list @qxuken/create-kui-node
npm stage approve <stage-id>        # opens npmjs in the browser for the 2FA step
npm view @qxuken/create-kui-node dist-tags
```

The first version staged creates the package with a `0.0.0-stage`
placeholder holding `latest`. `npm create` installs `latest`, so check the
last command's answer: if it does not read the approved version, `npm
dist-tag add @qxuken/create-kui-node@<version> latest` moves it.
