import type { CoreMsg, Ctx, KuiWindow, SystemEnv, UiEvent } from '@qxuken/kui';

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
  }
}

// The colours are the app's; `env().system.appearance` is what the OS says.
// kui acts on none of it — nothing repaints because the appearance changed —
// because only the view knows which of its colours is the background.
const dark = {
  bg: '#14141c', menu: '#22242c', field: '#1f2030', shadow: '#00000066',
  title: '#ffffff', text: '#e8e8f0', dim: '#99a0b0', brand: '#7aa2ff',
};
type Theme = typeof dark;
const light: Theme = {
  bg: '#f4f5f9', menu: '#ffffff', field: '#ffffff', shadow: '#00000029',
  title: '#14141c', text: '#22242c', dim: '#5c6373', brand: '#2f5fd0',
};

// `'unknown'` is a third answer — nobody asked the OS, or the platform has
// none — and not a missing second one, so it keeps this app's own default
// rather than guessing light.
const themeFor = (system: SystemEnv): Theme =>
  system.appearance === 'light' ? light : dark;

// Both resets are the same action, so the sentence is one string. With the
// menu open the access tree carries two buttons named `reset`; what tells
// them apart is the dialog the second one is inside, not the sentence.
const resetHint = 'sets the count back to zero';

// `modal` scopes the Tab ring, the hit list and the access tree to this
// subtree, sends the `dismiss` above on Escape or an outside press, and
// hands focus back where it found it.
function Menu({ at, theme, transition }: {
  at: { x: number; y: number };
  theme: Theme;
  transition: number;
}) {
  return (
    <box
      key="menu"
      float={{ anchor: 'viewport', at: ['start', 'start'], self: ['start', 'start'],
               dx: at.x, dy: at.y, fit: true }}
      modal={null}
      label="Actions"
      pad={4} gap={4} width={120} bg={theme.menu} radius={6}
      shadowColor={theme.shadow} shadowBlur={16} shadowY={4}
      transition={transition} enter={{ opacity: 0, dy: -4 }} exit={{ opacity: 0 }}
    >
      <button onClick={{ kind: 'add', by: 10 }}>+10</button>
      <button onClick={{ kind: 'reset' }} description={resetHint}>reset</button>
    </box>
  );
}

function Counter({ count, theme }: { count: number; theme: Theme }) {
  return (
    <box dir="row" gap={12} crossAlign="center">
      <button onClick={{ kind: 'add', by: 1 }}>+1</button>
      <button onClick={{ kind: 'add', by: -1 }}>-1</button>
      {/* `+1` is its own sentence; `reset` names an action and not its
          object, so the rest of it is a `description` — spoken after the
          name, never drawn. The stock button reads that, `label`,
          `tooltip` and `disabled`, and drops any other prop with an
          `unknown-prop` warning, because its look is its own spec. */}
      <button onClick={{ kind: 'reset' }} description={resetHint}>reset</button>
      {/* A live region: a screen reader reads the new count when it
          changes, without the user going looking for it. On the smallest
          node that holds the message — everything inside a live node is
          live, so this is the text and not the row. */}
      <box live="polite">
        <text size={20} color={theme.text}>{`count = ${count}`}</text>
      </box>
    </box>
  );
}

// A `null` tag declares the behaviour and leaves the events without one;
// this app has a single menu, so there is nothing to tell apart.
//
// The third argument is the surface, here for `env()` alone: `system` is the
// four things the user set in the OS, as the host was able to read them. A
// window asks macOS and Windows for all four; a headless `Ctx` knows what
// `setEnv` declared. The reading is kui's, the policy below is this app's.
export const view = (model: Model, _window: string, ui: Ctx | KuiWindow) => {
  const system = ui.env().system;
  const theme = themeFor(system);
  // Three-valued for the same reason `appearance` is: test for the request
  // rather than for truthiness, since `'unknown'` is not a "no".
  const transition = system.motion === 'reduced' ? 0 : 120;
  return (
    <box pad={24} gap={16} bg={theme.bg} width="grow" height="grow" onContextMenu={null}>
      <box gap={8}>
        <text size={24} color={theme.title}>
          <span bold color={theme.brand}>kui</span> × Node × JSX
        </text>
        {/* `accent` substitutes the OS highlight colour for this node's `bg`
            and nothing else; where the host cannot tell — a headless core,
            X11 — the declared `bg` stays. The one prop whose paint depends
            on the machine, which is why it is opt-in. */}
        <box accent bg={theme.brand} width={72} height={2} radius={1} />
      </box>
      <Counter count={model.count} theme={theme} />
      <edit key="note" label="note" initial="" size={16} width={280} padX={10} padY={6}
            bg={theme.field} color={theme.text} radius={4} autofocus />
      <text size={14} color={theme.dim}>{`note: ${model.note || '(empty)'}`}</text>
      {model.menu ? <Menu at={model.menu} theme={theme} transition={transition} /> : null}
    </box>
  );
};
