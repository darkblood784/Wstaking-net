// src/components/NotificationProvider.tsx

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Snackbar, Alert, AlertColor } from "@mui/material";

// 定義通知的介面
interface Notification {
  message: string; // 通知訊息
  type: AlertColor; // 通知類型（'error' | 'warning' | 'info' | 'success'）
}

// 定義通知上下文的介面
interface NotificationContextProps {
  showNotification: (message: string, type: AlertColor) => void; // 顯示通知的函數
}

// 創建通知上下文，初始值為 undefined
const NotificationContext = createContext<NotificationContextProps | undefined>(undefined);

/**
 * NotificationProvider 組件
 * 提供通知功能給子組件使用
 */
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<Notification | null>(null); // 當前通知狀態
  const [open, setOpen] = useState(false); // Snackbar 開啟狀態

  /**
   * 顯示通知
   * @param message 通知訊息
   * @param type 通知類型
   */
  const showNotification = (message: string, type: AlertColor) => {
    setNotification({ message, type }); // 設置通知內容
    setOpen(true); // 打開 Snackbar
  };

  /**
   * 處理通知關閉事件
   * @param event 事件對象
   * @param reason 關閉原因
   */
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return; // 如果是點擊離開，則不關閉
    }
    setOpen(false); // 關閉 Snackbar
    setNotification(null); // 重置通知狀態
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && (
        <Snackbar
          open={open} // 控制 Snackbar 是否開啟
          onClose={handleClose} // 當 Snackbar 關閉時調用 handleClose
          anchorOrigin={{ vertical: "top", horizontal: "center" }} // 通知位置
          autoHideDuration={3000} // 自動關閉時間（毫秒）
        >
          <Alert
            severity={notification.type} // 設置 Alert 的嚴重性
            onClose={handleClose} // 當 Alert 的關閉按鈕被點擊時調用 handleClose
            sx={{
              width: "100%",
              maxWidth: "400px", // 限制通知寬度
              mx: "auto", // 水平居中
              boxShadow: 3, // 陰影效果
            }}
          >
            {notification.message} {/* 顯示通知訊息 */}
          </Alert>
        </Snackbar>
      )}
    </NotificationContext.Provider>
  );
};

/**
 * 自訂 Hook，用於在組件中使用通知功能
 * @returns {NotificationContextProps} 通知上下文的屬性
 * @throws 當不在 NotificationProvider 中使用時，拋出錯誤
 */
export const useNotification = (): NotificationContextProps => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification 必須在 NotificationProvider 內使用");
  }
  return context;
};