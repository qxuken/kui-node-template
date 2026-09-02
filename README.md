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

Publish a new version with `npm version <x.y.z> && npm publish` (the
registry is in `publishConfig`; a `write:packages` token in `~/.npmrc`).
`npm create` only accepts registry names, so test an unpublished checkout with
`node /path/to/kui-node-template/index.mjs demo` (same code path as the bin).
