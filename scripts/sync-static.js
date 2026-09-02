/**
 * Syncs the CRA build output (build/static) into the served root static/
 * folder and updates root index.html hashed asset references.
 * Run:  npm run build && npm run sync
 * Server: http://localhost/ecommerce-project/ (Apache serves root index.html + static/)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BUILD_STATIC = path.join(ROOT, 'build', 'static');
const STATIC = path.join(ROOT, 'static');
const INDEX = path.join(ROOT, 'index.html');

function walk(dir, base) {
  const out = new Map();
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(abs, base).forEach((src, rel) => out.set(rel, src));
    } else {
      out.set(path.relative(base, abs), abs);
    }
  }
  return out;
}

const buildFiles = walk(BUILD_STATIC, BUILD_STATIC); // rel -> absolute in build
let copied = 0;

for (const [rel, src] of buildFiles) {
  const dest = path.join(STATIC, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  copied++;
}

let removed = 0;
for (const sub of ['js', 'css', 'media']) {
  const dir = path.join(STATIC, sub);
  if (!fs.existsSync(dir)) continue;
  for (const [rel] of walk(dir, STATIC)) {
    if (!buildFiles.has(rel)) {
      fs.unlinkSync(path.join(STATIC, rel));
      removed++;
    }
  }
}

const jsName = [...buildFiles.keys()]
  .filter((r) => /^js[\\/]main\.[a-f0-9]+\.js$/.test(r))[0]
  ?.split(/[\\/]/)[1];
const cssName = [...buildFiles.keys()]
  .filter((r) => /^css[\\/]main\.[a-f0-9]+\.css$/.test(r))[0]
  ?.split(/[\\/]/)[1];

if (!jsName || !cssName) {
  console.error('Could not locate main.[hash].js / main.[hash].css in build/static');
  process.exit(1);
}

let html = fs.readFileSync(INDEX, 'utf8');
let htmlChanged = false;
const updated = html.replace(
  /\.\/static\/(js|css)\/main\.[a-f0-9]+\.(js|css)/g,
  (m) => {
    htmlChanged = true;
    return m.endsWith('.js') ? `./static/js/${jsName}` : `./static/css/${cssName}`;
  }
);
fs.writeFileSync(INDEX, updated);

console.log(`Synced ${copied} file(s) into static/ (${removed} stale removed).`);
console.log(`index.html -> static/js/${jsName} + static/css/${cssName}${htmlChanged ? '' : '  (WARN: no hash references matched!)'}`);