import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 기존 characters.json 읽기
const charactersPath = path.join(__dirname, '../src/data/characters.json');
const charactersData = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));

async function scrapeCharacterDetails() {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  console.log('캐릭터 상세 정보 크롤링 시작...');
  
  for (let i = 0; i < charactersData.characters.length; i++) {
    const character = charactersData.characters[i];
    console.log(`${i + 1}/${charactersData.characters.length} - ${character.name} 크롤링 중...`);
    
    try {
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.goto(character.url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // 색상 캐릭터 이미지 추출
      const colorImages = await page.evaluate(() => {
        const images = [];
        // color_character 이미지들 찾기
        const imgElements = document.querySelectorAll('img[src*="color_character"], img[src*=".gif"]');
        imgElements.forEach(img => {
          if (img.src && (img.src.includes('gif') || img.src.includes('color'))) {
            let src = img.src;
            if (src.startsWith('/')) {
              src = 'https://pooyas.com' + src;
            } else if (!src.startsWith('http')) {
              src = 'https://pooyas.com/' + src;
            }
            if (!images.includes(src)) {
              images.push(src);
            }
          }
        });
        return images;
      });
      
      // 첫 번째 테이블에서 무기 데이터 추출
      const weaponData = await page.evaluate(() => {
        const weapons = [];
        const tables = document.querySelectorAll('table');
        
        if (tables.length > 0) {
          const firstTable = tables[0];
          const rows = firstTable.querySelectorAll('tr');
          
          rows.forEach((row, index) => {
            if (index === 0) return; // 헤더 건너뛰기
            
            const cells = row.querySelectorAll('td');
            if (cells.length >= 2) {
              const weaponName = cells[0] ? cells[0].textContent.trim() : '';
              const imgElement = cells[1] ? cells[1].querySelector('img') : null;
              
              if (weaponName && imgElement) {
                let imgSrc = imgElement.src;
                if (imgSrc.startsWith('/')) {
                  imgSrc = 'https://pooyas.com' + imgSrc;
                } else if (!imgSrc.startsWith('http')) {
                  imgSrc = 'https://pooyas.com/' + imgSrc;
                }
                
                weapons.push({
                  name: weaponName,
                  image: imgSrc
                });
              }
            }
          });
        }
        
        return weapons;
      });
      
      // 데이터 업데이트
      charactersData.characters[i].colorImages = colorImages;
      charactersData.characters[i].weapons = weaponData;
      
      await page.close();
      console.log(`${character.name} 완료 - 색상 이미지: ${colorImages.length}개, 무기: ${weaponData.length}개`);
      
      // 잠시 대기 (서버 부하 방지)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`${character.name} 크롤링 실패:`, error.message);
      charactersData.characters[i].colorImages = [];
      charactersData.characters[i].weapons = [];
    }
  }
  
  await browser.close();
  
  // 업데이트된 데이터를 파일에 저장
  charactersData.lastUpdated = new Date().toISOString();
  fs.writeFileSync(charactersPath, JSON.stringify(charactersData, null, 2), 'utf8');
  
  console.log('캐릭터 상세 정보 크롤링 완료!');
  console.log(`총 ${charactersData.characters.length}개 캐릭터 데이터 업데이트됨`);
}

scrapeCharacterDetails().catch(console.error);