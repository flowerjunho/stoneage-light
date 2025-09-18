import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// characters.json 파일 경로
const charactersPath = path.join(__dirname, '../src/data/characters.json');
const charactersData = JSON.parse(fs.readFileSync(charactersPath, 'utf8'));

// colorImages와 weapons 필드 제거
charactersData.characters = charactersData.characters.map(character => {
  const { colorImages, weapons, ...cleanCharacter } = character;
  return cleanCharacter;
});

// 업데이트된 데이터 저장
charactersData.lastUpdated = new Date().toISOString();
fs.writeFileSync(charactersPath, JSON.stringify(charactersData, null, 2), 'utf8');

console.log('colorImages와 weapons 필드를 제거했습니다.');
console.log(`총 ${charactersData.characters.length}개 캐릭터 데이터 정리 완료`);