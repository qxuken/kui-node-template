# kui app

JSX views lowered into [kui](https://github.com/qxuken/kui)'s IR,
Elm-style messages as data, a real window from Node.

```
npm install        # @qxuken/kui comes from npm, prebuilt addon included
npm start          # window
npm start -- --motion reduced   # the same window, as a user who asked for less motion
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
`text`, `preedit`, `hover`, `drag`, `drop`, `contextmenu`, `menu`,
`forceclick`, `dismiss`, `layout`, `modifiers`, `resize`, `window`,
`system`, `scroll`, `selectionrange`, `sound`, `access`, `change`,
`files`, `button`, `focus`, `fonts`, `open`), and is what the loop delivers:
`runWindowed<Model, AnyMsg>` and `createApp<Model, AnyMsg>` carry it
through to `update`, events and `dispatch`, so `update` is one switch over
`msg.kind` with no casts.

The JSX payload props are the one place the union cannot be inferred: props
are global, so `onClick` takes any plain data unless the app registers its
own. That is all `src/kui.d.ts` does. A tag prop also takes `null` —
`onContextMenu={null}` here — which declares the behaviour and leaves the
events without a tag. `onDrop` is a tag prop of the same shape that makes
its node a zone for files dragged in from the OS — the paths arrive as the
`drop` message, in four phases, and `dropBg` lights the zone while they
hover — which a counter has no use for. Its sibling from alpha.19 is
`files`, the answer to the Open, Save or folder dialog `ui.requestFiles(...)`
asked the platform for: `paths` shaped as a `drop`'s, so one handler takes
both, and empty when the user cancelled. Nor for the two stock things
alpha.16 adds: `<select label options current>`, a field showing the choice
in force that drops the core's own menu of the options, whose pick arrives
as the `menu` message on the field's key — the same message a menu row
posts, and the app holds no open state; and `<box dir="table">`, a column
whose rows' children line up in columns, so a list's values sit behind its
longest label with nothing measured and no width picked by hand. Nor for
alpha.19's: `<checkbox>`, `<radio>` and `<switch>`, drawn from the `checked`
the view declares and posting their `onClick`; `<radioGroup>`, one Tab stop
whose arrows move the choice; and `<slider>`, whose `onChange` has the core
turn a press, a drag or a key into a value already clamped and snapped to
`valueStep`, posted as `change` — a slider's proposal, where `changed` is an
editor's — for the view to declare back as `valueNow`. Each holds no state
of its own and reads a closed set of rows, as the button does.

The two newest members answer two more tag props of the same shape, from
alpha.22, and a counter has no use for either. `onFocus` posts `focus` as
the keyboard enters or leaves the node's subtree, `phase` `in` or `out`
and `by` saying what moved it (`pointer`, `keyboard`, `assistive`,
`program`), so a pane that cares whether it holds the keyboard hears so
instead of diffing the focused key every frame. The window says the same
of itself as two more `window` phases, `focused` and `blurred`.
`onButton` posts `button` for the middle and secondary buttons, press,
move and release, captured by the node while the button is held. A
claimed secondary press is that `button` *instead of* a `contextmenu`,
which is why the page here says `onContextMenu` and not `onButton`.

The last two need no prop: they arrive on the root unasked, and a counter
ignores both. `fonts` says the system's installed fonts changed — a face
installed or removed while the window was open — for an app whose model
holds the `systemFonts()` list; a `family` named in the view needs
nothing. `open`, from alpha.40, is the OS handing the app documents —
Open With in the Finder, a file dropped on the Dock icon, `open -a` — at
launch or while it runs, `paths` in the order asked. It is macOS's alone:
Windows and Linux hand documents over in `process.argv`, so an app that
reads its arguments and hears `open` covers all three.
`ctx.openDocuments(paths)` is the headless drive of it.

## One `update`, both drivers

`update`'s fourth argument is the surface the loop is driving: the headless
`Ctx` under `createApp`, the `KuiWindow` under `runWindowed`. It is how
`changed` reads an editor back (`ui.editText(ev.key)` — the runtime owns the
buffer), and where `focus`, `play`, `measureText` and `setWindowSize` live.
The config is `{ init, update, view, teardown }` on either side.

`init` and `view` can take the same surface where they need it — `init: (ui)
=> ...` runs after `setup`, so a first model measures against the fonts it
registered and reads the size the window really opened at instead of a
constant a `resize` handler has to correct — and from alpha.19 `ui.size()`
answers headless too, with the `width` and `height` handed to `createApp`
before its first frame, so one `init` fits one first model under both
drivers; `view(model, window, ui)` is what lets a tree size a column to its
widest label with `ui.measureText(...)` while it is being built. Both are
optional. This app's `init` is a value; its `view` takes the surface for
the palette, the sizes and the one OS reading the palette does not cover
(`theme()`, `metrics()`, `env().system.motion`), and ignores the window name
in between — that is `'main'` until an app declares a second window.

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
drawn. The stock button reads that, `label`, `tooltip`, `disabled`, `index`
(a row's number in a virtual list, keying the button the way `key` does) and
`accent`, and nothing else; any other prop on one — `cursor` included — is
dropped with an `unknown-prop` warning naming the rows it does read, because
its look is its own spec. The field is the same kind of thing: `<input label
initial>` is the stock field, chrome and all, `label` its key and its name
both, and it reads nothing else — a field that needs any other row
(`autofocus`, a width, `multiline`) is an `<edit>` in a box of its own. The
count sits in a `live="polite"` box, which is the whole of "read the new
value when it changes" — no status field in the model and nothing to clear a
frame later. It goes on the smallest node holding the message, since
everything inside a live node is live.

## What the OS gets a say in

`ui.env().system` is what the user set outside this app: `appearance`
(light or dark), `accent` (the OS highlight colour), `motion` (whether they
asked for less animation) and `locale` (a BCP-47 tag). A window fills in all
four before the first `view` on macOS and Windows; on X11 and Wayland the
locale comes from `LANG` and the rest read `'unknown'`, as all four do in a
headless core until `setEnv` says otherwise. A fifth row, `assistive`, is a
fact of the same shape rather than a setting: `'listening'` once an
accessibility client has asked the window for its tree, `'none'` while the
bridge is up and nobody has, `'unknown'` where there is no bridge to ask —
headless, always. It is the one reading that changes what a view *says*
rather than what it draws, and this app says the same thing either way.

`ui.theme()` is the first two, already acted on: a palette of named roles —
`bg`, `surface`, `raised`, `sunken`, `border`, `fg`, `muted`, the accent
family, and the rest of the table in `props.md` — with the base picked by
`appearance` and the accent recoloured by `accent`. An unknown appearance is
the dark base without claiming the user chose it, and an unknown accent is
kui's blue, so every role is a value whatever the host could tell and a view
branches on nothing. This app names no colour of its own: the page is
`theme.bg`, the rule and the word `kui` `theme.accent`, the menu
`theme.raised` with a `theme.borderStrong` edge — which is how the stock
context menu paints, since on the light base a float cannot be lighter than
a white page and separates by its border instead. The stock widgets read
the same roles, so a `<button>`, an `<input>`, a tooltip and a `<text>`
with no `color` (`theme.fg`) follow the OS with nothing written.
`ui.metrics()` is the same for sizes: the menu's corner is `radius` rather
than a number copied from the stock button, and `fieldPadX` and `fieldPadY`
are there for a field an app builds from an `<edit>`. An app with a brand
colour keeps the OS's light and dark and paints its own accent with
`ui.setAccent('#…')`; `setTheme` pins a palette that follows nothing. An app with colours and
sizes of its own beside the theme's declares them once —
`ui.setTokens({ colors: { peach: { light, dark } }, lengths: { sideW: 132 } })`
— and writes them by name in any colour or length prop, `bg="$peach"`,
`width="$sideW"`, with a colour token's two halves picked by the appearance
the way the roles are.

The stock button paints from the accent family — the fill, the hover and
pressed shades under it, and a black or white label by the accent's
luminance, so a yellow accent still reads — and declares nothing for it:
every `<button>` here is `theme.accent`, the OS's colour on a Mac. (Until
alpha.11 only a button declaring `accent` was, and `+1` carried it; the
prop is still read on a button and changes nothing there.) On any other
node `accent` substitutes `theme.accent` for its `bg` and nothing else; the
rule under the title spells that as `bg={theme.accent}`, the same colour
read from the same table.

The pointer is declared the same way, from alpha.14. Over an editor or a
`selectable` scope it is the I-beam, the one shape the core still implies
because the text itself says it can be taken; over everything else it is
the arrow — an `onClick` or `focusable` box of the app's own included, as
a native button, a tab or a list row is — unless the node says `cursor`:
`pointer` for a hand, `grab` for a handle and `grabbing` while its drag
runs, `notAllowed`, the four resize arrows. The stock button says
`pointer` for itself, so every `<button>` here has the hand it had, and
`cursor` on one is dropped like any other look row. (The `cursor` row in
`props.md` is the rule, and from alpha.19 the doc comment on
`cursorShape()` in `index.d.ts` and the package README say it too; until
then both still spelled the alpha.13 derivation. The headless readback
below is what the core answers either way.)

`motion` is the reading the theme does not cover. `'unknown'` is a third
answer and not a missing second one, which is why the enum spells it and why
it is tested with `=== 'reduced'` rather than for truthiness: a
`reduceMotion` boolean would have had to invent a `false` for "nobody
asked", and a view branching on that false animates for a user who asked it
not to. kui shortens no animation on its own, because only the view knows
which of its animations carries meaning rather than decoration; the policy
is one line of `view`, the menu's `transition` dropped to zero. `npm start
-- --motion reduced` is how to look at that branch in a window on a machine
whose owner did not ask for it: `src/main.tsx` hands `runWindowed` a
`system: { motion }` pin, the same partial `setEnv` takes headless, merged
inside the runner's per-frame write so it holds. A field left out of the
pin keeps following the OS, and a change to it still arrives as the
`system` message. It is an option rather than an environment variable so
that a shipped app's motion is its own code's decision.

A setting the user changes while the window is open arrives as a `system`
message on the root, carrying the whole of `env.system` as it now reads. It
exists because a window's `view` only runs when `update` returns a model —
a redraw re-lowers the tree it was handed — so without it the palette the
first frame derived would stand for the life of the window. `update`
returns the model unchanged for it, which is all it takes: the reading lives
on `ui`, and `view` reads it again.

On macOS the window also comes with the standard bar — the application
menu, an Edit menu whose rows replay the ⌘ chords the runner performs, a
Window menu with Minimize, Zoom and Enter Full Screen — without this app
declaring one, so ⌘C and ⌘V in the field and the tiling shortcuts work as
they do in any other app. An app that declares its own bar gets exactly
what it declared.

The window's icon is the one piece of chrome an app has to supply, and
this one supplies none. `runWindowed`'s `icon` option (from alpha.18) gives
every window the app opens the same picture, `{ rgba, width, height }` in
straight RGBA with a `Buffer` as the pixels. Windows puts it in the title
bar, Alt-Tab and the taskbar, and X11 in the window manager. A Mac draws
the bundle's `.icns` and Wayland the `.desktop` file's, and neither has a
window icon at all. `resource` names an icon linked into the executable,
which under `node.exe` is Node's own, so it is for a packaged app. A
counter has no picture to give it, so it keeps the platform's default.

## What runs as the window goes

`teardown(model)`, the config's fourth field from alpha.16, runs once as the
main window goes for good — its close button, `win.close()`, Quit from the
menu or the dock — with the model as it stands, from inside the pump that
saw it go and before `runWindowed` resolves. It exists because on a Mac ⌘Q
ends the process inside that pump: the promise never resolves, and nothing
after `await runWindowed(...)` runs, not even `process.on('exit')` — so a
session, a draft or a position saved on the line after the `await` was
never saved by a user who quit the way Mac users quit. `teardown` is the
only thing an app runs on ⌘Q, which is what makes it the place to save.
The window is gone by then: nothing draws, and its doors are not for it.
`src/main.tsx` prints the model from it, and prints again after the
`await` — the second line is the close button's alone. Headless,
`app.teardown()` runs the same function, once; a second call is nothing.

`src/headless.tsx` finds controls by the names a reader would say rather
than hunting the display list, and exits non-zero if the core raised a
warning. From alpha.46 the core does the finding: `app.ctx.keyNamed('+1')`
is the key of the node a reader hears as "+1", and a second node named the
same — a caption under the button repeating its text, say — raises
`ambiguous-name`, so the lookup fails the drive on two controls a screen
reader could not tell apart, which the `find` it replaced never noticed.
It answers a key, and this drive presses with the pointer, so the key goes
back through `app.accessTree()` for the rect to click. (Open field report:
`keyNamed`'s doc comment in `index.d.ts` spells the use as
`ctx.click(ctx.keyNamed('Like'))`, which `tsc` rejects — Node's `Ctx` has
no `click`, and the app's takes `x, y`. The key-taking door is
`app.access(key, 'click')`, a screen reader's activation rather than a
press, which leaves the pointer where it was.) Two things it does not have to do by hand:
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
tells them apart is the node each is inside. `app.ctx.owed()` is the
question beside the wait — which of transitions, keyframe cycles,
departing nodes, requested frames, autoscroll and a scroller easing to a
`reveal` the last frame left owed — for a suite with a `repeat` cycle that `runOut` could only ever time out
on; this app has none, so it waits.

Before any of that it reads the pointer: `app.ctx.cursor(x, y)` puts it
somewhere and `app.ctx.cursorShape()` is the shape a window would set
there — `pointer` over `-1`, where the last click left it, `default` over
the page, `text` over the field — which is the alpha.14 rule read back
rather than taken on trust.

Then it declares the user: `app.ctx.setEnv({system: {...}})` writes down what
a window reads off the machine, so a suite can render the frame a light-mode
reader with a yellow accent and reduced motion would get, and `app.ctx.theme()`
is the palette that reading derived. It reads the root quad and the `+1`
button back off the display list under an unknown appearance and under the
declared one, and checks each against the role it should be — the page
`theme.bg`, the button's fill `theme.accent`, its label `theme.onAccent`,
which goes black under the yellow — then opens the menu again and gets
`runOut` back as 0 ms where full motion took 128, the app's own answer to
the setting. `+1` is read because it stands for every stock button now:
the fill it checks is the one `-1` and `reset` paint too. The one thing it
cannot show is the `system` message: nothing changed behind the app's back,
the test wrote the reading itself and rendered, so that message is a
window's alone.

Last of all it ends the way a window does: `app.teardown()` hands the
`teardown` the config declared the model as it stands — count 11, the note
typed above — and hands it nothing on a second call, which the drive
counts. That is the whole of "what would this app have kept had the user
quit here", asserted without a window.

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
