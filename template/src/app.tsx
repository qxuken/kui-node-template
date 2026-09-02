// The app is three plain values, Elm-style: `init` is the model, `view`
// turns a model into JSX (plain data, no reconciler), and `update` folds a
// message back into the model. Messages are whatever you put in `onClick`;
// the runtime never sees a closure.
import type { Msg, UiEvent } from '@qxuken/kui';

export type Model = { count: number; note: string };

export type AppMsg = { kind: 'add'; by: number } | { kind: 'reset' };

export const init: Model = { count: 0, note: '' };

// `editText` is how the host reads an editor back: the runtime owns the
// buffer and reports "changed" with the editor's node key.
export function update(
  model: Model,
  msg: Msg,
  ev: UiEvent,
  editText: (key: string) => string | null | undefined,
): Model | undefined {
  if (msg === null || typeof msg !== 'object' || Array.isArray(msg)) return;
  switch ((msg as AppMsg | { kind: string }).kind) {
    case 'add':
      return { ...model, count: model.count + (msg as { by: number }).by };
    case 'reset':
      return { ...model, count: 0 };
    case 'changed':
      return { ...model, note: editText(ev.key) ?? '' };
  }
}

function Counter({ count }: { count: number }) {
  return (
    <box dir="row" gap={12} crossAlign="center">
      <button onClick={{ kind: 'add', by: 1 } satisfies AppMsg}>+1</button>
      <button onClick={{ kind: 'add', by: -1 } satisfies AppMsg}>-1</button>
      <button onClick={{ kind: 'reset' } satisfies AppMsg}>reset</button>
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
