// The app is three plain values, Elm-style: `init` is the model, `view`
// turns a model into JSX (plain data, no reconciler), and `update` folds a
// message back into the model. Messages are whatever you put in `onClick`;
// the runtime never sees a closure.
import type { CoreMsg, UiEvent } from '@qxuken/kui';

export type Model = { count: number; note: string };

// The messages this app's own nodes carry.
export type CounterMsg = { kind: 'add'; by: number } | { kind: 'reset' };

// Registering them types the payload props: `onClick`, `onDrag`, `onHover`
// and `onKey` then take a CounterMsg rather than any plain data, so a typo
// fails where it is written. Program-wide (one app per tsconfig), and
// entirely optional — delete it and everything below still compiles.
declare module '@qxuken/kui/jsx-runtime' {
  interface KuiMsg {
    msg: CounterMsg;
  }
}

// Everything `update` sees: this app's messages plus the ones the core
// sends by itself (`changed`, `submit`, `key`, `hover`, `drag`,
// `modifiers`). One flat union, so the switch below needs no casts.
export type Msg = CounterMsg | CoreMsg;

export const init: Model = { count: 0, note: '' };

// `editText` is how the host reads an editor back: the runtime owns the
// buffer and reports "changed" with the editor's node key.
export function update(
  model: Model,
  msg: Msg,
  ev: UiEvent<Msg>,
  editText: (key: string) => string | null | undefined,
): Model | undefined {
  switch (msg.kind) {
    case 'add':
      return { ...model, count: model.count + msg.by };
    case 'reset':
      return { ...model, count: 0 };
    case 'changed':
      return { ...model, note: editText(ev.key) ?? '' };
  }
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

export const view = (model: Model) => (
  <box pad={24} gap={16} bg="#14141c" width="grow" height="grow">
    <text size={24} color="#ffffff"><span bold color="#7aa2ff">kui</span> × Node × JSX</text>
    <Counter count={model.count} />
    <edit key="note" initial="" size={16} width={280} padX={10} padY={6}
          bg="#1f2030" color="#e8e8f0" radius={4} autofocus />
    <text size={14} color="#99a0b0">{`note: ${model.note || '(empty)'}`}</text>
  </box>
);
