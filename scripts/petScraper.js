import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapePetData() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();

    // 사용자 에이전트 설정
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    );

    let allPets = [];

    // 1페이지부터 31페이지까지 순회
    for (let pageNum = 1; pageNum <= 31; pageNum++) {
      console.log(`${pageNum}페이지 로딩 중...`);

      try {
        await page.goto(`https://www.hwansoo.top/bbs/board.php?bo_table=pets&page=${pageNum}`, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        });

        console.log(`${pageNum}페이지 데이터 추출 중...`);

        const petData = await page.evaluate(currentPage => {
          const pets = [];
          const galleryElement = document.getElementById('bo_gallery');

          if (!galleryElement) {
            throw new Error('bo_gallery 요소를 찾을 수 없습니다.');
          }

          const petItems = galleryElement.querySelectorAll('.pets_item');

          petItems.forEach((item, index) => {
            try {
              // 이미지 링크 추출
              const petsHeader = item.querySelector('.pets_header img');
              const imageLink = petsHeader ? petsHeader.src : '';

              // ID와 이름 추출
              const petsTitle = item.querySelector('.pets_title a');
              let petId = '';
              let name = '';

              if (petsTitle) {
                const href = petsTitle.href;
                const urlParams = new URLSearchParams(href.split('?')[1]);
                petId = urlParams.get('wr_id') || '';

                const strongTag = petsTitle.querySelector('strong');
                name = strongTag ? strongTag.textContent.trim() : '';
              }

              // 소스 추출
              const detailPets = item.querySelector('.detail_pets');
              const source = detailPets ? detailPets.textContent.trim() : '';

              // 원소 스탯 추출 - 정확한 DOM 구조로 수정
              const petsStat = item.querySelector('.pets_stat');
              let elementStats = {
                water: 0,
                fire: 0,
                wind: 0,
                earth: 0,
              };

              if (petsStat) {
                // pets_stat 안의 모든 dd 태그들 순회
                const ddElements = petsStat.querySelectorAll('dd');

                ddElements.forEach(dd => {
                  // 각 dd의 div들을 찾기
                  const divs = dd.querySelectorAll('div');

                  // 2번째 div (인덱스 1)가 있다면
                  if (divs.length >= 2) {
                    const secondDiv = divs[1];

                    // 2번째 div 안의 모든 span 태그들 순회
                    const spans = secondDiv.querySelectorAll('span');

                    spans.forEach(span => {
                      const classList = span.classList;
                      // color_bg2 = water
                      if (classList.contains('color_bg2')) {
                        elementStats.water++;
                      }
                      // color_bg3 = fire
                      if (classList.contains('color_bg3')) {
                        elementStats.fire++;
                      }
                      // color_bg4 = wind
                      if (classList.contains('color_bg4')) {
                        elementStats.wind++;
                      }
                      // color_bg = earth (다른 color_bg 클래스가 없는 경우만)
                      if (
                        classList.contains('color_bg') &&
                        !classList.contains('color_bg2') &&
                        !classList.contains('color_bg3') &&
                        !classList.contains('color_bg4')
                      ) {
                        elementStats.earth++;
                      }
                    });
                  }
                });
              }

              // 펫 테이블 정보 추출 - 텍스트 기반으로 찾기
              let baseStats = {
                attack: 0,
                defense: 0,
                agility: 0,
                vitality: 0,
              };
              let growthStats = {
                attack: 0,
                defense: 0,
                agility: 0,
                vitality: 0,
              };
              let rideable = '';
              let totalGrowth = '';
              let grade = '';

              // 전체 텍스트에서 정보 추출
              const itemText = item.textContent;

              // 초기치 정보 찾기 - 여러 패턴 시도
              let baseStatsMatch = itemText.match(
                /초기치[:\s]*(\d+)[:\s]*(\d+)[:\s]*(\d+)[:\s]*(\d+)/
              );

              if (!baseStatsMatch) {
                // 다른 패턴으로 시도
                baseStatsMatch = itemText.match(
                  /공격력[:\s]*(\d+)[^\d]*방어력[:\s]*(\d+)[^\d]*순발력[:\s]*(\d+)[^\d]*내구력[:\s]*(\d+)/
                );
              }

              if (!baseStatsMatch) {
                // 또 다른 패턴으로 시도 (숫자만 연속으로)
                const statsNumbers = itemText.match(
                  /(?:초기치|공격력)[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(\d+)[^0-9]*(\d+)/
                );
                if (statsNumbers) {
                  baseStatsMatch = statsNumbers;
                }
              }

              if (baseStatsMatch) {
                baseStats.attack = parseFloat(baseStatsMatch[1]) || 0;
                baseStats.defense = parseFloat(baseStatsMatch[2]) || 0;
                baseStats.agility = parseFloat(baseStatsMatch[3]) || 0;
                baseStats.vitality = parseFloat(baseStatsMatch[4]) || 0;
              }

              // 성장률 정보 찾기 - 정확한 패턴 사용
              const growthStatsMatch = itemText.match(
                /성장률[^0-9]*([0-9.]+)[^0-9]*([0-9.]+)[^0-9]*([0-9.]+)[^0-9]*([0-9.]+)/
              );

              if (growthStatsMatch) {
                growthStats.attack = parseFloat(growthStatsMatch[1]) || 0;
                growthStats.defense = parseFloat(growthStatsMatch[2]) || 0;
                growthStats.agility = parseFloat(growthStatsMatch[3]) || 0;
                growthStats.vitality = parseFloat(growthStatsMatch[4]) || 0;
              }

              // 탑승여부 찾기
              const rideableMatch = itemText.match(/탑승(가능|불가)/);
              if (rideableMatch) {
                rideable = '탑승' + rideableMatch[1];
              }

              // 총성장률 찾기 - 개별 성장률로 분리
              let totalGrowthMatch = itemText.match(/총성장률[:\s]*([0-9.]+)/);
              if (totalGrowthMatch) {
                totalGrowth = totalGrowthMatch[1];
              }

              // 판매등급 찾기
              const gradeMatch = itemText.match(
                /(1등급|2등급|3등급|4등급|5등급|일반등급|일반페트|일반|고급등급|고급페트|고급|희귀등급|희귀페트|희귀|영웅등급|영웅페트|영웅|전설등급|전설페트|전설)/
              );
              if (gradeMatch) {
                grade = gradeMatch[1];
              }

              pets.push({
                id: petId || `${currentPage}-${index + 1}`,
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
            } catch (error) {
              console.error(`펫 아이템 ${index + 1} 처리 중 오류:`, error);
            }
          });

          return pets;
        }, pageNum);

        console.log(`${pageNum}페이지에서 ${petData.length}개의 펫 데이터를 추출했습니다.`);
        allPets = allPets.concat(petData);

        // 페이지 간 딜레이 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (pageError) {
        console.error(`${pageNum}페이지 처리 중 오류:`, pageError);
        // 개별 페이지 오류는 건너뛰고 계속 진행
        continue;
      }
    }

    console.log(`총 ${allPets.length}개의 펫 데이터를 추출했습니다.`);

    // JSON 파일로 저장
    const jsonData = {
      lastUpdated: new Date().toISOString(),
      totalCount: allPets.length,
      pets: allPets,
    };

    fs.writeFileSync('src/data/petData.json', JSON.stringify(jsonData, null, 2), 'utf8');
    console.log('src/data/petData.json 파일이 생성되었습니다.');

    return allPets;
  } catch (error) {
    console.error('스크래핑 중 오류 발생:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// 스크립트 실행
scrapePetData()
  .then(data => {
    console.log('스크래핑 완료!');
    console.log(`추출된 펫 수: ${data.length}`);
  })
  .catch(error => {
    console.error('스크래핑 실패:', error);
    process.exit(1);
  });

export { scrapePetData };
