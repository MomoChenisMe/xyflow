import { AngularNode } from '../types';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 檢測兩個矩形是否相交
 * @param rectA 第一個矩形
 * @param rectB 第二個矩形
 * @param partially 是否允許部分重疊 (預設: true)
 * @returns 是否相交
 */
export function isRectIntersecting(
  rectA: Rect,
  rectB: Rect,
  partially: boolean = true
): boolean {
  if (partially) {
    // 部分重疊檢測
    return !(
      rectA.x + rectA.width < rectB.x ||
      rectB.x + rectB.width < rectA.x ||
      rectA.y + rectA.height < rectB.y ||
      rectB.y + rectB.height < rectA.y
    );
  } else {
    // 完全包含檢測
    return (
      rectA.x >= rectB.x &&
      rectA.y >= rectB.y &&
      rectA.x + rectA.width <= rectB.x + rectB.width &&
      rectA.y + rectA.height <= rectB.y + rectB.height
    );
  }
}

/**
 * 將節點轉換為矩形
 * @param node 節點對象
 * @param nodeInternals 節點內部狀態 Map
 * @returns 矩形對象
 */
export function nodeToRect<T extends AngularNode>(
  node: T,
  nodeInternals: Map<string, any>
): Rect {
  const internal = nodeInternals.get(node.id);
  const position = internal?.positionAbsolute || node.position;
  
  // 從節點內部狀態獲取尺寸，如果沒有則使用預設值或節點樣式中的尺寸
  let width = internal?.measured?.width || node.width || 150;
  let height = internal?.measured?.height || node.height || 80;
  
  // 如果節點有樣式中定義的寬高，優先使用
  if (node.style?.['width']) {
    width = typeof node.style['width'] === 'number' ? node.style['width'] : parseInt(node.style['width'] as string, 10) || width;
  }
  if (node.style?.['height']) {
    height = typeof node.style['height'] === 'number' ? node.style['height'] : parseInt(node.style['height'] as string, 10) || height;
  }
  
  return {
    x: position.x,
    y: position.y,
    width,
    height
  };
}

/**
 * 計算矩形的中心點
 * @param rect 矩形對象
 * @returns 中心點座標
 */
export function getRectCenter(rect: Rect): { x: number; y: number } {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

/**
 * 計算兩個矩形之間的距離
 * @param rectA 第一個矩形
 * @param rectB 第二個矩形
 * @returns 距離
 */
export function getRectDistance(rectA: Rect, rectB: Rect): number {
  const centerA = getRectCenter(rectA);
  const centerB = getRectCenter(rectB);
  
  const dx = centerA.x - centerB.x;
  const dy = centerA.y - centerB.y;
  
  return Math.sqrt(dx * dx + dy * dy);
}