import type { CoreMsg, Ctx, KuiWindow, UiEvent } from '@qxuken/kui';

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
// under a window. Both pass it, so one `update` serves both.
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

// `modal` scopes the Tab ring, the hit list and the access tree to this
// subtree, sends the `dismiss` above on Escape or an outside press, and
// hands focus back where it found it.
function Menu({ at }: { at: { x: number; y: number } }) {
  return (
    <box
      key="menu"
      float={{ anchor: 'viewport', at: ['start', 'start'], self: ['start', 'start'],
               dx: at.x, dy: at.y, fit: true }}
      modal={null}
      label="Actions"
      pad={4} gap={4} width={120} bg="#22242c" radius={6}
      shadowColor="#00000066" shadowBlur={16} shadowY={4}
      transition={120} enter={{ opacity: 0, dy: -4 }} exit={{ opacity: 0 }}
    >
      <button onClick={{ kind: 'add', by: 10 }}>+10</button>
      <button onClick={{ kind: 'reset' }}>reset</button>
    </box>
  );
}

function Counter({ count }: { count: number }) {
  return (
    <box dir="row" gap={12} crossAlign="center">
      <button onClick={{ kind: 'add', by: 1 }}>+1</button>
      <button onClick={{ kind: 'add', by: -1 }}>-1</button>
      <button onClick={{ kind: 'reset' }}>reset</button>
      <text size={20} color="#e8e8f0">{`count = ${count}`}</text>
    </box>
  );
}

// A `null` tag declares the behaviour and leaves the events without one;
// this app has a single menu, so there is nothing to tell apart.
export const view = (model: Model) => (
  <box pad={24} gap={16} bg="#14141c" width="grow" height="grow" onContextMenu={null}>
    <text size={24} color="#ffffff"><span bold color="#7aa2ff">kui</span> × Node × JSX</text>
    <Counter count={model.count} />
    <edit key="note" label="note" initial="" size={16} width={280} padX={10} padY={6}
          bg="#1f2030" color="#e8e8f0" radius={4} autofocus />
    <text size={14} color="#99a0b0">{`note: ${model.note || '(empty)'}`}</text>
    {model.menu ? <Menu at={model.menu} /> : null}
  </box>
);
