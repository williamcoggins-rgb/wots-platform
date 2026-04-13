#!/usr/bin/env node
/**
 * One-time setup: create the "wots_unsigned" Cloudinary upload preset.
 *
 * The admin gallery uploader does unsigned browser-side uploads with this
 * preset name. Unsigned presets must be created by an account owner using
 * the Admin API (API key + secret auth). This script is idempotent: if the
 * preset already exists it exits cleanly without modifying it.
 *
 * Usage:
 *   CLOUDINARY_CLOUD_NAME=dcpeomifz \
 *   CLOUDINARY_API_KEY=xxx \
 *   CLOUDINARY_API_SECRET=yyy \
 *   node scripts/setup-cloudinary-preset.js
 */

const https = require('https');

const PRESET_NAME = 'wots_unsigned';
const FOLDER = 'wots-gallery';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error('Missing env vars. Required:');
  console.error('  CLOUDINARY_CLOUD_NAME');
  console.error('  CLOUDINARY_API_KEY');
  console.error('  CLOUDINARY_API_SECRET');
  console.error('\nFind these in the Cloudinary dashboard → Settings → Access Keys.');
  process.exit(1);
}

const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: 'api.cloudinary.com',
        path: `/v1_1/${cloudName}${path}`,
        method,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
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
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function main() {
  console.log(`Cloud: ${cloudName}`);
  console.log(`Preset: ${PRESET_NAME}`);

  // 1. Check if preset already exists
  const check = await request('GET', `/upload_presets/${PRESET_NAME}`);
  if (check.status === 200) {
    console.log(`\n✓ Preset "${PRESET_NAME}" already exists. Nothing to do.`);
    if (check.data && check.data.unsigned === false) {
      console.warn('  ⚠ WARNING: preset exists but is SIGNED. The admin uploader');
      console.warn('    requires unsigned=true. Update it in the Cloudinary dashboard.');
    }
    return;
  }
  if (check.status !== 404) {
    console.error(`\nUnexpected status ${check.status} checking preset:`);
    console.error(check.text);
    process.exit(1);
  }

  // 2. Create the preset
  console.log('\nPreset not found. Creating…');
  const create = await request('POST', '/upload_presets', {
    name: PRESET_NAME,
    unsigned: true,
    folder: FOLDER,
  });

  if (create.status === 200 || create.status === 201) {
    console.log(`✓ Created unsigned preset "${PRESET_NAME}" (folder: ${FOLDER}).`);
    return;
  }

  console.error(`\nFailed to create preset (status ${create.status}):`);
  console.error(create.text);
  process.exit(1);
}

main().catch((err) => {
  console.error('Setup failed:', err);
  process.exit(1);
});
