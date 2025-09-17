import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.hwansoo.top/bbs/board.php?bo_table=quests&page=';
const MAX_PAGES = 5;
const OUTPUT_FILE = 'src/data/quest.json';

async function scrapeQuestPage(page, pageNum) {
  console.log(`페이지 ${pageNum} 크롤링 중...`);
  
  const url = BASE_URL + pageNum;
  
  try {
    await page.goto(url, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // bo_list 섹션이 로드될 때까지 대기
    await page.waitForSelector('#bo_list', { timeout: 10000 });

    // 페이지 HTML 구조 확인
    const pageInfo = await page.evaluate(() => {
      const boList = document.querySelector('#bo_list');
      if (!boList) {
        return {
          error: 'bo_list 요소를 찾을 수 없습니다',
          bodyHTML: document.body.innerHTML.substring(0, 1000) + '...'
        };
      }
      
      return {
        found: true,
        innerHTML: boList.innerHTML.substring(0, 2000) + '...',
        allLinks: Array.from(boList.querySelectorAll('a')).map(a => ({
          text: a.textContent.trim(),
          href: a.getAttribute('href')
        })).slice(0, 10)
      };
    });

    console.log('페이지 구조 정보:', JSON.stringify(pageInfo, null, 2));

    // 제목과 링크 추출
    const quests = await page.evaluate(() => {
      const boList = document.querySelector('#bo_list');
      if (!boList) return [];

      const results = [];
      
      // 모든 링크 요소 확인
      const allLinks = boList.querySelectorAll('a');
      
      allLinks.forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        
        // wr_id가 포함된 링크이고 텍스트가 있는 경우
        if (href && href.includes('wr_id') && text && text.length > 1) {
          let fullLink = href;
          
          // 상대 링크인 경우 절대 링크로 변환
          if (!href.startsWith('http')) {
            fullLink = 'https://www.hwansoo.top' + (href.startsWith('/') ? href : '/' + href);
          }
          
          // 공지사항 제외
          if (!text.includes('[공지]')) {
            results.push({
              title: text,
              link: fullLink
            });
          }
        }
      });
      
      return results;
    });

    console.log(`페이지 ${pageNum}에서 ${quests.length}개의 퀘스트를 찾았습니다.`);
    return quests;
    
  } catch (error) {
    console.error(`페이지 ${pageNum} 크롤링 중 오류 발생:`, error.message);
    return [];
  }
}

async function scrapeAllQuests() {
  console.log('퀘스트 크롤링을 시작합니다...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();
    
    // 헤더 설정으로 봇 감지 회피
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // 페이지 설정
    await page.setViewport({ width: 1920, height: 1080 });
    
    const allQuests = [];
    
    // 모든 페이지 크롤링
    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      const quests = await scrapeQuestPage(page, pageNum);
      allQuests.push(...quests);
      
      // 페이지 간 딜레이 (서버 부하 방지)
      if (pageNum < MAX_PAGES) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 중복 제거 (링크 기준)
    const uniqueQuests = allQuests.filter((quest, index, self) => 
      index === self.findIndex(q => q.link === quest.link)
    );
    
    // 파일로 저장
    const outputPath = path.resolve(OUTPUT_FILE);
    fs.writeFileSync(outputPath, JSON.stringify(uniqueQuests, null, 2), 'utf8');
    
    console.log(`\n크롤링 완료!`);
    console.log(`총 ${uniqueQuests.length}개의 퀘스트를 수집했습니다.`);
    console.log(`결과가 ${outputPath}에 저장되었습니다.`);
    
    return uniqueQuests;
    
  } catch (error) {
    console.error('크롤링 중 오류 발생:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
scrapeAllQuests()
  .then((quests) => {
    console.log('\n=== 크롤링 결과 샘플 ===');
    console.log(quests.slice(0, 3).map((quest, i) => 
      `${i + 1}. ${quest.title}\n   ${quest.link}`
    ).join('\n\n'));
  })
  .catch((error) => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  });