# kui app

JSX views lowered into [kui](https://drydock9.qxuken.dev/qxuken/kui)'s IR,
Elm-style messages as data, a real window from Node.

```
npm install        # @qxuken/kui comes from the registry in .npmrc, prebuilt addon included
npm start          # window
npm run headless   # one frame + a click, no window
npm run typecheck
```

`src/app.tsx` holds the model, `update` and `view`; `src/main.tsx` opens the
window and `src/headless.tsx` drives the same app without one.

Messages are typed end to end. `Msg` in `src/app.tsx` is this app's own
union plus `CoreMsg` — what the core sends by itself (`changed`, `submit`,
`key`, `hover`, `drag`, `modifiers`) — so `update` is one switch over
`msg.kind` with no casts, and `createApp` / `runWindowed` carry that union
through to events and `dispatch`. The `declare module` block next to it
registers the app's own messages with the JSX props, which is what makes
`onClick={{ kind: 'add', by: 1 }}` checked at the node; drop the block and
payloads go back to accepting any plain data.
