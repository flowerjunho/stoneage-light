import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NOTICE_LIST_URL = 'https://www.hwansoo.top/bbs/board.php?bo_table=notice';

async function crawlNotices() {
  console.log('🚀 공지사항 크롤링 시작...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  try {
    // 1. 공지사항 목록 페이지 접근
    console.log('📋 공지사항 목록 페이지 접근 중...');
    await page.goto(NOTICE_LIST_URL, { waitUntil: 'networkidle2' });

    // 2. 공지사항 링크와 타이틀 추출
    const noticeLinks = await page.evaluate(() => {
      const listItems = document.querySelectorAll('ul li');
      const notices = [];

      listItems.forEach(item => {
        const links = item.querySelectorAll('a');
        links.forEach(link => {
          if (link.href && link.href.includes('notice') && link.href.includes('wr_id=')) {
            const title = link.textContent.trim();
            if (title && title.length > 0) {
              notices.push({
                title: title,
                link: link.href
              });
            }
          }
        });
      });

      // 중복 제거
      return notices.filter((item, index, self) =>
        index === self.findIndex(t => t.link === item.link)
      );
    });

    console.log(`✅ ${noticeLinks.length}개의 공지사항 발견`);

    // 3. 각 공지사항 상세 페이지 크롤링
    const notices = [];

    for (let i = 0; i < noticeLinks.length; i++) {
      const { title, link } = noticeLinks[i];
      console.log(`📖 [${i + 1}/${noticeLinks.length}] ${title} 크롤링 중...`);

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

      notices.push({
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
    const outputPath = path.join(__dirname, '..', 'src', 'data', 'notices.json');

    // data 폴더가 없으면 생성
    const dataDir = path.dirname(outputPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(notices, null, 2), 'utf-8');

    console.log(`\n✅ 크롤링 완료!`);
    console.log(`📁 저장 위치: ${outputPath}`);
    console.log(`📊 총 ${notices.length}개의 공지사항 수집됨`);

    return notices;

  } catch (error) {
    console.error('❌ 크롤링 중 오류 발생:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

crawlNotices().catch(console.error);
