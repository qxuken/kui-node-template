// Types only — esbuild never sees this file, nothing here reaches the
// bundle. It registers this app's messages with the JSX props, so
// `onClick`, `onDrag`, `onHover`, `onKey` and `<audio tag>` take a `Msg`
// rather than any plain data, and a typo fails where it is written with no
// wrapper call at the node.
//
// The declaration is program-wide (one app per tsconfig), which is why it
// sits here on its own rather than in the middle of the app. It registers
// `Msg` and not `AnyMsg` on purpose: nodes send this app's messages, they
// never send the core's back.
//
// `import('./app.js').Msg` is written out rather than imported at the top
// on purpose too. Inside the augmentation the augmented module's own
// exports are in scope, and `@qxuken/kui/jsx-runtime` exports a `Msg` of
// its own (the wire type, "any plain data"): a bare `Msg` here silently
// resolves to that one and every payload prop goes back to accepting
// anything, with nothing to show for it. `export {}` keeps this file a
// module, which is what makes the block an augmentation rather than a
// declaration that would replace the package's types outright.
//
// Optional: delete this file and the payload props accept any plain data
// again, while `update`, the events and `dispatch` keep this app's union
// from the `runWindowed<Model, AnyMsg>` and `App<Model, AnyMsg>`
// annotations.
export {};

declare module '@qxuken/kui/jsx-runtime' {
  interface KuiMsg {
    msg: import('./app.js').Msg;
  }
}
