/**
 * Angular XYFlow 圖操作工具
 * 
 * 提供圖的遍歷、查找、邊界計算等核心功能
 * 包括節點和邊線的關係處理、可見性檢測等
 */

import { AngularNode } from '../types/nodes';
import { AngularEdge } from '../types/edges';
import { XYPosition, Rect, Box, Dimensions, Viewport, Transform } from '../types/system-types';
import { 
  getBoundsOfBoxes, 
  nodeToBox, 
  boxToRect, 
  getOverlappingArea,
  pointToRendererPoint,
  getViewportForBounds,
  isNode,
  isEdge,
  nodeToRect,
  getNodeDimensions
} from './general';

// ===================
// 節點和邊線關係查找
// ===================

/**
 * 獲取出去的節點（作為邊線的source）
 */
export function getOutgoers<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  node: NodeType | { id: string },
  nodes: NodeType[],
  edges: EdgeType[]
): NodeType[] {
  if (!node.id) {
    return [];
  }

  const outgoerIds = new Set<string>();
  edges.forEach((edge) => {
    if (edge.source === node.id) {
      outgoerIds.add(edge.target);
    }
  });

  return nodes.filter((n) => outgoerIds.has(n.id));
}

/**
 * 獲取進來的節點（作為邊線的target）
 */
export function getIncomers<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  node: NodeType | { id: string },
  nodes: NodeType[],
  edges: EdgeType[]
): NodeType[] {
  if (!node.id) {
    return [];
  }

  const incomersIds = new Set<string>();
  edges.forEach((edge) => {
    if (edge.target === node.id) {
      incomersIds.add(edge.source);
    }
  });

  return nodes.filter((n) => incomersIds.has(n.id));
}

/**
 * 獲取連接的邊線
 */
export function getConnectedEdges<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  nodes: NodeType[],
  edges: EdgeType[]
): EdgeType[] {
  const nodeIds = new Set<string>();
  nodes.forEach((node) => {
    nodeIds.add(node.id);
  });

  return edges.filter((edge) => nodeIds.has(edge.source) || nodeIds.has(edge.target));
}

/**
 * 獲取節點的所有連接邊線
 */
export function getNodeConnectedEdges<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  node: NodeType | { id: string },
  edges: EdgeType[]
): EdgeType[] {
  if (!node.id) {
    return [];
  }

  return edges.filter((edge) => edge.source === node.id || edge.target === node.id);
}

/**
 * 檢查兩個節點是否直接連接
 */
export function areNodesConnected<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  nodeA: NodeType | { id: string },
  nodeB: NodeType | { id: string },
  edges: EdgeType[]
): boolean {
  if (!nodeA.id || !nodeB.id) {
    return false;
  }

  return edges.some(
    (edge) => 
      (edge.source === nodeA.id && edge.target === nodeB.id) ||
      (edge.source === nodeB.id && edge.target === nodeA.id)
  );
}

// ===================
// 邊界和尺寸計算
// ===================

/**
 * 獲取多個節點的邊界
 */
export function getNodesBounds<NodeType extends AngularNode>(
  nodes: NodeType[],
  nodeOrigin: [number, number] = [0, 0]
): Rect {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const boxes = nodes.map(node => {
    const box = nodeToBox(node);
    const dimensions = getNodeDimensions(node);
    const origin = node.origin ?? nodeOrigin;
    
    // 調整位置基於原點
    const offsetX = dimensions.width * origin[0];
    const offsetY = dimensions.height * origin[1];
    
    return {
      x: box.x - offsetX,
      y: box.y - offsetY,
      x2: box.x2 - offsetX,
      y2: box.y2 - offsetY
    };
  });

  const boundsBox = getBoundsOfBoxes(boxes);
  return boxToRect(boundsBox);
}

/**
 * 獲取流程圖的總邊界
 */
export function getFlowBounds<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  nodes: NodeType[],
  edges: EdgeType[]
): Rect {
  // 目前只計算節點邊界，未來可以擴展包含邊線路徑
  return getNodesBounds(nodes);
}

/**
 * 檢查節點是否在視窗內可見
 */
export function isNodeVisible<NodeType extends AngularNode>(
  node: NodeType,
  viewport: Viewport,
  flowBounds: Rect
): boolean {
  const nodeRect = nodeToRect(node);
  const viewportRect: Rect = {
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    width: flowBounds.width / viewport.zoom,
    height: flowBounds.height / viewport.zoom
  };

  return getOverlappingArea(nodeRect, viewportRect) > 0;
}

/**
 * 獲取視窗內的可見節點
 */
export function getVisibleNodes<NodeType extends AngularNode>(
  nodes: NodeType[],
  viewport: Viewport,
  flowBounds: Rect,
  partially: boolean = false
): NodeType[] {
  const viewportRect: Rect = {
    x: -viewport.x / viewport.zoom,
    y: -viewport.y / viewport.zoom,
    width: flowBounds.width / viewport.zoom,
    height: flowBounds.height / viewport.zoom
  };

  return nodes.filter(node => {
    if (node.hidden) {
      return false;
    }

    const nodeRect = nodeToRect(node);
    const overlappingArea = getOverlappingArea(nodeRect, viewportRect);
    const nodeArea = nodeRect.width * nodeRect.height;

    if (partially) {
      return overlappingArea > 0;
    }

    return overlappingArea >= nodeArea;
  });
}

/**
 * 檢查邊線是否可見
 */
export function isEdgeVisible<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  edge: EdgeType,
  nodes: NodeType[],
  viewport: Viewport,
  flowBounds: Rect
): boolean {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);

  if (!sourceNode || !targetNode) {
    return false;
  }

  // 如果source或target節點可見，則邊線可能可見
  return (
    isNodeVisible(sourceNode, viewport, flowBounds) ||
    isNodeVisible(targetNode, viewport, flowBounds)
  );
}

// ===================
// 圖遍歷和搜索
// ===================

/**
 * 深度優先搜索遍歷節點
 */
export function dfsTraverseNodes<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  startNode: NodeType,
  nodes: NodeType[],
  edges: EdgeType[],
  visited: Set<string> = new Set(),
  visitor?: (node: NodeType, depth: number) => void,
  depth: number = 0
): void {
  if (visited.has(startNode.id)) {
    return;
  }

  visited.add(startNode.id);
  visitor?.(startNode, depth);

  const outgoers = getOutgoers(startNode, nodes, edges);
  for (const outgoer of outgoers) {
    dfsTraverseNodes(outgoer, nodes, edges, visited, visitor, depth + 1);
  }
}

/**
 * 廣度優先搜索遍歷節點
 */
export function bfsTraverseNodes<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  startNode: NodeType,
  nodes: NodeType[],
  edges: EdgeType[],
  visitor?: (node: NodeType, depth: number) => void
): void {
  const visited = new Set<string>();
  const queue: Array<{ node: NodeType; depth: number }> = [{ node: startNode, depth: 0 }];

  while (queue.length > 0) {
    const { node, depth } = queue.shift()!;

    if (visited.has(node.id)) {
      continue;
    }

    visited.add(node.id);
    visitor?.(node, depth);

    const outgoers = getOutgoers(node, nodes, edges);
    for (const outgoer of outgoers) {
      if (!visited.has(outgoer.id)) {
        queue.push({ node: outgoer, depth: depth + 1 });
      }
    }
  }
}

/**
 * 查找兩個節點之間的路徑
 */
export function findPath<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  sourceNode: NodeType,
  targetNode: NodeType,
  nodes: NodeType[],
  edges: EdgeType[]
): NodeType[] | null {
  if (sourceNode.id === targetNode.id) {
    return [sourceNode];
  }

  const visited = new Set<string>();
  const queue: Array<{ node: NodeType; path: NodeType[] }> = [
    { node: sourceNode, path: [sourceNode] }
  ];

  while (queue.length > 0) {
    const { node, path } = queue.shift()!;

    if (visited.has(node.id)) {
      continue;
    }

    visited.add(node.id);

    if (node.id === targetNode.id) {
      return path;
    }

    const outgoers = getOutgoers(node, nodes, edges);
    for (const outgoer of outgoers) {
      if (!visited.has(outgoer.id)) {
        queue.push({ node: outgoer, path: [...path, outgoer] });
      }
    }
  }

  return null;
}

/**
 * 檢查圖中是否存在環
 */
export function hasCycle<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  nodes: NodeType[],
  edges: EdgeType[]
): boolean {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfsHasCycle(nodeId: string): boolean {
    if (recursionStack.has(nodeId)) {
      return true;
    }

    if (visited.has(nodeId)) {
      return false;
    }

    visited.add(nodeId);
    recursionStack.add(nodeId);

    const outgoingEdges = edges.filter(edge => edge.source === nodeId);
    for (const edge of outgoingEdges) {
      if (dfsHasCycle(edge.target)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (dfsHasCycle(node.id)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * 拓撲排序
 */
export function topologicalSort<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  nodes: NodeType[],
  edges: EdgeType[]
): NodeType[] | null {
  if (hasCycle(nodes, edges)) {
    return null; // 有環無法進行拓撲排序
  }

  const inDegree = new Map<string, number>();
  const adjList = new Map<string, string[]>();

  // 初始化
  nodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  });

  // 構建圖和計算入度
  edges.forEach(edge => {
    adjList.get(edge.source)?.push(edge.target);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // 找到所有入度為0的節點
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  const result: NodeType[] = [];
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodeMap.get(nodeId);
    if (node) {
      result.push(node);
    }

    const neighbors = adjList.get(nodeId) || [];
    neighbors.forEach(neighborId => {
      const currentDegree = inDegree.get(neighborId) || 0;
      inDegree.set(neighborId, currentDegree - 1);
      
      if (inDegree.get(neighborId) === 0) {
        queue.push(neighborId);
      }
    });
  }

  return result.length === nodes.length ? result : null;
}

// ===================
// 圖分析工具
// ===================

/**
 * 獲取圖的連通分量
 */
export function getConnectedComponents<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  nodes: NodeType[],
  edges: EdgeType[]
): NodeType[][] {
  const visited = new Set<string>();
  const components: NodeType[][] = [];
  const nodeMap = new Map(nodes.map(node => [node.id, node]));

  function dfsComponent(nodeId: string, component: NodeType[]): void {
    if (visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);
    const node = nodeMap.get(nodeId);
    if (node) {
      component.push(node);
    }

    // 查找所有相連的節點
    edges.forEach(edge => {
      if (edge.source === nodeId && !visited.has(edge.target)) {
        dfsComponent(edge.target, component);
      }
      if (edge.target === nodeId && !visited.has(edge.source)) {
        dfsComponent(edge.source, component);
      }
    });
  }

  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      const component: NodeType[] = [];
      dfsComponent(node.id, component);
      if (component.length > 0) {
        components.push(component);
      }
    }
  });

  return components;
}

/**
 * 檢查圖是否連通
 */
export function isGraphConnected<NodeType extends AngularNode, EdgeType extends AngularEdge>(
  nodes: NodeType[],
  edges: EdgeType[]
): boolean {
  if (nodes.length <= 1) {
    return true;
  }

  const components = getConnectedComponents(nodes, edges);
  return components.length === 1;
}

/**
 * 獲取節點的度數（連接的邊線數量）
 */
export function getNodeDegree<EdgeType extends AngularEdge>(
  nodeId: string,
  edges: EdgeType[]
): { inDegree: number; outDegree: number; totalDegree: number } {
  let inDegree = 0;
  let outDegree = 0;

  edges.forEach(edge => {
    if (edge.target === nodeId) {
      inDegree++;
    }
    if (edge.source === nodeId) {
      outDegree++;
    }
  });

  return {
    inDegree,
    outDegree,
    totalDegree: inDegree + outDegree
  };
}