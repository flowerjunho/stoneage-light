import fs from 'fs';
import path from 'path';
import readline from 'readline';
import puppeteer from 'puppeteer';

/**
 * hwansoo.top 페트 정보 범위 지정 터미널 크롤러 스크립트
 * (시작 전 petData_{datetime}.json 백업 및 pnpm scrape:pets 실행 연동)
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

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

async function main() {
  console.log('\n==================================================');
  console.log('🕷️  [환수강림 페트 정보 터미널 대화형 크롤러]');
  console.log('    pnpm scrape:pets 실행 모드');
  console.log('==================================================\n');

  // 1. 시작 전 기존 petData.json 자동 백업 생성
  const petDataPath = path.resolve('src/data/petData.json');
  let backupFilename = '';

  if (fs.existsSync(petDataPath)) {
    backupFilename = `petData_${getDatetimeStr()}.json`;
    const backupPath = path.resolve('src/data', backupFilename);
    fs.copyFileSync(petDataPath, backupPath);
    console.log(`📦 [자동 백업 완료] 기존 petData.json -> src/data/${backupFilename}\n`);
  }

  // 2. 터미널 범위 입력받기
  const startInput = await askQuestion('▶ 시작 페이지 번호를 입력하세요 (예: 1): ');
  const endInput = await askQuestion('▶ 끝 페이지 번호를 입력하세요 (예: 5): ');
  
  rl.close();

  const startPage = parseInt(startInput, 10) || 1;
  const endPage = parseInt(endInput, 10) || startPage;

  console.log(`\n📌 [설정 탐색 범위]: ${startPage}페이지 ~ ${endPage}페이지\n`);

  // 3. petData.json 데이터 읽기
  const rawPetData = fs.readFileSync(petDataPath, 'utf-8');
  const petDataObj = JSON.parse(rawPetData);
  const existingPets = petDataObj.pets || [];

  // 현재 기존 DB 최고 ID 구하기
  let maxId = 0;
  existingPets.forEach(p => {
    const num = parseInt(p.id, 10);
    if (!isNaN(num) && num > maxId) {
      maxId = num;
    }
  });

  console.log(`📊 [기존 DB 현황] 현재 등록된 펫: ${existingPets.length}개 | 최고 ID: ${maxId}\n`);

  // 4. Puppeteer 가상 브라우저 실행
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  const baseUrl = 'https://www.hwansoo.top/bbs/board.php?bo_table=pets';
  const scrapedPets = [];

  // 범위 순회 수집
  for (let pageNum = startPage; pageNum <= endPage; pageNum++) {
    process.stdout.write(`▶ [${pageNum}/${endPage}] 페이지 데이터 추출 중... `);

    try {
      await page.goto(`${baseUrl}&page=${pageNum}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const html = await page.content();
      const petBlocks = html.split('<div class="pets_item"');
      let count = 0;

      for (let i = 1; i < petBlocks.length; i++) {
        const block = petBlocks[i];

        // 1. 이름
        const nameMatch = /<strong>(.*?)<\/strong>/.exec(block);
        const name = nameMatch ? nameMatch[1].trim() : '';
        if (!name) continue;

        // 2. 획득처
        const sourceMatch = /<a [^>]*class="detail_pets">([\s\S]*?)<\/a>/.exec(block);
        const source = sourceMatch ? sourceMatch[1].replace(/<[^>]+>/g, '').trim() : '';

        // 3. 이미지 주소
        const imgMatch = /<img [^>]*src="([^"]+)"/.exec(block);
        const imageLink = imgMatch ? imgMatch[1].trim() : '';

        // 4. 속성 능력치
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

        // 5. 초기치
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

        // 6. 성장률
        const growthStats = { attack: 0, defense: 0, agility: 0, vitality: 0 };
        const growthRowMatch = /<td class="pettb_name">성장률<\/td>([\s\S]*?)<\/tr>/.exec(block);
        if (growthRowMatch) {
          const nums = [];
          const numRegex = /<strong class="pettb_num">([\d.]+)<\/strong>/g;
          let nm;
          while ((nm = numRegex.exec(growthRowMatch[1])) !== null) {
            nums.push(parseFloat(nm[1]));
          }
          if (nums.length >= 4) {
            growthStats.attack = nums[0];
            growthStats.defense = nums[1];
            growthStats.agility = nums[2];
            growthStats.vitality = nums[3];
          }
        }

        // 7. 탑승여부
        const rideMatch = /탑승가능|탑승불가/.exec(block);
        const rideable = rideMatch ? rideMatch[0] : '탑승불가';

        // 8. 총성장률
        const totalGrowthMatch = /<td class="pettb_name">총성장률<\/td>[\s\S]*?<strong class="pettb_num"[^>]*>([\d.]+)<\/strong>/.exec(block);
        const totalGrowth = totalGrowthMatch ? totalGrowthMatch[1] : '0.000';

        // 9. 판매등급
        const gradeMatch = /<td class="pettb_name">판매등급<\/td>[\s\S]*?<td [^>]*class="pettb_data">([\s\S]*?)<\/td>/.exec(block);
        const rawGrade = gradeMatch ? gradeMatch[1].replace(/<[^>]+>/g, '').trim() : '일반등급';
        const grade = rawGrade.includes('등급') ? rawGrade : `${rawGrade}등급`;

        scrapedPets.push({
          name,
          source,
          imageLink,
          elementStats,
          baseStats,
          growthStats,
          rideable,
          totalGrowth,
          grade,
        });

        count++;
      }

      console.log(`✅ (${count}개 파싱 완료)`);
    } catch (e) {
      console.log(`❌ 실패 (${e.message})`);
    }
  }

  await browser.close();

  console.log(`\n==================================================`);
  console.log(`✨ [1단계 수집 완료] 지정 범위에서 총 ${scrapedPets.length}개 데이터 추출`);
  console.log(`🔍 [2단계 검증] name(이름) 기준 중복 대조 처리 중...\n`);

  // 5. name(이름) 기준 중복 검사 및 신규 펫 추출
  const skippedPetsList = [];
  const newPetsToAdd = [];

  for (const pet of scrapedPets) {
    const isDuplicate = existingPets.some(ep => ep.name === pet.name) ||
                         newPetsToAdd.some(np => np.name === pet.name);

    if (isDuplicate) {
      skippedPetsList.push(pet.name);
    } else {
      newPetsToAdd.push(pet);
    }
  }

  // 중복으로 인해 추가하지 않은 펫 목록 상세 출력
  if (skippedPetsList.length > 0) {
    console.log(`--------------------------------------------------`);
    console.log(`🚫 [중복 제외 목록 (총 ${skippedPetsList.length}개 - 추가 안됨)]:`);
    skippedPetsList.forEach((name, idx) => {
      console.log(`   ${idx + 1}. ${name}`);
    });
    console.log(`--------------------------------------------------\n`);
  } else {
    console.log(`🚫 중복되어 제외된 펫 없음\n`);
  }

  // 새로 추가할 펫들에게 내림차순 ID 할당 (상단에 들어올 첫번째 펫이 가장 큰 ID)
  const newCount = newPetsToAdd.length;
  const newPetsWithId = newPetsToAdd.map((pet, index) => {
    const assignedId = (maxId + newCount - index).toString();
    return {
      id: assignedId,
      ...pet,
    };
  });

  // 새로 추가된 펫 목록 상세 출력
  if (newPetsWithId.length > 0) {
    console.log(`--------------------------------------------------`);
    console.log(`✨ [신규 추가 목록 (총 ${newPetsWithId.length}개 - petData.json 상단 등록)]:`);
    newPetsWithId.forEach((pet) => {
      console.log(`   + [ID: ${pet.id}] 이름: ${pet.name} | 획득처: ${pet.source} | 총성장: ${pet.totalGrowth} | 탑승: ${pet.rideable}`);
    });
    console.log(`--------------------------------------------------\n`);
  } else {
    console.log(`✨ 신규 추가할 새로운 펫이 없습니다 (모두 중복됨).\n`);
  }

  // 기존 pets 배열의 맨 앞쪽(상단)에 신규 펫들 추가
  const updatedPetsList = [...newPetsWithId, ...existingPets];

  // 6. petData.json 파일 업데이트 저장
  petDataObj.lastUpdated = new Date().toISOString();
  petDataObj.totalCount = updatedPetsList.length;
  petDataObj.pets = updatedPetsList;

  fs.writeFileSync(petDataPath, JSON.stringify(petDataObj, null, 2), 'utf-8');

  console.log(`==================================================`);
  console.log(`🎉 [크롤링 및 petData.json 저장 최종 결과 리포트]`);
  console.log(`- 📦 백업 파일명: src/data/${backupFilename}`);
  console.log(`- 탐색한 페이지 범위: ${startPage} 페이지 ~ ${endPage} 페이지`);
  console.log(`- 크롤링 추출 펫 수: ${scrapedPets.length}개`);
  console.log(`- 🚫 name 중복 제외된 펫: ${skippedPetsList.length}개`);
  console.log(`- ✨ 상단에 새로 추가된 펫: ${newCount}개 (ID 내림차순 할당)`);
  console.log(`- 📊 최종 petData.json 총 펫 수: ${petDataObj.totalCount}개`);
  console.log(`- 🕒 DB 갱신 시각: ${petDataObj.lastUpdated}`);
  console.log(`==================================================\n`);
}

main().catch(err => {
  console.error('❌ 스크립트 실행 중 에러 발생:', err);
  rl.close();
});
