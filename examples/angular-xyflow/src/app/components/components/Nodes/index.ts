// 節點組件導出
export * from './DefaultNode/default-node.component';
export * from './InputNode/input-node.component';
export * from './OutputNode/output-node.component';
export * from './GroupNode/group-node.component';
export * from './NodeWrapper/node-wrapper.component';

// 類型定義導出
export * from './nodes.types';

// 內建節點類型映射
export const builtinNodeTypes = {
  default: 'DefaultNodeComponent',
  input: 'InputNodeComponent',
  output: 'OutputNodeComponent',
  group: 'GroupNodeComponent',
} as const;

// 節點工具函數
export const nodeUtils = {
  // 獲取節點內聯樣式尺寸
  getNodeInlineStyleDimensions: (node: any) => {
    const dimensions: any = {};
    if (node.width) dimensions.width = `${node.width}px`;
    if (node.height) dimensions.height = `${node.height}px`;
    return dimensions;
  },

  // 箭頭鍵對應的移動量
  arrowKeyDiffs: {
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
  },

  // 處理節點點擊邏輯
  handleNodeClick: (params: {
    id: string;
    store: any;
    unselect?: boolean;
    nodeRef?: any;
  }) => {
    const { id, store, unselect } = params;
    console.log('Handle node click:', { id, unselect });
    // 在實際實現中，這裡會處理節點選擇邏輯
  },
};