# kui app

JSX views lowered into [kui](https://github.com/qxuken/kui)'s IR,
Elm-style messages as data, a real window from Node.

```
npm install        # @qxuken/kui comes from npm, prebuilt addon included
npm start          # window
npm start -- --motion reduced   # the same window, as a user who asked for less motion
npm run headless   # the app driven by hand, no window
npm run typecheck
```

`src/app.tsx` holds the model, `update` and `view`; `src/main.tsx` opens the
window and `src/headless.tsx` drives the same app without one.
`src/kui.d.ts` is types only.

On Linux the addon links ALSA, so `libasound2` (`libasound2t64` on trixie
and newer) has to be installed; without it even `npm run headless` fails at
load. macOS and Windows need nothing extra.

## Messages

`Msg` is every message `update` sees, and each is one the view declared.
A node that hears an event names the message it arrives as, and the core
writes the event's data into it under the event's name: the field's
`onChange={{ kind: 'note' }}` arrives as `{ kind: 'note', change: { text } }`.
`Msg` registers those as they arrive — `EditChangeMsg<{ kind: 'note' }>`,
`ContextMenuMsg<…>`, `DismissMsg<…>`, `SystemMsg<…>` — and `update` is one
switch over `msg.kind`, the app's own, with no casts. `ev.event` on the
envelope says which event it was, when that matters.

Props are global, so `onClick` takes any plain data unless the app
registers its own type; that is all `src/kui.d.ts` does. Once it does, a
handler prop takes only the messages that carry its event's field, so
`onChange={{ kind: 'add', by: 1 }}` fails where it is written.

A window's own events — a resize, its keyboard focus, an OS setting, the
modifiers, fonts, documents opened — have no node, so the root box
declares them in `windowEvents`. A window hears only what its root
declares: here `onSystemSettingsChange`.

## One `update`, both drivers

The config is `{ init, update, view, teardown }` under either driver.
`update(model, msg, ev, ui)` and `view(model, window, ui)` are handed the
surface being driven: the headless `Ctx` under `createApp`, the `KuiWindow`
under `runWindowed`. That is where `focus`, `measureText` and the theme
live. This `update` needs neither `ev` nor `ui`, since the messages carry
the data; `view` reads the palette and sizes from `ui`. `init` can take it
too: `init: (ui) => ...` for a first model measured against the real
window.

## What the scaffold shows

- **A modal context menu.** `onContextMenu`'s message says where the press
  landed and the view declares a `modal` float there. `modal` scopes Tab,
  hit testing and the access tree to its subtree, sends its own message
  (`closeMenu`, with `dismiss: { reason }`) on Escape or an outside press,
  and restores focus.
- **The model holds the field's text.** The `<input>` declares
  `value={model.note}` every frame and `onChange` brings each edit back,
  so clearing or reformatting the note is a change to the model.
- **Accessibility from the props.** Every control is a Tab stop and Enter
  and Space press it. The editor and the menu have a `label`; `reset` has a
  `description`, spoken after its name. The count sits in a
  `live="polite"` box, so a screen reader reads the new value. The stock
  `<button>` and `<input>` read a closed set of props and warn
  (`unknown-prop`) on anything else.
- **The OS's colours.** `ui.theme()` is a palette of roles (`bg`, `fg`,
  `muted`, `raised`, `accent`, …) picked by the OS's light or dark and
  recoloured by its accent. The app names no colour of its own, and stock
  widgets read the same roles. `ui.metrics()` does the same for sizes.
- **The pointer is declared.** The stock button says `pointer`; everything
  else is the arrow unless a node sets `cursor`, except text, which is the
  I-beam.
- **Reduced motion.** `ui.env().system.motion` is `'full'`, `'reduced'` or
  `'unknown'`, so the view tests `=== 'reduced'` and drops the menu's
  `transition` to zero. kui shortens no animation on its own.
  `--motion reduced` pins the reading through `runWindowed`'s `system`
  option.
- **OS changes while open.** The root's `windowEvents` declares
  `onSystemSettingsChange`, so a `system` message carries the new readings;
  `update` returns the model unchanged, which re-runs `view`. Without the
  declaration the window would keep the first frame's palette.
- **Saving on quit.** `teardown(model)` runs once as the main window goes.
  On a Mac ⌘Q ends the process inside the event loop, so nothing after
  `await runWindowed(...)` runs: `teardown` is the place to save.

## The headless drive

`src/headless.tsx` drives the app the way a user would and exits non-zero
on any core warning:

- Controls are found by the name a screen reader says, through
  `ctx.keyNamed`, so two controls with the same name fail the run
  (`ambiguous-name`).
- `ctx.cursorShape()` reads back the pointer over a button, the page and
  the field.
- `ctx.focus('note')` focuses the editor by its label and `type` reaches
  the model through `onChange`; `press('escape')` sends a whole key.
- `runOut()` advances until animations settle, so clicks land where the
  user's would.
- `ctx.setEnv(...)` declares a light-mode user with a yellow accent and
  reduced motion; the drive checks the painted colours against
  `ctx.theme()` and that the menu now opens settled.
- `app.teardown()` runs `teardown` once, and a second call does nothing.

Open field report: `keyNamed`'s doc comment in `index.d.ts` shows
`ctx.click(ctx.keyNamed('Like'))`, which `tsc` rejects — Node's `Ctx` has
no `click`. Click by key with `app.access(key, 'click')`.

## Reference

The library ships `node_modules/@qxuken/kui/props.md` (every prop, element
and event), `howto.md` (task-oriented answers), `CHANGELOG.md` (what breaks
first in each release) and `docs/adr/`. Its README is the checklist for a
larger windowed app: fonts, images, sound, custom chrome, multiple windows.
