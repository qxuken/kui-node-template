// Types only — esbuild never sees this file. Registering this app's messages
// makes the payload props (`onClick`, `onDrag`, `onHover`, `onKey`,
// `onLayout`, `onContextMenu`, `modal`) take a `Msg` rather than any plain
// data, so a typo fails at the node. Delete the file and everything still
// compiles; the props just accept any plain data again.
//
// Register `Msg`, not `AnyMsg`: nodes never send the core's messages back,
// and `CoreMsg` is typed in terms of this registration. Write out
// `import('./app.js').Msg` rather than importing at the top — inside the
// augmentation a bare `Msg` resolves to the package's own wire type instead.
// `export {}` is what makes this an augmentation rather than a replacement.
export {};

declare module '@qxuken/kui/jsx-runtime' {
  interface KuiMsg {
    msg: import('./app.js').Msg;
  }
}
