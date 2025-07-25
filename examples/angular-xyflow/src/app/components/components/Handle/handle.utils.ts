/**
 * Handle 工具函數
 * 提供 Handle 組件所需的各種工具函數
 */

import { HandleType, ConnectionMode, Position } from './handle.types';
import { XYPosition } from '../../store/store-types';

/**
 * 相反位置映射
 */
export const oppositePosition = {
  [Position.Top]: Position.Bottom,
  [Position.Bottom]: Position.Top,
  [Position.Left]: Position.Right,
  [Position.Right]: Position.Left,
} as const;

/**
 * 獲取最近的 handle
 */
export function getClosestHandle(
  position: XYPosition,
  connectionRadius: number,
  nodeLookup: Map<string, any>,
  fromHandle: any
): any {
  let closestHandle = null;
  let minDistance = connectionRadius;

  for (const [nodeId, node] of nodeLookup) {
    // 跳過源節點
    if (nodeId === fromHandle.nodeId) {
      continue;
    }

    // 獲取節點的 handles
    const handles = getNodeHandles(node);
    
    for (const handle of handles) {
      // 在嚴格模式下，source 只能連接到 target
      if (fromHandle.type === handle.type) {
        continue;
      }

      const handlePosition = getHandlePosition(node, handle);
      const distance = Math.sqrt(
        Math.pow(position.x - handlePosition.x, 2) + 
        Math.pow(position.y - handlePosition.y, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestHandle = {
          ...handle,
          nodeId,
          x: handlePosition.x,
          y: handlePosition.y
        };
      }
    }
  }

  return closestHandle;
}

/**
 * 獲取節點的所有 handles
 */
function getNodeHandles(node: any): any[] {
  // 這是一個簡化實現，實際應該根據節點類型來獲取 handles
  const handles = [];
  
  // 假設每個節點都有默認的 source 和 target handles
  handles.push({
    id: null,
    type: 'source',
    position: Position.Bottom
  });
  
  handles.push({
    id: null,
    type: 'target',
    position: Position.Top
  });
  
  return handles;
}

/**
 * 獲取 handle 在頁面上的絕對位置
 */
function getHandlePosition(node: any, handle: any): XYPosition {
  const nodeWidth = node.measured?.width || node.width || 150;
  const nodeHeight = node.measured?.height || node.height || 40;
  const nodePosition = node.internals?.positionAbsolute || node.position;

  let x = nodePosition.x;
  let y = nodePosition.y;

  // 根據 handle 位置計算座標
  switch (handle.position) {
    case Position.Top:
      x += nodeWidth / 2;
      break;
    case Position.Bottom:
      x += nodeWidth / 2;
      y += nodeHeight;
      break;
    case Position.Left:
      y += nodeHeight / 2;
      break;
    case Position.Right:
      x += nodeWidth;
      y += nodeHeight / 2;
      break;
  }

  return { x, y };
}

/**
 * 驗證連接是否有效
 */
export function isConnectionValid(hasClosestHandle: boolean, isValid: boolean): boolean {
  return hasClosestHandle && isValid;
}

/**
 * 獲取 handle 類型
 */
export function getHandleType(edgeUpdaterType: string | undefined, element: Element | null): HandleType | null {
  if (edgeUpdaterType) {
    return edgeUpdaterType as HandleType;
  }

  if (element?.classList.contains('source')) {
    return 'source';
  }

  if (element?.classList.contains('target')) {
    return 'target';
  }

  return null;
}

/**
 * 獲取 handle 資訊
 */
export function getHandle(
  nodeId: string,
  handleType: HandleType,
  handleId: string | null,
  nodeLookup: Map<string, any>,
  connectionMode: ConnectionMode,
  isTarget = false
): any {
  const node = nodeLookup.get(nodeId);
  if (!node) {
    return null;
  }

  // 返回 handle 資訊
  return {
    nodeId,
    id: handleId,
    type: handleType,
    position: handleType === 'source' ? Position.Bottom : Position.Top
  };
}