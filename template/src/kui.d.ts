// Types only. Registers this app's `Msg` so the core's message props
// (`onClick`, `onChange`, `onContextMenu`, `modal`, `windowEvents`, …) reject
// anything else, and a handler prop takes only the messages that carry its
// event's field: `onContextMenu` takes `{ kind: 'openMenu' }` because `Msg`
// registers it as a `ContextMenuMsg`. Without this file they accept any
// plain data. Kit's own `on*` props are typed `unknown` and are not checked.
//
// Use `import('./app.js').Msg` inline — a bare `Msg` here resolves to the
// package's own type. `export {}` makes this an augmentation.
export {};

declare module '@qxuken/kui/jsx-runtime' {
  interface KuiMsg {
    msg: import('./app.js').Msg;
  }
}
