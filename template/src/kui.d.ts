// Types only. Registers this app's `Msg` so payload props (`onClick`,
// `onContextMenu`, `modal`, …) reject anything else; without this file they
// accept any plain data.
//
// Register `Msg`, not `AnyMsg`: nodes never send the core's messages. Use
// `import('./app.js').Msg` inline — a bare `Msg` here resolves to the
// package's own type. `export {}` makes this an augmentation.
export {};

declare module '@qxuken/kui/jsx-runtime' {
  interface KuiMsg {
    msg: import('./app.js').Msg;
  }
}
