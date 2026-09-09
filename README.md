# create-kui-node

The `npm create` initializer for kui Node apps. Published to the Forgejo npm
registry, so point npm there once (per user, or per project with an
`.npmrc`) and scaffold:

```
npm config set @qxuken:registry https://drydock9.qxuken.dev/api/packages/qxuken/npm/
npm create @qxuken/kui-node my-app
cd my-app && npm install && npm start
```

The registry is scoped on purpose: Forgejo does not proxy npmjs, so a plain
`registry=` line would send esbuild and typescript there too and fail. Only
`@qxuken/*` resolves from Forgejo; everything else keeps coming from npmjs.

`template/` is copied verbatim; `_gitignore` and `_npmrc` become the
dotfiles npm would otherwise drop from the tarball, and the package name is
taken from the directory. The generated `.npmrc` keeps `@qxuken/kui`
resolving from the same registry.

`template/package.json` pins the minimum `@qxuken/kui` the scaffold needs,
so a template change that uses a new kui API waits on that kui release:
publish the library version first, then push the tag here — CI installs the
scaffold for real and cannot resolve an unpublished floor.

A floor is all it is. `^0.1.0-alpha.10` admits every later alpha of the same
`0.1.0`, and so does `~0.1.0-alpha.10` — npm's semver treats both the same way
for prereleases of one version tuple, so neither spelling pins one. That is
what a scaffold wants; an app that wants the kui it tested against edits that
line to an exact version (`"0.1.0-alpha.10"`) and commits `package-lock.json`,
which is what holds the version either way.

Where that floor has floated to is `npm view @qxuken/kui version`. It answers
from alpha.9 on: every alpha now takes the `latest` dist-tag as well as
`alpha`, so `npm outdated` sees the package too. Before that there was only
`alpha`, and both commands printed nothing and exited 0 — silence that reads
as "no such release" and meant "wrong tag".

Releases are tags: `npm version <x.y.z>` (commits and tags `v<x.y.z>`), then
`git push --follow-tags`. CI scaffolds and runs an app on every push and,
on a `v*` tag, publishes to the registry with the `PACKAGES_TOKEN` secret.
`npm publish` also works by hand with a `write:packages` token in `~/.npmrc`.
`npm create` only accepts registry names, so test an unpublished checkout with
`node /path/to/kui-node-template/index.mjs demo` (same code path as the bin).
