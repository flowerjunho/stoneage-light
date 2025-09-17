import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fastScrapeItems() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  
  // 기존 데이터 확인
  const outputPath = path.join(__dirname, 'src', 'data', 'items.json');
  let existingData = [];
  if (fs.existsSync(outputPath)) {
    try {
      const data = fs.readFileSync(outputPath, 'utf8');
      existingData = JSON.parse(data);
      console.log(`기존 데이터 ${existingData.length}개 로드됨`);
    } catch (error) {
      console.log('기존 데이터 로드 실패');
    }
  }
  
  const startPage = Math.floor(existingData.length / 10) + 1;
  const endPage = 164;
  const concurrency = 5; // 동시에 5개 페이지 크롤링
  
  console.log(`페이지 ${startPage}부터 ${endPage}까지 크롤링 시작 (동시 ${concurrency}개)`);
  
  const allItems = [...existingData];
  
  // 페이지를 청크로 나누기
  const pageChunks = [];
  for (let i = startPage; i <= endPage; i += concurrency) {
    const chunk = [];
    for (let j = 0; j < concurrency && (i + j) <= endPage; j++) {
      chunk.push(i + j);
    }
    pageChunks.push(chunk);
  }
  
  for (let chunkIndex = 0; chunkIndex < pageChunks.length; chunkIndex++) {
    const chunk = pageChunks[chunkIndex];
    console.log(`청크 ${chunkIndex + 1}/${pageChunks.length} 처리 중: 페이지 ${chunk[0]}-${chunk[chunk.length - 1]}`);
    
    // 병렬로 페이지 크롤링
    const chunkPromises = chunk.map(async (pageNum) => {
      const page = await browser.newPage();
      
      try {
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
        
        const url = `https://pooyas.com/index.php?mid=sa_item_book&page=${pageNum}`;
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
        
        // 페이지가 로드될 때까지 잠시 대기
        await page.waitForSelector('.list-box', { timeout: 5000 });
        
        const items = await page.evaluate(() => {
          const listItems = document.querySelectorAll('.list-box li');
          const items = [];
          
          listItems.forEach((item, index) => {
            try {
              const imgElement = item.querySelector('img');
              if (!imgElement) return;
              
              let imageUrl = imgElement.src || imgElement.getAttribute('src') || '';
              if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = 'https://pooyas.com' + (imageUrl.startsWith('/') ? imageUrl : '/' + imageUrl);
              }
              
              const linkElement = item.querySelector('a');
              const link = linkElement ? linkElement.href : '';
              const documentSrl = link.match(/document_srl=(\\d+)/)?.[1] || '';
              
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
              
              let name = '', options = '', materials = '';
              
              textNodes.forEach(text => {
                if ((text.includes('합성활') || text.includes('(정령)')) && !name) {
                  name = text;
                } else if ((text.includes('공 +') || text.includes('방 -')) && !options) {
                  options = text;
                } else if (text.includes('나무') && text.includes('+') && !materials) {
                  materials = text;
                }
              });
              
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
              console.error(`아이템 처리 중 오류 (페이지 ${pageNum}, 인덱스 ${index}):`, error);
            }
          });
          
          return items;
        });
        
        console.log(`페이지 ${pageNum}: ${items.length}개 아이템 발견`);
        return { pageNum, items };
        
      } catch (error) {
        console.error(`페이지 ${pageNum} 크롤링 중 오류:`, error);
        return { pageNum, items: [] };
      } finally {
        await page.close();
      }
    });
    
    // 청크 완료 대기
    const chunkResults = await Promise.all(chunkPromises);
    
    // 결과를 페이지 순서대로 정렬하여 추가
    chunkResults
      .sort((a, b) => a.pageNum - b.pageNum)
      .forEach(result => {
        allItems.push(...result.items);
      });
    
    // 중간 저장
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2), 'utf8');
    
    const progress = ((chunkIndex + 1) / pageChunks.length * 100).toFixed(1);
    console.log(`진행률: ${progress}% (${allItems.length}개 아이템 수집됨)`);
  }
  
  await browser.close();
  
  console.log(`\\n총 ${allItems.length}개 아이템 수집 완료`);
  console.log(`데이터가 ${outputPath}에 저장되었습니다.`);
  
  return allItems;
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  fastScrapeItems()
    .then((items) => {
      console.log('고속 크롤링이 성공적으로 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('크롤링 중 오류 발생:', error);
      process.exit(1);
    });
}