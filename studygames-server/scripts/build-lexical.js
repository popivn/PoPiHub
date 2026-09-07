const fs = require('fs');
const path = require('path');
const https = require('https');

const dataDir = path.resolve(__dirname, '..', 'data', 'lexical');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function buildLexicalData() {
  console.log('1. Fetching antonyms...');
  const antRaw = await fetchText('https://raw.githubusercontent.com/fighting41love/funNLP/master/data/%E5%90%8C%E4%B9%89%E8%AF%8D%E5%BA%93%E3%80%81%E5%8F%8D%E4%B9%89%E8%AF%8D%E5%BA%93%E3%80%81%E5%90%A6%E5%AE%9A%E8%AF%8D%E5%BA%93/%E5%8F%8D%E4%B9%89%E8%AF%8D%E5%BA%93.txt');
  const antLines = antRaw.split(/\r?\n/).filter(Boolean);
  const antonymsMap = {};

  for (const line of antLines) {
    const parts = line.split(/[\u2014\u2500\u2015\-~—]+/).map(s => s.trim()).filter(Boolean);
    if (parts.length === 2) {
      const [w1, w2] = parts;
      if (!antonymsMap[w1]) antonymsMap[w1] = [];
      if (!antonymsMap[w2]) antonymsMap[w2] = [];
      if (!antonymsMap[w1].includes(w2)) antonymsMap[w1].push(w2);
      if (!antonymsMap[w2].includes(w1)) antonymsMap[w2].push(w1);
    }
  }
  fs.writeFileSync(path.join(dataDir, 'antonyms.json'), JSON.stringify(antonymsMap), 'utf8');
  console.log('Saved antonyms.json with ' + Object.keys(antonymsMap).length + ' entries.');

  console.log('2. Fetching synonyms...');
  const synRaw1 = await fetchText('https://raw.githubusercontent.com/jaaack-wang/Chinese-Synonyms/master/synonyms.json');
  const synMap1 = JSON.parse(synRaw1);
  const synonymsMap = {};

  for (const [k, list] of Object.entries(synMap1)) {
    if (Array.isArray(list) && list.length > 0) {
      synonymsMap[k] = list.filter(w => w !== k);
    }
  }

  const cilinRaw = await fetchText('https://raw.githubusercontent.com/fighting41love/funNLP/master/data/%E5%90%8C%E4%B9%89%E8%AF%8D%E5%BA%93%E3%80%81%E5%8F%8D%E4%B9%89%E8%AF%8D%E5%BA%93%E3%80%81%E5%90%A6%E5%AE%9A%E8%AF%8D%E5%BA%93/%E5%90%8C%E4%B9%89%E8%AF%8D%E5%BA%93.txt');
  const cilinLines = cilinRaw.split(/\r?\n/).filter(Boolean);
  for (const line of cilinLines) {
    // Only exact synonyms '='
    if (line.includes('=')) {
      const parts = line.split('=')[1]?.trim().split(/\s+/).filter(Boolean) || [];
      if (parts.length > 1) {
        for (const w of parts) {
          if (!synonymsMap[w]) synonymsMap[w] = [];
          for (const other of parts) {
            if (other !== w && !synonymsMap[w].includes(other)) {
              synonymsMap[w].push(other);
            }
          }
        }
      }
    }
  }

  // Cap each word to 12 best synonyms to keep file compact and responsive
  for (const k of Object.keys(synonymsMap)) {
    if (synonymsMap[k].length > 12) {
      synonymsMap[k] = synonymsMap[k].slice(0, 12);
    }
  }

  fs.writeFileSync(path.join(dataDir, 'synonyms.json'), JSON.stringify(synonymsMap), 'utf8');
  console.log('Saved synonyms.json with ' + Object.keys(synonymsMap).length + ' entries.');

  console.log('3. Building POS from hsk30.csv...');
  const hskCsvPath = path.resolve(__dirname, '..', 'data', 'hsk', 'hsk30.csv');
  const hskCsvRaw = fs.readFileSync(hskCsvPath, 'utf8');
  const hskLines = hskCsvRaw.split(/\r?\n/).filter(Boolean);
  const posMap = {
    'Adj': 'Tính từ',
    'V': 'Động từ',
    'N': 'Danh từ',
    'Adv': 'Phó từ',
    'Num': 'Số từ',
    'M': 'Lượng từ',
    'Pron': 'Đại từ',
    'Prep': 'Giới từ',
    'Conj': 'Liên từ',
    'Aux': 'Trợ từ',
    'Interj': 'Thán từ',
    'Ono': 'Từ tượng thanh'
  };

  const translatePos = (rawPos) => {
    if (!rawPos) return '';
    return rawPos.split(/[\/,]/).map(p => {
      const trimmed = p.trim();
      return posMap[trimmed] || trimmed;
    }).join(' / ');
  };

  const hskPosObj = {};
  for (let i = 1; i < hskLines.length; i++) {
    const line = hskLines[i];
    const match = line.match(/^[^,]+,([^,]+),([^,]+),([^,]+),([^,]*),(\d+)/);
    if (match) {
      const [, simplified, traditional, pinyin, rawPos, level] = match;
      const subWords = simplified.split('|');
      for (const w of subWords) {
        if (!hskPosObj[w] && rawPos) {
          hskPosObj[w] = {
            pos: rawPos,
            posVi: translatePos(rawPos),
            level: parseInt(level, 10)
          };
        }
      }
    }
  }
  fs.writeFileSync(path.join(dataDir, 'hsk-pos.json'), JSON.stringify(hskPosObj), 'utf8');
  console.log('Saved hsk-pos.json with ' + Object.keys(hskPosObj).length + ' entries.');
}

buildLexicalData().catch(console.error);
