#!/usr/bin/env node
const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');

const MAX_PER_CATEGORY = 20;

const categories = {
  it: {
    name: 'Lĩnh Vực IT',
    nameEn: 'IT',
    icon: 'faLaptopCode',
    candidates:
      '码网电计算机软件硬盘数据程序系统文件屏幕内存键盘鼠标服务器网站互联网应用代码程序员开发接口协议安全数据库云虚拟机容器部署'
  },
  office: {
    name: 'Nơi Công Sở',
    nameEn: 'Office',
    icon: 'faBriefcase',
    candidates:
      '工作司会议报告合同经理客户员工公司办公室项目计划业务文件电话邮件时间工资假期招聘面试简历培训'
  },
  home: {
    name: 'Giao Tiếp Tại Nhà',
    nameEn: 'Home',
    icon: 'faHouseChimney',
    candidates:
      '家饭水睡吃喝洗衣房间门窗桌椅床菜茶米面肉父母亲兄弟姐妹孩子欢迎谢谢再见早晚上午下午睡觉起床洗澡'
  }
};

const cedict = new Map();
const cvdict = new Map();

function parseDict(path, map) {
  const raw = readFileSync(path, 'utf-8');
  const lines = raw.split('\n');
  for (const line of lines) {
    if (line.startsWith('#') || line.trim() === '') continue;
    const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
    if (!match) continue;
    const [, traditional, simplified, pinyin, meanings] = match;
    const meaning = meanings.split('/').filter(m => m.trim() !== '');
    const entry = { traditional, simplified, pinyin, meaning: meaning.join('; ') };
    for (const key of [simplified, traditional]) {
      const list = map.get(key) || [];
      list.push(entry);
      map.set(key, list);
    }
  }
}

parseDict(resolve(process.cwd(), 'data', 'cedict.txt'), cedict);
parseDict(resolve(process.cwd(), 'data', 'cvdict.u8'), cvdict);

function formatPinyin(raw) {
  return raw.replace(/u:/g, 'ü').replace(/\d/g, '').replace(/\s+/g, ' ').trim();
}

function extractHanViet(vietnamese) {
  if (!vietnamese) return '';
  const first = vietnamese.split(';')[0].trim();
  const m = first.match(/^([^()]+)/);
  if (m) {
    const c = m[1].trim();
    if (c.length <= 10 && c.length > 0) return c;
  }
  return first;
}

function lookup(char) {
  const cedictEntries = cedict.get(char) || [];
  const cvdictEntries = cvdict.get(char) || [];
  if (cedictEntries.length === 0 && cvdictEntries.length === 0) return null;
  const cedict0 = cedictEntries[0] || {};
  const cvdict0 = cvdictEntries[0] || {};

  const pinyin = formatPinyin(cedict0.pinyin || cvdict0.pinyin || '');
  const meaningEn = cedict0.meaning || '';
  const vietnamese = cvdict0.meaning || '';
  const hanViet = extractHanViet(vietnamese);

  const examples = [];
  const seen = new Set();
  for (const entry of [...cedictEntries, ...cvdictEntries]) {
    if (entry.simplified === char || entry.traditional === char) continue;
    if (entry.simplified.length <= 1) continue;
    if (seen.has(entry.simplified)) continue;
    seen.add(entry.simplified);
    const meaning = entry.meaning || '';
    if (meaning && examples.length < 3) {
      examples.push({
        sentence: entry.simplified,
        pinyin: formatPinyin(entry.pinyin),
        meaning
      });
    }
  }

  return {
    char,
    pinyin,
    hanViet,
    meaning: vietnamese || meaningEn,
    meaningEn,
    examples
  };
}

function isUsable(lookup) {
  if (!lookup) return false;
  if (!lookup.pinyin) return false;
  if (/\d/.test(lookup.pinyin)) return false;
  if (!lookup.meaning && !lookup.meaningEn) return false;
  const code = lookup.char.codePointAt(0) || 0;
  return code >= 0x4e00 && code <= 0x9fff;
}

const output = {
  total: 0,
  categories: {},
  words: []
};

const used = new Set();
let globalIndex = 0;

for (const [categoryId, rule] of Object.entries(categories)) {
  const selected = [];
  for (const char of rule.candidates) {
    if (used.has(char)) continue;
    const data = lookup(char);
    if (!isUsable(data)) continue;
    used.add(char);
    globalIndex++;
    selected.push({
      id: `cn_${categoryId}_${String(globalIndex).padStart(3, '0')}`,
      char: data.char,
      pinyin: data.pinyin,
      hanViet: data.hanViet,
      meaning: data.meaning,
      meaningEn: data.meaningEn,
      level: categoryId.toUpperCase(),
      category: rule.name,
      categoryEn: rule.nameEn,
      categoryId,
      radical: '',
      strokeCount: 0,
      examples: data.examples
    });
    if (selected.length >= MAX_PER_CATEGORY) break;
  }
  output.categories[categoryId] = selected.length;
  output.total += selected.length;
  output.words.push(...selected);
}

const outPath = resolve(process.cwd(), 'data', 'curated-words.json');
writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');
console.log(`Extracted ${output.total} curated words to ${outPath}`);
console.log('Counts:', output.categories);
