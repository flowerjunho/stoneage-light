import { doc, getDoc, setDoc, updateDoc, increment, query, collection, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';

// 방문자 추적을 위한 유틸리티 함수들
export class VisitTracker {
  private static readonly COLLECTION_NAME = 'daily_stats';
  private static readonly LOCALSTORAGE_PREFIX = 'stoneage_visit_';

  // 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (서울 시간대 기준)
  private static getTodayString(): string {
    // 서울 시간대로 직접 변환
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  }

  // 로컬스토리지에서 오늘 방문 여부 확인
  private static hasVisitedToday(): boolean {
    const todayKey = `${this.LOCALSTORAGE_PREFIX}${this.getTodayString()}`;
    return localStorage.getItem(todayKey) === 'visited';
  }

  // 로컬스토리지에 오늘 방문 기록 저장
  private static markAsVisited(): void {
    const todayKey = `${this.LOCALSTORAGE_PREFIX}${this.getTodayString()}`;
    localStorage.setItem(todayKey, 'visited');
  }

  // 방문자 수 증가 (신규 방문자인 경우에만)
  public static async trackVisit(): Promise<void> {
    // 이미 오늘 방문한 경우 스킵
    if (this.hasVisitedToday()) {
      return;
    }

    try {
      const today = this.getTodayString();
      const docRef = doc(db, this.COLLECTION_NAME, today);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        // 문서가 존재하면 count 증가
        await updateDoc(docRef, {
          count: increment(1)
        });
      } else {
        // 문서가 없으면 새로 생성 (첫 방문자)
        await setDoc(docRef, {
          date: today,
          count: 1,
          createdAt: new Date()
        });
      }

      // 로컬스토리지에 방문 기록 저장
      this.markAsVisited();
    } catch (error) {
      console.error('방문자 추적 중 오류:', error);
    }
  }

  // 일별 방문자 수 조회 (관리자용)
  public static async getDailyStats(dateString?: string): Promise<number> {
    try {
      const targetDate = dateString || this.getTodayString();
      const docRef = doc(db, this.COLLECTION_NAME, targetDate);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data().count || 0;
      }
      return 0;
    } catch (error) {
      console.error('방문자 수 조회 중 오류:', error);
      return 0;
    }
  }

  // 최근 7일간 방문자 수 조회 (관리자용)
  public static async getWeeklyStats(): Promise<Array<{ date: string; count: number }>> {
    try {
      const results: Array<{ date: string; count: number }> = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = this.formatDate(date);
        const count = await this.getDailyStats(dateString);
        
        results.push({ date: dateString, count });
      }
      
      return results;
    } catch (error) {
      console.error('주간 통계 조회 중 오류:', error);
      return [];
    }
  }

  // 특정 주간의 방문자 수 조회 (관리자용) - 배치 쿼리로 최적화
  public static async getWeeklyStatsOptimized(weekStartDate: Date): Promise<Array<{ date: string; count: number }>> {
    try {
      const results: Array<{ date: string; count: number }> = [];
      const dateStrings: string[] = [];
      
      // 7일간의 날짜 문자열 생성
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStartDate);
        date.setDate(weekStartDate.getDate() + i);
        const dateString = this.formatDate(date);
        dateStrings.push(dateString);
        results.push({ date: dateString, count: 0 }); // 기본값 0으로 초기화
      }
      
      // Firestore에서 해당 주간의 모든 데이터를 한 번에 조회
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('date', 'in', dateStrings)
      );
      
      const querySnapshot = await getDocs(q);
      
      // 조회된 데이터를 결과 배열에 매핑
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dateIndex = dateStrings.indexOf(data.date);
        if (dateIndex !== -1) {
          results[dateIndex].count = data.count || 0;
        }
      });
      
      return results;
    } catch (error) {
      console.error('주간 통계 조회 중 오류:', error);
      return [];
    }
  }

  // 날짜 포맷팅 헬퍼 (서울 시간대 기준)
  private static formatDate(date: Date): string {
    // 서울 시간대로 직접 변환
    return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  }
}