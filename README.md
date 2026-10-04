# create-kui-node

The `npm create` initializer for kui Node apps, on npmjs from 0.14.0:

```
npm create @qxuken/kui-node my-app
cd my-app && npm install && npm start
```

Nothing to configure: the initializer and `@qxuken/kui` (from
0.1.0-alpha.35) both come from npmjs, so a scaffolded app carries no
`.npmrc`. The Forgejo npm registry holds every version of both, earlier
ones included; a project that wants those scopes it by hand with
`npm config set @qxuken:registry https://drydock9.qxuken.dev/api/packages/qxuken/npm/`
— scoped because Forgejo does not proxy npmjs, so a plain `registry=` line
would send esbuild and typescript there too and fail.

`template/` is copied verbatim; `_gitignore` becomes the dotfile npm would
otherwise drop from the tarball, and the package name is taken from the
directory.

`template/package.json` pins the minimum `@qxuken/kui` the scaffold needs,
so a template change that uses a new kui API waits on that kui release:
publish the library version first, then push the tag here — CI installs the
scaffold for real and cannot resolve an unpublished floor.

A floor is all it is. `^0.1.0-alpha.12` admits every later alpha of the same
`0.1.0`, and so does `~0.1.0-alpha.12` — npm's semver treats both the same way
for prereleases of one version tuple, so neither spelling pins one. That is
what a scaffold wants; an app that wants the kui it tested against edits that
line to an exact version (`"0.1.0-alpha.12"`) and commits `package-lock.json`,
which is what holds the version either way.

Where that floor has floated to is `npm view @qxuken/kui version`. It answers
from alpha.9 on: every alpha now takes the `latest` dist-tag as well as
`alpha`, so `npm outdated` sees the package too. Before that there was only
`alpha`, and both commands printed nothing and exited 0 — silence that reads
as "no such release" and meant "wrong tag".

Releases are tags: `npm version <x.y.z>` (commits and tags `v<x.y.z>`), then
`git push --follow-tags`. Forgejo's CI scaffolds and runs an app on every
push and, on a `v*` tag, publishes to the Forgejo registry with the
`PACKAGES_TOKEN` secret. The same tag on GitHub runs
`.github/workflows/release.yml`: the same check, then the package staged on
npmjs with the `NPM_TOKEN` secret, a granular token for the `@qxuken` scope
that can stage and not publish. A staged version is hidden until a
maintainer with 2FA approves it, with npm 11.15 or newer:

```
npm stage list @qxuken/create-kui-node
npm stage approve <stage-id>        # opens npmjs in the browser for the 2FA step
npm view @qxuken/create-kui-node dist-tags
```

The first version staged creates the package with a `0.0.0-stage`
placeholder holding `latest`; a plain version is staged as `latest` and
takes the tag when it is approved, and `npm dist-tag add
@qxuken/create-kui-node@<version> latest` moves it by hand if it has not.
`npm publish --registry <forgejo>` also works by hand with a
`write:packages` token in `~/.npmrc`.
`npm create` only accepts registry names, so test an unpublished checkout with
`node /path/to/kui-node-template/index.mjs demo` (same code path as the bin).
