// A real window: winit + wgpu underneath, the Elm loop in JS on top. The
// promise resolves with the final model when the window closes.
import { runWindowed } from '@qxuken/kui';
import { init, update, view, type Model, type AnyMsg } from './app.js';

// `npm start -- --motion reduced` pins that one reading over the OS's for
// the life of the window, so the branch `view` takes for it can be looked
// at on a machine whose owner did not ask for less motion. Everything not
// pinned keeps following the OS, and a change to it still arrives as the
// `system` message. An option rather than an environment variable, so a
// shipped app's motion is its own code's decision.
const flag = process.argv.indexOf('--motion');
const motion = flag === -1 ? undefined : process.argv[flag + 1];
if (motion !== undefined && motion !== 'full' && motion !== 'reduced') {
  console.error(`--motion takes full or reduced, not ${JSON.stringify(motion ?? '')}`);
  process.exit(2);
}

const finalModel = await runWindowed<Model, AnyMsg>(
  { init, update, view },
  { title: 'kui app', width: 640, height: 480, minWidth: 420, minHeight: 320,
    system: motion === undefined ? undefined : { motion } },
);
console.log('window closed, final model:', JSON.stringify(finalModel));
