#!/bin/bash
# Download dictionary data files (CEDICT + CVDICT) on deploy
# Run before server starts: node download-data.js or npm run download-data

const { createWriteStream, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const https = require('https');
const http = require('http');
const { createGunzip } = require('zlib');

const DATA_DIR = join(__dirname, '..', 'data');

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        download(res.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (e) => { reject(e); });
  });
}

async function main() {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  // 1. Download CEDICT (gzipped)
  const cedictGz = join(DATA_DIR, 'cedict.txt.gz');
  const cedictTxt = join(DATA_DIR, 'cedict.txt');
  if (!existsSync(cedictTxt)) {
    console.log('Downloading CEDICT...');
    await download('https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz', cedictGz);
    console.log('Extracting CEDICT...');
    await new Promise((resolve, reject) => {
      const gunzip = createGunzip();
      const src = require('fs').createReadStream(cedictGz);
      const dest = createWriteStream(cedictTxt);
      src.pipe(gunzip).pipe(dest);
      dest.on('finish', resolve);
      dest.on('error', reject);
    });
    console.log('CEDICT ready.');
  } else {
    console.log('CEDICT already exists, skipping.');
  }

  // 2. Download CVDICT (raw UTF-8)
  const cvdictPath = join(DATA_DIR, 'cvdict.u8');
  if (!existsSync(cvdictPath)) {
    console.log('Downloading CVDICT...');
    await download('https://raw.githubusercontent.com/ph0ngp/CVDICT/main/CVDICT.u8', cvdictPath);
    console.log('CVDICT ready.');
  } else {
    console.log('CVDICT already exists, skipping.');
  }

  console.log('All dictionary data ready.');
}

main().catch((e) => {
  console.error('Failed to download dictionary data:', e);
  process.exit(1);
});
