/* HTML nesting audit for the plugin templates.
   Reports any element with an id that ends up OUTSIDE the template root
   (the bug class that hid the studio save/BOM modals behind the 3D canvas).
   Usage: node scripts/audit-html.js [file...] */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DEFAULTS = [
	'wordpress-plugin/chekadbam-studio/includes/wp-studio.php',
	'wordpress-plugin/chekadbam-studio/includes/wp-viewer.php',
	'wordpress-plugin/chekadbam-studio/includes/shortcodes.php',
	'wordpress-plugin/chekadbam-studio/includes/meta-boxes.php',
	'wordpress-plugin/chekadbam-studio/test-page.html',
	'public/ckb/index.html',
];

const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const SVG_LEAF = new Set(['path','circle','rect','line','polygon','polyline','ellipse','use','stop','feturbulence','fecolormatrix','feoffset','feblend','fegaussianblur','fedropshadow','fecomposite','fefunca','fefuncr','animate']);

/* Tokenizer over the raw source: skips PHP blocks, HTML comments and quoted
   attribute values so a "<div>" inside a PHP string never counts. */
function tokenize(src) {
	const out = [];
	let i = 0;
	const n = src.length;
	while (i < n) {
		const c = src[i];
		if (c === '<' && src.startsWith('<?php', i)) {
			const end = src.indexOf('?>', i);
			i = end < 0 ? n : end + 2;
			continue;
		}
		if (c === '<' && src.startsWith('<?=', i)) {
			const end = src.indexOf('?>', i);
			i = end < 0 ? n : end + 2;
			continue;
		}
		if (c === '<' && src.startsWith('<!--', i)) {
			const end = src.indexOf('-->', i);
			i = end < 0 ? n : end + 3;
			continue;
		}
		if (c === '<' && /[a-zA-Z/!]/.test(src[i + 1] || '')) {
			/* scan to the tag's closing ">", honouring quotes and PHP blocks */
			let j = i + 1, selfClose = false;
			while (j < n) {
				if (src.startsWith('<?php', j) || src.startsWith('<?=', j)) {
					const end = src.indexOf('?>', j);
					j = end < 0 ? n : end + 2;
					continue;
				}
				const q = src[j];
				if (q === '"' || q === "'") {
					const end = src.indexOf(q, j + 1);
					j = end < 0 ? n : end + 1;
					continue;
				}
				if (src[j] === '>') break;
				j++;
			}
			const raw = src.slice(i, j + 1);
			const m = /^<\/?\s*([a-zA-Z][a-zA-Z0-9-]*)/.exec(raw);
			if (m) {
				const name = m[1].toLowerCase();
				selfClose = /\/\s*$/.test(raw);
				out.push({ closing: raw[1] === '/', name, raw, offset: i, selfClose });
			}
			i = j + 1;
			continue;
		}
		i++;
	}
	return out;
}

const lineOf = (src, idx) => src.slice(0, idx).split('\n').length;

function idOf(raw) {
	const m = /\sid\s*=\s*["']([^"']*)["']/.exec(raw);
	if (!m) return null;
	return m[1].replace(/<\?[^>]*\?>/, 'SID').trim();
}

function audit(file, rootClass) {
	const src = fs.readFileSync(file, 'utf8');
	const tokens = tokenize(src);
	const rootIdx = tokens.findIndex((t) => !t.closing && t.raw.includes(rootClass));
	if (rootIdx < 0) return { skipped: `root "${rootClass}" not found` };
	let depth = 0;
	const inside = [];
	const outside = [];
	let rootClosedAt = null;
	for (let k = rootIdx; k < tokens.length; k++) {
		const t = tokens[k];
		if (t.closing) {
			depth--;
			if (depth === 0 && rootClosedAt === null) rootClosedAt = lineOf(src, t.offset);
			if (depth < 0) break;
			continue;
		}
		const id = idOf(t.raw);
		const entry = { id, line: lineOf(src, t.offset), depth: depth + 1 };
		if (id) (rootClosedAt ? outside : inside).push(entry);
		if (!VOID.has(t.name) && !SVG_LEAF.has(t.name) && !t.selfClose) depth++;
	}
	return { inside, outside, rootClosedAt, rootLine: lineOf(src, tokens[rootIdx].offset) };
}

const files = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULTS;
console.log('=== HTML nesting audit (ids outside the template root) ===');
for (const rel of files) {
	const abs = path.join(ROOT, rel);
	if (!fs.existsSync(abs)) { console.log(`\n-- ${rel}: MISSING`); continue; }
	const roots = ['ckb-wstudio-container', 'ckb-wstudio-viewer', 'ckb-wrap', 'ckb-wstudio'];
	const res = roots.map((r) => audit(abs, r)).find((r) => !r.skipped && r.rootClosedAt !== null) ||
		roots.map((r) => audit(abs, r)).find((r) => !r.skipped);
	console.log(`\n-- ${rel}`);
	if (!res || res.skipped) { console.log('   no ckb root element — skipped'); continue; }
	console.log(`   root at line ${res.rootLine}, closes at line ${res.rootClosedAt || 'EOF (unbalanced open)'}`);
	console.log(`   ids inside root: ${res.inside.length} | ids outside root: ${res.outside.length}`);
	for (const o of res.outside.slice(0, 20)) console.log(`     !! line ${o.line}: ${o.id}`);
}
