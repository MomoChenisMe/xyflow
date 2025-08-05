/**
 * Angular XYFlow 錯誤訊息常數
 * 與 React Flow 的錯誤處理機制保持一致
 * 基於 @xyflow/system/src/constants.ts
 */

export const errorMessages = {
  // 節點相關錯誤
  error003: (nodeType: string) => `Node type "${nodeType}" not found. Using fallback type "default".`,
  
  // 邊相關錯誤
  error011: (edgeType: string) => `Edge type "${edgeType}" not found. Using fallback type "default".`,
  
  // 其他錯誤可在此添加
} as const;

export type ErrorCode = keyof typeof errorMessages;
export type ErrorMessage = string;

/**
 * 錯誤處理函數類型
 * 與 React Flow 的 onError 事件保持一致
 */
export type OnErrorHandler = (code: ErrorCode, message: ErrorMessage) => void;

/**
 * 預設錯誤處理函數
 * 使用 console.warn 輸出警告
 */
export const defaultErrorHandler: OnErrorHandler = (code: ErrorCode, message: ErrorMessage) => {
  console.warn(`[Angular XYFlow ${code}] ${message}`);
};