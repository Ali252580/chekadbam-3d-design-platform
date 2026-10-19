#!/usr/bin/env node
/**
 * build-zip.js — ساخت zip افزونه چکادبام استودیو
 *
 * v2.13.9: فشرده‌سازی استاندارد DEFLATE (method 8) — همان‌طور که همه ابزارهای
 * معمول zip می‌سازند، تا PclZip/ZipArchive وردپرس بدون هیچ محدودیتی بخواند.
 * (نسخه قبلی از stored/method-0 استفاده می‌کرد؛ برخی پیکربندی‌های PclZip
 *  برای فایل بزرگ stored دچار مشکل می‌شوند.)
 *
 *  - جداکننده مسیرها "/" (استاندارد ZIP)
 *  - فایل اصلی افزونه chekadbam-studio/chekadbam-studio.php اول ثبت می‌شود
 */
const fs = require('fs');
const path = require('path');
const zlib = require('node:zlib');

const root = __dirname;
const pluginSrc = path.join(root, 'chekadbam-studio');
const zipOut = path.join(root, 'chekadbam-studio.zip');
const TOP = 'chekadbam-studio/';

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ -1) >>> 0;
}

function dosTime(dt) {
  return {
    t: ((dt.getHours() << 11) | (dt.getMinutes() << 5) | (Math.floor(dt.getSeconds() / 2))) & 0xffff,
    d: (((dt.getFullYear() - 1980) << 9) | ((dt.getMonth() + 1) << 5) | dt.getDate()) & 0xffff,
  };
}

/** یک local file header + داده با روش DEFLATE می‌سازد */
function makeLFH(name, raw, comp, dt) {
  const nameBuf = Buffer.from(name, 'utf8');
  const { t, d } = dosTime(dt);
  const h = Buffer.alloc(30);
  h.writeUInt32LE(0x04034b50, 0); // signature
  h.writeUInt16LE(20, 4);         // version needed to extract
  h.writeUInt16LE(0x0800, 6);     // flags: UTF-8 filename
  h.writeUInt16LE(8, 8);          // method: DEFLATE
  h.writeUInt16LE(t, 10);
  h.writeUInt16LE(d, 12);
  h.writeUInt32LE(crc32(raw), 14);
  h.writeUInt32LE(comp.length, 18);     // compressed size
  h.writeUInt32LE(raw.length, 22);      // uncompressed size
  h.writeUInt16LE(nameBuf.length, 26);
  h.writeUInt16LE(0, 28);         // extra len
  return Buffer.concat([h, nameBuf, comp]);
}

/** central directory record */
function makeCD(name, raw, comp, dt, offset) {
  const nameBuf = Buffer.from(name, 'utf8');
  const { t, d } = dosTime(dt);
  const c = Buffer.alloc(46);
  c.writeUInt32LE(0x02014b50, 0);
  c.writeUInt16LE(0x031e, 4);     // version made by (unix)
  c.writeUInt16LE(20, 6);
  c.writeUInt16LE(0x0800, 8);     // flags UTF-8
  c.writeUInt16LE(8, 10);         // method: DEFLATE
  c.writeUInt16LE(t, 12);
  c.writeUInt16LE(d, 14);
  c.writeUInt32LE(crc32(raw), 16);
  c.writeUInt32LE(comp.length, 20);
  c.writeUInt32LE(raw.length, 24);
  c.writeUInt16LE(nameBuf.length, 28);
  c.writeUInt16LE(0, 30);         // extra len
  c.writeUInt16LE(0, 32);         // comment len
  c.writeUInt16LE(0, 34);         // disk #
  c.writeUInt16LE(0, 36);         // internal attrs
  c.writeUInt32LE(0, 38);         // external attrs
  c.writeUInt32LE(offset, 42);
  return Buffer.concat([c, nameBuf]);
}

function collect(dir, rel, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    const relPath = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) collect(abs, relPath, out);
    else if (e.isFile()) out.push({ name: TOP + relPath, abs });
  }
}

if (!fs.existsSync(pluginSrc)) {
  console.error('پوشه افزونه پیدا نشد:', pluginSrc);
  process.exit(1);
}

const files = [];
collect(pluginSrc, '', files);
// فایل اصلی افزونه اول ثبت می‌شود (وردپرس برای شناسایی پرونده افزونه تکیه بر آن دارد)
files.sort((a, b) => {
  const ap = a.name === TOP + 'chekadbam-studio.php' ? 0 : 1;
  const bp = b.name === TOP + 'chekadbam-studio.php' ? 0 : 1;
  return ap - bp || a.name.localeCompare(b.name);
});

const now = new Date();
let offset = 0;
const parts = [];
const cds = [];
let totalRaw = 0;
for (const f of files) {
  const raw = fs.readFileSync(f.abs);
  totalRaw += raw.length;
  const comp = zlib.deflateRawSync(raw, { level: 9 });
  const lfh = makeLFH(f.name, raw, comp, now);
  parts.push(lfh);
  cds.push(makeCD(f.name, raw, comp, now, offset));
  offset += lfh.length;
}

const cdStart = offset;
const cdBuf = Buffer.concat(cds);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(0, 4);
end.writeUInt16LE(0, 6);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(cdBuf.length, 12);
end.writeUInt32LE(cdStart, 16);
end.writeUInt16LE(0, 20);       // comment len
const zipBuf = Buffer.concat([...parts, cdBuf, end]);
fs.writeFileSync(zipOut, zipBuf);
console.log('✓ ZIP built:', zipOut);
console.log('  files:', files.length, '| raw:', (totalRaw / 1024).toFixed(0), 'KB → zip:', (zipBuf.length / 1024).toFixed(0), 'KB (deflate)');
