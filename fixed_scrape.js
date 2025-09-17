import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixedScrapeItems() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });
  
  const outputPath = path.join(__dirname, 'src', 'data', 'items.json');
  const allItems = [];
  
  const concurrency = 3; // 더 안정적인 동시 처리 수
  const endPage = 164;
  
  console.log(`개선된 크롤링 시작: 1부터 ${endPage}까지 (동시 ${concurrency}개)`);
  
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
        
        // 페이지가 로드될 때까지 잠시 대기
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
              
              // 개선된 텍스트 추출 - 더 광범위한 패턴 매칭
              const allText = item.textContent || '';
              const lines = allText.split('\\n').map(line => line.trim()).filter(line => line.length > 0);
              
              let name = '', options = '', materials = '';
              
              // 첫 번째 패스: 명확한 패턴들 찾기
              lines.forEach(line => {
                // 아이템 이름 - 합성활, 정령, 무기 등이 포함된 라인
                if (!name && (line.includes('합성활') || line.includes('(정령)') || line.includes('무기') || 
                    line.includes('방패') || line.includes('도끼') || line.includes('활') || line.includes('창'))) {
                  name = line;
                }
                // 옵션 - 공격력, 방어력 등이 포함된 라인
                else if (!options && (line.includes('공 +') || line.includes('방 -') || line.includes('방 +') || 
                    line.includes('공격력') || line.includes('방어력') || line.match(/Lv\\d+/))) {
                  options = line;
                }
                // 재료 - 나무, 끈, 또는 + 기호가 포함된 제작 재료
                else if (!materials && (line.includes('나무') || line.includes('끈') || 
                    (line.includes('+') && !line.includes('공 +') && !line.includes('방 +')))) {
                  materials = line;
                }
              });
              
              // 두 번째 패스: 더 넓은 패턴으로 누락된 것들 찾기
              if (!name) {
                // 첫 번째 의미있는 텍스트를 이름으로 사용
                const meaningfulLine = lines.find(line => 
                  line.length > 3 && 
                  !line.includes('공 +') && 
                  !line.includes('방 -') && 
                  !line.includes('나무') &&
                  !line.match(/^\\d+$/) // 숫자만 있는 라인 제외
                );
                if (meaningfulLine) name = meaningfulLine;
              }
              
              if (!options) {
                // 스탯이나 효과가 있는 라인 찾기
                const statLine = lines.find(line => 
                  line.includes('+') || line.includes('-') || 
                  line.includes('내성') || line.includes('매력') ||
                  line.match(/\\d+/)
                );
                if (statLine && statLine !== name && statLine !== materials) {
                  options = statLine;
                }
              }
              
              if (!materials) {
                // 나머지 의미있는 텍스트를 재료로 사용
                const remainingText = lines.filter(line => 
                  line !== name && line !== options && line.length > 5
                ).join(' ');
                if (remainingText) materials = remainingText;
              }
              
              // 마지막 체크: 빈 값들에 대해 전체 텍스트에서 추출
              if (!name || name.startsWith('아이템_')) {
                // img의 alt 속성이나 title 체크
                const imgAlt = imgElement.alt || imgElement.title || '';
                if (imgAlt && imgAlt.length > 0) {
                  name = imgAlt;
                } else {
                  // 전체 텍스트에서 첫 번째 의미있는 부분 추출
                  const firstMeaningful = allText.split(/[\\n\\r]+/)[0]?.trim();
                  if (firstMeaningful && firstMeaningful.length > 3) {
                    name = firstMeaningful;
                  } else {
                    name = `미확인_아이템_${index + 1}`;
                  }
                }
              }
              
              const itemData = {
                id: documentSrl,
                name: name || `미확인_아이템_${index + 1}`,
                imageUrl: imageUrl,
                options: options || '',
                materials: materials || allText.replace(/\\s+/g, ' ').trim(),
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
    item.name.startsWith('아이템_') || item.name.startsWith('미확인_')
  );
  console.log(`이름이 제대로 추출되지 않은 아이템: ${itemsWithoutProperNames.length}개`);
  
  if (itemsWithoutProperNames.length > 0) {
    console.log('문제가 있는 아이템들:');
    itemsWithoutProperNames.slice(0, 5).forEach(item => {
      console.log(`- ${item.name} (${item.link})`);
    });
  }
  
  return allItems;
}

// 스크립트 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  fixedScrapeItems()
    .then((items) => {
      console.log('개선된 크롤링이 성공적으로 완료되었습니다.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('크롤링 중 오류 발생:', error);
      process.exit(1);
    });
}