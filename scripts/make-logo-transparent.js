#!/usr/bin/env node
// Fetch logo from Cloudinary, remove white background, upload back as transparent PNG.
// Usage: node scripts/make-logo-transparent.js

const sharp = require('sharp');
const https = require('https');
const http = require('http');

const SOURCE_URL = 'https://res.cloudinary.com/dcpeomifz/image/upload/image0_1_avuytq.png';
const CLOUD_NAME = 'dcpeomifz';
const UPLOAD_PRESET = 'wots_unsigned';

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

async function removeWhiteBg(inputBuffer) {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const { width, height, channels } = info;

  for (let i = 0; i < width * height; i++) {
    const offset = i * channels;
    const r = pixels[offset];
    const g = pixels[offset + 1];
    const b = pixels[offset + 2];
    // If pixel is near-white, make it transparent
    if (r > 240 && g > 240 && b > 240) {
      pixels[offset + 3] = 0; // set alpha to 0
    }
  }

  return sharp(Buffer.from(pixels), { raw: { width, height, channels } })
    .png()
    .toBuffer();
}

function uploadToCloudinary(buffer) {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now();
    const filename = 'wots_logo_transparent.png';

    let body = '';
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="upload_preset"\r\n\r\n${UPLOAD_PRESET}\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="public_id"\r\n\r\nwots_logo_transparent\r\n`;
    body += `--${boundary}\r\n`;
    body += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    body += `Content-Type: image/png\r\n\r\n`;

    const bodyStart = Buffer.from(body, 'utf-8');
    const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
    const payload = Buffer.concat([bodyStart, buffer, bodyEnd]);

    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': payload.length,
      },
    };

    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString();
        try {
          const json = JSON.parse(text);
          if (json.secure_url) {
            resolve(json.secure_url);
          } else {
            reject(new Error('Upload failed: ' + text));
          }
        } catch {
          reject(new Error('Invalid response: ' + text));
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const fs = require('fs');
  const path = require('path');

  // Resolve project root (script is in scripts/)
  const projectRoot = path.resolve(__dirname, '..');
  const outPath = path.join(projectRoot, 'frontend/public/art/logo-transparent.png');

  console.log('Fetching original logo...');
  const original = await fetchBuffer(SOURCE_URL);
  console.log(`Downloaded ${original.length} bytes`);

  console.log('Removing white background (R>240, G>240, B>240 → transparent)...');
  const transparent = await removeWhiteBg(original);
  console.log(`Transparent PNG: ${transparent.length} bytes`);

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, transparent);
  console.log(`Saved to ${outPath}`);

  // Optionally upload to Cloudinary
  console.log('\nUploading to Cloudinary...');
  try {
    const url = await uploadToCloudinary(transparent);
    console.log('Uploaded! New URL:', url);
    console.log('\nUpdate LOGO_URL in your code to:', url);
  } catch (err) {
    console.log('Cloudinary upload failed:', err.message);
    console.log('The local file at /art/logo-transparent.png is ready to use.');
    console.log('Code already references /art/logo-transparent.png as fallback.');
  }
}

main().catch(console.error);
