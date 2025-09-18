import React, { useEffect } from 'react';

interface ExpTableData {
  level: number;
  exp: number;
}

interface ExpTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  expData: ExpTableData[];
}

const ExpTableModal: React.FC<ExpTableModalProps> = ({ isOpen, onClose, expData }) => {
  // 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDimClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={handleDimClick}
    >
      <div 
        className="bg-bg-primary rounded-xl max-w-xs w-full max-h-[90vh] overflow-y-auto border-2 border-border-primary shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-border-primary">
          <h2 className="text-xl font-bold text-text-primary">경험치 테이블</h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary transition-colors p-1 hover:bg-bg-secondary rounded-lg"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 테이블 */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border-primary">
                  <th className="text-left py-3 px-4 text-text-primary font-semibold">레벨</th>
                  <th className="text-right py-3 px-4 text-text-primary font-semibold">필요 경험치</th>
                </tr>
              </thead>
              <tbody>
                {expData.map((data, index) => (
                  <tr key={data.level} className={index % 2 === 0 ? 'bg-bg-secondary/30' : ''}>
                    <td className="py-2 px-4 text-text-primary font-medium">Lv.{data.level}</td>
                    <td className="py-2 px-4 text-text-primary text-right font-mono">
                      {data.exp.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpTableModal;