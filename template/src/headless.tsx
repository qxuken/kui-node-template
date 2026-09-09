// The same app without a window, driven the way a user would drive it.
import { createApp, decodeQuads } from '@qxuken/kui';
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
// The frame that opens the menu is frame 0 of its `enter`, so the rect the
// access tree reports is the one the item slides in from — `dy: -4`, four px
// above where it comes to rest. `runOut` draws once and then advances in
// frame steps until nothing moves (128 ms here), so the click below lands on
// the settled button, where the user's would.
const fullMotionMs = app.runOut();
// The stock button carries the rows a reader hears, so `reset` says what it
// resets. Both of them are in the tree while the menu is open — a `modal`
// marks the node in effect rather than pruning what is behind it — and what
// tells them apart is the node each one is inside.
const tree = app.accessTree();
for (const node of tree.nodes.filter((n) => n.name === 'reset')) {
  const parent = tree.nodes.find((n) => n.key === node.parent);
  console.log(`reset in the ${parent?.role}: "${node.description}"`);
}
app.click(...center('+10'));
console.log(`after the menu's +10: count = ${app.model.count}, menu = ${app.model.menu}`);

// The four things the user set in the OS are a reading and not a policy: a
// window asks macOS or Windows for them, a headless core knows what `setEnv`
// declared, and `unknown` — the default here — means the host could not tell
// rather than that the user chose nothing. So every frame above is the app's
// own dark palette, and a suite says which user a frame is for.
const hex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
// Painter's order, so the root box is quad 0 — the background the palette
// picked — and the rest is every colour this frame put on screen.
const colors = () => decodeQuads(app.ctx.quads()).map((q) => '#' + q.color.slice(0, 3).map(hex).join(''));
console.log(`appearance unknown: background = ${colors()[0]}`);

app.ctx.setEnv({ system: { appearance: 'light', accent: '#ffcc00', motion: 'reduced' } });
app.render();
// `accent` is the OS colour standing in for the rule's own `bg`, so the
// yellow declared above is drawn where `brand` was and nothing else moves.
console.log(`appearance light: background = ${colors()[0]}, rule accented = ${colors().includes('#ffcc00')}`);

// `motion: 'reduced'` is the user asking for less animation, and dropping the
// menu's `transition` to zero is this app answering — kui shortens nothing on
// its own. The menu now opens settled, so `runOut` has nothing to advance.
app.rightClick(500, 400);
console.log(`reduced motion: menu settles in ${app.runOut()}ms, full motion took ${fullMotionMs}ms`);

if (app.warnings.length > 0) {
  console.error(`${app.warnings.length} warning(s)`);
  process.exit(1);
}
