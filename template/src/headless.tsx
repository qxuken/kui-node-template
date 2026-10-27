// The same app without a window, driven the way a user would drive it.
import { createApp, decodeQuads } from '@qxuken/kui';
import { extension as kit } from '@qxuken/kui/kit';
import { init, update, view, type Model, type Msg } from './app.js';

// Keep what `teardown` is handed, to check it at the end.
let kept: Model | undefined;
let tornDown = 0;
const teardown = (model: Model) => { kept = model; tornDown += 1; };

// Kit loads before the first frame, as it does on a window.
const app = createApp<Model, Msg>(
  { init, update, view, teardown },
  { width: 640, height: 480, extensions: [kit] },
);

const stats = app.render();
console.log(`frame: ${stats.quadCount} quads @ ${stats.viewportW}x${stats.viewportH}`);

/** The key of the node a screen reader calls `name`. Two such nodes raise
 *  `ambiguous-name`, which fails the drive. */
function keyNamed(name: string) {
  const key = app.ctx.keyNamed(name);
  if (key === null) throw new Error(`no node named ${name} in the access tree`);
  return key;
}

function rectNamed(name: string) {
  const key = keyNamed(name);
  return app.accessTree().nodes.find((n) => n.key === key)!.rect;
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
console.log(`cursor: -1 ${app.ctx.cursorShape()}, page ${shapeAt(600, 300)}, note ${shapeAt(...center('note'))}`);

// Kit's field is keyed in Kit's origin, where a `key` the app wrote is not,
// so it is focused by the key its name finds.
app.ctx.focus(keyNamed('note'));
app.type('hello from node');
console.log(`note: "${app.model.note}"`);

app.rightClick(500, 300);
console.log(`menu at ${JSON.stringify(app.model.menu)}`);
app.press('escape');
console.log(`after escape: menu = ${app.model.menu}`);
app.rightClick(500, 300);
// The menu slides in, so wait for it to settle before clicking into it.
const fullMotionMs = app.runOut();
// The toolbar's `reset` and the menu's are both in the tree while the menu
// is open; the role tells them apart. Read off the tree, since
// `keyNamed('reset')` would warn.
const resets = app.accessTree().nodes.filter((n) => n.name === 'reset').map((n) => n.role);
console.log(`reset while the menu is open: ${resets.join(' and ')}`);
app.click(...center('+10'));
console.log(`after the menu's +10: count = ${app.model.count}, menu = ${app.model.menu}`);

// Kit paints from its skin's light or dark half, picked by the OS's
// appearance: read the buttons' fills and labels under each. Ledger's
// primary is its yellow in both halves; a plain button follows the half.
const hex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
const quads = () => decodeQuads(app.ctx.quads()).map((q) => ({ ...q, hex: '#' + q.color.slice(0, 3).map(hex).join('') }));
/** The Kit button named `name` as painted: its fill and its label's colour. */
function button(name: string) {
  const { x, y, w, h } = rectNamed(name);
  const inside = (q: { x: number; y: number }) => q.x >= x && q.x < x + w && q.y >= y && q.y < y + h;
  // Ledger's hard shadow comes first (kind 5); the fill is the first solid
  // quad (kind 0) and the label its first glyph (kind 1).
  const painted = quads().filter(inside);
  const fill = painted.find((q) => q.kind === 0)!;
  const label = painted.find((q) => q.kind === 1)!;
  return { fill: fill.hex, label: label.hex };
}
const report = (who: string) => {
  const [plus, minus] = [button('+1'), button('-1')];
  console.log(`${who}: +1 ${plus.label} on ${plus.fill}, -1 ${minus.label} on ${minus.fill}`);
};
report('appearance unknown (the dark half)');

// Declare the user a window would read off the OS: light mode and reduced
// motion.
app.ctx.setEnv({ system: { appearance: 'light', motion: 'reduced' } });
app.render();
report('appearance light');

// With reduced motion Kit's menu opens settled.
app.rightClick(500, 300);
console.log(`reduced motion: menu settles in ${app.runOut()}ms, full motion took ${fullMotionMs}ms`);

// `teardown` runs once; the second call does nothing.
app.teardown();
app.teardown();
console.log(`teardown ran ${tornDown} time(s), kept count = ${kept?.count}, note = "${kept?.note}"`);

if (app.warnings.length > 0) {
  console.error(`${app.warnings.length} warning(s)`);
  process.exit(1);
}
