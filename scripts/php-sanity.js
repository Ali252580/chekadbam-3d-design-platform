/* Lightweight PHP structural sanity check (no PHP binary needed).
   Flags unbalanced braces/parens/brackets outside strings+comments and
   unterminated string literals per line. Usage: node scripts/php-sanity.js <files...> */
const fs = require('fs');

function check(file) {
	const src = fs.readFileSync(file, 'utf8');
	const issues = [];
	let inPHP = false;
	let depth = { '{': 0, '(': 0, '[': 0 };
	let line = 1;
	let i = 0;
	const n = src.length;
	let heredoc = null;
	while (i < n) {
		const c = src[i];
		if (c === '\n') line++;
		if (!inPHP) {
			if (src.startsWith('<?php', i) || src.startsWith('<?=', i)) { inPHP = true; i += 5; continue; }
			if (src.startsWith('?>', i)) { i += 2; continue; }
			i++;
			continue;
		}
		if (src.startsWith('?>', i)) { inPHP = false; i += 2; continue; }
		if (heredoc) {
			if (src.startsWith(heredoc.tag, i) && (i === 0 || /\n/.test(src[i - 1]))) {
				const end = src.indexOf('\n', i);
				heredoc = null;
				i = end < 0 ? n : end + 1;
				line++;
				continue;
			}
			i++;
			continue;
		}
		if (src.startsWith('//', i) || src.startsWith('#', i)) {
			const end = src.indexOf('\n', i);
			i = end < 0 ? n : end;
			continue;
		}
		if (src.startsWith('/*', i)) {
			const end = src.indexOf('*/', i + 2);
			const stop = end < 0 ? n : end + 2;
			line += src.slice(i, stop).split('\n').length - 1;
			i = stop;
			continue;
		}
		if (src.startsWith('<<<', i)) {
			const m = /^<<<\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?/.exec(src.slice(i, i + 80));
			if (m) { heredoc = { tag: m[1] }; i += m[0].length; continue; }
		}
		if (c === '"' || c === "'") {
			let j = i + 1, closed = false;
			while (j < n) {
				if (src[j] === '\\') { j += 2; continue; }
				if (src[j] === '\n') break;
				if (src[j] === c) { closed = true; break; }
				j++;
			}
			if (!closed) issues.push(`line ${line}: unterminated ${c} string`);
			line += src.slice(i, j).split('\n').length - 1;
			i = j + 1;
			continue;
		}
		if (c === '{') depth['{']++;
		else if (c === '}') { depth['{']--; if (depth['{'] < 0) issues.push(`line ${line}: stray }`); }
		else if (c === '(') depth['(']++;
		else if (c === ')') { depth['(']--; if (depth['('] < 0) issues.push(`line ${line}: stray )`); }
		else if (c === '[') depth['[']++;
		else if (c === ']') { depth['[']--; if (depth['['] < 0) issues.push(`line ${line}: stray ]`); }
		i++;
	}
	for (const k of ['{', '(', '[']) if (depth[k] !== 0) issues.push(`unbalanced ${k === '{' ? 'braces' : k === '(' ? 'parens' : 'brackets'}: ${depth[k]}`);
	return issues;
}

const files = process.argv.slice(2);
let bad = 0;
for (const f of files) {
	const issues = check(f);
	if (issues.length) { bad++; console.log(`FAIL ${f}`); issues.slice(0, 6).forEach((s) => console.log(`     ${s}`)); }
	else console.log(`ok   ${f}`);
}
process.exit(bad ? 1 : 0);
