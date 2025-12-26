import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PATCH_NOTE_LIST_URL = 'https://www.hwansoo.top/bbs/board.php?bo_table=patchnote';

async function crawlPatchNotes() {
  console.log('🚀 패치노트 크롤링 시작...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    // 1. 패치노트 목록 페이지 접근
    console.log('📋 패치노트 목록 페이지 접근 중...');
    await page.goto(PATCH_NOTE_LIST_URL, { waitUntil: 'networkidle2' });

    // 2. 패치노트 링크와 타이틀 추출
    const patchNoteLinks = await page.evaluate(() => {
      const listItems = document.querySelectorAll('ul li');
      const patchNotes = [];

      listItems.forEach(item => {
        const links = item.querySelectorAll('a');
        links.forEach(link => {
          if (link.href && link.href.includes('patchnote') && link.href.includes('wr_id=')) {
            const title = link.textContent.trim();
            if (title && title.includes('패치노트')) {
              patchNotes.push({
                title: title,
                link: link.href
              });
            }
          }
        });
      });

      // 중복 제거
      return patchNotes.filter((item, index, self) =>
        index === self.findIndex(t => t.link === item.link)
      );
    });

    console.log(`✅ ${patchNoteLinks.length}개의 패치노트 발견`);

    // 3. 각 패치노트 상세 페이지 크롤링
    const patchNotes = [];

    for (let i = 0; i < patchNoteLinks.length; i++) {
      const { title, link } = patchNoteLinks[i];
      console.log(`📖 [${i + 1}/${patchNoteLinks.length}] ${title} 크롤링 중...`);

      await page.goto(link, { waitUntil: 'networkidle2' });

      const detail = await page.evaluate(() => {
        // 작성일 추출
        const timeEl = document.querySelector('time');
        const date = timeEl ? timeEl.textContent.trim() : '';

        // 본문 HTML 추출
        const contentSection = document.querySelector('section.bo_v_atc')
          || document.querySelector('#bo_v_atc')
          || document.querySelector('.bo_v_atc');

        let contentHtml = '';
        if (contentSection) {
          // view-content div만 추출
          const viewContent = contentSection.querySelector('.view-content');
          if (viewContent) {
            contentHtml = viewContent.innerHTML;
          } else {
            contentHtml = contentSection.innerHTML;
          }
        }

        return { date, contentHtml };
      });

      // wr_id 추출
      const wrIdMatch = link.match(/wr_id=(\d+)/);
      const id = wrIdMatch ? parseInt(wrIdMatch[1]) : i + 1;

      patchNotes.push({
        id,
        title,
        link,
        date: detail.date,
        contentHtml: detail.contentHtml
      });

      // 요청 간 딜레이 (서버 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 4. JSON 파일로 저장
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'patchnotes.json');

    // data 폴더가 없으면 생성
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(patchNotes, null, 2), 'utf-8');

    console.log(`\n✅ 크롤링 완료!`);
    console.log(`📁 저장 위치: ${outputPath}`);
    console.log(`📊 총 ${patchNotes.length}개의 패치노트 수집됨`);

    return patchNotes;

  } catch (error) {
    console.error('❌ 크롤링 중 오류 발생:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

crawlPatchNotes().catch(console.error);
