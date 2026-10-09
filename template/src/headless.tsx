// The same app without a window, driven the way a user would drive it.
import { createApp, decodeQuads } from '@qxuken/kui';
import { init, update, view, type Model, type AnyMsg } from './app.js';

// Keep what `teardown` is handed, to check it at the end.
let kept: Model | undefined;
let tornDown = 0;
const teardown = (model: Model) => { kept = model; tornDown += 1; };

const app = createApp<Model, AnyMsg>({ init, update, view, teardown }, { width: 640, height: 480 });

const stats = app.render();
console.log(`frame: ${stats.quadCount} quads @ ${stats.viewportW}x${stats.viewportH}`);

/** The rect of the node a screen reader calls `name`. Two such nodes raise
 *  `ambiguous-name`, which fails the drive. */
function rectNamed(name: string) {
  const key = app.ctx.keyNamed(name);
  const node = app.accessTree().nodes.find((n) => n.key === key);
  if (!node) throw new Error(`no node named ${name} in the access tree`);
  return node.rect;
}

function center(name: string): readonly [number, number] {
  const { x, y, w, h } = rectNamed(name);
  return [x + w / 2, y + h / 2] as const;
}

app.click(...center('+1'));
app.click(...center('+1'));
app.click(...center('-1'));
console.log(`after +1 +1 -1: count = ${app.model.count}`);

// The pointer is still on `-1` from the last click.
const shapeAt = (x: number, y: number) => { app.ctx.cursor(x, y); return app.ctx.cursorShape(); };
console.log(`cursor: -1 ${app.ctx.cursorShape()}, page ${shapeAt(600, 460)}, note ${shapeAt(...center('note'))}`);

app.ctx.focus('note');
app.type('hello from node');
console.log(`note: "${app.model.note}"`);

app.rightClick(500, 400);
console.log(`menu at ${JSON.stringify(app.model.menu)}`);
app.press('escape');
console.log(`after escape: menu = ${app.model.menu}`);
app.rightClick(500, 400);
// The menu slides in, so wait for it to settle before clicking into it.
const fullMotionMs = app.runOut();
// Both `reset` buttons are in the tree while the menu is open; the parent
// tells them apart. Read off the tree, since `keyNamed('reset')` would warn.
const tree = app.accessTree();
for (const node of tree.nodes.filter((n) => n.name === 'reset')) {
  const parent = tree.nodes.find((n) => n.key === node.parent);
  console.log(`reset in the ${parent?.role}: "${node.description}"`);
}
app.click(...center('+10'));
console.log(`after the menu's +10: count = ${app.model.count}, menu = ${app.model.menu}`);

// Check the painted colours against the theme's roles.
const hex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
const role = (rgba: number) => '#' + (rgba >>> 0).toString(16).padStart(8, '0').slice(0, 6);
const quads = () => decodeQuads(app.ctx.quads()).map((q) => ({ ...q, hex: '#' + q.color.slice(0, 3).map(hex).join('') }));
/** The stock button named `name` as painted: its fill and its label's colour. */
function button(name: string) {
  const { x, y, w, h } = rectNamed(name);
  const inside = (q: { x: number; y: number }) => q.x >= x && q.x < x + w && q.y >= y && q.y < y + h;
  const [fill, ...glyphs] = quads().filter(inside);
  return { fill: fill.hex, label: glyphs[0].hex };
}
// Quad 0 is the root box, painted first.
const report = (who: string) => {
  const t = app.ctx.theme();
  const plus = button('+1');
  const same = (painted: string, name: string, value: number) =>
    `${painted} ${painted === role(value) ? '=' : '!='} theme.${name}`;
  console.log(`${who}: background ${same(quads()[0].hex, 'bg', t.bg)};`
    + ` +1 fill ${same(plus.fill, 'accent', t.accent)}, label ${same(plus.label, 'onAccent', t.onAccent)}`);
};
report('appearance unknown');

// Declare the user a window would read off the OS: light mode, a yellow
// accent (so labels go black), and reduced motion.
app.ctx.setEnv({ system: { appearance: 'light', accent: '#ffcc00', motion: 'reduced' } });
app.render();
report('appearance light, accent #ffcc00');

// With reduced motion the menu opens settled.
app.rightClick(500, 400);
console.log(`reduced motion: menu settles in ${app.runOut()}ms, full motion took ${fullMotionMs}ms`);

// `teardown` runs once; the second call does nothing.
app.teardown();
app.teardown();
console.log(`teardown ran ${tornDown} time(s), kept count = ${kept?.count}, note = "${kept?.note}"`);

if (app.warnings.length > 0) {
  console.error(`${app.warnings.length} warning(s)`);
  process.exit(1);
}
