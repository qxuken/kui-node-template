# kui app

JSX views lowered into [kui](https://github.com/qxuken/kui)'s IR, drawn
with Kit, kui's UI kit; Elm-style messages as data; a real window from
Node.

```
npm install        # @qxuken/kui comes from npm, with this machine's prebuilt addon
npm start          # window
npm start -- --motion reduced   # the same window, as a user who asked for less motion
npm run headless   # the app driven by hand, no window
npm run typecheck
```

`src/app.tsx` holds the model, `update` and `view`; `src/main.tsx` opens the
window and `src/headless.tsx` drives the same app without one.
`src/kui.d.ts` is types only.

`@qxuken/kui` names its addon per platform (`@qxuken/kui-darwin-arm64` and
the rest) as optional dependencies, and npm installs this machine's. An
install with `--omit=optional`, or from a lockfile written on another OS,
has none and says how to fix it. On Linux the addon links ALSA, so
`libasound2` (`libasound2t64` on trixie and newer) has to be installed;
without it even `npm run headless` fails at load. macOS and Windows need
nothing extra.

## Kit

Kit is kui's UI kit for dense tool windows: panels, toolbars, buttons,
fields, tables, menus, charts and more, written once in Lua and placed
from Node as typed JSX components:

```tsx
import { Button, Toolbar } from '@qxuken/kui/kit';

<Toolbar>
  <Button label="+1" variant="primary" onPress={{ kind: 'add', by: 1 }} />
</Toolbar>
```

Kit is an extension, so it is loaded before the first frame:
`extensions: [extension]` from `@qxuken/kui/kit`, which `main.tsx` passes
to `runWindowed` and `headless.tsx` to `createApp`. `<Settings />` placed
once picks the skin — Ledger (paper and ink, the default), Phosphor (a
terminal) or Neutral (quiet chrome) — the density and any brand colours.
Kit follows the OS's light and dark and holds still under reduced motion
by itself, so the app names no colour, size or duration of its own.

Every component, prop and event is listed in
`node_modules/@qxuken/kui/kit/reference.md`.

## Messages

`Msg` is every message `update` sees, and each is one the view declared.
A node or a Kit component that hears an event names the message it
arrives as, and the event's data is written into it under the event's
name: the field's `onChange={{ kind: 'note' }}` arrives as
`{ kind: 'note', change: { text } }`. `Msg` registers those as they
arrive — Kit's `ButtonPressMsg<…>`, `TextFieldChangeMsg<…>`,
`MenuChooseMsg<…>`, `MenuDismissMsg<…>`, and the core's
`ContextMenuMsg<…>` and `SystemMsg<…>` — and `update` is one switch over `msg.kind`, the
app's own, with no casts.

Props are global, so `onClick` takes any plain data unless the app
registers its own type; that is all `src/kui.d.ts` does. Once it does, a
core handler prop takes only the messages that carry its event's field,
so `onContextMenu={{ kind: 'add', by: 1 }}` fails where it is written.
Kit's `on*` props are not checked yet (below).

A window's own events — a resize, its keyboard focus, an OS setting, the
modifiers, fonts, documents opened — have no node, so the root box
declares them in `windowEvents`. A window hears only what its root
declares: here `onSystemSettingsChange`.

## One `update`, both drivers

The config is `{ init, update, view, teardown }` under either driver.
`update(model, msg, ev, ui)` and `view(model, window, ui)` are handed the
surface being driven: the headless `Ctx` under `createApp`, the `KuiWindow`
under `runWindowed`. That is where `focus`, `measureText` and the theme
live. This app needs neither: the messages carry the data and Kit paints
from its skin. `init` can take it too: `init: (ui) => ...` for a first
model measured against the real window.

## What the scaffold shows

- **A Kit window.** A `Toolbar` of `Button`s across the top, with
  `reset` pushed to the far side; a `Stat` for the count and a `TextField`
  for the note on the window's own ground; a `Statusbar` of `Badge`s at
  the foot. Kit's `Panel` is a framed card for a region inside a window,
  so the window itself is not one.
- **A context menu.** `onContextMenu` on the root says where the press
  landed, and the view places Kit's `Menu` in a box of no size there (a
  Kit menu hangs below whatever holds it). The menu is modal: it scopes
  Tab and hit testing to itself, sends `onDismiss` on Escape or an outside
  press, restores focus, and `onChoose` carries the row's `value`.
- **The model holds the field's text.** The `TextField` declares
  `value={model.note}` every frame and `onChange` brings each edit back,
  so clearing or reformatting the note is a change to the model.
- **Accessibility from the props.** Every control is a Tab stop and Enter
  and Space press it. The field has a name; `reset` has a
  `tooltip`, shown under the pointer and read after its name. The count
  sits in a `live="polite"` box, so a screen reader reads the new value; a
  live region reads as one message, so it holds the number and no
  control (`control-inside-live` says so otherwise).
- **The OS's light and dark.** Kit's skins have a light half and a dark
  half, and the core picks the one the OS asks for each frame. The root's
  `windowEvents` declares `onSystemSettingsChange`, so a change while the
  window is open arrives as a `system` message; `update` returns the model
  unchanged, which re-runs `view` and draws the frame in the new half.
- **Reduced motion.** Kit's menu slides in, and holds still when the OS
  asks for less motion. `--motion reduced` pins that reading through
  `runWindowed`'s `system` option.
- **Saving on quit.** `teardown(model)` runs once as the main window goes.
  On a Mac ⌘Q ends the process inside the event loop, so nothing after
  `await runWindowed(...)` runs: `teardown` is the place to save.

## The headless drive

`src/headless.tsx` drives the app the way a user would and exits non-zero
on any core warning:

- Controls are found by the name a screen reader says, through
  `ctx.keyNamed`, so two controls with the same name fail the run
  (`ambiguous-name`). Kit's components are keyed in Kit's origin, so the
  field is focused by the key its name finds, not by a `key` the app wrote.
- `ctx.cursorShape()` reads back the pointer over a button, the page and
  the field.
- `type` reaches the model through `onChange`; `press('escape')` sends a
  whole key.
- `runOut()` advances until animations settle, so clicks land where the
  user's would.
- `ctx.setEnv(...)` declares a light-mode user with reduced motion; the
  drive reads the buttons' fills and labels under each half and
  checks that the menu now opens settled.
- `app.teardown()` runs `teardown` once, and a second call does nothing.

## Open field reports

- Kit exports its `$kit…` tokens so an app's own boxes paint in the skin
  (`bg="$kitPanel"`, says kui's changelog for alpha.68), but Node's encoder
  resolves a `$name` against the app's `setTokens` table and the roles
  only: from JSX, `$kitBg` raises `unknown-token` and paints nothing. So
  the body sits on the window's own ground, the core theme's `bg`, rather
  than the skin's.
- Kit's `on*` props (`onPress`, `onChange`, `onChoose`, …) are typed
  `unknown`, so the `Msg` that `src/kui.d.ts` registers does not reach
  them: `<Button onPress={{ kind: 'typo' }}/>` compiles, where the core's
  `<button onClick={{ kind: 'typo' }}>` fails.
- `keyNamed`'s doc comment in `index.d.ts` shows
  `ctx.click(ctx.keyNamed('Like'))`, which `tsc` rejects — Node's `Ctx` has
  no `click`. Click by key with `app.access(key, 'click')`.

## Reference

The library ships `node_modules/@qxuken/kui/props.md` (every prop, element
and event), `howto.md` (task-oriented answers), `kit/reference.md` (Kit's
components), `CHANGELOG.md` (what breaks first in each release) and
`docs/adr/`. Its README is the checklist for a larger windowed app: fonts,
images, sound, custom chrome, multiple windows.
