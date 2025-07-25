/**
 * 用戶選擇矩形接口
 */
export interface UserSelectionRect {
  /** 矩形 X 坐標 */
  x: number;
  /** 矩形 Y 坐標 */
  y: number;
  /** 矩形寬度 */
  width: number;
  /** 矩形高度 */
  height: number;
}

/**
 * 用戶選擇狀態接口
 */
export interface UserSelectionState {
  /** 是否有用戶選擇活動 */
  userSelectionActive: boolean;
  /** 用戶選擇矩形 */
  userSelectionRect: UserSelectionRect | null;
}