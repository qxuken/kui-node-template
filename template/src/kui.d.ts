// Types only. Registers this app's `Msg` so message props (`onClick`,
// `onChange`, `modal`, `windowEvents`, …) reject anything else, and a
// handler prop takes only the messages that carry its event's field:
// `onChange` takes `{ kind: 'note' }` because `Msg` registers it as an
// `EditChangeMsg`. Without this file they accept any plain data.
//
// Use `import('./app.js').Msg` inline — a bare `Msg` here resolves to the
// package's own type. `export {}` makes this an augmentation.
export {};

declare module '@qxuken/kui/jsx-runtime' {
  interface KuiMsg {
    msg: import('./app.js').Msg;
  }
}
