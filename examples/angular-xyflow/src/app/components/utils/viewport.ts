/**
 * Angular XYFlow 視窗工具
 * 
 * 提供視窗相關的計算和操作功能
 * 包括縮放、平移、適配視圖等
 */

import { Viewport, Transform, Rect, XYPosition } from '../types/system-types';
import { clamp } from './general';

// ===================
// 視窗轉換
// ===================

/**
 * 視窗轉換為Transform陣列
 */
export function viewportToTransform(viewport: Viewport): Transform {
  return [viewport.x, viewport.y, viewport.zoom];
}

/**
 * Transform陣列轉換為視窗
 */
export function transformToViewport(transform: Transform): Viewport {
  return {
    x: transform[0],
    y: transform[1],
    zoom: transform[2]
  };
}

/**
 * 獲取視窗的變換矩陣
 */
export function getViewportTransformMatrix(viewport: Viewport): string {
  return `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
}

// ===================
// 視窗計算
// ===================

/**
 * 計算適合邊界的視窗
 */
export function getViewportForBounds(
  bounds: Rect,
  width: number,
  height: number,
  minZoom: number = 0.1,
  maxZoom: number = 4,
  padding: number = 0.1
): Viewport {
  const paddingX = bounds.width * padding;
  const paddingY = bounds.height * padding;
  
  const xZoom = width / (bounds.width + paddingX * 2);
  const yZoom = height / (bounds.height + paddingY * 2);
  const zoom = clamp(Math.min(xZoom, yZoom), minZoom, maxZoom);
  
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  
  const x = width / 2 - centerX * zoom;
  const y = height / 2 - centerY * zoom;
  
  return { x, y, zoom };
}

/**
 * 計算視窗邊界
 */
export function getViewportBounds(
  viewport: Viewport,
  width: number,
  height: number
): Rect {
  return {
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    width: width / viewport.zoom,
    height: height / viewport.zoom
  };
}

/**
 * 檢查視窗是否在邊界內
 */
export function isViewportInBounds(
  viewport: Viewport,
  bounds: Rect,
  width: number,
  height: number
): boolean {
  const viewportBounds = getViewportBounds(viewport, width, height);
  
  return (
    viewportBounds.x >= bounds.x &&
    viewportBounds.y >= bounds.y &&
    viewportBounds.x + viewportBounds.width <= bounds.x + bounds.width &&
    viewportBounds.y + viewportBounds.height <= bounds.y + bounds.height
  );
}

// ===================
// 縮放計算
// ===================

/**
 * 計算以點為中心的縮放
 */
export function zoomWithCenter(
  viewport: Viewport,
  zoomFactor: number,
  center: XYPosition,
  constraints?: {
    minZoom?: number;
    maxZoom?: number;
  }
): Viewport {
  const { minZoom = 0.1, maxZoom = 4 } = constraints || {};
  
  const newZoom = clamp(viewport.zoom * zoomFactor, minZoom, maxZoom);
  const zoomScale = newZoom / viewport.zoom;
  
  const x = center.x - (center.x - viewport.x) * zoomScale;
  const y = center.y - (center.y - viewport.y) * zoomScale;
  
  return { x, y, zoom: newZoom };
}

/**
 * 縮放到指定等級
 */
export function zoomTo(
  viewport: Viewport,
  zoom: number,
  center: XYPosition,
  constraints?: {
    minZoom?: number;
    maxZoom?: number;
  }
): Viewport {
  const { minZoom = 0.1, maxZoom = 4 } = constraints || {};
  
  const newZoom = clamp(zoom, minZoom, maxZoom);
  const zoomScale = newZoom / viewport.zoom;
  
  const x = center.x - (center.x - viewport.x) * zoomScale;
  const y = center.y - (center.y - viewport.y) * zoomScale;
  
  return { x, y, zoom: newZoom };
}

/**
 * 放大
 */
export function zoomIn(
  viewport: Viewport,
  center: XYPosition,
  zoomSpeed: number = 1.2,
  constraints?: {
    minZoom?: number;
    maxZoom?: number;
  }
): Viewport {
  return zoomWithCenter(viewport, zoomSpeed, center, constraints);
}

/**
 * 縮小
 */
export function zoomOut(
  viewport: Viewport,
  center: XYPosition,
  zoomSpeed: number = 1.2,
  constraints?: {
    minZoom?: number;
    maxZoom?: number;
  }
): Viewport {
  return zoomWithCenter(viewport, 1 / zoomSpeed, center, constraints);
}

// ===================
// 平移計算
// ===================

/**
 * 平移視窗
 */
export function panViewport(
  viewport: Viewport,
  deltaX: number,
  deltaY: number
): Viewport {
  return {
    x: viewport.x + deltaX,
    y: viewport.y + deltaY,
    zoom: viewport.zoom
  };
}

/**
 * 平移到指定位置
 */
export function panTo(
  viewport: Viewport,
  position: XYPosition,
  viewportSize: { width: number; height: number }
): Viewport {
  const centerX = viewportSize.width / 2;
  const centerY = viewportSize.height / 2;
  
  return {
    x: centerX - position.x * viewport.zoom,
    y: centerY - position.y * viewport.zoom,
    zoom: viewport.zoom
  };
}

/**
 * 限制視窗在邊界內
 */
export function constrainViewportToBounds(
  viewport: Viewport,
  bounds: Rect,
  viewportSize: { width: number; height: number }
): Viewport {
  const viewportBounds = getViewportBounds(viewport, viewportSize.width, viewportSize.height);
  
  let x = viewport.x;
  let y = viewport.y;
  
  // 限制左邊界
  if (viewportBounds.x < bounds.x) {
    x = -bounds.x * viewport.zoom;
  }
  
  // 限制上邊界
  if (viewportBounds.y < bounds.y) {
    y = -bounds.y * viewport.zoom;
  }
  
  // 限制右邊界
  if (viewportBounds.x + viewportBounds.width > bounds.x + bounds.width) {
    x = viewportSize.width - (bounds.x + bounds.width) * viewport.zoom;
  }
  
  // 限制下邊界
  if (viewportBounds.y + viewportBounds.height > bounds.y + bounds.height) {
    y = viewportSize.height - (bounds.y + bounds.height) * viewport.zoom;
  }
  
  return { x, y, zoom: viewport.zoom };
}

// ===================
// 視窗動畫
// ===================

export interface ViewportTransition {
  from: Viewport;
  to: Viewport;
  duration: number;
  startTime: number;
  easing?: (t: number) => number;
}

/**
 * 線性插值視窗
 */
export function interpolateViewport(
  from: Viewport,
  to: Viewport,
  progress: number
): Viewport {
  return {
    x: from.x + (to.x - from.x) * progress,
    y: from.y + (to.y - from.y) * progress,
    zoom: from.zoom + (to.zoom - from.zoom) * progress
  };
}

/**
 * 創建視窗過渡
 */
export function createViewportTransition(
  from: Viewport,
  to: Viewport,
  duration: number,
  easing?: (t: number) => number
): ViewportTransition {
  return {
    from,
    to,
    duration,
    startTime: Date.now(),
    easing
  };
}

/**
 * 獲取過渡進度
 */
export function getTransitionProgress(transition: ViewportTransition): number {
  const elapsed = Date.now() - transition.startTime;
  const progress = Math.min(elapsed / transition.duration, 1);
  
  if (transition.easing) {
    return transition.easing(progress);
  }
  
  return progress;
}

/**
 * 獲取過渡視窗
 */
export function getTransitionViewport(transition: ViewportTransition): Viewport {
  const progress = getTransitionProgress(transition);
  return interpolateViewport(transition.from, transition.to, progress);
}

// ===================
// 視窗工具函數
// ===================

/**
 * 比較兩個視窗是否相等
 */
export function areViewportsEqual(a: Viewport, b: Viewport): boolean {
  return a.x === b.x && a.y === b.y && a.zoom === b.zoom;
}

/**
 * 計算兩個視窗的差異
 */
export function getViewportDelta(from: Viewport, to: Viewport): Viewport {
  return {
    x: to.x - from.x,
    y: to.y - from.y,
    zoom: to.zoom - from.zoom
  };
}

/**
 * 應用視窗差異
 */
export function applyViewportDelta(viewport: Viewport, delta: Viewport): Viewport {
  return {
    x: viewport.x + delta.x,
    y: viewport.y + delta.y,
    zoom: viewport.zoom + delta.zoom
  };
}

/**
 * 創建默認視窗
 */
export function createDefaultViewport(
  x: number = 0,
  y: number = 0,
  zoom: number = 1
): Viewport {
  return { x, y, zoom };
}

/**
 * 計算滾輪縮放的新視窗
 */
export function wheelZoom(
  viewport: Viewport,
  wheelDelta: number,
  position: XYPosition,
  options: {
    zoomSpeed?: number;
    minZoom?: number;
    maxZoom?: number;
    invertScrollDirection?: boolean;
  } = {}
): Viewport {
  const {
    zoomSpeed = 0.002,
    minZoom = 0.1,
    maxZoom = 4,
    invertScrollDirection = false
  } = options;
  
  const delta = invertScrollDirection ? -wheelDelta : wheelDelta;
  const zoomFactor = 1 + delta * zoomSpeed;
  
  return zoomWithCenter(viewport, zoomFactor, position, { minZoom, maxZoom });
}

/**
 * 計算雙指縮放的新視窗
 */
export function pinchZoom(
  viewport: Viewport,
  scale: number,
  center: XYPosition,
  constraints?: {
    minZoom?: number;
    maxZoom?: number;
  }
): Viewport {
  return zoomWithCenter(viewport, scale, center, constraints);
}

/**
 * 重置視窗
 */
export function resetViewport(): Viewport {
  return createDefaultViewport();
}

// ===================
// 視窗範圍計算
// ===================

/**
 * 獲取視窗的可視範圍
 */
export function getVisibleRect(
  viewport: Viewport,
  containerWidth: number,
  containerHeight: number
): Rect {
  return {
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    width: containerWidth / viewport.zoom,
    height: containerHeight / viewport.zoom
  };
}

/**
 * 檢查點是否在視窗內
 */
export function isPointInViewport(
  point: XYPosition,
  viewport: Viewport,
  containerWidth: number,
  containerHeight: number
): boolean {
  const visibleRect = getVisibleRect(viewport, containerWidth, containerHeight);
  
  return (
    point.x >= visibleRect.x &&
    point.x <= visibleRect.x + visibleRect.width &&
    point.y >= visibleRect.y &&
    point.y <= visibleRect.y + visibleRect.height
  );
}

/**
 * 檢查矩形是否在視窗內
 */
export function isRectInViewport(
  rect: Rect,
  viewport: Viewport,
  containerWidth: number,
  containerHeight: number,
  partially: boolean = false
): boolean {
  const visibleRect = getVisibleRect(viewport, containerWidth, containerHeight);
  
  if (partially) {
    // 部分可見
    return !(
      rect.x > visibleRect.x + visibleRect.width ||
      rect.x + rect.width < visibleRect.x ||
      rect.y > visibleRect.y + visibleRect.height ||
      rect.y + rect.height < visibleRect.y
    );
  } else {
    // 完全可見
    return (
      rect.x >= visibleRect.x &&
      rect.y >= visibleRect.y &&
      rect.x + rect.width <= visibleRect.x + visibleRect.width &&
      rect.y + rect.height <= visibleRect.y + visibleRect.height
    );
  }
}