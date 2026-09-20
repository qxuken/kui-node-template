// The same app without a window, driven the way a user would drive it.
import { createApp, decodeQuads } from '@qxuken/kui';
import { init, update, view, type Model, type AnyMsg } from './app.js';

// `teardown` is what the window runs as it goes — the one thing that runs
// on ⌘Q — so a drive keeps what it was handed and asserts on it at the end,
// where `src/main.tsx` prints it.
let kept: Model | undefined;
let tornDown = 0;
const teardown = (model: Model) => { kept = model; tornDown += 1; };

const app = createApp<Model, AnyMsg>({ init, update, view, teardown }, { width: 640, height: 480 });

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

// The pointer shape is declared, not derived: the arrow over everything
// but text unless a node says `cursor`, and the stock button says
// `pointer` for itself. The last click left the pointer on `-1`, so the
// first reading is the button's; then the page, which declares nothing,
// and the field, the one shape the core still implies.
const shapeAt = (x: number, y: number) => { app.ctx.cursor(x, y); return app.ctx.cursorShape(); };
console.log(`cursor: -1 ${app.ctx.cursorShape()}, page ${shapeAt(600, 460)}, note ${shapeAt(...center('note'))}`);

// The clicks above left focus on a button. `focus` takes the label the
// field declared, resolved through the last frame — so no rect to click and
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
// rather than that the user chose nothing. `theme()` is the palette derived
// from that reading, so a suite says which user a frame is for and reads the
// roles back beside the quads they should have painted.
const hex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
const role = (rgba: number) => '#' + (rgba >>> 0).toString(16).padStart(8, '0').slice(0, 6);
const quads = () => decodeQuads(app.ctx.quads()).map((q) => ({ ...q, hex: '#' + q.color.slice(0, 3).map(hex).join('') }));
/** The stock button named `name` as it was painted: its fill, and its label's colour. */
function button(name: string) {
  const { x, y, w, h } = app.accessTree().nodes.find((n) => n.name === name)!.rect;
  const inside = (q: { x: number; y: number }) => q.x >= x && q.x < x + w && q.y >= y && q.y < y + h;
  const [fill, ...glyphs] = quads().filter(inside);
  return { fill: fill.hex, label: glyphs[0].hex };
}
// Painter's order, so the root box is quad 0 — the window behind everything.
const report = (who: string) => {
  const t = app.ctx.theme();
  const plus = button('+1');
  const same = (painted: string, name: string, value: number) =>
    `${painted} ${painted === role(value) ? '=' : '!='} theme.${name}`;
  console.log(`${who}: background ${same(quads()[0].hex, 'bg', t.bg)};`
    + ` +1 fill ${same(plus.fill, 'accent', t.accent)}, label ${same(plus.label, 'onAccent', t.onAccent)}`);
};
report('appearance unknown');

// An unknown appearance is the dark base; a declared light one with a yellow
// accent is a light page, the rule and every stock button in yellow, and
// their labels black — the readability arithmetic this app never wrote.
// `+1` stands for all three: a stock button declares nothing for its paint.
// In a window the same change arrives as a `system` message too, so `view`
// runs again; here the test wrote the reading itself, and renders.
app.ctx.setEnv({ system: { appearance: 'light', accent: '#ffcc00', motion: 'reduced' } });
app.render();
report('appearance light, accent #ffcc00');

// `motion: 'reduced'` is the user asking for less animation, and dropping the
// menu's `transition` to zero is this app answering — kui shortens nothing on
// its own. The menu now opens settled, so `runOut` has nothing to advance.
// The same reading pinned on a window is `npm start -- --motion reduced`.
app.rightClick(500, 400);
console.log(`reduced motion: menu settles in ${app.runOut()}ms, full motion took ${fullMotionMs}ms`);

// A headless drive ends the way a window does: `app.teardown()` runs the
// config's `teardown` with the model as it stands, once — a second call is
// nothing, as a window that is already gone has nothing more to say.
app.teardown();
app.teardown();
console.log(`teardown ran ${tornDown} time(s), kept count = ${kept?.count}, note = "${kept?.note}"`);

if (app.warnings.length > 0) {
  console.error(`${app.warnings.length} warning(s)`);
  process.exit(1);
}
