import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function finalScrapeItems() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  
  const outputPath = path.join(__dirname, 'src', 'data', 'items.json');
  const allItems = [];
  
  const concurrency = 3;
  const endPage = 164;
  
  console.log(`최종 크롤링 시작: 1부터 ${endPage}까지 (동시 ${concurrency}개)`);
  
  // 페이지를 청크로 나누기
  const pageChunks = [];
  for (let i = 1; i <= endPage; i += concurrency) {
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
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        await page.waitForSelector('.list-box', { timeout: 10000 });
        
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
              
              // TreeWalker를 사용한 텍스트 노드 추출
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
              
              // 텍스트 노드에서 패턴 매칭으로 필드 분리
              textNodes.forEach(text => {
                // 아이템 이름: 합성활, (정령) 등이 포함된 첫 번째 텍스트
                if ((text.includes('합성활') || text.includes('(정령)') || 
                     text.includes('도끼') || text.includes('창') || text.includes('방패') ||
                     text.includes('무기') || text.includes('갑옷') || text.includes('투구') ||
                     text.includes('넥클리스') || text.includes('반지') || text.includes('귀걸이')) && !name) {
                  name = text;
                } 
                // 옵션: 공격력, 방어력, 레벨 등이 포함된 텍스트
                else if ((text.includes('공 +') || text.includes('방 -') || text.includes('방 +') ||
                         text.includes('공격력') || text.includes('방어력') || text.includes('내성') ||
                         text.includes('Lv') || text.includes('매력')) && !options) {
                  options = text;
                }
                // 재료: 나무, 끈, + 기호가 포함된 제작 재료
                else if ((text.includes('나무') || text.includes('끈') || text.includes('가죽') ||
                         (text.includes('+') && !text.includes('공 +') && !text.includes('방 +'))) && !materials) {
                  materials = text;
                }
              });
              
              // 기본값 처리
              if (!name) {
                // 첫 번째 의미있는 텍스트를 이름으로 사용
                const firstMeaningful = textNodes.find(text => 
                  text.length > 3 && 
                  !text.includes('공 +') && 
                  !text.includes('방 -') &&
                  !text.includes('나무') &&
                  !text.match(/^\\d+$/)
                );
                name = firstMeaningful || `아이템_${index + 1}`;
              }
              
              const itemData = {
                id: documentSrl,
                name: name,
                imageUrl: imageUrl,
                options: options,
                materials: materials,
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
    
    const progress = ((chunkIndex + 1) / pageChunks.length * 100).toFixed(1);
    console.log(`진행률: ${progress}% (${allItems.length}개 아이템 수집됨)`);
    
    // 10청크마다 중간 저장
    if ((chunkIndex + 1) % 10 === 0) {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2), 'utf8');
      console.log(`중간 저장 완료: ${allItems.length}개 아이템`);
    }
  }
  
  await browser.close();
  
  // 최종 저장
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(allItems, null, 2), 'utf8');
  
  console.log(`\\n총 ${allItems.length}개 아이템 수집 완료`);
  console.log(`데이터가 ${outputPath}에 저장되었습니다.`);
  
  // 품질 체크
  const itemsWithoutProperNames = allItems.filter(item => 
    item.name.startsWith('아이템_')
  );
  console.log(`기본 이름인 아이템: ${itemsWithoutProperNames.length}개`);
  
  const itemsWithOptions = allItems.filter(item => item.options && item.options.length > 0);
  const itemsWithMaterials = allItems.filter(item => item.materials && item.materials.length > 0);
  
  console.log('\\n=== 데이터 품질 통계 ===');
  console.log(`총 아이템: ${allItems.length}개`);
  console.log(`옵션 정보가 있는 아이템: ${itemsWithOptions.length}개`);
  console.log(`재료 정보가 있는 아이템: ${itemsWithMaterials.length}개`);
  
  return allItems;
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  finalScrapeItems()
    .then((items) => {
      console.log('최종 크롤링이 성공적으로 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('크롤링 중 오류 발생:', error);
      process.exit(1);
    });
}