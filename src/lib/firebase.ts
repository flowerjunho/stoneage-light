import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase 설정 - 실제 프로젝트에서는 환경변수 사용 권장
const firebaseConfig = {
  apiKey: 'AIzaSyBwtpZh4roGYUyG6l0q0hPOej12MFtgaRs',
  authDomain: 'stoneage-light.firebaseapp.com',
  projectId: 'stoneage-light',
  storageBucket: 'stoneage-light.firebasestorage.app',
  messagingSenderId: '961129802087',
  appId: '1:961129802087:web:bec965058ea0125d0627c2',
  measurementId: 'G-2M6DZF4FZY',
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 초기화
export const db = getFirestore(app);

// 댓글 데이터 타입 정의
export interface Comment {
  id?: string;
  nickname: string;
  content: string;
  timestamp: Date;
  likes: number;
  ipHash?: string; // 중복 방지용 (실제로는 IP 해시값 저장)
  passwordHash?: string; // 댓글 삭제용 비밀번호 해시
}
