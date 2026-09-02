// A real window (winit + wgpu) driven from Node. The event loop is pumped
// from a timer, so Node stays responsive while the window is open; the
// promise resolves with the final model when it closes.
import { runWindowed } from '@qxuken/kui';
import { init, update, view } from './app.js';

const finalModel = await runWindowed(
  { init, update: (m, msg, ev, win) => update(m, msg, ev, (k) => win.editText(k)), view },
  { title: 'kui app', width: 640, height: 480 },
);
console.log('window closed, final model:', JSON.stringify(finalModel));
