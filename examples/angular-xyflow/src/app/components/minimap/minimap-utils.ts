// 本地實現 @xyflow/system 中所需的工具函數
// 這些是 MiniMap 所需的核心功能

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Box {
  x: number;
  y: number;
  x2: number;
  y2: number;
}

export interface InternalNodeBase {
  internals: {
    userNode: any;
    positionAbsolute: { x: number; y: number };
  };
}

// 節點維度計算
export function getNodeDimensions(node: any): { width: number; height: number } {
  return {
    width: node.width || 150,
    height: node.height || 36
  };
}

// 檢查節點是否有維度 (修改為與 React Flow 一致)
export function nodeHasDimensions(node: any): boolean {
  // 如果節點有明確的寬高，檢查它們
  if (node && typeof node.width === 'number' && typeof node.height === 'number') {
    return node.width > 0 && node.height > 0;
  }
  
  // 如果沒有明確的寬高，使用預設值（React Flow 的行為）
  // 在 React Flow 中，節點即使沒有明確寬高也會顯示在 MiniMap 中
  return node && !node.hidden;
}

// Box 和 Rect 轉換
export function boxToRect(box: Box): Rect {
  return {
    x: box.x,
    y: box.y,
    width: box.x2 - box.x,
    height: box.y2 - box.y,
  };
}

export function rectToBox(rect: Rect): Box {
  return {
    x: rect.x,
    y: rect.y,
    x2: rect.x + rect.width,
    y2: rect.y + rect.height,
  };
}

// 計算兩個 Box 的合併邊界
export function getBoundsOfBoxes(box1: Box, box2: Box): Box {
  return {
    x: Math.min(box1.x, box2.x),
    y: Math.min(box1.y, box2.y),
    x2: Math.max(box1.x2, box2.x2),
    y2: Math.max(box1.y2, box2.y2),
  };
}

// 計算兩個矩形的合併邊界 - 與 React 版本相同
export function getBoundsOfRects(rect1: Rect, rect2: Rect): Rect {
  return boxToRect(getBoundsOfBoxes(rectToBox(rect1), rectToBox(rect2)));
}

// 將節點轉換為 Box
export function nodeToBox(node: InternalNodeBase): Box {
  const { x, y } = node.internals.positionAbsolute;
  const { width, height } = getNodeDimensions(node.internals.userNode);
  
  return {
    x,
    y,
    x2: x + width,
    y2: y + height,
  };
}

// 計算內部節點的邊界 - 與 React 版本相同
export function getInternalNodesBounds<NodeType extends InternalNodeBase>(
  nodeLookup: Map<string, NodeType>,
  params: { filter?: (node: NodeType) => boolean } = {}
): Rect {
  if (nodeLookup.size === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let box = { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity };

  nodeLookup.forEach((node) => {
    if (params.filter === undefined || params.filter(node)) {
      const nodeBox = nodeToBox(node);
      box = getBoundsOfBoxes(box, nodeBox);
    }
  });

  return boxToRect(box);
}

// 簡化版 XYMinimap 介面 - 基本實現
export interface XYMinimapInstance {
  update: (params: any) => void;
  destroy: () => void;
  pointer: (event: MouseEvent) => [number, number];
}

// 簡化版 XYMinimap 實現 - 基本功能
export function XYMinimap(params: {
  domNode: Element;
  panZoom: any;
  getTransform: () => [number, number, number];
  getViewScale: () => number;
}): XYMinimapInstance {
  
  // 基本的點擊位置計算
  function pointer(event: MouseEvent): [number, number] {
    const rect = params.domNode.getBoundingClientRect();
    return [
      event.clientX - rect.left,
      event.clientY - rect.top
    ];
  }

  return {
    update: (updateParams: any) => {
      // 基本更新邏輯 - 在實際應用中可以擴展
      // TODO: 實現完整的 pan/zoom 更新邏輯
    },
    destroy: () => {
      // 清理邏輯
      // TODO: 實現完整的事件清理
    },
    pointer
  };
}