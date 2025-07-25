/**
 * 面板位置類型 - 模擬 @xyflow/system 的 PanelPosition
 */
export type PanelPosition = 
  | 'top-left' 
  | 'top-center' 
  | 'top-right'
  | 'bottom-left' 
  | 'bottom-center' 
  | 'bottom-right';

/**
 * Panel 組件屬性
 */
export interface PanelProps {
  /**
   * 面板位置
   * @default "top-left"
   */
  position?: PanelPosition;
  
  /** CSS 類名 */
  className?: string;
  
  /** 內聯樣式 */
  style?: any;
  
  /** 其他 DOM 屬性 */
  [key: string]: any;
}