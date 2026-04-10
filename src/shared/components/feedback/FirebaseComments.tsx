import React, { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  increment,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, type Comment } from '@/lib/firebase';
import { VisitTracker } from '@/shared/utils/visitTracker';

const FirebaseComments: React.FC = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [title, setTitle] = useState('');
  const [nickname, setNickname] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dailyVisitors, setDailyVisitors] = useState<number>(0);
  const [weeklyStats, setWeeklyStats] = useState<Array<{ date: string; count: number }>>([]);
  const [currentWeekOffset, setCurrentWeekOffset] = useState<number>(0); // 0: 이번주, -1: 지난주, 1: 다음주
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPasswordError, setShowAdminPasswordError] = useState(false);

  // 간단한 해시 함수 (실제 프로덕션에서는 더 강력한 해시 사용 권장)
  const simpleHash = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // 주의 시작일 (월요일)을 구하는 함수 (서울 시간대 기준)
  const getWeekStartDate = (offset: number = 0): Date => {
    // 서울 시간대 기준으로 현재 날짜 구하기
    const seoulDateString = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
    const seoulDate = new Date(seoulDateString + 'T00:00:00');
    
    const dayOfWeek = seoulDate.getDay(); // 0: 일요일, 1: 월요일, ..., 6: 토요일
    const daysFromMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일까지의 거리
    
    const weekStart = new Date(seoulDate);
    weekStart.setDate(seoulDate.getDate() + daysFromMonday + (offset * 7));
    return weekStart;
  };

  // 방문자 통계 로드 함수 (관리자 전용) - 최적화된 단일 쿼리 사용
  const loadVisitorStats = useCallback(async (weekOffset: number = 0) => {
    try {
      const todayCount = await VisitTracker.getDailyStats();
      setDailyVisitors(todayCount);

      // 특정 주의 통계 로드 - 최적화된 배치 쿼리 사용
      const weekStart = getWeekStartDate(weekOffset);
      const weekStats = await VisitTracker.getWeeklyStatsOptimized(weekStart);
      
      setWeeklyStats(weekStats);
    } catch (error) {
      console.error('방문자 통계 로드 실패:', error);
    }
  }, []);

  // 저장된 타이틀, 닉네임 및 관리자 권한 확인
  useEffect(() => {
    const savedTitle = localStorage.getItem('firebase-comment-title');
    if (savedTitle) {
      setTitle(savedTitle);
    }

    const savedNickname = localStorage.getItem('firebase-comment-nickname');
    if (savedNickname) {
      setNickname(savedNickname);
    }

    // 관리자 권한 확인
    const adminId = localStorage.getItem('ADMIN_ID_STONE');
    const isAdminUser = adminId === 'flowerjunho';
    setIsAdmin(isAdminUser);
    
    // 관리자인 경우에만 방문자 통계 로드
    if (isAdminUser) {
      loadVisitorStats(currentWeekOffset);
    }
  }, [currentWeekOffset, loadVisitorStats]);

  // 실시간 댓글 불러오기
  useEffect(() => {
    setIsLoading(true);

    const q = query(collection(db, 'comments'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const commentsData: Comment[] = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          commentsData.push({
            id: doc.id,
            nickname: data.nickname,
            content: data.content,
            timestamp: data.timestamp?.toDate() || new Date(),
            likes: data.likes || 0,
            passwordHash: data.passwordHash || '',
          });
        });
        setComments(commentsData);
        setIsLoading(false);
      },
      error => {
        console.error('댓글 불러오기 실패:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 댓글 작성
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('댓글 내용을 입력해주세요.');
      return;
    }

    if (content.length > 500) {
      alert('댓글은 500자 이내로 작성해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalNickname = nickname.trim() || title.trim() || '익명';
      const passwordHash = password.trim() ? await simpleHash(password.trim()) : '';

      await addDoc(collection(db, 'comments'), {
        nickname: finalNickname,
        content: content.trim(),
        timestamp: Timestamp.now(),
        likes: 0,
        passwordHash: passwordHash,
      });

      // 타이틀과 닉네임 저장
      if (title.trim()) {
        localStorage.setItem('firebase-comment-title', title.trim());
      }
      if (nickname.trim()) {
        localStorage.setItem('firebase-comment-nickname', nickname.trim());
      }

      setContent('');
      setPassword('');
      alert('댓글이 등록되었습니다!');
    } catch (error) {
      console.error('댓글 등록 실패:', error);
      alert('댓글 등록에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 좋아요 기능
  const handleLike = async (commentId: string) => {
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        likes: increment(1),
      });
    } catch (error) {
      console.error('좋아요 실패:', error);
    }
  };

  // 댓글 삭제 기능 (관리자 또는 비밀번호 확인)
  const handleDelete = async (
    commentId: string,
    commentAuthor: string,
    commentPasswordHash?: string
  ) => {
    // 관리자인 경우 바로 삭제
    if (isAdmin) {
      const confirmDelete = window.confirm(
        `관리자 권한으로 댓글을 삭제하시겠습니까?\n\n작성자: ${commentAuthor}`
      );

      if (!confirmDelete) return;

      try {
        await deleteDoc(doc(db, 'comments', commentId));
        alert('댓글이 삭제되었습니다.');
      } catch (error) {
        console.error('댓글 삭제 실패:', error);
        alert('댓글 삭제에 실패했습니다.');
      }
      return;
    }

    // 일반 사용자인 경우 비밀번호 확인
    if (!commentPasswordHash) {
      alert('이 댓글은 비밀번호가 설정되지 않아 삭제할 수 없습니다.');
      return;
    }

    const inputPassword = prompt(
      `댓글을 삭제하려면 비밀번호를 입력하세요.\n\n작성자: ${commentAuthor}`
    );

    if (!inputPassword) return;

    try {
      const inputPasswordHash = await simpleHash(inputPassword);

      if (inputPasswordHash !== commentPasswordHash) {
        alert('비밀번호가 일치하지 않습니다.');
        return;
      }

      const confirmDelete = window.confirm('비밀번호가 확인되었습니다. 정말로 삭제하시겠습니까?');
      if (!confirmDelete) return;

      await deleteDoc(doc(db, 'comments', commentId));
      alert('댓글이 삭제되었습니다.');
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  // 시간 포맷팅
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;

    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="space-y-6">
      {/* 댓글 작성 폼 */}
      <div className="bg-bg-tertiary rounded-lg p-4 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-lg font-semibold text-text-primary select-none"
            onClick={() => {
              setShowAdminModal(true);
              setAdminPassword('');
              setShowAdminPasswordError(false);
            }}
          >💬 댓글 작성</h3>
          {isAdmin && (
            <div className="flex items-center gap-3">
              <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded">
                👑 관리자 모드
              </span>
              <div className="text-xs text-text-secondary">
                📊 오늘 방문자: <span className="font-semibold text-accent">{dailyVisitors}명</span>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="제목 (선택사항)"
              maxLength={20}
              className={`w-full px-3 py-2 bg-bg-secondary border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent ${
                isAdmin ? 'border-yellow-500' : 'border-border'
              }`}
            />
            {isAdmin && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400">
                ⚡ 관리자 권한: 모든 댓글 삭제 가능
              </div>
            )}
          </div>
          <div>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="닉네임 (선택사항)"
              maxLength={20}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="내용을 입력해주세요. (필수, 최대 500자)"
              maxLength={500}
              rows={3}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent resize-none"
              required
            />
            <div className="text-right text-xs text-text-secondary mt-1">{content.length}/500</div>
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="삭제 비밀번호 (선택사항)"
              maxLength={50}
              className="w-full px-3 py-2 bg-bg-secondary border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <div className="text-xs text-text-secondary mt-1">
              💡 비밀번호를 설정하면 나중에 본인이 직접 댓글을 삭제할 수 있습니다
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
          >
            {isSubmitting ? '등록 중...' : '댓글 등록'}
          </button>
        </form>
      </div>

      {/* 댓글 목록 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-text-primary">💭 댓글 {comments.length}개</h3>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="text-text-secondary">댓글을 불러오는 중...</div>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-text-secondary">첫 번째 댓글을 작성해보세요!</div>
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="bg-bg-tertiary rounded-lg p-4 border border-border">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-text-primary">{comment.nickname}</span>
                  <span className="text-xs text-text-secondary">
                    {formatTime(comment.timestamp)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => comment.id && handleLike(comment.id)}
                    className="flex items-center space-x-1 text-xs text-text-secondary hover:text-red-500 transition-colors"
                  >
                    <span>❤️</span>
                    <span>{comment.likes}</span>
                  </button>
                  <button
                    onClick={() =>
                      comment.id && handleDelete(comment.id, comment.nickname, comment.passwordHash)
                    }
                    className={`text-xs transition-colors px-2 py-1 rounded ${
                      isAdmin
                        ? 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/20'
                        : 'text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900/20'
                    }`}
                    title={
                      isAdmin
                        ? '관리자 권한으로 삭제'
                        : comment.passwordHash
                          ? '비밀번호로 삭제'
                          : '비밀번호가 설정되지 않음'
                    }
                  >
                    {isAdmin ? '👑🗑️' : '🗑️'}
                  </button>
                </div>
              </div>
              <div className="text-text-primary whitespace-pre-wrap">{comment.content}</div>
            </div>
          ))
        )}
      </div>

      {/* 관리자 전용 주간 방문자 통계 */}
      {isAdmin && weeklyStats.length > 0 && (
        <div className="mt-6 bg-bg-tertiary rounded-lg p-4 border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-text-primary">📈 주간 방문자 현황</h3>
            <div className="flex items-center gap-2">
              {currentWeekOffset !== 0 && (
                <button
                  onClick={() => setCurrentWeekOffset(0)}
                  className="px-2 py-1 text-[10px] bg-accent/10 hover:bg-accent/20 text-accent font-medium rounded border border-accent/20 transition-all active:scale-95"
                  title="이번 주로 이동"
                >
                  오늘
                </button>
              )}
              <button
                onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                className="px-2 py-1 text-xs bg-bg-secondary hover:bg-bg-primary rounded border border-border transition-colors"
                title="이전 주"
              >
                ◀
              </button>
              <span className="text-xs text-text-secondary">
                {currentWeekOffset === 0 ? '이번 주' : 
                 currentWeekOffset === -1 ? '지난 주' : 
                 currentWeekOffset === 1 ? '다음 주' : 
                 `${Math.abs(currentWeekOffset)}주 ${currentWeekOffset > 0 ? '후' : '전'}`}
              </span>
              <button
                onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                className="px-2 py-1 text-xs bg-bg-secondary hover:bg-bg-primary rounded border border-border transition-colors"
                title="다음 주"
              >
                ▶
              </button>
            </div>
          </div>
          
          <div className="space-y-1">
            {weeklyStats.map((stat) => {
              const date = new Date(stat.date);
              const dayName = ['월', '화', '수', '목', '금', '토', '일'][date.getDay() === 0 ? 6 : date.getDay() - 1];
              const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
              const isToday = stat.date === today;
              const isWeekend = date.getDay() === 0 || date.getDay() === 6; // 일요일 또는 토요일
              
              return (
                <div 
                  key={stat.date} 
                  className={`flex justify-between items-center text-xs py-1 px-2 rounded ${
                    isToday ? 'font-semibold text-accent bg-accent/10' : 
                    isWeekend ? 'text-red-400' : 'text-text-secondary'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-4 text-center">{dayName}</span>
                    <span>{stat.date}</span>
                    {isToday && <span className="text-xs text-accent">오늘</span>}
                  </span>
                  <span className="font-mono">{stat.count}명</span>
                </div>
              );
            })}
            
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex justify-between text-xs font-semibold text-text-primary bg-bg-secondary/50 rounded px-2 py-1">
                <span>주간 총계</span>
                <span className="font-mono">{weeklyStats.reduce((total, stat) => total + stat.count, 0)}명</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 관리자 비밀번호 입력 모달 */}
      {showAdminModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm"
          onClick={() => setShowAdminModal(false)}
        >
          <div
            className="bg-bg-secondary rounded-lg p-8 border border-border shadow-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-center mb-6">🔐 비밀번호 입력</h2>
            <div className="space-y-4">
              <input
                type="password"
                value={adminPassword}
                onChange={e => setAdminPassword(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    if (adminPassword === 'asdf11') {
                      localStorage.setItem('ADMIN_ID_STONE', 'flowerjunho');
                      window.location.reload();
                    } else {
                      setShowAdminPasswordError(true);
                    }
                  }
                }}
                placeholder="비밀번호를 입력하세요"
                className="w-full px-4 py-2 bg-bg-tertiary border border-border rounded-lg focus:outline-none focus:border-accent"
                autoFocus
              />
              {showAdminPasswordError && <p className="text-red-500 text-sm">잘못된 비밀번호입니다.</p>}
              <button
                onClick={() => {
                  if (adminPassword === 'asdf11') {
                    localStorage.setItem('ADMIN_ID_STONE', 'flowerjunho');
                    window.location.reload();
                  } else {
                    setShowAdminPasswordError(true);
                  }
                }}
                className="w-full px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseComments;
