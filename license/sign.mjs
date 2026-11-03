#!/usr/bin/env node
/**
 * Chekadbam license signer — Ed25519 detached signatures.
 *
 * Usage:
 *   node sign.mjs genkey [--force]           # → keys/chekadbam-license.key + public key (base64)
 *   node sign.mjs sign domains.json -o license.json [-k keys/chekadbam-license.key]
 *   node sign.mjs verify license.json        # local sanity check (same math as WP side)
 *
 * The license.json layout is verified by includes/license.php in the WP plugin
 * with sodium_crypto_sign_verify_detached against the baked-in public key.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);

function die(msg) {
	console.error(`✕ ${msg}`);
	process.exit(1);
}

function parseArgs(argv) {
	const out = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '-o' || a === '--out') out.out = argv[++i];
		else if (a === '-k' || a === '--key') out.key = argv[++i];
		else if (a === '--force') out.force = true;
		else out._.push(a);
	}
	return out;
}

/** Recursively sort object keys → deterministic bytes, so verification is exact. */
function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === 'object') {
		const obj = {};
		for (const k of Object.keys(value).sort()) obj[k] = canonical(value[k]);
		return obj;
	}
	return value;
}

function domainKey(host) {
	return String(host).trim().toLowerCase().replace(/^www\./, '');
}

function normalizeDomains(raw) {
	const domains = {};
	for (const [host, entry] of Object.entries(raw.domains || {})) {
		domains[domainKey(host)] = entry || { status: 'active' };
	}
	return domains;
}

function buildPayload(domainsFile) {
	const raw = JSON.parse(fs.readFileSync(domainsFile, 'utf8'));
	const payload = {
		version: 1,
		issuer: raw.issuer || 'chekadbam',
		generatedAt: raw.generatedAt || new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
		notAfter: raw.notAfter || null,
		domains: normalizeDomains(raw),
	};
	return payload;
}

function loadKey(keyArg) {
	const keyPath = keyArg || path.join(here, 'keys', 'chekadbam-license.key');
	if (!fs.existsSync(keyPath)) {
		die(`کلید خصوصی پیدا نشده: ${keyPath}\n  اول این را اجرا کن: node sign.mjs genkey`);
	}
	return crypto.createPrivateKey(fs.readFileSync(keyPath, 'utf8'));
}

/* ------------------------------- genkey ------------------------------- */

function genkey(opts) {
	const dir = path.join(here, 'keys');
	const priv = path.join(dir, 'chekadbam-license.key');
	const pubTxt = path.join(dir, 'chekadbam-license-public.txt');
	if (fs.existsSync(priv) && !opts.force) {
		die(`کلید از قبل وجود دارد: ${priv} (برای ساخت جدید از --force استفاده کن)`);
	}
	fs.mkdirSync(dir, { recursive: true });
	const { privateKey, publicKey } = crypto.generateKeyPairSync('ed25519');
	fs.writeFileSync(priv, privateKey.export({ type: 'pkcs8', format: 'pem' }));
	const rawPub = publicKey.export({ type: 'spki', format: 'der' }).subarray(-32); // last 32 bytes = raw Ed25519 key
	const pubB64 = rawPub.toString('base64');
	fs.writeFileSync(pubTxt, pubB64 + '\n');
	console.log('✓ کلید خصوصی: ' + priv + '  (فوری محافظت کن — هرگز کامیت نشود)');
	console.log('✓ کلید عمومی (فقط در افزونه): ' + pubB64);
}

/* ------------------------------- sign ------------------------------- */

function sign(opts) {
	const input = opts._[1] || path.join(here, 'domains.json');
	if (!fs.existsSync(input)) die(`فایل دامنه‌ها پیدا نشد: ${input}`);
	const key = loadKey(opts.key);

	const payload = buildPayload(input);
	const payloadStr = JSON.stringify(canonical(payload));
	const signature = crypto.sign(null, Buffer.from(payloadStr, 'utf8'), key).toString('base64');

	const license = {
		version: 1,
		issuer: payload.issuer,
		generatedAt: payload.generatedAt,
		notAfter: payload.notAfter || null,
		payloadStr,
		signature,
	};

	const out = opts.out || path.join(here, 'license.json');
	fs.writeFileSync(out, JSON.stringify(license, null, 2) + '\n');
	const n = Object.keys(payload.domains).length;
	const active = Object.values(payload.domains).filter((d) => (d.status || 'active') === 'active').length;
	console.log(`✓ لایسنس ساخته شد: ${out}`);
	console.log(`  دامنه‌ها: ${n} (${active} فعال) | انقضای کلی: ${payload.notAfter || '—'}`);
}

/* ------------------------------- verify ------------------------------- */

function verify(cmd) {
	const file = cmd._[1] || path.join(here, 'license.json');
	if (!fs.existsSync(file)) die(`فایل لایسنس پیدا نشد: ${file}`);
	const lic = JSON.parse(fs.readFileSync(file, 'utf8'));
	// Public key from keys dir unless overridable via env for key rotation testing.
	const pubB64 = process.env.CKB_LICENSE_PUBLIC_KEY || fs.readFileSync(path.join(here, 'keys', 'chekadbam-license-public.txt'), 'utf8').trim();
	const pubRaw = crypto.createPublicKey({
		key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), Buffer.from(pubB64, 'base64')]),
		format: 'der',
		type: 'spki',
	});
	const ok = crypto.verify(null, Buffer.from(lic.payloadStr, 'utf8'), pubRaw, Buffer.from(lic.signature, 'base64'));
	if (!ok) die('امضای فایل لایسنس نامعتبر است.');
	const payload = JSON.parse(lic.payloadStr);
	console.log('✓ اعتبار — امضا معتبر است.');
	console.log(`  issued: ${payload.generatedAt} | notAfter: ${payload.notAfter || '—'}`);
	for (const [host, d] of Object.entries(payload.domains)) {
		console.log(`  ${host.padEnd(40)} ${d.status || 'active'}${d.until ? '  تا ' + d.until : ''}${d.note ? '  ' + d.note : ''}`);
	}
}

/* ------------------------------- main ------------------------------- */

const cmd = parseArgs(args);
switch (cmd._[0]) {
	case 'genkey':
		genkey(cmd);
		break;
	case 'sign':
	case 'verify':
	case undefined:
		if (cmd._[0] === undefined && !cmd.out && !cmd.key) {
			console.log(import.meta.url.split('/').pop() + ' — ابزار امضای لایسنس چکادبام');
			console.log('  node sign.mjs genkey            ساخت جفت‌کلید');
			console.log('  node sign.mjs sign domains.json -o license.json');
			console.log('  node sign.mjs verify license.json');
			break;
		}
		if (cmd._[0] === 'sign') sign(cmd);
		else verify(cmd);
		break;
	default:
		die(`دستور ناشناخته: ${cmd._[0]}`);
}
