# kui app

JSX views lowered into [kui](https://drydock9.qxuken.dev/qxuken/kui)'s IR,
Elm-style messages as data, a real window from Node.

```
npm install        # @qxuken/kui comes from the registry in .npmrc, prebuilt addon included
npm start          # window
npm run headless   # one frame + a click, no window
npm run typecheck
```

On Linux the prebuilt addon links ALSA for audio, so `libasound2` has to be
installed (`libasound2t64` on trixie and newer); without it even
`npm run headless` dies at dlopen, before any app code runs. macOS and
Windows need nothing extra.

`src/app.tsx` holds the model, `update` and `view`; `src/main.tsx` opens the
window and `src/headless.tsx` drives the same app without one.
`src/kui.d.ts` is types only.

Messages are typed end to end, under two names in `src/app.tsx`. `Msg` is
what this app's nodes send — the `onClick` payloads. `AnyMsg` widens it with
`CoreMsg`, what the core sends by itself (`changed`, `submit`, `key`,
`hover`, `drag`, `modifiers`, `resize`, `sound`), and is what the loop
delivers: `runWindowed<Model, AnyMsg>` and `App<Model, AnyMsg>` carry it
through to `update`, events and `dispatch`, so `update` is one switch over
`msg.kind` with no casts. `CoreMsg` itself is named once, next to `AnyMsg`.

The JSX payload props are the one place the union cannot be inferred: props
are global, so `onClick` takes the wire shape (any plain data) unless the
app registers its own. `src/kui.d.ts` registers `Msg` and nothing else,
which is what makes `onClick={{ kind: 'add', by: 1 }}` checked at the node
with no wrapper call. Delete the file and the rest still compiles; payloads
just accept any plain data again.
