import type {
  ContextMenuMsg, Ctx, DismissMsg, EditChangeMsg, KuiWindow, Metrics, SystemMsg, Theme,
} from '@qxuken/kui';

export type Model = {
  count: number;
  note: string;
  menu: { x: number; y: number } | null;
};

// Every message `update` sees is one the view declared (registered with JSX
// in `src/kui.d.ts`). A node that hears an event names the message it
// arrives as, and the core writes the event's data into it under the
// event's name: `{ kind: 'note' }` on the field arrives as
// `{ kind: 'note', change: { text } }`.
export type Msg =
  | { kind: 'add'; by: number }
  | { kind: 'reset' }
  | EditChangeMsg<{ kind: 'note' }>
  | ContextMenuMsg<{ kind: 'openMenu' }>
  | DismissMsg<{ kind: 'closeMenu' }>
  | SystemMsg<{ kind: 'system' }>;

export const init: Model = { count: 0, note: '', menu: null };

// The messages carry everything it needs, so this `update` takes neither the
// event's envelope nor the surface (the third and fourth arguments).
export function update(model: Model, msg: Msg): Model | undefined {
  switch (msg.kind) {
    case 'add':
      return { ...model, count: model.count + msg.by, menu: null };
    case 'reset':
      return { ...model, count: 0, menu: null };
    case 'note':
      return { ...model, note: msg.change.text };
    case 'openMenu':
      return { ...model, menu: { x: msg.contextmenu.x, y: msg.contextmenu.y } };
    case 'closeMenu':
      return { ...model, menu: null };
    // An OS setting changed. `view` reads it from `ui`; returning the model
    // is what makes it run again.
    case 'system':
      return model;
  }
}

// Spoken after the name `reset`, on both reset buttons.
const resetHint = 'sets the count back to zero';

// `modal` scopes Tab, hit testing and the access tree to this subtree, sends
// its message on Escape or an outside press, and restores focus. `raised` with
// a `borderStrong` edge reads as a float on both light and dark pages.
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
      modal={{ kind: 'closeMenu' }}
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
      {/* Stock buttons paint from the theme's accent and set their own
          pointer; nothing is declared for either. */}
      <button onClick={{ kind: 'add', by: 1 }}>+1</button>
      <button onClick={{ kind: 'add', by: -1 }}>-1</button>
      {/* `description` is spoken after the name and never drawn. */}
      <button onClick={{ kind: 'reset' }} description={resetHint}>reset</button>
      {/* A screen reader reads the new count when it changes. Everything
          inside a live node is live, so it wraps the text, not the row. */}
      <box live="polite">
        <text size={20}>{`count = ${count}`}</text>
      </box>
    </box>
  );
}

// `ui` is the headless `Ctx` or the `KuiWindow`, so one `view` serves both.
// `theme()` and `metrics()` follow the OS's light/dark and accent, so the
// app names no colour or size of its own.
export const view = (model: Model, _window: string, ui: Ctx | KuiWindow) => {
  const theme = ui.theme();
  const metrics = ui.metrics();
  // `motion` can also be `'unknown'`, which is not a request for less.
  const transition = ui.env().system.motion === 'reduced' ? 0 : 120;
  return (
    // The window's own events are declared on its root; without
    // `onSystemSettingsChange` the view would not hear the OS change.
    <box
      pad={24} gap={16} bg={theme.bg} width="grow" height="grow"
      onContextMenu={{ kind: 'openMenu' }}
      windowEvents={{ onSystemSettingsChange: { kind: 'system' } }}
    >
      <box gap={8}>
        <text size={24}>
          <span bold color={theme.accent}>kui</span> × Node × JSX
        </text>
        <box bg={theme.accent} width={72} height={2} radius={1} />
      </box>
      <Counter count={model.count} />
      {/* `label` is the stock field's key and accessible name. `value` is
          the model's text, declared every frame, and `onChange` brings
          what was typed back. For more control (`autofocus`, a width,
          `multiline`) use an `<edit>`. */}
      <input label="note" value={model.note} onChange={{ kind: 'note' }} />
      <text size={14} color={theme.muted}>{`note: ${model.note || '(empty)'}`}</text>
      {model.menu
        ? <Menu at={model.menu} theme={theme} metrics={metrics} transition={transition} />
        : null}
    </box>
  );
};
