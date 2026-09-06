// The same app without a window, driven the way a user would drive it.
import { createApp } from '@qxuken/kui';
import { init, update, view, type Model, type AnyMsg } from './app.js';

const app = createApp<Model, AnyMsg>({ init, update, view }, { width: 640, height: 480 });

const stats = app.render();
console.log(`frame: ${stats.quadCount} quads @ ${stats.viewportW}x${stats.viewportH}`);

/** The centre of the node a screen reader would call `name`. */
function center(name: string): readonly [number, number] {
  const node = app.accessTree().nodes.find((n) => n.name === name);
  if (!node) throw new Error(`no node named ${name} in the access tree`);
  const { x, y, w, h } = node.rect;
  return [x + w / 2, y + h / 2] as const;
}

app.click(...center('+1'));
app.click(...center('+1'));
app.click(...center('-1'));
console.log(`after +1 +1 -1: count = ${app.model.count}`);

// `autofocus` only takes the keyboard while nothing else holds it, and the
// clicks above left focus on a button. `focus` takes the label the node's
// `key` declared, resolved through the last frame — so no rect to click and
// no event from the editor is needed to name it.
app.ctx.focus('note');
app.type('hello from node');
console.log(`note: "${app.model.note}"`);

app.rightClick(500, 400);
console.log(`menu at ${JSON.stringify(app.model.menu)}`);
// `press` is a whole key, both channels in the window's order: the raw press
// to a key sink, then what the core does with it — here, dismissing the
// modal. `keyDown` and `key` are its halves, for a test that means to drive
// one and not the other.
app.press('escape');
console.log(`after escape: menu = ${app.model.menu}`);
app.rightClick(500, 400);
app.click(...center('+10'));
console.log(`after the menu's +10: count = ${app.model.count}, menu = ${app.model.menu}`);

if (app.warnings.length > 0) {
  console.error(`${app.warnings.length} warning(s)`);
  process.exit(1);
}
