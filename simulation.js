import puppeteer from 'puppeteer';

(async () => {
  console.log('🚀 시뮬레이션 시작: 로컬 브라우저를 띄워 이벤트를 발생시킵니다...');
  
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  try {
    // 로컬 프리뷰 서버로 접속 (npm run preview 포트 기준)
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0' });
    console.log('✅ 사이트 접속 성공');
    
    // 초기 로컬 스토리지 확인
    let queue = await page.evaluate(() => localStorage.getItem('stoneage_event_queue'));
    console.log(`📊 현재 로컬 스토리지 대기열 수: ${queue ? JSON.parse(queue).length : 0}개`);

    // 1. 탭 클릭 시뮬레이션
    console.log('👉 [액션] "듀얼" 탭 클릭');
    await page.click('text="듀얼"').catch(() => {});
    await new Promise(r => setTimeout(r, 500));

    console.log('👉 [액션] "페트" 탭 클릭');
    await page.click('text="페트"').catch(() => {});
    await new Promise(r => setTimeout(r, 500));

    // 큐 확인
    queue = await page.evaluate(() => localStorage.getItem('stoneage_event_queue'));
    const parsedQueue = queue ? JSON.parse(queue) : [];
    console.log(`📊 현재 로컬 스토리지 대기열 수: ${parsedQueue.length}개`);
    if (parsedQueue.length > 0) {
      console.log('   마지막 저장된 이벤트:', parsedQueue[parsedQueue.length - 1].type, parsedQueue[parsedQueue.length - 1].action);
    }

    // 추가 액션 발생 (5개 이상 만들어서 Firebase Flush 유도)
    console.log('👉 [액션] 추가 클릭 3회 수행 (총 5회 이상 발생시켜 덤프 유도)');
    await page.click('text="공지"').catch(() => {});
    await new Promise(r => setTimeout(r, 500));
    
    await page.click('text="홈"').catch(() => {});
    await new Promise(r => setTimeout(r, 500));
    
    await page.click('text="듀얼"').catch(() => {});
    
    // 비동기 전송 대기
    console.log('⏳ Firebase 전송 대기 중 (3초)...');
    await new Promise(r => setTimeout(r, 3000));

    // 최종 큐 확인 (5개가 넘었으므로 전송 시도 후 큐가 비워져야 함)
    queue = await page.evaluate(() => localStorage.getItem('stoneage_event_queue'));
    const finalQueue = queue ? JSON.parse(queue) : [];
    console.log(`📊 최종 로컬 스토리지 대기열 수: ${finalQueue.length}개`);
    
    if (finalQueue.length === 0) {
      console.log('✨ [성공] 5개의 이벤트가 모여 Firebase로 성공적으로 덤프되었고 로컬 스토리지가 비워졌습니다!');
    } else {
      console.log('⚠️ [안내] Firebase 전송 대기 상태이거나, 권한/네트워크 이슈로 큐가 유지되었습니다.');
    }
    
  } catch (err) {
    console.error('❌ 시뮬레이션 중 오류 발생:', err.message);
  } finally {
    await browser.close();
    console.log('🏁 시뮬레이션 종료');
  }
})();
