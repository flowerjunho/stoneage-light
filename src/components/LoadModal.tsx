import React from 'react';
import type { SavedData } from '../utils/storage';

interface LoadModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedDataList: SavedData[];
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  formatTimestamp: (timestamp: number) => string;
}

const LoadModal: React.FC<LoadModalProps> = ({
  isOpen,
  onClose,
  savedDataList,
  onLoad,
  onDelete,
  formatTimestamp,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-lg p-6 w-96 max-w-90vw border border-border max-h-80vh overflow-y-auto">
        <h3 className="text-xl font-bold mb-4 text-text-primary">저장된 데이터 불러오기</h3>
        {savedDataList.length === 0 ? (
          <div className="text-center py-8 text-text-muted">저장된 데이터가 없습니다.</div>
        ) : (
          <div className="space-y-3 mb-4">
            {savedDataList
              .sort((a, b) => b.timestamp - a.timestamp)
              .map(data => (
                <div
                  key={data.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-bg-tertiary border border-border"
                >
                  <div className="flex-1">
                    <div className="font-semibold text-text-primary">{data.title}</div>
                    <div className="text-xs text-text-secondary">
                      {formatTimestamp(data.timestamp)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onLoad(data.id)}
                      className="px-3 py-1 rounded text-sm bg-green-500 text-white font-semibold hover:bg-green-600 transition-colors"
                    >
                      불러오기
                    </button>
                    <button
                      onClick={() => onDelete(data.id)}
                      className="px-3 py-1 rounded text-sm bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadModal;
