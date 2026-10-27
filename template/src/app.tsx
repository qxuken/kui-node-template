import type { ContextMenuMsg, SystemMsg } from '@qxuken/kui';
import {
  Badge, Button, Menu, Settings, Stat, Statusbar, TextField, Toolbar,
  type ButtonPressMsg, type MenuChooseMsg, type MenuDismissMsg, type TextFieldChangeMsg,
} from '@qxuken/kui/kit';

export type Model = {
  count: number;
  note: string;
  menu: { x: number; y: number } | null;
};

// Every message `update` sees is one the view declared. A node or a Kit
// component that hears an event names the message it arrives as, and the
// event's data is written into it under the event's name: `{ kind: 'note' }`
// on the field arrives as `{ kind: 'note', change: { text } }`. Kit's
// `*Msg` helpers spell those, as the core's do for its own events.
export type Msg =
  | ButtonPressMsg<{ kind: 'add'; by: number }>
  | ButtonPressMsg<{ kind: 'reset' }>
  | TextFieldChangeMsg<{ kind: 'note' }>
  | ContextMenuMsg<{ kind: 'openMenu' }>
  | MenuChooseMsg<{ kind: 'menuPick' }>
  | MenuDismissMsg<{ kind: 'closeMenu' }>
  | SystemMsg<{ kind: 'system' }>;

export const init: Model = { count: 0, note: '', menu: null };

// The messages carry everything it needs, so this `update` takes neither the
// event's envelope nor the surface (the third and fourth arguments).
export function update(model: Model, msg: Msg): Model | undefined {
  switch (msg.kind) {
    case 'add':
      return { ...model, count: model.count + msg.by };
    case 'reset':
      return { ...model, count: 0 };
    case 'note':
      return { ...model, note: msg.change.text };
    case 'openMenu':
      return { ...model, menu: { x: msg.contextmenu.x, y: msg.contextmenu.y } };
    // A row's `value` is what `choose` carries.
    case 'menuPick':
      return { ...model, menu: null, count: msg.choose.value === 'reset' ? 0 : model.count + 10 };
    case 'closeMenu':
      return { ...model, menu: null };
    // An OS setting changed. Kit picks its skin's light or dark half each
    // frame; returning the model is what makes `view` run, so a frame goes
    // out.
    case 'system':
      return model;
  }
}

// Kit's menu hangs below whatever holds it, so a context menu is a box of
// no size at the press, holding the menu. The menu is modal: it scopes Tab
// and hit testing to itself, sends `onDismiss` on Escape or an outside
// press, and restores focus.
function ContextMenu({ at }: { at: { x: number; y: number } }) {
  return (
    <box
      key="menu"
      float={{ anchor: 'viewport', at: ['start', 'start'], self: ['start', 'start'], dx: at.x, dy: at.y }}
      width={0} height={0}
    >
      <Menu
        items={[{ value: 'add10', label: '+10' }, { value: 'reset', label: 'reset', danger: true }]}
        onChoose={{ kind: 'menuPick' }}
        onDismiss={{ kind: 'closeMenu' }}
      />
    </box>
  );
}

// Kit draws every control here in its skin, follows the OS's light and dark
// and holds still under reduced motion, so the view names no colour, size
// or duration of its own. A Kit `Panel` is a framed card; the window itself
// is a toolbar, the body on the window's own ground, and a status bar.
export const view = (model: Model) => (
  // The window's own events are declared on its root; without
  // `onSystemSettingsChange` the view would not hear the OS change.
  <box
    width="grow" height="grow"
    onContextMenu={{ kind: 'openMenu' }}
    windowEvents={{ onSystemSettingsChange: { kind: 'system' } }}
  >
    {/* Kit's look for this window; it draws nothing. Try `skin="phosphor"`
        or `density="compact"`. */}
    <Settings />
    <Toolbar trailing={
      // `tooltip` is shown under the pointer and read after the name.
      <Button label="reset" variant="ghost" tooltip="sets the count back to zero"
              onPress={{ kind: 'reset' }} />
    }>
      <Button label="+1" variant="primary" onPress={{ kind: 'add', by: 1 }} />
      <Button label="-1" onPress={{ kind: 'add', by: -1 }} />
    </Toolbar>
    <box pad={16} gap={12} width="grow" height="grow">
      {/* A screen reader reads the new count when it changes. A live
          region reads as one message, so it holds the number alone. */}
      <box live="polite">
        <Stat label="count" value={String(model.count)} />
      </box>
      {/* `value` is the model's text, declared every frame, and
          `onChange` brings what was typed back. */}
      <TextField label="note" placeholder="type something" value={model.note}
                 onChange={{ kind: 'note' }} />
    </box>
    <Statusbar trailing={<Badge label="right-click for more" />}>
      <Badge label={`note: ${model.note || '(empty)'}`} tone={model.note ? 'accent' : 'neutral'} />
    </Statusbar>
    {model.menu ? <ContextMenu at={model.menu} /> : null}
  </box>
);
