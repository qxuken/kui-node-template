// A real window. The promise resolves with the final model when the window
// closes.
import { runWindowed } from '@qxuken/kui';
import { init, update, view, type Model, type AnyMsg } from './app.js';

// `--motion reduced` pins that one OS reading, to see the reduced-motion
// branch on a machine that did not ask for it. The rest follows the OS.
const flag = process.argv.indexOf('--motion');
const motion = flag === -1 ? undefined : process.argv[flag + 1];
if (motion !== undefined && motion !== 'full' && motion !== 'reduced') {
  console.error(`--motion takes full or reduced, not ${JSON.stringify(motion ?? '')}`);
  process.exit(2);
}

// Runs once as the window goes. On a Mac, ⌘Q ends the process before the
// `await` below returns, so this is the place to save state.
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
