import React from 'react';

// LoadingFallback 組件，用於懶加載的回退動畫效果，內嵌樣式方式實現
const LoadingFallback: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed', // 固定在視窗
        top: 0,
        left: 0,
        width: '100vw', // 占滿整個視窗寬度
        height: '100vh', // 占滿整個視窗高度
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)', // 半透明黑色背景
        backdropFilter: 'blur(8px)', // 模糊效果
        zIndex: 9999, // 保證在最上層
      }}
    >
      <div className="spinner">
        <div className="double-bounce1"></div>
        <div className="double-bounce2"></div>
      </div>
      {/* 樣式直接嵌入在組件內 */}
      <style>
        {`
          .spinner {
            width: 50px;
            height: 50px;
            position: relative;
          }
          .double-bounce1,
          .double-bounce2 {
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: #1a88f8;
            opacity: 0.6;
            position: absolute;
            top: 0;
            left: 0;
            animation: sk-bounce 2s infinite ease-in-out;
          }
          .double-bounce2 {
            animation-delay: -1s;
          }
          @keyframes sk-bounce {
            0%,
            100% {
              transform: scale(0);
            }
            50% {
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingFallback;