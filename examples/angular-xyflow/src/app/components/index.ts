// Angular Flow 模塊化組件導出
// 完全對應 ReactFlow 的組件架構

// === Container Components ===
export { AngularFlowComponent } from './container/ReactFlow/angular-flow.component';
// Temporarily disabled signal-based components
// export { WrapperComponent } from './container/ReactFlow/wrapper.component';
// export { GraphViewComponent } from './container/GraphView/graph-view.component';
// export { FlowRendererComponent } from './container/FlowRenderer/flow-renderer.component';
// export { NodeRendererComponent } from './container/NodeRenderer/node-renderer.component';
export { EdgeRendererComponent } from './container/EdgeRenderer/edge-renderer.component';
// export { PaneComponent } from './container/Pane/pane.component';
// export { ViewportComponent } from './container/Viewport/viewport.component';
// export { ZoomPaneComponent } from './container/ZoomPane/zoom-pane.component';

// === Components ===
export { NodeWrapperComponent } from './components/NodeWrapper/node-wrapper.component';
export { ConnectionLineComponent } from './components/ConnectionLine/connection-line.component';
export { StoreUpdaterComponent } from './components/StoreUpdater/store-updater.component';

// === Edge Components ===
export { BaseEdgeComponent } from './components/Edges/BaseEdge/base-edge.component';
export { BezierEdgeComponent } from './components/Edges/BezierEdge/bezier-edge.component';
export { SimpleBezierEdgeComponent } from './components/Edges/SimpleBezierEdge/simple-bezier-edge.component';
export { SmoothStepEdgeComponent } from './components/Edges/SmoothStepEdge/smooth-step-edge.component';
export { StepEdgeComponent } from './components/Edges/StepEdge/step-edge.component';
export { StraightEdgeComponent } from './components/Edges/StraightEdge/straight-edge.component';
export { EdgeTextComponent } from './components/Edges/EdgeText/edge-text.component';
export { EdgeAnchorComponent } from './components/Edges/EdgeAnchor/edge-anchor.component';

// === Additional Components ===
export { BackgroundComponent } from './additional-components/Background/background.component';
export { ControlsComponent } from './additional-components/Controls/controls.component';
export { MiniMapComponent } from './additional-components/MiniMap/minimap.component';

// === Examples ===
export { AngularFlowBasicNew } from './examples/angular-flow-basic-new';

// === Types ===
export type { Node } from '../types/node';
export type { Edge } from '../types/edge';

// === Edge Types ===
export type {
  BaseEdgeProps,
  EdgeComponentProps,
  BezierEdgeProps,
  SimpleBezierEdgeProps,
  SmoothStepEdgeProps,
  StepEdgeProps,
  StraightEdgeProps,
  EdgeTextProps,
  EdgeAnchorProps,
  Position
} from './components/Edges/edges.types';