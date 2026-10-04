#!/usr/bin/env node
// `npm create @qxuken/kui-node <dir>` runs this: it copies template/ into <dir>,
// names the package after the directory and restores the dotfile that npm
// refuses to publish (.gitignore travels as _gitignore).
import { cpSync, existsSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`usage: npm create @qxuken/kui-node [dir]

Creates a kui Node app in <dir> (default: kui-app): a counter in a real
window, JSX views compiled by esbuild, kui installed from npm with its
prebuilt addon.`);
  process.exit(0);
}

const dir = path.resolve(args.find((a) => !a.startsWith('-')) ?? 'kui-app');
const name = path.basename(dir).toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
if (existsSync(dir) && readdirSync(dir).length > 0) {
  console.error(`${dir} exists and is not empty`);
  process.exit(1);
}

const templateDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'template');
cpSync(templateDir, dir, { recursive: true });
renameSync(path.join(dir, '_gitignore'), path.join(dir, '.gitignore'));

const pkgPath = path.join(dir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
pkg.name = name;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const rel = path.relative(process.cwd(), dir) || '.';
console.log(`created ${name} in ${rel}

  cd ${rel}
  npm install
  npm start            # opens the window
  npm run headless     # drives a frame without a window
`);
