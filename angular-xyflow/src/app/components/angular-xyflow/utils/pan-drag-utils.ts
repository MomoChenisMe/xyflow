// Pan drag 相關的工具函數
import { MouseButton, PanOnDragArray } from '../types';

/**
 * 檢查是否為右鍵拖拽
 * @param panOnDrag - panOnDrag 設定值
 * @param mouseButton - 滑鼠按鍵 (0: 左鍵, 1: 中鍵, 2: 右鍵)
 * @returns 是否為右鍵拖拽
 */
export function isRightClickPan(panOnDrag: boolean | number[], mouseButton: number): boolean {
  return Array.isArray(panOnDrag) && panOnDrag.includes(2) && mouseButton === 2;
}

/**
 * 檢查特定滑鼠按鍵是否啟用了 panOnDrag
 * @param panOnDrag - panOnDrag 設定值
 * @param mouseButton - 滑鼠按鍵 (預設為 0，左鍵)
 * @returns 是否啟用了 panOnDrag
 */
export function isPanOnDragEnabled(panOnDrag: boolean | number[], mouseButton: number = 0): boolean {
  if (typeof panOnDrag === 'boolean') {
    return panOnDrag && mouseButton === 0;
  }
  if (Array.isArray(panOnDrag)) {
    return panOnDrag.includes(mouseButton);
  }
  return false;
}

/**
 * 獲取適當的拖拽游標樣式
 * @param panOnDrag - panOnDrag 設定值
 * @param isDragging - 是否正在拖拽中
 * @returns 游標樣式字串
 */
export function getPanCursor(panOnDrag: boolean | number[], isDragging: boolean): string {
  if (isDragging) {
    return 'grabbing';
  }
  
  if (isPanOnDragEnabled(panOnDrag, 0)) {
    return 'grab';
  }
  
  return 'default';
}

/**
 * 檢查是否啟用了任何形式的 panOnDrag
 * @param panOnDrag - panOnDrag 設定值
 * @returns 是否啟用了任何 panOnDrag 功能
 */
export function isAnyPanOnDragEnabled(panOnDrag: boolean | number[]): boolean {
  if (typeof panOnDrag === 'boolean') {
    return panOnDrag;
  }
  if (Array.isArray(panOnDrag)) {
    return panOnDrag.length > 0;
  }
  return false;
}

/**
 * 獲取支援的滑鼠按鍵列表
 * @param panOnDrag - panOnDrag 設定值
 * @returns 支援的滑鼠按鍵陣列
 */
export function getSupportedMouseButtons(panOnDrag: boolean | number[]): number[] {
  if (typeof panOnDrag === 'boolean') {
    return panOnDrag ? [0] : [];
  }
  if (Array.isArray(panOnDrag)) {
    return panOnDrag.filter(button => typeof button === 'number' && button >= 0 && button <= 2);
  }
  return [];
}