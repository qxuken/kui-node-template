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
