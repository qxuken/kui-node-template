// The same app without a window: build a frame, click the first button by
// hit-testing its quad, print what changed. Handy for tests and CI.
import { createApp, decodeQuads } from '@qxuken/kui';
import type { App } from '@qxuken/kui';
import { init, update, view, type Model, type AnyMsg } from './app.js';

// The annotation matters: `update` reads `app.ctx` inside app's own initializer.
const app: App<Model, AnyMsg> = createApp(
  { init, update: (m, msg, ev) => update(m, msg, ev, (k) => app.ctx.editText(k)), view },
  { width: 640, height: 480 },
);

const stats = app.render();
console.log(`frame: ${stats.quadCount} quads @ ${stats.viewportW}x${stats.viewportH}`);

// Buttons are the radius-6 solid quads, left to right: +1, -1, reset.
const [plus] = decodeQuads(app.ctx.quads())
  .filter((q) => q.kind === 0 && q.radius === 6)
  .sort((a, b) => a.x - b.x);
app.click(plus.x + plus.w / 2, plus.y + plus.h / 2);
console.log('after clicking +1:', JSON.stringify(app.model));
