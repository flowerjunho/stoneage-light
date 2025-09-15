import React from 'react';

interface SaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  saveTitle: string;
  setSaveTitle: (title: string) => void;
  onSave: () => void;
}

const SaveModal: React.FC<SaveModalProps> = ({
  isOpen,
  onClose,
  saveTitle,
  setSaveTitle,
  onSave
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setSaveTitle('');
  };

  const handleSave = () => {
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-lg p-6 w-96 max-w-90vw border border-border">
        <h3 className="text-xl font-bold mb-4 text-text-primary">데이터 저장</h3>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 text-text-secondary">
            저장할 이름을 입력하세요
          </label>
          <input
            type="text"
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            placeholder="예: 완캐/순캐"
            className="w-full px-3 py-2 rounded-lg border-2 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            maxLength={10}
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div className="text-xs text-text-muted mb-4">
          * 최대 5개까지 저장 가능하며, 초과 시 가장 오래된 데이터가 삭제됩니다.
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-lg bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!saveTitle.trim()}
            className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;