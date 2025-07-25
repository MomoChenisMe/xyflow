// 主要組件導出
export * from './A11yDescriptions';
export * from './Attribution';
export { BatchProviderService, MockStoreApiService, createQueue } from './BatchProvider';
export type { Queue, QueueItem, BatchContext } from './BatchProvider';
export * from './EdgeLabelRenderer';
export * from './EdgeWrapper';
export * from './Edges';
export * from './Handle';
export * from './Nodes';
export * from './NodesSelection';
export * from './Panel';
export * from './ReactFlowProvider';
export * from './SelectionListener';
export * from './UserSelection';
export * from './ViewportPortal';

// Additional components 導出 (使用具名導出避免衝突)
export { BackgroundComponent } from '../additional-components/Background/background.component';
export { ControlsComponent } from '../additional-components/Controls/controls.component';
export { MiniMapComponent } from '../additional-components/MiniMap/minimap.component';
export { NodeResizer as NodeResizerComponent } from '../additional-components/NodeResizer';
export { NodeToolbar as NodeToolbarComponent } from '../additional-components/NodeToolbar';

// 類型統一導出
export type { Position } from './Handle/handle.types';
export type { PanelPosition } from './Panel/panel.types';
export type { NodeBase, InternalNode, NodeProps } from './Nodes/nodes.types';
export type { EdgeComponentProps, BaseEdgeProps } from './Edges/edges.types';

// 組件映射常量
export const ANGULAR_FLOW_COMPONENTS = {
  // Additional Components
  Background: 'BackgroundComponent',
  Controls: 'ControlsComponent', 
  MiniMap: 'MiniMapComponent',
  NodeResizer: 'NodeResizerComponent',
  NodeToolbar: 'NodeToolbarComponent',
  
  // Core Components
  A11yDescriptions: 'A11yDescriptionsComponent',
  Attribution: 'AttributionComponent',
  EdgeLabelRenderer: 'EdgeLabelRendererComponent',
  EdgeWrapper: 'EdgeWrapperComponent',
  Handle: 'HandleComponent',
  NodeWrapper: 'NodeWrapperComponent',
  NodesSelection: 'NodesSelectionComponent',
  Panel: 'PanelComponent',
  SelectionListener: 'SelectionListenerComponent',
  UserSelection: 'UserSelectionComponent',
  ViewportPortal: 'ViewportPortalComponent',
  
  // Node Types
  DefaultNode: 'DefaultNodeComponent',
  InputNode: 'InputNodeComponent',
  OutputNode: 'OutputNodeComponent',
  GroupNode: 'GroupNodeComponent',
  
  // Edge Types
  BaseEdge: 'BaseEdgeComponent',
  BezierEdge: 'BezierEdgeComponent',
  SimpleBezierEdge: 'SimpleBezierEdgeComponent',
  SmoothStepEdge: 'SmoothStepEdgeComponent',
  StepEdge: 'StepEdgeComponent',
  StraightEdge: 'StraightEdgeComponent',
  EdgeText: 'EdgeTextComponent',
  EdgeAnchor: 'EdgeAnchorComponent',
} as const;

// 服務導出
export { AngularFlowProviderService } from './ReactFlowProvider/angular-flow-provider.service';