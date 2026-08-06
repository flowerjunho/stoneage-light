import fs from 'fs';
import path from 'path';

const petDataPath = path.resolve('src/data/petData.json');
const petDataObj = JSON.parse(fs.readFileSync(petDataPath, 'utf-8'));
const pets = petDataObj.pets || [];

console.log('==================================================');
console.log('🔍 [펫 이름 공백 제거 기준 중복 정밀 진단 리포트]');
console.log('==================================================\n');

console.log(`📊 전체 펫 데이터 수: ${pets.length}개`);

// 1. 공백 포함 펫 필터링
const petsWithSpace = pets.filter(p => /\s/.test(p.name));
console.log(`🔍 이름에 공백(띄어쓰기)이 들어간 펫 수: ${petsWithSpace.length}개\n`);

console.log('--------------------------------------------------');
console.log('📋 [이름에 공백이 포함된 펫 13개 전체 목록]');
petsWithSpace.forEach((p, i) => {
  console.log(`  ${(i + 1).toString().padStart(2, ' ')}. ID: ${p.id.padStart(4, ' ')} | 원본이름: "${p.name}" | 공백제거: "${p.name.replace(/\s+/g, '')}" | 획득처: ${p.source}`);
});
console.log('--------------------------------------------------\n');

// 2. 공백 제거 후(normalized) 동일해지는 그룹 찾기
const normalizedMap = new Map();

pets.forEach(pet => {
  const norm = pet.name.replace(/\s+/g, '');
  if (!normalizedMap.has(norm)) {
    normalizedMap.set(norm, []);
  }
  normalizedMap.get(norm).push(pet);
});

// 3. 중복되는 그룹 중 공백 포함 펫이 포함된 그룹만 필터링
const duplicateGroups = [];
for (const [norm, group] of normalizedMap.entries()) {
  if (group.length > 1) {
    const hasSpacePet = group.some(p => /\s/.test(p.name));
    if (hasSpacePet) {
      duplicateGroups.push({ norm, group });
    }
  }
}

console.log('==================================================');
console.log(`⚠️ [공백 제거 시 동일한 이름으로 중복되는 펫 그룹 (총 ${duplicateGroups.length}개 그룹)]`);
console.log('==================================================\n');

duplicateGroups.forEach((item, index) => {
  console.log(`[그룹 ${index + 1}] 공백 제거 기준 이름: "${item.norm}" (총 ${item.group.length}개 항목)`);
  item.group.forEach(p => {
    console.log(`   - ID: ${p.id.padStart(4, ' ')} | 원본이름: "${p.name}" | 획득처: ${p.source} | 총성장: ${p.totalGrowth} | 이미지: ${p.imageLink}`);
  });
  console.log('');
});

console.log('==================================================');
console.log(`🎉 진단 완료! 상기 ${duplicateGroups.length}개 그룹이 공백 제거 시 중복되는 항목입니다.`);
console.log('==================================================\n');
