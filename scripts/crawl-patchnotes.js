import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LIST_URL = 'https://www.hwansoo.top/bbs/board.php?bo_table=patchnote';
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'data', 'patchnotes.json');

function fetchHtml(url) {
  return execSync(`curl -sL -A "Mozilla/5.0" '${url}'`, {
    maxBuffer: 10 * 1024 * 1024,
  }).toString();
}

function parseList(html) {
  const results = [];
  const seen = new Set();
  const regex = /href="([^"]*bo_table=patchnote[^"]*wr_id=(\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    const id = parseInt(m[2]);
    if (seen.has(id)) continue;
    const title = m[3].replace(/<[^>]+>/g, '').trim();
    if (!title) continue;
    seen.add(id);
    results.push({
      id,
      title,
      link: `https://www.hwansoo.top/bbs/board.php?bo_table=patchnote&wr_id=${id}`,
    });
  }
  return results;
}

function parseDetail(html) {
  // 날짜
  const timeMatch = html.match(/<time[^>]*>([\s\S]*?)<\/time>/);
  const date = timeMatch ? timeMatch[1].replace(/<[^>]+>/g, '').trim() : '';

  // bo_v_atc 섹션 범위 추출
  const secStart = html.indexOf('<section id="bo_v_atc"');
  const secEnd = html.indexOf('</section>', secStart);
  if (secStart === -1) return { date, contentHtml: '' };

  const sec = html.slice(secStart, secEnd);

  // view-content div를 중첩 depth 계산으로 정확히 추출
  const VIEW_TAG = '<div class="view-content">';
  const viewStart = sec.indexOf(VIEW_TAG);
  if (viewStart === -1) return { date, contentHtml: sec };

  const bodyStart = viewStart + VIEW_TAG.length;
  let depth = 1;
  let i = bodyStart;

  while (i < sec.length && depth > 0) {
    const nextOpen = sec.indexOf('<div', i);
    const nextClose = sec.indexOf('</div>', i);

    if (nextOpen !== -1 && (nextClose === -1 || nextOpen < nextClose)) {
      depth++;
      i = nextOpen + 4;
    } else if (nextClose !== -1) {
      depth--;
      if (depth === 0) {
        return { date, contentHtml: sec.slice(bodyStart, nextClose) };
      }
      i = nextClose + 6;
    } else {
      break;
    }
  }

  return { date, contentHtml: '' };
}

function loadExisting() {
  if (!fs.existsSync(OUTPUT_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(OUTPUT_PATH, 'utf-8'));
  } catch {
    console.warn('⚠️  기존 파일 파싱 실패, 새로 생성합니다.');
    return [];
  }
}

async function crawl() {
  console.log('🚀 패치노트 크롤링 시작\n');

  // 1. 목록 페이지 파싱
  process.stdout.write('📋 목록 페이지 읽는 중... ');
  const listHtml = fetchHtml(LIST_URL);
  const allOnPage = parseList(listHtml);
  console.log(`${allOnPage.length}개 항목 발견`);

  // 2. 기존 데이터 로드 & 신규 필터
  const existing = loadExisting();
  const existingIds = new Set(existing.map(e => e.id));
  const toFetch = allOnPage.filter(l => !existingIds.has(l.id));

  console.log(`📂 기존: ${existing.length}개 / 신규: ${toFetch.length}개`);

  if (toFetch.length === 0) {
    console.log('\n✅ 이미 최신 상태입니다.');
    return;
  }

  console.log('');
  toFetch.forEach(l => console.log(`   + [id=${l.id}] ${l.title}`));
  console.log('');

  // 3. 상세 페이지 크롤링
  const newItems = [];
  for (let i = 0; i < toFetch.length; i++) {
    const { id, title, link } = toFetch[i];
    process.stdout.write(`📖 [${i + 1}/${toFetch.length}] ${title}... `);

    const html = fetchHtml(link);
    const { date, contentHtml } = parseDetail(html);
    newItems.push({ id, title, link, date, contentHtml });

    console.log(`완료 (${date})`);

    if (i < toFetch.length - 1) await new Promise(r => setTimeout(r, 300));
  }

  // 4. 병합 & 저장 (id 기준 내림차순)
  const map = new Map();
  for (const item of existing) map.set(item.id, item);
  for (const item of newItems) map.set(item.id, item);
  const merged = Array.from(map.values()).sort((a, b) => b.id - a.id);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2), 'utf-8');

  console.log(`\n✅ 완료! 총 ${merged.length}개 저장`);
  console.log(`📁 ${OUTPUT_PATH}`);
}

crawl().catch(err => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
