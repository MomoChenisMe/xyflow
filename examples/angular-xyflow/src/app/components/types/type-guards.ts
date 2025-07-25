/**
 * Angular XYFlow 類型守衛函數
 * 
 * 定義用於運行時類型檢查的守衛函數
 * 包括節點、邊線、事件、配置等類型檢查
 */

import { AngularNode, NodeComponent } from './nodes';
import { AngularEdge, EdgeComponent } from './edges';
import { 
  Viewport, 
  XYPosition, 
  Dimensions, 
  Connection,
  NodeChange,
  EdgeChange,
  SelectionRect,
  CoordinateExtent
} from './system-types';
import { 
  DefaultNodeTypes, 
  DefaultEdgeTypes, 
  HandleType,
  ErrorCode
} from './constants';

// ===================
// 基礎類型守衛
// ===================

/**
 * 檢查是否為空值（null 或 undefined）
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * 檢查是否為非空值
 */
export function isNotNullish<T>(value: T | null | undefined): value is T {
  return !isNullish(value);
}

/**
 * 檢查是否為數字
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * 檢查是否為整數
 */
export function isInteger(value: unknown): value is number {
  return isNumber(value) && Number.isInteger(value);
}

/**
 * 檢查是否為正數
 */
export function isPositiveNumber(value: unknown): value is number {
  return isNumber(value) && value > 0;
}

/**
 * 檢查是否為非負數
 */
export function isNonNegativeNumber(value: unknown): value is number {
  return isNumber(value) && value >= 0;
}

/**
 * 檢查是否為字符串
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * 檢查是否為非空字符串
 */
export function isNonEmptyString(value: unknown): value is string {
  return isString(value) && value.length > 0;
}

/**
 * 檢查是否為布爾值
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * 檢查是否為函數
 */
export function isFunction(value: unknown): value is Function {
  return typeof value === 'function';
}

/**
 * 檢查是否為對象（非 null）
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * 檢查是否為數組
 */
export function isArray<T = unknown>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * 檢查是否為非空數組
 */
export function isNonEmptyArray<T = unknown>(value: unknown): value is T[] {
  return isArray<T>(value) && value.length > 0;
}

/**
 * 檢查是否為空對象
 */
export function isEmptyObject(value: unknown): value is {} {
  return isObject(value) && Object.keys(value).length === 0;
}

/**
 * 檢查是否為 Date 對象
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}

/**
 * 檢查是否為 Promise
 */
export function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return value instanceof Promise || (
    isObject(value) && 
    isFunction((value as any).then) && 
    isFunction((value as any).catch)
  );
}

// ===================
// 位置和尺寸守衛
// ===================

/**
 * 檢查是否為有效的 XY 位置
 */
export function isXYPosition(value: unknown): value is XYPosition {
  return (
    isObject(value) &&
    'x' in value &&
    'y' in value &&
    isNumber(value['x']) &&
    isNumber(value['y'])
  );
}

/**
 * 檢查是否為有效的尺寸對象
 */
export function isDimensions(value: unknown): value is Dimensions {
  return (
    isObject(value) &&
    'width' in value &&
    'height' in value &&
    isNonNegativeNumber(value['width']) &&
    isNonNegativeNumber(value['height'])
  );
}

/**
 * 檢查是否為有效的矩形（位置 + 尺寸）
 */
export function isRect(value: unknown): value is XYPosition & Dimensions {
  return isXYPosition(value) && isDimensions(value);
}

/**
 * 檢查是否為有效的選擇矩形
 */
export function isSelectionRect(value: unknown): value is SelectionRect {
  return (
    isRect(value) &&
    isNonNegativeNumber(value.width) &&
    isNonNegativeNumber(value.height)
  );
}

/**
 * 檢查是否為有效的座標範圍
 */
export function isCoordinateExtent(value: unknown): value is CoordinateExtent {
  return (
    isArray(value) &&
    value.length === 2 &&
    isArray(value[0]) &&
    isArray(value[1]) &&
    value[0].length === 2 &&
    value[1].length === 2 &&
    isNumber(value[0][0]) &&
    isNumber(value[0][1]) &&
    isNumber(value[1][0]) &&
    isNumber(value[1][1])
  );
}

// ===================
// 視窗守衛
// ===================

/**
 * 檢查是否為有效的視窗對象
 */
export function isViewport(value: unknown): value is Viewport {
  return (
    isObject(value) &&
    'x' in value &&
    'y' in value &&
    'zoom' in value &&
    isNumber(value['x']) &&
    isNumber(value['y']) &&
    isPositiveNumber(value['zoom'])
  );
}

/**
 * 檢查是否為有效的縮放級別
 */
export function isValidZoom(value: unknown, minZoom = 0.1, maxZoom = 10): value is number {
  return isNumber(value) && value >= minZoom && value <= maxZoom;
}

// ===================
// 節點守衛
// ===================

/**
 * 檢查是否為節點對象
 */
export function isNode(value: unknown): value is AngularNode {
  return (
    isObject(value) &&
    'id' in value &&
    'position' in value &&
    'data' in value &&
    isNonEmptyString(value['id']) &&
    isXYPosition(value['position']) &&
    isObject(value['data']) &&
    // 不能有邊線特有屬性
    !('source' in value) &&
    !('target' in value)
  );
}

/**
 * 檢查是否為內建節點類型
 */
export function isBuiltInNodeType(value: unknown): value is keyof typeof DefaultNodeTypes {
  return isString(value) && Object.values(DefaultNodeTypes).includes(value as any);
}

/**
 * 檢查是否為節點組件
 */
export function isNodeComponent(value: unknown): value is NodeComponent {
  return (
    isObject(value) &&
    'node' in value &&
    'selected' in value
  );
}

/**
 * 檢查節點是否有效（有必需屬性）
 */
export function isValidNode(value: unknown): value is AngularNode {
  return (
    isNode(value) &&
    // 檢查可選屬性
    (value.type === undefined || isString(value.type)) &&
    (value.width === undefined || isNonNegativeNumber(value.width)) &&
    (value.height === undefined || isNonNegativeNumber(value.height)) &&
    (value.zIndex === undefined || isInteger(value.zIndex)) &&
    (value.draggable === undefined || isBoolean(value.draggable)) &&
    (value.selectable === undefined || isBoolean(value.selectable)) &&
    (value.connectable === undefined || isBoolean(value.connectable)) &&
    (value.deletable === undefined || isBoolean(value.deletable)) &&
    (value.focusable === undefined || isBoolean(value.focusable))
  );
}

/**
 * 檢查節點是否選中
 */
export function isNodeSelected(node: AngularNode): boolean {
  return node.selected === true;
}

/**
 * 檢查節點是否可拖拽
 */
export function isNodeDraggable(node: AngularNode): boolean {
  return node.draggable !== false;
}

/**
 * 檢查節點是否可連接
 */
export function isNodeConnectable(node: AngularNode): boolean {
  return node.connectable !== false;
}

/**
 * 檢查節點是否為群組節點
 */
export function isGroupNode(node: AngularNode): boolean {
  return node.type === DefaultNodeTypes.Group;
}

/**
 * 檢查節點是否為子節點
 */
export function isChildNode(node: AngularNode): boolean {
  return isNonEmptyString(node.parentId);
}

// ===================
// 邊線守衛
// ===================

/**
 * 檢查是否為邊線對象
 */
export function isEdge(value: unknown): value is AngularEdge {
  return (
    isObject(value) &&
    'id' in value &&
    'source' in value &&
    'target' in value &&
    isNonEmptyString(value['id']) &&
    isNonEmptyString(value['source']) &&
    isNonEmptyString(value['target'])
  );
}

/**
 * 檢查是否為內建邊線類型
 */
export function isBuiltInEdgeType(value: unknown): value is keyof typeof DefaultEdgeTypes {
  return isString(value) && Object.values(DefaultEdgeTypes).includes(value as any);
}

/**
 * 檢查是否為邊線組件
 */
export function isEdgeComponent(value: unknown): value is EdgeComponent {
  return (
    isObject(value) &&
    'edge' in value &&
    'selected' in value
  );
}

/**
 * 檢查邊線是否有效（有必需屬性）
 */
export function isValidEdge(value: unknown): value is AngularEdge {
  return (
    isEdge(value) &&
    // 檢查可選屬性
    (value.type === undefined || isString(value.type)) &&
    (value.sourceHandle === undefined || value.sourceHandle === null || isString(value.sourceHandle)) &&
    (value.targetHandle === undefined || value.targetHandle === null || isString(value.targetHandle)) &&
    (value.animated === undefined || isBoolean(value.animated)) &&
    (value.hidden === undefined || isBoolean(value.hidden)) &&
    (value.selected === undefined || isBoolean(value.selected)) &&
    (value.selectable === undefined || isBoolean(value.selectable)) &&
    (value.deletable === undefined || isBoolean(value.deletable)) &&
    (value.focusable === undefined || isBoolean(value.focusable)) &&
    (value.zIndex === undefined || isInteger(value.zIndex))
  );
}

/**
 * 檢查邊線是否選中
 */
export function isEdgeSelected(edge: AngularEdge): boolean {
  return edge.selected === true;
}

/**
 * 檢查邊線是否动画
 */
export function isEdgeAnimated(edge: AngularEdge): boolean {
  return edge.animated === true;
}

/**
 * 檢查邊線是否隱藏
 */
export function isEdgeHidden(edge: AngularEdge): boolean {
  return edge.hidden === true;
}

/**
 * 檢查邊線是否可重新連接
 */
export function isEdgeReconnectable(edge: AngularEdge): boolean {
  return edge.reconnectable === true || 
         edge.reconnectable === 'source' || 
         edge.reconnectable === 'target';
}

// ===================
// 連接守衛
// ===================

/**
 * 檢查是否為有效的連接對象
 */
export function isConnection(value: unknown): value is Connection {
  return (
    isObject(value) &&
    'source' in value &&
    'target' in value &&
    isNonEmptyString(value['source']) &&
    isNonEmptyString(value['target']) &&
    (value['sourceHandle'] === undefined || value['sourceHandle'] === null || isString(value['sourceHandle'])) &&
    (value['targetHandle'] === undefined || value['targetHandle'] === null || isString(value['targetHandle']))
  );
}

/**
 * 檢查是否為有效的手柄類型
 */
export function isHandleType(value: unknown): value is HandleType {
  return value === HandleType.Source || value === HandleType.Target;
}

/**
 * 檢查連接是否有效（進一步檢查）
 */
export function isValidConnection(connection: Connection, nodes: AngularNode[]): boolean {
  if (!isConnection(connection)) {
    return false;
  }
  
  // 檢查源節點和目標節點是否存在
  const sourceNode = nodes.find(node => node.id === connection.source);
  const targetNode = nodes.find(node => node.id === connection.target);
  
  if (!sourceNode || !targetNode) {
    return false;
  }
  
  // 不能連接到自己
  if (connection.source === connection.target) {
    return false;
  }
  
  // 檢查節點是否可連接
  if (!isNodeConnectable(sourceNode) || !isNodeConnectable(targetNode)) {
    return false;
  }
  
  return true;
}

// ===================
// 變化守衛
// ===================

/**
 * 檢查是否為節點變化
 */
export function isNodeChange(value: unknown): value is NodeChange<AngularNode> {
  return (
    isObject(value) &&
    'type' in value &&
    'id' in value &&
    isString(value['type']) &&
    isNonEmptyString(value['id'])
  );
}

/**
 * 檢查是否為邊線變化
 */
export function isEdgeChange(value: unknown): value is EdgeChange<AngularEdge> {
  return (
    isObject(value) &&
    'type' in value &&
    'id' in value &&
    isString(value['type']) &&
    isNonEmptyString(value['id'])
  );
}

/**
 * 檢查是否為位置變化
 */
export function isPositionChange(change: NodeChange<AngularNode>): change is NodeChange<AngularNode> & {
  type: 'position';
  position?: XYPosition;
  positionAbsolute?: XYPosition;
  dragging?: boolean;
} {
  return change.type === 'position';
}

/**
 * 檢查是否為尺寸變化
 */
export function isDimensionsChange(change: NodeChange<AngularNode>): change is NodeChange<AngularNode> & {
  type: 'dimensions';
  dimensions?: Dimensions;
  handleBounds?: any;
  updateStyle?: boolean;
} {
  return change.type === 'dimensions';
}

/**
 * 檢查是否為選擇變化
 */
export function isSelectionChange(change: NodeChange<AngularNode> | EdgeChange<AngularEdge>): change is (
  NodeChange<AngularNode> | EdgeChange<AngularEdge>
) & {
  type: 'select';
  selected: boolean;
} {
  return change.type === 'select';
}

// ===================
// 事件守衛
// ===================

/**
 * 檢查是否為滑鼠事件
 */
export function isMouseEvent(event: Event): event is MouseEvent {
  return event instanceof MouseEvent;
}

/**
 * 檢查是否為鍵盤事件
 */
export function isKeyboardEvent(event: Event): event is KeyboardEvent {
  return event instanceof KeyboardEvent;
}

/**
 * 檢查是否為觸控事件
 */
export function isTouchEvent(event: Event): event is TouchEvent {
  return event instanceof TouchEvent;
}

/**
 * 檢查是否為滾輪事件
 */
export function isWheelEvent(event: Event): event is WheelEvent {
  return event instanceof WheelEvent;
}

/**
 * 檢查是否為拖拽事件
 */
export function isDragEvent(event: Event): event is DragEvent {
  return event instanceof DragEvent;
}

/**
 * 檢查是否為聚焦事件
 */
export function isFocusEvent(event: Event): event is FocusEvent {
  return event instanceof FocusEvent;
}

// ===================
// 數據結構守衛
// ===================

/**
 * 檢查是否為 Map 對象
 */
export function isMap<K, V>(value: unknown): value is Map<K, V> {
  return value instanceof Map;
}

/**
 * 檢查是否為 Set 對象
 */
export function isSet<T>(value: unknown): value is Set<T> {
  return value instanceof Set;
}

/**
 * 檢查是否為 WeakMap 對象
 */
export function isWeakMap<K extends object, V>(value: unknown): value is WeakMap<K, V> {
  return value instanceof WeakMap;
}

/**
 * 檢查是否為 WeakSet 對象
 */
export function isWeakSet<T extends object>(value: unknown): value is WeakSet<T> {
  return value instanceof WeakSet;
}

// ===================
// 元素集合守衛
// ===================

/**
 * 檢查陣列是否全部為節點
 */
export function areAllNodes(elements: unknown[]): elements is AngularNode[] {
  return elements.every(element => isNode(element));
}

/**
 * 檢查陣列是否全部為邊線
 */
export function areAllEdges(elements: unknown[]): elements is AngularEdge[] {
  return elements.every(element => isEdge(element));
}

/**
 * 檢查陣列是否全部為有效節點
 */
export function areAllValidNodes(elements: unknown[]): elements is AngularNode[] {
  return elements.every(element => isValidNode(element));
}

/**
 * 檢查陣列是否全部為有效邊線
 */
export function areAllValidEdges(elements: unknown[]): elements is AngularEdge[] {
  return elements.every(element => isValidEdge(element));
}

/**
 * 檢查節點 ID 是否唯一
 */
export function hasUniqueNodeIds(nodes: AngularNode[]): boolean {
  const ids = new Set(nodes.map(node => node.id));
  return ids.size === nodes.length;
}

/**
 * 檢查邊線 ID 是否唯一
 */
export function hasUniqueEdgeIds(edges: AngularEdge[]): boolean {
  const ids = new Set(edges.map(edge => edge.id));
  return ids.size === edges.length;
}

// ===================
// 配置守衛
// ===================

/**
 * 檢查是否為有效的效能配置
 */
export function isValidPerformanceConfig(config: unknown): config is {
  elevateNodesOnSelect?: boolean;
  elevateEdgesOnSelect?: boolean;
  dragThreshold?: number;
  clickDistance?: number;
} {
  return (
    isObject(config) &&
    (config['elevateNodesOnSelect'] === undefined || isBoolean(config['elevateNodesOnSelect'])) &&
    (config['elevateEdgesOnSelect'] === undefined || isBoolean(config['elevateEdgesOnSelect'])) &&
    (config['dragThreshold'] === undefined || isNonNegativeNumber(config['dragThreshold'])) &&
    (config['clickDistance'] === undefined || isNonNegativeNumber(config['clickDistance']))
  );
}

/**
 * 檢查是否為有效的自動平移配置
 */
export function isValidAutoPanConfig(config: unknown): config is {
  onConnect?: boolean;
  onNodeFocus?: boolean;
  speed?: number;
} {
  return (
    isObject(config) &&
    (config['onConnect'] === undefined || isBoolean(config['onConnect'])) &&
    (config['onNodeFocus'] === undefined || isBoolean(config['onNodeFocus'])) &&
    (config['speed'] === undefined || isPositiveNumber(config['speed']))
  );
}

// ===================
// 錯誤守衛
// ===================

/**
 * 檢查是否為知的錯誤代碼
 */
export function isKnownErrorCode(code: string): code is string {
  return Object.values(ErrorCode).includes(code as any);
}

/**
 * 檢查是否為 Angular Flow 錯誤
 */
export function isAngularFlowError(error: Error): error is Error & {
  code?: string;
  context?: Record<string, unknown>;
} {
  return (
    error instanceof Error &&
    ('code' in error || 'context' in error)
  );
}

// ===================
// 類型轉換守衛
// ===================

/**
 * 安全轉換為數字
 */
export function toNumber(value: unknown): number | null {
  if (isNumber(value)) {
    return value;
  }
  
  if (isString(value)) {
    const parsed = parseFloat(value);
    return isNumber(parsed) ? parsed : null;
  }
  
  return null;
}

/**
 * 安全轉換為字符串
 */
export function toString(value: unknown): string {
  if (isString(value)) {
    return value;
  }
  
  if (isNullish(value)) {
    return '';
  }
  
  return String(value);
}

/**
 * 安全轉換為布爾值
 */
export function toBoolean(value: unknown): boolean {
  if (isBoolean(value)) {
    return value;
  }
  
  if (isString(value)) {
    return value.toLowerCase() === 'true';
  }
  
  if (isNumber(value)) {
    return value !== 0;
  }
  
  return Boolean(value);
}

/**
 * 安全轉換為陣列
 */
export function toArray<T>(value: unknown): T[] {
  if (isArray<T>(value)) {
    return value;
  }
  
  if (isNullish(value)) {
    return [];
  }
  
  return [value as T];
}

// ===================
// 位置驗證守衛
// ===================

/**
 * 檢查位置是否在範圍內
 */
export function isPositionInBounds(
  position: XYPosition, 
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    position.x >= bounds.x &&
    position.y >= bounds.y &&
    position.x <= bounds.x + bounds.width &&
    position.y <= bounds.y + bounds.height
  );
}

/**
 * 檢查矩形是否重疊
 */
export function areRectsOverlapping(
  rect1: { x: number; y: number; width: number; height: number },
  rect2: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

/**
 * 檢查節點是否在選擇矩形內
 */
export function isNodeInSelectionRect(
  node: AngularNode, 
  selectionRect: SelectionRect
): boolean {
  if (!node.width || !node.height) {
    return false;
  }
  
  const nodeRect = {
    x: node.position.x,
    y: node.position.y,
    width: node.width,
    height: node.height
  };
  
  return areRectsOverlapping(nodeRect, selectionRect);
}

// ===================
// 組合守衛函數
// ===================

/**
 * 檢查值是否滿足多個條件之一
 */
export function isOneOf<T>(value: unknown, validators: Array<(v: unknown) => v is T>): value is T {
  return validators.some(validator => validator(value));
}

/**
 * 檢查值是否滿足所有條件
 */
export function isAllOf<T>(value: unknown, validators: Array<(v: unknown) => v is T>): value is T {
  return validators.every(validator => validator(value));
}

/**
 * 創建可選屬性守衛
 */
export function isOptional<T>(
  validator: (value: unknown) => value is T
): (value: unknown) => value is T | undefined {
  return (value: unknown): value is T | undefined => {
    return value === undefined || validator(value);
  };
}

/**
 * 創建陣列守衛
 */
export function isArrayOf<T>(
  validator: (value: unknown) => value is T
): (value: unknown) => value is T[] {
  return (value: unknown): value is T[] => {
    return isArray(value) && value.every(validator);
  };
}

/**
 * 創建對象守衛
 */
export function isObjectWith<T>(
  schema: { [K in keyof T]: (value: unknown) => value is T[K] }
): (value: unknown) => value is T {
  return (value: unknown): value is T => {
    if (!isObject(value)) {
      return false;
    }
    
    return Object.entries(schema).every(([key, validator]) => {
      return (validator as any)((value as any)[key]);
    });
  };
}