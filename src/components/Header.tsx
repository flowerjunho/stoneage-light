import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="w-full bg-bg-secondary border-b border-border mb-8">
      <div className="max-w-6xl mx-auto p-4 relative iphone16:p-3">
        <div className="w-full h-80 rounded-xl overflow-hidden relative iphone16:h-60 iphone16:rounded-lg">
          <img 
            src="./sa.jpg" 
            alt="StoneAge Light - Pet Collection" 
            className="w-full h-full object-cover brightness-75"
          />
        </div>
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 text-center text-white z-10 w-full px-4">
          <h1 className="text-4xl font-bold mb-2 drop-shadow-2xl iphone16:text-2xl xs:text-xl leading-tight">
            스톤에이지 환수강림 라이트 페트 및 탑승 정보 by.명가
          </h1>
        </div>
      </div>
    </header>
  );
};

export default Header;