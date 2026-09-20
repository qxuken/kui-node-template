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

// Runs once as the window goes for good, with the model as it stands —
// from inside the pump that saw it go, before the promise resolves. On a
// Mac, ⌘Q (Quit from the menu or the dock is the same thing) ends the
// process inside that pump: the promise never resolves, and nothing after
// the `await` below runs, not even `process.on('exit')`. So this is the
// only thing an app runs on ⌘Q, and where a session, a draft or a position
// is saved. The window is gone by then: nothing draws, and its doors are
// not for it. Headless, `app.teardown()` runs the same function.
const teardown = (model: Model) => {
  console.log('window gone, final model:', JSON.stringify(model));
};

const finalModel = await runWindowed<Model, AnyMsg>(
  { init, update, view, teardown },
  { title: 'kui app', width: 640, height: 480, minWidth: 420, minHeight: 320,
    system: motion === undefined ? undefined : { motion } },
);
// Reached by the close button, and never by ⌘Q.
console.log('runWindowed resolved:', JSON.stringify(finalModel));
