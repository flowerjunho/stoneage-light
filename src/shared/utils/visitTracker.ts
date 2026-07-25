import { doc, getDoc, setDoc, updateDoc, increment, query, collection, where, getDocs, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface DailyVisitStats {
  date: string;
  count: number;       // 순수 방문자 수 (중복 제거)
  totalVisits: number; // 총 방문 횟수 (중복 방문 포함)
}

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

  // 관리자 여부 확인
  private static isAdmin(): boolean {
    const adminId = localStorage.getItem('ADMIN_ID_STONE');
    return adminId === 'flowerjunho';
  }

  // 방문자 수 및 총 방문 횟수 증가
  public static async trackVisit(): Promise<DailyVisitStats | null> {
    // 관리자인 경우 방문 카운트 적재 스킵
    if (this.isAdmin()) {
      return null;
    }

    try {
      const today = this.getTodayString();
      const docRef = doc(db, this.COLLECTION_NAME, today);
      const docSnap = await getDoc(docRef);
      const isFirstVisitToday = !this.hasVisitedToday();

      let count = 1;
      let totalVisits = 1;

      if (docSnap.exists()) {
        const data = docSnap.data();
        const existingCount = data.count || 0;
        const existingTotal = data.totalVisits !== undefined ? data.totalVisits : existingCount;

        count = existingCount + (isFirstVisitToday ? 1 : 0);
        totalVisits = Math.max(existingTotal + 1, count);

        const updateData: Record<string, any> = {
          totalVisits: data.totalVisits !== undefined ? increment(1) : totalVisits
        };

        // 오늘 첫 방문인 경우에만 순수 방문자수(count)도 증가
        if (isFirstVisitToday) {
          updateData.count = increment(1);
        }

        await updateDoc(docRef, updateData);
      } else {
        // 문서가 없으면 새로 생성 (오늘 첫 방문자)
        await setDoc(docRef, {
          date: today,
          count: 1,
          totalVisits: 1,
          createdAt: new Date()
        });
      }

      // 오늘 첫 방문 시 로컬스토리지에 방문 기록 저장
      if (isFirstVisitToday) {
        this.markAsVisited();
      }

      return { date: today, count, totalVisits };
    } catch (error) {
      console.error('방문자 추적 중 오류:', error);
      return null;
    }
  }

  // 일별 방문자 수 및 총 방문 횟수 조회 (관리자용)
  public static async getDailyStats(dateString?: string): Promise<DailyVisitStats> {
    try {
      const targetDate = dateString || this.getTodayString();
      const docRef = doc(db, this.COLLECTION_NAME, targetDate);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        const count = data.count || 0;
        const totalVisits = Math.max(data.totalVisits !== undefined ? data.totalVisits : count, count);
        return {
          date: targetDate,
          count,
          totalVisits
        };
      }
      return { date: targetDate, count: 0, totalVisits: 0 };
    } catch (error) {
      console.error('방문자 수 조회 중 오류:', error);
      return { date: dateString || this.getTodayString(), count: 0, totalVisits: 0 };
    }
  }

  // 최근 7일간 방문자 수 조회 (관리자용)
  public static async getWeeklyStats(): Promise<DailyVisitStats[]> {
    try {
      const results: DailyVisitStats[] = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateString = this.formatDate(date);
        const stat = await this.getDailyStats(dateString);
        
        results.push(stat);
      }
      
      return results;
    } catch (error) {
      console.error('주간 통계 조회 중 오류:', error);
      return [];
    }
  }

  // 특정 주간의 방문자 수 조회 (관리자용) - 단일 쿼리(documentId IN) 방식으로 속도 극대화
  public static async getWeeklyStatsOptimized(weekStartDate: Date): Promise<DailyVisitStats[]> {
    try {
      const results: DailyVisitStats[] = [];
      const dateStrings: string[] = [];
      
      // 7일간의 날짜 문자열 생성
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStartDate);
        date.setDate(weekStartDate.getDate() + i);
        const dateString = this.formatDate(date);
        dateStrings.push(dateString);
        results.push({ date: dateString, count: 0, totalVisits: 0 }); // 기본값 0으로 초기화
      }
      
      // Firestore의 documentId() 쿼리를 사용하여 7일치 데이터를 한 번의 네트워크 요청으로 조회
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where(documentId(), 'in', dateStrings)
      );
      
      const querySnapshot = await getDocs(q);
      
      // 조회된 데이터를 결과 배열에 매핑
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const dateIndex = dateStrings.indexOf(doc.id);
        if (dateIndex !== -1) {
          const count = data.count || 0;
          const totalVisits = Math.max(data.totalVisits !== undefined ? data.totalVisits : count, count);
          results[dateIndex].count = count;
          results[dateIndex].totalVisits = totalVisits;
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

