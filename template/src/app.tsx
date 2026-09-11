import type { CoreMsg, Ctx, KuiWindow, Metrics, Theme, UiEvent } from '@qxuken/kui';

export type Model = {
  count: number;
  note: string;
  menu: { x: number; y: number } | null;
};

// What this app's nodes send, and what `src/kui.d.ts` registers with the
// JSX props. `AnyMsg` adds what the core sends by itself, so `update` is one
// switch with no casts.
export type Msg = { kind: 'add'; by: number } | { kind: 'reset' };
export type AnyMsg = Msg | CoreMsg;

export const init: Model = { count: 0, note: '', menu: null };

// `ui` is the surface the loop drives: the `Ctx` headless, the `KuiWindow`
// under a window. Both pass it, so one `update` serves both. `init` can take
// it too — `init: (ui) => ...` for a first model measured against the real
// window size.
export function update(
  model: Model,
  msg: AnyMsg,
  ev: UiEvent<AnyMsg>,
  ui: Ctx | KuiWindow,
): Model | undefined {
  switch (msg.kind) {
    case 'add':
      return { ...model, count: model.count + msg.by, menu: null };
    case 'reset':
      return { ...model, count: 0, menu: null };
    case 'changed':
      return { ...model, note: ui.editText(ev.key) ?? '' };
    case 'contextmenu':
      return { ...model, menu: { x: msg.x, y: msg.y } };
    case 'dismiss':
      return { ...model, menu: null };
    // The user changed an OS setting while the window was open. The model
    // holds none of it — `view` reads `ui.theme()` and `ui.env()` — but a
    // window's `view` only runs when `update` returns a model, so returning
    // this one unchanged is what repaints the palette the OS just moved.
    case 'system':
      return model;
  }
}

// Both resets are the same action, so the sentence is one string. With the
// menu open the access tree carries two buttons named `reset`; what tells
// them apart is the dialog the second one is inside, not the sentence.
const resetHint = 'sets the count back to zero';

// `modal` scopes the Tab ring, the hit list and the access tree to this
// subtree, sends the `dismiss` above on Escape or an outside press, and
// hands focus back where it found it.
//
// A float paints `raised` with a `borderStrong` edge, which is what the
// stock context menu does: on the dark base a float is lighter than the
// page, on the light one it cannot be and separates by its border instead.
// One spelling for both, and no shadow to weigh by appearance.
function Menu({ at, theme, metrics, transition }: {
  at: { x: number; y: number };
  theme: Theme;
  metrics: Metrics;
  transition: number;
}) {
  return (
    <box
      key="menu"
      float={{ anchor: 'viewport', at: ['start', 'start'], self: ['start', 'start'],
               dx: at.x, dy: at.y, fit: true }}
      modal={null}
      label="Actions"
      pad={4} gap={4} width={120} bg={theme.raised} radius={metrics.radius}
      borderColor={theme.borderStrong} borderW={1}
      transition={transition} enter={{ opacity: 0, dy: -4 }} exit={{ opacity: 0 }}
    >
      <button onClick={{ kind: 'add', by: 10 }}>+10</button>
      <button onClick={{ kind: 'reset' }} description={resetHint}>reset</button>
    </box>
  );
}

function Counter({ count }: { count: number }) {
  return (
    <box dir="row" gap={12} crossAlign="center">
      {/* `accent` on the stock button is a question and not a colour: it
          paints from the theme's accent family — the OS highlight where
          the host reports one, kui's blue otherwise — takes its hover and
          pressed shades from it, and picks a black or white label by its
          luminance, so a yellow accent still reads. */}
      <button onClick={{ kind: 'add', by: 1 }} accent>+1</button>
      <button onClick={{ kind: 'add', by: -1 }}>-1</button>
      {/* `+1` is its own sentence; `reset` names an action and not its
          object, so the rest of it is a `description` — spoken after the
          name, never drawn. The stock button reads that, `label`,
          `tooltip`, `disabled` and `accent`, and drops any other prop with
          an `unknown-prop` warning, because its look is its own spec. */}
      <button onClick={{ kind: 'reset' }} description={resetHint}>reset</button>
      {/* A live region: a screen reader reads the new count when it
          changes, without the user going looking for it. On the smallest
          node that holds the message — everything inside a live node is
          live, so this is the text and not the row. A `<text>` with no
          `color` is `theme.fg`. */}
      <box live="polite">
        <text size={20}>{`count = ${count}`}</text>
      </box>
    </box>
  );
}

// A `null` tag declares the behaviour and leaves the events without one;
// this app has a single menu, so there is nothing to tell apart.
//
// The third argument is the surface, here for what the OS had to say.
// `theme()` is the palette as roles — the OS's light or dark picks the base,
// the OS's accent recolours it, and an unknown appearance is the dark base
// without claiming the user chose it — so this app names no colour of its
// own; `metrics()` is the same for sizes. `env().system.motion` is the
// reading the theme does not cover, and the policy for it is the view's.
export const view = (model: Model, _window: string, ui: Ctx | KuiWindow) => {
  const theme = ui.theme();
  const metrics = ui.metrics();
  // Three-valued: test for the request rather than for truthiness, since
  // `'unknown'` — nobody asked the OS, or the platform has none — is not a
  // "no", and keeps this app's own 120 ms.
  const transition = ui.env().system.motion === 'reduced' ? 0 : 120;
  return (
    <box pad={24} gap={16} bg={theme.bg} width="grow" height="grow" onContextMenu={null}>
      <box gap={8}>
        <text size={24}>
          <span bold color={theme.accent}>kui</span> × Node × JSX
        </text>
        {/* `theme.accent` is already the fallback resolved: the OS colour
            where the host reports one, kui's blue where it cannot tell. */}
        <box bg={theme.accent} width={72} height={2} radius={1} />
      </box>
      <Counter count={model.count} />
      <edit key="note" label="note" initial="" size={16} width={280}
            padX={metrics.fieldPadX} padY={metrics.fieldPadY} radius={metrics.radius}
            bg={theme.sunken} autofocus />
      <text size={14} color={theme.muted}>{`note: ${model.note || '(empty)'}`}</text>
      {model.menu
        ? <Menu at={model.menu} theme={theme} metrics={metrics} transition={transition} />
        : null}
    </box>
  );
};
