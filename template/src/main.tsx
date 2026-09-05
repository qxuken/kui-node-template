// A real window: winit + wgpu underneath, the Elm loop in JS on top. The
// promise resolves with the final model when the window closes.
import { runWindowed } from '@qxuken/kui';
import { init, update, view, type Model, type AnyMsg } from './app.js';

const finalModel = await runWindowed<Model, AnyMsg>(
  { init, update, view },
  { title: 'kui app', width: 640, height: 480, minWidth: 420, minHeight: 320 },
);
console.log('window closed, final model:', JSON.stringify(finalModel));
