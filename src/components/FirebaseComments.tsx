import React, { useState, useEffect } from 'react';
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
import { db, type Comment } from '../lib/firebase';
import { VisitTracker } from '../utils/visitTracker';

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

  // 간단한 해시 함수 (실제 프로덕션에서는 더 강력한 해시 사용 권장)
  const simpleHash = async (text: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // 방문자 통계 로드 함수 (관리자 전용)
  const loadVisitorStats = async () => {
    try {
      const todayCount = await VisitTracker.getDailyStats();
      const weekStats = await VisitTracker.getWeeklyStats();
      setDailyVisitors(todayCount);
      setWeeklyStats(weekStats);
    } catch (error) {
      console.error('방문자 통계 로드 실패:', error);
    }
  };

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
      loadVisitorStats();
    }
  }, []);

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
          <h3 className="text-lg font-semibold text-text-primary">💬 댓글 작성</h3>
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
              <div className="space-y-2">
                <div className="text-xs text-yellow-600 dark:text-yellow-400">
                  ⚡ 관리자 권한: 모든 댓글 삭제 가능
                </div>
                <div className="bg-bg-secondary rounded-lg p-3 border border-border">
                  <div className="text-xs text-text-secondary mb-2 font-semibold">📈 주간 방문자 현황</div>
                  <div className="space-y-1">
                    {weeklyStats.map((stat, index) => {
                      const date = new Date(stat.date);
                      const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
                      const isToday = stat.date === new Date().toISOString().split('T')[0];
                      return (
                        <div key={stat.date} className={`flex justify-between text-xs ${isToday ? 'font-semibold text-accent' : 'text-text-secondary'}`}>
                          <span>{stat.date} ({dayName})</span>
                          <span>{stat.count}명</span>
                        </div>
                      );
                    })}
                    <div className="border-t border-border pt-1 mt-2">
                      <div className="flex justify-between text-xs font-semibold text-text-primary">
                        <span>7일 총계</span>
                        <span>{weeklyStats.reduce((total, stat) => total + stat.count, 0)}명</span>
                      </div>
                    </div>
                  </div>
                </div>
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
    </div>
  );
};

export default FirebaseComments;
