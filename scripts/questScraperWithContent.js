import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://www.hwansoo.top/bbs/board.php?bo_table=quests&page=';
const MAX_PAGES = 5;
const OUTPUT_FILE = 'src/data/questWithContent.json';

// 개별 퀘스트 상세 페이지 크롤링
async function scrapeQuestDetail(page, questLink) {
  try {
    console.log(`상세 페이지 크롤링 중: ${questLink}`);
    
    await page.goto(questLink, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('body', { timeout: 10000 });

    // class="view-content" DOM HTML 전체 추출
    const content = await page.evaluate(() => {
      // class="view-content" 찾기
      const viewContent = document.querySelector('.view-content');
      if (viewContent) {
        return viewContent.outerHTML || '';
      }
      
      // view-content가 없으면 fallback으로 다른 선택자들 시도
      const fallbackSelectors = [
        '#bo_v_atc',
        '#bo_v_con',
        '.bo_v_con',
        '#nt_body',
        '.content',
        '.post-content'
      ];
      
      for (const selector of fallbackSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          return element.outerHTML || '';
        }
      }
      
      return '';
    });

    return content.trim();
    
  } catch (error) {
    console.error(`상세 페이지 크롤링 실패 (${questLink}):`, error.message);
    return '';
  }
}

// 퀘스트 목록 페이지 크롤링 (제목과 링크만)
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

async function scrapeAllQuestsWithContent() {
  console.log('퀘스트 상세 내용 크롤링을 시작합니다...');
  
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
    
    // 1단계: 모든 페이지에서 퀘스트 목록 수집
    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      const quests = await scrapeQuestPage(page, pageNum);
      allQuests.push(...quests);
      
      // 페이지 간 딜레이 (서버 부하 방지)
      if (pageNum < MAX_PAGES) {
        console.log(`페이지 ${pageNum} 완료. 다음 페이지로 이동하기 전 잠시 대기...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // 2단계: 중복 제거 (링크 기준)
    const uniqueQuests = allQuests.filter((quest, index, self) => 
      index === self.findIndex(q => q.link === quest.link)
    );
    
    console.log(`\n중복 제거 완료. 총 ${uniqueQuests.length}개의 고유 퀘스트 발견.`);
    
    // 3단계: 모든 퀘스트의 상세 내용 크롤링 (전체 idx 적용)
    const questsWithContent = [];
    for (let i = 0; i < uniqueQuests.length; i++) {
      const quest = uniqueQuests[i];
      console.log(`[${i + 1}/${uniqueQuests.length}] ${quest.title} 상세 내용 크롤링 중...`);
      
      const content = await scrapeQuestDetail(page, quest.link);
      
      questsWithContent.push({
        idx: i + 1,
        title: quest.title,
        link: quest.link,
        content: content
      });
      
      // 서버 부하 방지를 위한 딜레이
      if (i < uniqueQuests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }
    
    // 4단계: 파일로 저장
    const outputPath = path.resolve(OUTPUT_FILE);
    fs.writeFileSync(outputPath, JSON.stringify(questsWithContent, null, 2), 'utf8');
    
    console.log(`\n크롤링 완료!`);
    console.log(`총 ${questsWithContent.length}개의 퀘스트를 수집했습니다.`);
    console.log(`결과가 ${outputPath}에 저장되었습니다.`);
    
    // 내용이 있는 퀘스트와 없는 퀘스트 통계
    const withContent = questsWithContent.filter(q => q.content && q.content.length > 0);
    const withoutContent = questsWithContent.filter(q => !q.content || q.content.length === 0);
    
    console.log(`\n=== 크롤링 통계 ===`);
    console.log(`내용이 있는 퀘스트: ${withContent.length}개`);
    console.log(`내용이 없는 퀘스트: ${withoutContent.length}개`);
    
    return questsWithContent;
    
  } catch (error) {
    console.error('크롤링 중 오류 발생:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// 스크립트 실행
scrapeAllQuestsWithContent()
  .then((quests) => {
    console.log('\n=== 크롤링 결과 샘플 ===');
    const samplesWithContent = quests.filter(q => q.content && q.content.length > 0).slice(0, 2);
    
    samplesWithContent.forEach((quest, i) => {
      console.log(`${i + 1}. ${quest.title} (idx: ${quest.idx})`);
      console.log(`   링크: ${quest.link}`);
      console.log(`   내용 (처음 200자): ${quest.content.substring(0, 200)}...`);
      console.log('');
    });
  })
  .catch((error) => {
    console.error('스크립트 실행 실패:', error);
    process.exit(1);
  });