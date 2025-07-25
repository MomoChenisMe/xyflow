/**
 * Angular XYFlow 通用工具函數
 * 
 * 提供基礎的數學計算、幾何運算、類型檢查等通用功能
 * 包括數值限制、位置計算、邊界檢測等實用工具
 */

import { AngularNode } from '../types/nodes';
import { AngularEdge } from '../types/edges';
import { XYPosition, Viewport, Dimensions, Rect, Box } from '../types/system-types';

// ===================
// 數學計算工具
// ===================

/**
 * 將數值限制在指定範圍內
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 限制位置在指定邊界內
 */
export function clampPosition(
  position: XYPosition, 
  bounds: [[number, number], [number, number]]
): XYPosition;
export function clampPosition(
  position: XYPosition, 
  bounds: [[number, number], [number, number]], 
  dimensions: Dimensions
): XYPosition;
export function clampPosition(
  position: XYPosition, 
  bounds: [[number, number], [number, number]], 
  dimensions?: Dimensions
): XYPosition {
  if (dimensions) {
    // 考慮節點尺寸的限制
    const maxX = bounds[1][0] - dimensions.width;
    const maxY = bounds[1][1] - dimensions.height;
    return {
      x: clamp(position.x, bounds[0][0], maxX),
      y: clamp(position.y, bounds[0][1], maxY)
    };
  }
  
  return {
    x: clamp(position.x, bounds[0][0], bounds[1][0]),
    y: clamp(position.y, bounds[0][1], bounds[1][1])
  };
}

/**
 * 限制子節點位置在父節點內
 */
export function clampPositionToParent(
  position: XYPosition,
  dimensions: Dimensions,
  parentDimensions: Dimensions,
  parentPosition: XYPosition = { x: 0, y: 0 }
): XYPosition {
  const maxX = parentPosition.x + parentDimensions.width - dimensions.width;
  const maxY = parentPosition.y + parentDimensions.height - dimensions.height;
  
  return {
    x: clamp(position.x, parentPosition.x, maxX),
    y: clamp(position.y, parentPosition.y, maxY)
  };
}

/**
 * 網格對齊位置
 */
export function snapPosition(position: XYPosition, gridSize: number = 15): XYPosition {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize
  };
}

/**
 * 計算兩點間距離
 */
export function getDistance(pointA: XYPosition, pointB: XYPosition): number {
  return Math.sqrt(Math.pow(pointB.x - pointA.x, 2) + Math.pow(pointB.y - pointA.y, 2));
}

/**
 * 計算角度（弧度）
 */
export function getAngle(pointA: XYPosition, pointB: XYPosition): number {
  return Math.atan2(pointB.y - pointA.y, pointB.x - pointA.x);
}

/**
 * 線性插值
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * 位置線性插值
 */
export function lerpPosition(start: XYPosition, end: XYPosition, factor: number): XYPosition {
  return {
    x: lerp(start.x, end.x, factor),
    y: lerp(start.y, end.y, factor)
  };
}

// ===================
// 幾何計算工具
// ===================

/**
 * 矩形轉盒子
 */
export function rectToBox(rect: Rect): Box {
  return {
    x: rect.x,
    y: rect.y,
    x2: rect.x + rect.width,
    y2: rect.y + rect.height
  };
}

/**
 * 盒子轉矩形
 */
export function boxToRect(box: Box): Rect {
  return {
    x: box.x,
    y: box.y,
    width: box.x2 - box.x,
    height: box.y2 - box.y
  };
}

/**
 * 節點轉矩形
 */
export function nodeToRect(node: AngularNode): Rect {
  return {
    x: node.position.x,
    y: node.position.y,
    width: node.width || 150,
    height: node.height || 40
  };
}

/**
 * 節點轉盒子
 */
export function nodeToBox(node: AngularNode): Box {
  return rectToBox(nodeToRect(node));
}

/**
 * 獲取多個盒子的邊界
 */
export function getBoundsOfBoxes(boxes: Box[]): Box {
  if (boxes.length === 0) {
    return { x: 0, y: 0, x2: 0, y2: 0 };
  }
  
  let minX = boxes[0].x;
  let minY = boxes[0].y;
  let maxX = boxes[0].x2;
  let maxY = boxes[0].y2;
  
  for (let i = 1; i < boxes.length; i++) {
    const box = boxes[i];
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x2);
    maxY = Math.max(maxY, box.y2);
  }
  
  return { x: minX, y: minY, x2: maxX, y2: maxY };
}

/**
 * 計算重疊區域
 */
export function getOverlappingArea(rectA: Rect, rectB: Rect): number {
  const xOverlap = Math.max(0, Math.min(rectA.x + rectA.width, rectB.x + rectB.width) - Math.max(rectA.x, rectB.x));
  const yOverlap = Math.max(0, Math.min(rectA.y + rectA.height, rectB.y + rectB.height) - Math.max(rectA.y, rectB.y));
  
  return xOverlap * yOverlap;
}

/**
 * 檢查點是否在矩形內
 */
export function isPointInRect(point: XYPosition, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

/**
 * 檢查矩形是否相交
 */
export function doRectsIntersect(rectA: Rect, rectB: Rect): boolean {
  return (
    rectA.x < rectB.x + rectB.width &&
    rectA.x + rectA.width > rectB.x &&
    rectA.y < rectB.y + rectB.height &&
    rectA.y + rectA.height > rectB.y
  );
}

// ===================
// 座標轉換工具
// ===================

/**
 * 點座標轉渲染器座標
 */
export function pointToRendererPoint(
  point: XYPosition,
  transform: [number, number, number],
  snapToGrid: boolean = false,
  snapGrid: [number, number] = [15, 15]
): XYPosition {
  const transformedPoint = {
    x: (point.x - transform[0]) / transform[2],
    y: (point.y - transform[1]) / transform[2]
  };
  
  if (snapToGrid) {
    transformedPoint.x = Math.round(transformedPoint.x / snapGrid[0]) * snapGrid[0];
    transformedPoint.y = Math.round(transformedPoint.y / snapGrid[1]) * snapGrid[1];
  }
  
  return transformedPoint;
}

/**
 * 渲染器座標轉點座標
 */
export function rendererPointToPoint(
  point: XYPosition,
  transform: [number, number, number]
): XYPosition {
  return {
    x: point.x * transform[2] + transform[0],
    y: point.y * transform[2] + transform[1]
  };
}

/**
 * 屏幕座標轉流程座標
 */
export function screenToFlowPosition(position: XYPosition, viewport: Viewport): XYPosition {
  return {
    x: (position.x - viewport.x) / viewport.zoom,
    y: (position.y - viewport.y) / viewport.zoom
  };
}

/**
 * 流程座標轉屏幕座標
 */
export function flowToScreenPosition(position: XYPosition, viewport: Viewport): XYPosition {
  return {
    x: position.x * viewport.zoom + viewport.x,
    y: position.y * viewport.zoom + viewport.y
  };
}

// ===================
// 視窗計算工具
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
  const xZoom = width / (bounds.width * (1 + padding));
  const yZoom = height / (bounds.height * (1 + padding));
  const zoom = clamp(Math.min(xZoom, yZoom), minZoom, maxZoom);
  
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;
  
  const x = width / 2 - centerX * zoom;
  const y = height / 2 - centerY * zoom;
  
  return { x, y, zoom };
}

/**
 * 獲取節點尺寸
 */
export function getNodeDimensions(node: AngularNode): Dimensions {
  return {
    width: node.width || 150,
    height: node.height || 40
  };
}

/**
 * 計算絕對位置
 */
export function evaluateAbsolutePosition(
  position: XYPosition,
  dimensions: Dimensions,
  parent?: AngularNode
): XYPosition {
  if (!parent) {
    return position;
  }
  
  const parentDimensions = getNodeDimensions(parent);
  const parentAbsolutePosition = parent.positionAbsolute || parent.position;
  
  return {
    x: parentAbsolutePosition.x + position.x,
    y: parentAbsolutePosition.y + position.y
  };
}

// ===================
// 自動平移計算
// ===================

/**
 * 計算自動平移
 */
export function calcAutoPan(
  position: XYPosition,
  bounds: Rect,
  speed: number = 15
): XYPosition {
  const autoPanRange = 100;
  const deltaX = position.x - bounds.x;
  const deltaY = position.y - bounds.y;
  
  let panX = 0;
  let panY = 0;
  
  // 左邊界
  if (deltaX < autoPanRange) {
    panX = -speed * (1 - deltaX / autoPanRange);
  }
  // 右邊界
  else if (deltaX > bounds.width - autoPanRange) {
    panX = speed * ((deltaX - (bounds.width - autoPanRange)) / autoPanRange);
  }
  
  // 上邊界
  if (deltaY < autoPanRange) {
    panY = -speed * (1 - deltaY / autoPanRange);
  }
  // 下邊界
  else if (deltaY > bounds.height - autoPanRange) {
    panY = speed * ((deltaY - (bounds.height - autoPanRange)) / autoPanRange);
  }
  
  return { x: panX, y: panY };
}

// ===================
// 類型守衛
// ===================

/**
 * 檢查是否為節點
 */
export function isNode(element: any): element is AngularNode {
  return (
    element &&
    typeof element === 'object' &&
    'id' in element &&
    'position' in element &&
    'data' in element &&
    !('source' in element) &&
    !('target' in element)
  );
}

/**
 * 檢查是否為邊線
 */
export function isEdge(element: any): element is AngularEdge {
  return (
    element &&
    typeof element === 'object' &&
    'id' in element &&
    'source' in element &&
    'target' in element
  );
}

/**
 * 檢查是否為連接對象
 */
export function isConnection(element: any): boolean {
  return (
    element &&
    typeof element === 'object' &&
    'source' in element &&
    'target' in element
  );
}

// ===================
// ID 生成工具
// ===================

let nodeIdCounter = 0;
let edgeIdCounter = 0;

/**
 * 生成節點 ID
 */
export function generateNodeId(prefix: string = 'node'): string {
  return `${prefix}-${++nodeIdCounter}`;
}

/**
 * 生成邊線 ID
 */
export function generateEdgeId(prefix: string = 'edge'): string {
  return `${prefix}-${++edgeIdCounter}`;
}

/**
 * 生成 UUID
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 重置 ID 計數器
 */
export function resetIdCounters(): void {
  nodeIdCounter = 0;
  edgeIdCounter = 0;
}

// ===================
// 樣式工具
// ===================

/**
 * 組合類名
 */
export function combineClassNames(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * 創建樣式字符串
 */
export function createStyleString(styles: Record<string, string | number | undefined>): string {
  return Object.entries(styles)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${kebabCase(key)}: ${value}`)
    .join('; ');
}

/**
 * 駝峰轉短橫線
 */
export function kebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

// ===================
// 集合工具
// ===================

/**
 * 數組去重
 */
export function uniqueArray<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * 數組分組
 */
export function groupBy<T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const key = getKey(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

/**
 * 深度合併對象
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  if (!sources.length) return target;
  const source = sources.shift();
  
  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        if (source[key] != null) {
          deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }
  
  return deepMerge(target, ...sources);
}

/**
 * 深度克隆對象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

/**
 * 檢查是否為對象
 */
function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// ===================
// 防抖和節流
// ===================

/**
 * 防抖函數
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => func(...args), delay);
  };
}

/**
 * 節流函數
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// ===================
// 異步工具
// ===================

/**
 * 延遲執行
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 超時 Promise
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('操作超時')), timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

/**
 * 重試執行
 */
export async function retry<T>(
  fn: () => Promise<T>,
  attempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === attempts - 1) {
        throw error;
      }
      await delay(delayMs);
    }
  }
  throw new Error('所有重試嘗試都失敗了');
}