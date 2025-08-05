// Angular XYFlow Edge Components
// 仿照 React Flow 的邊組件導出結構

// Base components
export { BaseEdgeComponent, type BaseEdgeProps } from './base-edge/base-edge.component';
export { EdgeTextComponent, type EdgeTextProps } from './edge-text/edge-text.component';

// Edge type components
export { BezierEdgeComponent, type BezierEdgeProps } from './bezier-edge/bezier-edge.component';
export { StraightEdgeComponent, type StraightEdgeProps } from './straight-edge/straight-edge.component';
export { StepEdgeComponent, type StepEdgeProps } from './step-edge/step-edge.component';
export { SmoothStepEdgeComponent, type SmoothStepEdgeProps } from './smooth-step-edge/smooth-step-edge.component';
export { 
  SimpleBezierEdgeComponent, 
  type SimpleBezierEdgeProps,
  getSimpleBezierPath,
  type GetSimpleBezierPathParams
} from './simple-bezier-edge/simple-bezier-edge.component';

// 重新導出常用類型
export type {
  AngularEdge,
  EdgeTypes,
  EdgeProps,
  EdgeMarker,
} from '../../types';

// 重新導出 Position 枚舉，方便使用
export { Position } from '@xyflow/system';