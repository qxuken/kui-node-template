# create-kui-node

Scaffolds a [kui](https://github.com/qxuken/kui) app for Node: JSX views
drawn with Kit, kui's UI kit; Elm-style messages as data; and a real
native window — no browser, no React.

```
npm create @qxuken/kui-node my-app
cd my-app
npm install
npm start
```

That opens a window with a counter, a text field and a context menu, all
Kit components. Nothing to configure first: the initializer and
[`@qxuken/kui`](https://www.npmjs.com/package/@qxuken/kui) both come from
npm, and npm installs kui's native addon prebuilt for the machine it runs
on.

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
headless one is how the app is tested. The view places Kit's components
(`Toolbar`, `Button`, `Stat`, `TextField`, `Menu`, `Statusbar`, …) from
`@qxuken/kui/kit`, and Kit, a Lua extension, is loaded on the window
before its first frame. The generated README walks through what the
counter demonstrates — Kit's skins, a modal context menu, accessibility
names, the OS's light and dark, reduced motion, `teardown` on quit — and
the reference ships with the library: `props.md` for the core,
`kit/reference.md` for Kit, `howto.md` beside them.

The [kui runner](https://www.npmjs.com/package/@qxuken/kui-cli) (`kui
new`, `kui run`) is the other way to build a kui app with Kit: in Lua or
Teal, with no Node. This initializer is for an app on the Node API.

## Requirements

- Node 20 or newer.
- One of the platforms the addon is prebuilt for: linux-x64, linux-arm64
  (glibc 2.28 or newer), darwin-arm64, win32-x64. `@qxuken/kui` names
  them as optional dependencies (`@qxuken/kui-<platform>`), so an install
  with `--omit=optional`, or from a lockfile written on another OS, has no
  addon and says how to fix it. Anywhere else, build `kui-node` from the
  [kui repository](https://github.com/qxuken/kui) and point `KUI_NODE_LIB`
  at the result.
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
as a range: `^0.1.0-alpha.68`. A floor is all that is. Every kui release
so far is an alpha, and both `^0.1.0-alpha.68` and `~0.1.0-alpha.68` admit
every later alpha of the same `0.1.0` — npm's semver treats the two alike
for prereleases of one version tuple — so a fresh scaffold installs the
newest. An app that wants the kui it tested against edits the line to an
exact version (`"0.1.0-alpha.68"`) and commits `package-lock.json`, which
is what holds the version either way. `npm view @qxuken/kui version` says
where the floor has floated to.

## Versions before npmjs

npmjs has the initializer from 0.14.1 and `@qxuken/kui` from
0.1.0-alpha.35. The Forgejo npm registry the project grew up on holds the
earlier versions and takes no new ones: it stops at the initializer's
0.16.0 and kui's 0.1.0-alpha.67. To use it, scope it — Forgejo does not
proxy npmjs, so a plain `registry=` line would send esbuild and typescript
there too and fail:

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
then `git push --follow-tags origin main`. One GitHub workflow,
[release.yml](.github/workflows/release.yml), scaffolds, installs, runs
headless and typechecks on every push and pull request; on a `v*` tag it
then publishes to npmjs.

The publish uses npm's trusted publishing, so there is no token to keep:
the job asks GitHub for an OIDC token and npm trades it for a short-lived
one, and the version goes live with provenance, no approval step. It
needs the package's trusted publisher set once, on npmjs.com →
`@qxuken/create-kui-node` → Settings → Trusted Publisher: GitHub Actions,
organization or user `qxuken`, repository `kui-node-template`, workflow
`release.yml`. A version npmjs already holds is left alone, so a re-run
of a tag is safe.
