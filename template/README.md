# kui app

JSX views lowered into [kui](https://drydock9.qxuken.dev/qxuken/kui)'s IR,
Elm-style messages as data, a real window from Node.

```
npm install        # @qxuken/kui comes from the registry in .npmrc, prebuilt addon included
npm start          # window
npm run headless   # a frame driven by hand, no window
npm run typecheck
```

`src/app.tsx` holds the model, `update` and `view`; `src/main.tsx` opens the
window and `src/headless.tsx` drives the same app without one.
`src/kui.d.ts` is types only.

On Linux the prebuilt addon links ALSA for audio, so `libasound2` has to be
installed (`libasound2t64` on trixie and newer); without it even
`npm run headless` dies at dlopen, before any app code runs. macOS and
Windows need nothing extra.

## Messages

`Msg` is what this app's nodes send — the `onClick` payloads. `AnyMsg` widens
it with `CoreMsg`, what the core sends by itself (`changed`, `submit`, `key`,
`hover`, `drag`, `contextmenu`, `dismiss`, `layout`, `modifiers`, `resize`,
`window`, `sound`), and is what the loop delivers: `runWindowed<Model,
AnyMsg>` and `createApp<Model, AnyMsg>` carry it through to `update`, events
and `dispatch`, so `update` is one switch over `msg.kind` with no casts.

The JSX payload props are the one place the union cannot be inferred: props
are global, so `onClick` takes any plain data unless the app registers its
own. That is all `src/kui.d.ts` does. A tag prop also takes `null` —
`onContextMenu={null}` here — which declares the behaviour and leaves the
events without a tag.

## One `update`, both drivers

`update`'s fourth argument is the surface the loop is driving: the headless
`Ctx` under `createApp`, the `KuiWindow` under `runWindowed`. It is how
`changed` reads an editor back (`ui.editText(ev.key)` — the runtime owns the
buffer), and where `focus`, `play`, `measureText` and `setWindowSize` live.
The config is `{ init, update, view }` on either side.

`init` and `view` can take the same surface where they need it — `init: (ui)
=> ...` runs after `setup`, so a first model measures against the fonts it
registered and reads the size the window really opened at instead of a
constant a `resize` handler has to correct; `view(model, window, ui)` is what
lets a tree size a column to its widest label with `ui.measureText(...)` while
it is being built. Both are optional, and this app needs neither: its `init`
is a value and its `view` takes the model alone.

## What the scaffold shows

A counter, an editor, and a context menu on a secondary press: `onContextMenu`
says where it landed and the view declares a `modal` float there. `modal`
scopes the Tab ring, the hit list and the access tree to its subtree, sends
`dismiss` on Escape or an outside press, and hands focus back where it found
it — no scrim, no key binding, no "what was focused before?" field.

Accessibility falls out of the props already there: every control is a Tab
stop, Enter and Space press the focused one, the ring draws itself. What a
screen reader cannot name is a warning, which is why the editor has a `label`
and the menu one too. A name is not always the whole of it: `+1` is its own
sentence, `reset` names an action and not its object, so both reset buttons
carry a `description` — the rest of it, spoken after the name and never
drawn. The stock button reads that, `label`, `tooltip` and `disabled` and
nothing else; any other prop on one is dropped with an `unknown-prop`
warning naming the rows it does read, because its look is its own spec. The
count sits in a `live="polite"` box, which is the whole of "read the new
value when it changes" — no status field in the model and nothing to clear a
frame later. It goes on the smallest node holding the message, since
everything inside a live node is live.

`src/headless.tsx` finds controls through `app.accessTree()` by the names a
reader would say rather than hunting the display list, and exits non-zero if
the core raised a warning. Two things it does not have to do by hand:
`app.ctx.focus('note')` names the editor by the label its `key` declared —
resolved through the last frame, so no rect to click and no event from it
first — and `app.press('escape')` is a whole key, both channels in the order a
window sends them (the raw press to a key sink, then what the core does with
it: dismiss the modal). `keyDown` and `key` are its halves, for a test that
means to drive one and not the other.

A third: `app.runOut()` before it clicks into the open menu. The loop owns the
clock, so the frame that opens the menu is frame 0 of the menu's `enter` — the
access rect is the one the item slides in from, four px above where it rests.
`runOut` draws, then advances in frame steps until nothing moves, and returns
the milliseconds it took; a test that reads a settled frame asks for one
rather than writing the loop. With the menu settled it reads both reset
buttons back off the tree, descriptions and all — a `modal` marks the node in
effect rather than pruning what is behind it, so both are there, and what
tells them apart is the node each is inside.

The full prop, element and event reference ships with the library as
`node_modules/@qxuken/kui/props.md`, sorted by name, and `howto.md` beside it
is the other door into the same material: the question you arrived with, two
sentences of answer, and the row or the ADR that says the rest. Also there:
`CHANGELOG.md` — every release lists what it adds and, separately, what you
can delete, and from alpha.9 on it opens with the breaks, one line per symbol
to grep before the prose — and the ADRs under `docs/adr/`, which is where the
doc comments in `index.d.ts` point when they cite one. That package's README
is the windowed-app checklist: hover and pressed colors, fonts, images,
sound, custom window chrome, `float` overlays, text measurement, effects as
data, multiple windows.
