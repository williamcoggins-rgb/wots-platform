#!/usr/bin/env node
/**
 * List all Cloudinary upload presets on the account.
 *
 * Usage:
 *   CLOUDINARY_CLOUD_NAME=... \
 *   CLOUDINARY_API_KEY=... \
 *   CLOUDINARY_API_SECRET=... \
 *   node scripts/list-cloudinary-presets.js
 */

const https = require('https');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

function request(path) {
  return new Promise((resolve, reject) => {
    https
      .request(
        {
          hostname: 'api.cloudinary.com',
          path: `/v1_1/${cloudName}${path}`,
          method: 'GET',
          headers: { 'Authorization': authHeader },
        },
        (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf-8');
            let data = {};
            try { data = text ? JSON.parse(text) : {}; } catch { /* noop */ }
            resolve({ status: res.statusCode, data, text });
          });
        }
      )
      .on('error', reject)
      .end();
  });
}

(async () => {
  console.log(`Listing upload presets for cloud "${cloudName}"…\n`);

  // Paginate through all presets
  let nextCursor = null;
  const all = [];
  do {
    const path = '/upload_presets' + (nextCursor ? `?next_cursor=${encodeURIComponent(nextCursor)}` : '');
    const res = await request(path);
    if (res.status !== 200) {
      console.error(`Status ${res.status}: ${res.text}`);
      process.exit(1);
    }
    const presets = res.data.presets || [];
    all.push(...presets);
    nextCursor = res.data.next_cursor || null;
  } while (nextCursor);

  if (all.length === 0) {
    console.log('No upload presets found on this account.');
    return;
  }

  for (const p of all) {
    const mode = p.unsigned ? 'UNSIGNED' : 'signed';
    console.log(`  • ${p.name.padEnd(30)} ${mode}`);
  }

  console.log(`\nTotal: ${all.length} preset(s).`);

  const target = all.find((p) => p.name === 'wots_unsigned');
  if (!target) {
    console.log('\n❌ "wots_unsigned" is NOT present on this account.');
    process.exit(2);
  }
  console.log(`\n✓ "wots_unsigned" found. unsigned=${target.unsigned}`);
  if (!target.unsigned) {
    console.log('  ⚠ But it is SIGNED — browser uploads will fail. Set unsigned=true in dashboard.');
  }
})().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
