/**
 * Angular XYFlow 座標轉換工具
 * 
 * 提供各種座標系統間的轉換功能
 * 包括屏幕座標、流程座標、視窗座標等
 */

import { XYPosition, Viewport, Transform, Dimensions, Rect } from '../types/system-types';

// ===================
// 基礎座標轉換
// ===================

/**
 * 屏幕座標轉流程座標
 */
export function screenToFlowPosition(
  position: XYPosition,
  viewport: Viewport
): XYPosition {
  return {
    x: (position.x - viewport.x) / viewport.zoom,
    y: (position.y - viewport.y) / viewport.zoom
  };
}

/**
 * 流程座標轉屏幕座標
 */
export function flowToScreenPosition(
  position: XYPosition,
  viewport: Viewport
): XYPosition {
  return {
    x: position.x * viewport.zoom + viewport.x,
    y: position.y * viewport.zoom + viewport.y
  };
}

/**
 * 點座標轉渲染器座標
 */
export function pointToRendererPoint(
  point: XYPosition,
  transform: Transform,
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
  transform: Transform
): XYPosition {
  return {
    x: point.x * transform[2] + transform[0],
    y: point.y * transform[2] + transform[1]
  };
}

// ===================
// 容器座標轉換
// ===================

/**
 * 相對於容器的座標轉絕對座標
 */
export function containerToAbsolutePosition(
  position: XYPosition,
  containerRect: Rect
): XYPosition {
  return {
    x: position.x + containerRect.x,
    y: position.y + containerRect.y
  };
}

/**
 * 絕對座標轉相對於容器的座標
 */
export function absoluteToContainerPosition(
  position: XYPosition,
  containerRect: Rect
): XYPosition {
  return {
    x: position.x - containerRect.x,
    y: position.y - containerRect.y
  };
}

/**
 * 獲取相對於元素的座標
 */
export function getRelativePosition(
  position: XYPosition,
  elementPosition: XYPosition
): XYPosition {
  return {
    x: position.x - elementPosition.x,
    y: position.y - elementPosition.y
  };
}

// ===================
// 網格對齊
// ===================

/**
 * 對齊到網格
 */
export function snapToGrid(
  position: XYPosition,
  gridSize: [number, number] = [15, 15]
): XYPosition {
  return {
    x: Math.round(position.x / gridSize[0]) * gridSize[0],
    y: Math.round(position.y / gridSize[1]) * gridSize[1]
  };
}

/**
 * 對齊到網格（單一尺寸）
 */
export function snapToGridSingle(
  position: XYPosition,
  gridSize: number = 15
): XYPosition {
  return snapToGrid(position, [gridSize, gridSize]);
}

/**
 * 檢查是否對齊到網格
 */
export function isSnappedToGrid(
  position: XYPosition,
  gridSize: [number, number] = [15, 15]
): boolean {
  return (
    position.x % gridSize[0] === 0 &&
    position.y % gridSize[1] === 0
  );
}

/**
 * 計算最近的網格點
 */
export function getNearestGridPoint(
  position: XYPosition,
  gridSize: [number, number] = [15, 15]
): XYPosition {
  return {
    x: Math.round(position.x / gridSize[0]) * gridSize[0],
    y: Math.round(position.y / gridSize[1]) * gridSize[1]
  };
}

// ===================
// 邊界和限制
// ===================

/**
 * 限制位置在邊界內
 */
export function clampPositionToBounds(
  position: XYPosition,
  bounds: Rect
): XYPosition {
  return {
    x: Math.max(bounds.x, Math.min(position.x, bounds.x + bounds.width)),
    y: Math.max(bounds.y, Math.min(position.y, bounds.y + bounds.height))
  };
}

/**
 * 限制位置在圓形區域內
 */
export function clampPositionToCircle(
  position: XYPosition,
  center: XYPosition,
  radius: number
): XYPosition {
  const dx = position.x - center.x;
  const dy = position.y - center.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  if (distance <= radius) {
    return position;
  }
  
  const scale = radius / distance;
  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale
  };
}

/**
 * 檢查位置是否在邊界內
 */
export function isPositionInBounds(
  position: XYPosition,
  bounds: Rect
): boolean {
  return (
    position.x >= bounds.x &&
    position.x <= bounds.x + bounds.width &&
    position.y >= bounds.y &&
    position.y <= bounds.y + bounds.height
  );
}

// ===================
// 變換矩陣
// ===================

/**
 * 創建變換矩陣
 */
export function createTransformMatrix(
  translate: XYPosition = { x: 0, y: 0 },
  scale: number = 1,
  rotate: number = 0
): DOMMatrix {
  const matrix = new DOMMatrix();
  return matrix
    .translate(translate.x, translate.y)
    .scale(scale, scale)
    .rotate(rotate);
}

/**
 * 應用變換矩陣到位置
 */
export function transformPosition(
  position: XYPosition,
  matrix: DOMMatrix
): XYPosition {
  const point = new DOMPoint(position.x, position.y);
  const transformed = point.matrixTransform(matrix);
  
  return {
    x: transformed.x,
    y: transformed.y
  };
}

/**
 * 應用逆變換矩陣到位置
 */
export function inverseTransformPosition(
  position: XYPosition,
  matrix: DOMMatrix
): XYPosition {
  const inverted = matrix.inverse();
  return transformPosition(position, inverted);
}

// ===================
// 角度和旋轉
// ===================

/**
 * 計算兩點間的角度（弧度）
 */
export function getAngleBetweenPoints(
  point1: XYPosition,
  point2: XYPosition
): number {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x);
}

/**
 * 計算兩點間的角度（度）
 */
export function getAngleBetweenPointsDegrees(
  point1: XYPosition,
  point2: XYPosition
): number {
  return (getAngleBetweenPoints(point1, point2) * 180) / Math.PI;
}

/**
 * 旋轉點圍繞中心點
 */
export function rotatePoint(
  point: XYPosition,
  center: XYPosition,
  angle: number
): XYPosition {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  const dx = point.x - center.x;
  const dy = point.y - center.y;
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  };
}

/**
 * 弧度轉度
 */
export function radiansToDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * 度轉弧度
 */
export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// ===================
// 距離計算
// ===================

/**
 * 計算兩點間的歐幾里得距離
 */
export function getEuclideanDistance(
  point1: XYPosition,
  point2: XYPosition
): number {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 計算兩點間的曼哈頓距離
 */
export function getManhattanDistance(
  point1: XYPosition,
  point2: XYPosition
): number {
  return Math.abs(point2.x - point1.x) + Math.abs(point2.y - point1.y);
}

/**
 * 計算點到矩形的最短距離
 */
export function getDistanceToRect(
  point: XYPosition,
  rect: Rect
): number {
  const dx = Math.max(rect.x - point.x, 0, point.x - (rect.x + rect.width));
  const dy = Math.max(rect.y - point.y, 0, point.y - (rect.y + rect.height));
  return Math.sqrt(dx * dx + dy * dy);
}

// ===================
// 投影和映射
// ===================

/**
 * 投影點到線段
 */
export function projectPointToLine(
  point: XYPosition,
  lineStart: XYPosition,
  lineEnd: XYPosition
): XYPosition {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  
  if (dx === 0 && dy === 0) {
    return lineStart;
  }
  
  const t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / (dx * dx + dy * dy);
  const clampedT = Math.max(0, Math.min(1, t));
  
  return {
    x: lineStart.x + clampedT * dx,
    y: lineStart.y + clampedT * dy
  };
}

/**
 * 映射座標範圍
 */
export function mapRange(
  value: number,
  fromMin: number,
  fromMax: number,
  toMin: number,
  toMax: number
): number {
  return toMin + ((value - fromMin) * (toMax - toMin)) / (fromMax - fromMin);
}

/**
 * 映射位置範圍
 */
export function mapPositionRange(
  position: XYPosition,
  fromRect: Rect,
  toRect: Rect
): XYPosition {
  return {
    x: mapRange(position.x, fromRect.x, fromRect.x + fromRect.width, toRect.x, toRect.x + toRect.width),
    y: mapRange(position.y, fromRect.y, fromRect.y + fromRect.height, toRect.y, toRect.y + toRect.height)
  };
}

// ===================
// 向量運算
// ===================

/**
 * 向量加法
 */
export function addVectors(v1: XYPosition, v2: XYPosition): XYPosition {
  return {
    x: v1.x + v2.x,
    y: v1.y + v2.y
  };
}

/**
 * 向量減法
 */
export function subtractVectors(v1: XYPosition, v2: XYPosition): XYPosition {
  return {
    x: v1.x - v2.x,
    y: v1.y - v2.y
  };
}

/**
 * 向量標量乘法
 */
export function multiplyVector(vector: XYPosition, scalar: number): XYPosition {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar
  };
}

/**
 * 向量標準化
 */
export function normalizeVector(vector: XYPosition): XYPosition {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  
  if (length === 0) {
    return { x: 0, y: 0 };
  }
  
  return {
    x: vector.x / length,
    y: vector.y / length
  };
}

/**
 * 向量點積
 */
export function dotProduct(v1: XYPosition, v2: XYPosition): number {
  return v1.x * v2.x + v1.y * v2.y;
}

/**
 * 向量叉積（2D中為標量）
 */
export function crossProduct(v1: XYPosition, v2: XYPosition): number {
  return v1.x * v2.y - v1.y * v2.x;
}