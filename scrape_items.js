import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function scrapeItems() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // User-Agent 설정 (봇 차단 방지)
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  
  // 기존 데이터가 있다면 로드
  let allItems = [];
  const outputPath = path.join(__dirname, 'src', 'data', 'items.json');
  
  if (fs.existsSync(outputPath)) {
    try {
      const existingData = fs.readFileSync(outputPath, 'utf8');
      allItems = JSON.parse(existingData);
      console.log(`기존 데이터 ${allItems.length}개 로드됨`);
    } catch (error) {
      console.log('기존 데이터 로드 실패, 새로 시작합니다.');
      allItems = [];
    }
  }
  
  let pageNum = Math.floor(allItems.length / 10) + 1; // 기존 데이터 기준으로 시작 페이지 계산
  let hasNextPage = true;
  
  while (hasNextPage && pageNum <= 164) { // 최대 164페이지까지 크롤링
    const url = `https://pooyas.com/index.php?mid=sa_item_book&page=${pageNum}`;
    console.log(`페이지 ${pageNum} 크롤링 중... ${url}`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // 페이지가 로드될 때까지 잠시 대기
      await page.waitForSelector('.list-box', { timeout: 10000 });
      
      const items = await page.evaluate(() => {
        const listItems = document.querySelectorAll('.list-box li');
        const items = [];
        
        listItems.forEach((item, index) => {
          try {
            // 이미지 요소 찾기
            const imgElement = item.querySelector('img');
            if (!imgElement) return;
            
            // 이미지 URL 처리 (상대경로면 도메인 추가)
            let imageUrl = imgElement.src || imgElement.getAttribute('src') || '';
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = 'https://pooyas.com' + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
            }
            
            // 링크에서 document_srl 추출
            const linkElement = item.querySelector('a');
            const link = linkElement ? linkElement.href : '';
            const documentSrl = link.match(/document_srl=(\d+)/)?.[1] || '';
            
            // 텍스트 노드들을 직접 추출
            const walker = document.createTreeWalker(
              item,
              NodeFilter.SHOW_TEXT,
              null,
              false
            );
            
            const textNodes = [];
            let node;
            while (node = walker.nextNode()) {
              const text = node.textContent.trim();
              if (text && text.length > 2) {
                textNodes.push(text);
              }
            }
            
            // 추출된 텍스트에서 패턴 매칭
            let name = '', options = '', materials = '';
            
            // 텍스트 노드에서 의미있는 정보 추출
            textNodes.forEach(text => {
              if ((text.includes('합성활') || text.includes('(정령)')) && !name) {
                name = text;
              } else if ((text.includes('공 +') || text.includes('방 -')) && !options) {
                options = text;
              } else if (text.includes('나무') && text.includes('+') && !materials) {
                materials = text;
              }
            });
            
            // 전체 텍스트를 materials로 사용 (백업)
            const fullText = textNodes.join(' ');
            
            const itemData = {
              id: documentSrl,
              name: name || `아이템_${index + 1}`,
              imageUrl: imageUrl,
              options: options,
              materials: materials || fullText,
              link: link
            };
            
            items.push(itemData);
          } catch (error) {
            console.error(`아이템 처리 중 오류 (인덱스 ${index}):`, error);
          }
        });
        
        return items;
      });
      
      console.log(`페이지 ${pageNum}에서 ${items.length}개 아이템 발견`);
      allItems.push(...items);
      
      // 다음 페이지가 있는지 확인
      const hasNext = await page.evaluate(() => {
        // 다음 페이지 링크나 페이지네이션 확인
        const nextButton = document.querySelector('a[href*="page=' + (parseInt(window.location.search.match(/page=(\d+)/)?.[1] || '1') + 1) + '"]');
        return !!nextButton;
      });
      
      if (!hasNext || items.length === 0) {
        hasNextPage = false;
        console.log('더 이상 페이지가 없거나 아이템이 없습니다.');
      } else {
        pageNum++;
        // 페이지 간 딜레이 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
    } catch (error) {
      console.error(`페이지 ${pageNum} 크롤링 중 오류:`, error);
      hasNextPage = false;
    }
  }
  
  await browser.close();
  
  console.log(`총 ${allItems.length}개 아이템 수집 완료`);
  
  // 데이터를 JSON 파일로 저장 (이미 정의된 outputPath 사용)
  
  // 디렉토리가 없으면 생성
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2), 'utf8');
  console.log(`데이터가 ${outputPath}에 저장되었습니다.`);
  
  // 간단한 통계 출력
  const itemsWithImages = allItems.filter(item => item.imageUrl);
  const itemsWithNames = allItems.filter(item => item.name && !item.name.startsWith('아이템_'));
  const itemsWithOptions = allItems.filter(item => item.options);
  const itemsWithMaterials = allItems.filter(item => item.materials);
  
  console.log('\n=== 크롤링 통계 ===');
  console.log(`총 아이템 수: ${allItems.length}`);
  console.log(`이미지가 있는 아이템: ${itemsWithImages.length}`);
  console.log(`유효한 이름이 있는 아이템: ${itemsWithNames.length}`);
  console.log(`옵션 정보가 있는 아이템: ${itemsWithOptions.length}`);
  console.log(`재료 정보가 있는 아이템: ${itemsWithMaterials.length}`);
  
  return allItems;
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  scrapeItems()
    .then((items) => {
      console.log('크롤링이 성공적으로 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('크롤링 중 오류 발생:', error);
      process.exit(1);
    });
}

export { scrapeItems };