// 邊緣組件導出
export * from './BaseEdge/base-edge.component';
export * from './EdgeText/edge-text.component';
export * from './EdgeAnchor/edge-anchor.component';
export * from './BezierEdge/bezier-edge.component';
export * from './SimpleBezierEdge/simple-bezier-edge.component';
export * from './StraightEdge/straight-edge.component';
export * from './SmoothStepEdge/smooth-step-edge.component';
export * from './StepEdge/step-edge.component';

// 類型定義導出
export * from './edges.types';

// 工具函數導出
export { getSimpleBezierPath } from './SimpleBezierEdge/simple-bezier-edge.component';

// 內建邊緣類型映射 - 模擬 React Flow 的 builtinEdgeTypes
export const builtinEdgeTypes = {
  default: 'BezierEdgeComponent',
  straight: 'StraightEdgeComponent', 
  step: 'StepEdgeComponent',
  smoothstep: 'SmoothStepEdgeComponent',
  simplebezier: 'SimpleBezierEdgeComponent',
} as const;

// 空位置常量
export const nullPosition = {
  sourceX: null,
  sourceY: null,
  targetX: null,
  targetY: null,
  sourcePosition: null,
  targetPosition: null,
} as const;