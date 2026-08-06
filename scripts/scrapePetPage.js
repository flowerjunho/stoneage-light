import fs from 'fs';
import path from 'path';
import readline from 'readline';
import puppeteer from 'puppeteer';

/**
 * hwansoo.top 페트 정보 정밀 순서 정렬 크롤러 & 이미지 다운로더
 * 
 * [정렬 규칙]
 * 1. 1페이지 최상단 펫부터 44페이지 최하단 펫 순서대로 petData.json 상단 정렬
 * 2. 1~44페이지에 포함되지 않은 기존 펫들은 44페이지 정렬 이후 "맨 밑(하단)" 영역으로 보관
 * 3. 맨 위 첫번째 펫부터 내림차순 ID 부여 (가장 상단 펫 = 최고 ID, 맨 하단 펫 = ID "1")
 * 4. 모든 이미지 다운로드 완료 후, public/pets/ 디스크 실물 검증을 통과한 이미지에 한해 /pets/ 로 경로 대체
 * 5. 시작 전 petData_{datetime}.json 자동 백업
 */

// 타임스탬프 포맷터 (YYYYMMDD_HHMMSS)
const getDatetimeStr = () => {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const DD = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}_${hh}${mm}${ss}`;
};

// 한글 -> 영문 발음(로마자) 변환기
function koreanToRoman(text) {
  let s = text
    .replace(/\(환\)/g, '_hwan')
    .replace(/\(각\)/g, '_gak')
    .replace(/\(진\)/g, '_jin')
    .replace(/\(변종\)/g, '_byeonjong')
    .replace(/\(각성\)/g, '_gakseong')
    .replace(/\(신\)/g, '_shin')
    .replace(/\(개\)/g, '_gae')
    .replace(/\(SD\)/g, '_sd')
    .replace(/\(SD_환\)/g, '_sd_hwan');

  const cho = ['g', 'kk', 'n', 'd', 'tt', 'r', 'm', 'b', 'pp', 's', 'ss', '', 'j', 'jj', 'ch', 'k', 't', 'p', 'h'];
  const jung = ['a', 'ae', 'ya', 'yae', 'eo', 'e', 'ye', 'ye', 'o', 'wa', 'wae', 'oe', 'yo', 'u', 'wo', 'we', 'wi', 'yu', 'eu', 'ui', 'i'];
  const jong = ['', 'k', 'k', 'k', 'n', 'n', 'n', 't', 'l', 'k', 'm', 'l', 'l', 'l', 'p', 'l', 'm', 'p', 'p', 't', 't', 'ng', 't', 't', 'k', 't', 'p', 't'];

  let res = '';
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const uni = code - 0xac00;
      const c = Math.floor(uni / 588);
      const v = Math.floor((uni % 588) / 28);
      const j = uni % 28;
      res += cho[c] + jung[v] + jong[j];
    } else {
      res += s[i];
    }
  }

  const clean = res.toLowerCase().replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  return clean || 'pet';
}

// 이미지 직접 다운로드 함수
async function downloadImage(page, imageUrl, targetPath) {
  try {
    const viewSource = await page.goto(imageUrl, { waitUntil: 'networkidle2', timeout: 15000 });
    const buffer = await viewSource.buffer();
    fs.writeFileSync(targetPath, buffer);
    return true;
  } catch (err) {
    try {
      const res = await fetch(imageUrl);
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        fs.writeFileSync(targetPath, Buffer.from(arrayBuffer));
        return true;
      }
    } catch (e) {
      // ignore
    }
    return false;
  }
}

async function main() {
  console.log('\n==================================================');
  console.log('🕷️  [환수강림 페트 정보 1~44페이지 순서 정렬 크롤러]');
  console.log('==================================================\n');

  // 1. 시작 전 기존 petData.json 자동 백업 처리
  const petDataPath = path.resolve('src/data/petData.json');
  let backupFilename = '';

  if (fs.existsSync(petDataPath)) {
    backupFilename = `petData_${getDatetimeStr()}.json`;
    const backupPath = path.resolve('src/data', backupFilename);
    fs.copyFileSync(petDataPath, backupPath);
    console.log(`📦 [자동 백업 완료] 기존 petData.json -> src/data/${backupFilename}\n`);
  }

  // 2. CLI 인자 또는 터미널 대화형 입력받기
  let startPage = parseInt(process.argv[2], 10);
  let endPage = parseInt(process.argv[3], 10);

  if (isNaN(startPage) || isNaN(endPage)) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

    const startInput = await askQuestion('▶ 시작 페이지 번호를 입력하세요 (기본값: 1): ');
    const endInput = await askQuestion('▶ 끝 페이지 번호를 입력하세요 (기본값: 44): ');
    rl.close();

    startPage = parseInt(startInput, 10) || 1;
    endPage = parseInt(endInput, 10) || 44;
  }

  console.log(`📌 [설정 탐색 범위]: ${startPage}페이지 ~ ${endPage}페이지\n`);

  // 3. public/pets/ 디렉터리 세팅
  const publicPetsDir = path.resolve('public/pets');
  if (!fs.existsSync(publicPetsDir)) {
    fs.mkdirSync(publicPetsDir, { recursive: true });
    console.log(`📁 [디렉터리 생성] ${publicPetsDir}\n`);
  }

  // 4. petData.json 데이터 읽기
  const rawPetData = fs.readFileSync(petDataPath, 'utf-8');
  const petDataObj = JSON.parse(rawPetData);
  const existingPets = petDataObj.pets || [];

  console.log(`📊 [기존 DB 현황] 현재 등록된 펫: ${existingPets.length}개\n`);

  // 5. Puppeteer 가상 브라우저 가동
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const imgPage = await browser.newPage();
  await imgPage.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const baseUrl = 'https://www.hwansoo.top/bbs/board.php?bo_table=pets';
  const scrapedPetsInOrder = [];
  const seenScrapedNames = new Set();
  let downloadedCount = 0;

  console.log('🚀 [1단계] 1페이지~44페이지 순서대로 스크래핑 & 이미지 다운로드 가동...\n');

  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    console.log(`▶ [${pageNum}/${endPage}] 페이지 탐색 중...`);

    try {
      await page.goto(`${baseUrl}&page=${pageNum}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const html = await page.content();
      const petBlocks = html.split('<div class="pets_item"');

      for (let i = 1; i < petBlocks.length; i++) {
        const block = petBlocks[i];

        // 1. 이름 (name)
        const nameMatch = /<strong>(.*?)<\/strong>/.exec(block);
        const name = nameMatch ? nameMatch[1].trim() : '';
        if (!name) continue;

        // 크롤링 순서 중복 방지 (동일 페이지/이후 페이지 중복 방지)
        if (seenScrapedNames.has(name)) continue;
        seenScrapedNames.add(name);

        // 2. 획득처 (source)
        const sourceMatch = /<a [^>]*class="detail_pets">([\s\S]*?)<\/a>/.exec(block);
        const source = sourceMatch ? sourceMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        // 3. 원본 이미지 주소 (imageLink)
        const imgMatch = /<img [^>]*src="([^"]+)"/.exec(block);
        const originalImageLink = imgMatch ? imgMatch[1].trim() : '';

        // 이미지 파일 다운로드 시도
        if (originalImageLink) {
          const romanName = koreanToRoman(name);
          const extMatch = originalImageLink.match(/\.(webp|png|jpg|jpeg|gif)(\?.*)?$/i);
          const ext = extMatch ? extMatch[1].toLowerCase() : 'webp';
          const localFileName = `pet_${romanName}.${ext}`;
          const localFilePath = path.join(publicPetsDir, localFileName);

          if (!fs.existsSync(localFilePath)) {
            const success = await downloadImage(imgPage, originalImageLink, localFilePath);
            if (success) {
              downloadedCount++;
              process.stdout.write(`  📷 [새 다운로드 완료] ${name} -> public/pets/${localFileName}\n`);
            }
          }
        }

        // 4. 속성 능력치 (elementStats)
        const elementStats = { earth: 0, water: 0, fire: 0, wind: 0 };
        const elemRegex = /<span [^>]*class="label color_bg[^"]*"><strong>\s*([지수화풍])\s*\([^)]*Lv\.(\d+)\)\s*<\/strong><\/span>/g;
        let elemMatch;
        while ((elemMatch = elemRegex.exec(block)) !== null) {
          const type = elemMatch[1];
          const val = parseInt(elemMatch[2], 10) || 0;
          if (type === '지') elementStats.earth = val;
          if (type === '수') elementStats.water = val;
          if (type === '화') elementStats.fire = val;
          if (type === '풍') elementStats.wind = val;
        }

        // 5. 초기치 (baseStats)
        const baseStats = { attack: 0, defense: 0, agility: 0, vitality: 0 };
        const baseRowMatch = /<td class="pettb_name">초기치<\/td>([\s\S]*?)<\/tr>/.exec(block);
        if (baseRowMatch) {
          const nums = [];
          const numRegex = /<strong class="pettb_num">(\d+)<\/strong>/g;
          let nm;
          while ((nm = numRegex.exec(baseRowMatch[1])) !== null) {
            nums.push(parseInt(nm[1], 10));
          }
          if (nums.length >= 4) {
            baseStats.attack = nums[0];
            baseStats.defense = nums[1];
            baseStats.agility = nums[2];
            baseStats.vitality = nums[3];
          }
        }

        // 6. 성장률 (growthStats: 소수점 3자리 문자열)
        const growthStats = { attack: '0.000', defense: '0.000', agility: '0.000', vitality: '0.000' };
        const growthRowMatch = /<td class="pettb_name">성장률<\/td>([\s\S]*?)<\/tr>/.exec(block);
        if (growthRowMatch) {
          const nums = [];
          const numRegex = /<strong class="pettb_num">([\d.]+)<\/strong>/g;
          let nm;
          while ((nm = numRegex.exec(growthRowMatch[1])) !== null) {
            const parsedVal = parseFloat(nm[1]);
            nums.push(isNaN(parsedVal) ? '0.000' : parsedVal.toFixed(3));
          }
          if (nums.length >= 4) {
            growthStats.attack = nums[0];
            growthStats.defense = nums[1];
            growthStats.agility = nums[2];
            growthStats.vitality = nums[3];
          }
        }

        // 7. 탑승여부 (rideable)
        const rideMatch = /탑승가능|탑승불가/.exec(block);
        const rideable = rideMatch ? rideMatch[0] : '탑승불가';

        // 8. 총성장률 (totalGrowth)
        const totalGrowthMatch = /<td class="pettb_name">총성장률<\/td>[\s\S]*?<strong class="pettb_num"[^>]*>([\d.]+)<\/strong>/.exec(block);
        const rawTotalGrowth = totalGrowthMatch ? totalGrowthMatch[1] : '0.000';
        const totalGrowth = isNaN(parseFloat(rawTotalGrowth)) ? '0.000' : parseFloat(rawTotalGrowth).toFixed(3);

        // 9. 판매등급 (grade)
        const gradeMatch = /<td class="pettb_name">판매등급<\/td>[\s\S]*?<td [^>]*class="pettb_data">([\s\S]*?)<\/td>/.exec(block);
        const rawGrade = gradeMatch ? gradeMatch[1].replace(/<[^>]+>/g, '').trim() : '일반등급';
        const grade = rawGrade.includes('등급') ? rawGrade : `${rawGrade}등급`;

        scrapedPetsInOrder.push({
          name,
          source,
          imageLink: originalImageLink,
          elementStats,
          baseStats,
          growthStats,
          rideable,
          totalGrowth,
          grade,
        });
      }

    } catch (e) {
      console.log(`❌ ${pageNum}페이지 탐색 실패 (${e.message})`);
    }
  }

  await browser.close();

  console.log(`\n==================================================`);
  console.log(`✨ [크롤링 수집 완료] 총 ${scrapedPetsInOrder.length}개의 펫 순서대로 추출`);
  console.log(`🔍 [2단계 정렬 및 ID 내림차순 재할당 중...]`);

  // 로컬 디스크 파일 검증 후 이미지 경로 /pets/ 대체 함수
  const resolveLocalImageLink = (petName, currentLink) => {
    const romanName = koreanToRoman(petName);
    const extensions = ['webp', 'png', 'jpg', 'jpeg', 'gif'];
    
    for (const ext of extensions) {
      const localFileName = `pet_${romanName}.${ext}`;
      const localFilePath = path.join(publicPetsDir, localFileName);
      if (fs.existsSync(localFilePath)) {
        return `/pets/${localFileName}`;
      }
    }
    return currentLink;
  };

  // 1~44페이지에 포함되지 않은 기존 기타 펫들만 따로 추출 (맨 밑으로 배치할 펫들)
  const legacyPetsNotInScraped = existingPets.filter(ep => !seenScrapedNames.has(ep.name));

  // 이미지 경로 정밀 업데이트
  scrapedPetsInOrder.forEach(p => {
    p.imageLink = resolveLocalImageLink(p.name, p.imageLink);
  });

  legacyPetsNotInScraped.forEach(p => {
    p.imageLink = resolveLocalImageLink(p.name, p.imageLink);
  });

  // 최종 배열 결합: [ 1~44페이지 펫 (1페이지 상단 -> 44페이지 하단 순서) , ...나머지 기존 펫들 ]
  const finalOrderedPets = [...scrapedPetsInOrder, ...legacyPetsNotInScraped];
  const totalCount = finalOrderedPets.length;

  // 상단부터 순서대로 내림차순 ID 부여 (첫번째 펫 = totalCount ID, 맨 아래 펫 = ID "1")
  const finalPetsWithIds = finalOrderedPets.map((pet, index) => {
    return {
      id: (totalCount - index).toString(),
      ...pet,
    };
  });

  // petData.json 저장
  petDataObj.lastUpdated = new Date().toISOString();
  petDataObj.totalCount = totalCount;
  petDataObj.pets = finalPetsWithIds;

  fs.writeFileSync(petDataPath, JSON.stringify(petDataObj, null, 2), 'utf-8');

  console.log(`==================================================`);
  console.log(`🎉 [1~44페이지 완벽 순서 정렬 & petData.json 최종 저장 리포트]`);
  console.log(`- 📦 백업 파일명: src/data/${backupFilename}`);
  console.log(`- 📌 상단 1~44페이지 순서 정렬 펫 수: ${scrapedPetsInOrder.length}개`);
  console.log(`- 📌 하단 배정 기존 기타 펫 수: ${legacyPetsNotInScraped.length}개`);
  console.log(`- 🔝 1페이지 최상단 첫번째 펫: ${finalPetsWithIds[0]?.name} (ID: ${finalPetsWithIds[0]?.id})`);
  console.log(`- 📊 최종 petData.json 총 펫 수: ${petDataObj.totalCount}개`);
  console.log(`- 🕒 DB 갱신 완료 시각: ${petDataObj.lastUpdated}`);
  console.log(`==================================================\n`);
}

main().catch(err => {
  console.error('❌ 스크립트 실행 중 에러 발생:', err);
});
