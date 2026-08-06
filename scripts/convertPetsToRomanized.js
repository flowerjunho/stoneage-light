import fs from 'fs';
import path from 'path';

/**
 * public/pets/ 폴더의 한글 파일명을 영문 발음(Romanized) 파일명으로 일괄 변경
 * src/data/petData.json 의 imageLink 경로도 영문 파일명으로 일괄 변경
 */

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

function main() {
  console.log('==================================================');
  console.log('🔤 [한글 펫 파일명 -> 영문 발음(Romanized) 파일명 일괄 변환기]');
  console.log('==================================================\n');

  const petDataPath = path.resolve('src/data/petData.json');
  const publicPetsDir = path.resolve('public/pets');

  if (!fs.existsSync(petDataPath)) {
    console.error('❌ petData.json 파일이 존재하지 않습니다.');
    return;
  }

  const raw = fs.readFileSync(petDataPath, 'utf-8');
  const petDataObj = JSON.parse(raw);
  const pets = petDataObj.pets || [];

  // 1. public/pets/ 디렉터리 내 기존 파일 목록 읽기
  const filesOnDisk = fs.readdirSync(publicPetsDir);
  console.log(`📁 public/pets/ 폴더 내 파일 개수: ${filesOnDisk.length}개\n`);

  let renamedFilesCount = 0;
  let updatedJsonCount = 0;

  // 파일명 매핑 맵 (기존 한글파일명 -> 새로운 영문파일명)
  const fileRenameMap = new Map();

  filesOnDisk.forEach(fileName => {
    // pet_카르벤.webp -> ext: .webp, base: pet_카르벤
    const ext = path.extname(fileName); // .webp, .gif, .png ...
    const nameWithoutExt = path.basename(fileName, ext); // pet_카르벤

    // 한글이 들어간 파일명인 경우 변환
    if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(nameWithoutExt)) {
      const rawKoreanName = nameWithoutExt.replace(/^pet_/, '');
      const romanizedName = koreanToRoman(rawKoreanName);
      const newFileName = `pet_${romanizedName}${ext}`;

      const oldPath = path.join(publicPetsDir, fileName);
      const newPath = path.join(publicPetsDir, newFileName);

      // 리네임 처리
      try {
        fs.renameSync(oldPath, newPath);
        fileRenameMap.set(fileName, newFileName);
        renamedFilesCount++;
      } catch (err) {
        console.error(`  ❌ 파일명 변경 실패: ${fileName} -> ${newFileName}`, err.message);
      }
    }
  });

  console.log(`✅ [1단계] public/pets/ 파일명 영문 변환 완료: ${renamedFilesCount}개 변경됨\n`);

  // 2. petData.json 의 imageLink 도 영문 파일명으로 일괄 변환
  pets.forEach(pet => {
    if (pet.imageLink && pet.imageLink.startsWith('/pets/')) {
      const oldFileName = path.basename(pet.imageLink);
      
      // 만약 이미 리네임 맵에 있는 경우
      if (fileRenameMap.has(oldFileName)) {
        const newFileName = fileRenameMap.get(oldFileName);
        pet.imageLink = `/pets/${newFileName}`;
        updatedJsonCount++;
      } else if (/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(oldFileName)) {
        // 맵에는 없지만 한글 파일명인 경우 직접 계산
        const ext = path.extname(oldFileName);
        const nameWithoutExt = path.basename(oldFileName, ext);
        const rawKoreanName = nameWithoutExt.replace(/^pet_/, '');
        const romanizedName = koreanToRoman(rawKoreanName);
        const newFileName = `pet_${romanizedName}${ext}`;

        pet.imageLink = `/pets/${newFileName}`;
        updatedJsonCount++;
      }
    }
  });

  // 3. petData.json 저장
  fs.writeFileSync(petDataPath, JSON.stringify(petDataObj, null, 2), 'utf-8');

  console.log('==================================================');
  console.log('🎉 [영문 파일명 변환 및 petData.json 업데이트 완료 리포트]');
  console.log(`- 📂 영문으로 변경된 실물 이미지 파일 수: ${renamedFilesCount}개`);
  console.log(`- 📄 petData.json 내 영문 경로로 수정된 펫 수: ${updatedJsonCount}개`);
  console.log('==================================================\n');
}

main();
