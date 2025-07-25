/**
 * Angular XYFlow Hooks - 所有服務和工具函數的統一導出
 * 
 * 這個文件提供了與 React Flow hooks 等價的 Angular 服務和函數
 * 讓開發者可以使用熟悉的 API 在 Angular 中構建流程圖應用
 */

// 核心服務
export * from './angular-flow.service';
export * from './viewport.service';
export * from './node.service';
export * from './edge.service';

// 交互和事件處理服務
export * from './interaction.service';
export * from './selection.service';
export * from './color-mode.service';
export * from './key-press.service';

// 類型定義
export type {
  AngularFlowInstance,
  ViewportHelperFunctions,
  Transform,
  Viewport,
  FitViewOptions,
  ZoomOptions,
  SetCenterOptions
} from './angular-flow.service';

export type {
  NodeData,
  NodeUpdate,
  DataUpdate,
  NodeConnection,
  NodeConnectionsOptions
} from './node.service';

export type {
  Edge,
  EdgeChange,
  EdgeUpdate
} from './edge.service';

export type {
  DragOptions,
  MoveSelectedNodesOptions,
  KeyCode,
  UseKeyPressOptions,
  GlobalKeyHandlerOptions
} from './interaction.service';

export type {
  SelectionChangeParams,
  OnSelectionChangeFunc,
  SelectionChangeOptions,
  BatchSelectionOptions,
  AreaSelectionOptions,
  SelectionFilter
} from './selection.service';

export type {
  ColorMode,
  ColorModeClass,
  ColorModeOptions
} from './color-mode.service';

export type {
  KeyPressOptions,
  KeyCombinationOptions,
  KeySequenceOptions,
  KeyEventInfo,
  KeyState
} from './key-press.service';

// 便捷函數，與 React Flow hooks 命名保持一致
import { inject } from '@angular/core';
import { AngularFlowService } from './angular-flow.service';
import { ViewportService } from './viewport.service';
import { NodeService } from './node.service';
import { EdgeService } from './edge.service';
import { InteractionService } from './interaction.service';
import { SelectionService } from './selection.service';
import { ColorModeService } from './color-mode.service';
import { KeyPressService } from './key-press.service';

/**
 * 獲取 AngularFlow 實例
 * 等價於 React Flow 的 useReactFlow()
 */
export function useAngularFlow(): AngularFlowService {
  return inject(AngularFlowService);
}

/**
 * 獲取視窗服務
 * 等價於 React Flow 的 useViewport() 和 useViewportHelper()
 */
export function useViewport(): ViewportService {
  return inject(ViewportService);
}

/**
 * 獲取節點服務
 * 提供節點相關的所有操作
 */
export function useNodeService(): NodeService {
  return inject(NodeService);
}

/**
 * 獲取邊緣服務
 * 提供邊緣相關的所有操作
 */
export function useEdgeService(): EdgeService {
  return inject(EdgeService);
}

/**
 * 獲取交互服務
 * 提供拖拽、鍵盤事件等交互功能
 */
export function useInteractionService(): InteractionService {
  return inject(InteractionService);
}

/**
 * 獲取選擇服務
 * 提供選擇管理功能
 */
export function useSelectionService(): SelectionService {
  return inject(SelectionService);
}

/**
 * 獲取色彩模式服務
 * 提供主題管理功能
 */
export function useColorModeService(): ColorModeService {
  return inject(ColorModeService);
}

/**
 * 獲取按鍵服務
 * 提供鍵盤事件監聽功能
 */
export function useKeyPressService(): KeyPressService {
  return inject(KeyPressService);
}

/**
 * 獲取所有節點
 * 等價於 React Flow 的 useNodes()
 */
export function useNodes<T = any>() {
  const nodeService = inject(NodeService);
  return nodeService.nodes;
}

/**
 * 獲取所有邊緣
 * 等價於 React Flow 的 useEdges()
 */
export function useEdges<T = any>() {
  const edgeService = inject(EdgeService);
  return edgeService.edges;
}

/**
 * Angular XYFlow 服務提供者配置
 * 
 * 在模組或 bootstrapApplication 中使用這些提供者
 * 
 * @example
 * ```typescript
 * // 在 main.ts 中
 * import { ANGULAR_FLOW_PROVIDERS } from './components/hooks';
 * 
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     ...ANGULAR_FLOW_PROVIDERS,
 *     // 其他提供者
 *   ]
 * });
 * 
 * // 或在模組中
 * @NgModule({
 *   providers: [
 *     ...ANGULAR_FLOW_PROVIDERS
 *   ]
 * })
 * export class AppModule {}
 * ```
 */
export const ANGULAR_FLOW_PROVIDERS = [
  AngularFlowService,
  ViewportService,
  NodeService,
  EdgeService,
  InteractionService,
  SelectionService,
  ColorModeService,
  KeyPressService,
] as const;

/**
 * Angular XYFlow 功能常量
 */
export const ANGULAR_FLOW_FEATURES = {
  // 版本信息
  VERSION: '1.0.0',
  LIB: 'angular',
  
  // 默認配置
  DEFAULT_VIEWPORT: { x: 0, y: 0, zoom: 1 },
  DEFAULT_ZOOM_RANGE: { min: 0.1, max: 10 },
  DEFAULT_NODE_SIZE: { width: 150, height: 40 },
  
  // 事件類型
  EVENTS: {
    NODES_CHANGE: 'nodes-change',
    EDGES_CHANGE: 'edges-change',
    VIEWPORT_CHANGE: 'viewport-change',
    SELECTION_CHANGE: 'selection-change',
    CONNECTION_START: 'connection-start',
    CONNECTION_END: 'connection-end',
  },
  
  // 默認類名
  CSS_CLASSES: {
    FLOW_CONTAINER: 'angular-flow',
    NODE: 'angular-flow__node',
    EDGE: 'angular-flow__edge',
    HANDLE: 'angular-flow__handle',
    CONTROLS: 'angular-flow__controls',
    MINIMAP: 'angular-flow__minimap',
    BACKGROUND: 'angular-flow__background',
    SELECTION: 'angular-flow__selection',
  },
} as const;

/**
 * 工具函數：檢查環境
 */
export function isAngularFlowEnvironment(): boolean {
  return typeof window !== 'undefined' && 'Angular' in (window as any);
}

/**
 * 工具函數：創建唯一 ID
 */
export function createId(prefix = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 工具函數：創建節點 ID
 */
export function createNodeId(): string {
  return createId('node');
}

/**
 * 工具函數：創建邊緣 ID
 */
export function createEdgeId(): string {
  return createId('edge');
}

/**
 * 工具函數：創建連接 ID
 */
export function createConnectionId(source: string, target: string, sourceHandle?: string, targetHandle?: string): string {
  const parts = [source, target];
  if (sourceHandle) parts.push(sourceHandle);
  if (targetHandle) parts.push(targetHandle);
  return parts.join('-');
}

/**
 * Angular XYFlow 使用指南
 * 
 * @example
 * ```typescript
 * // 1. 在組件中使用基本功能
 * @Component({
 *   template: `
 *     <div>節點數量: {{ nodeCount() }}</div>
 *     <button (click)="addNode()">添加節點</button>
 *   `
 * })
 * export class FlowComponent {
 *   private angularFlow = useAngularFlow();
 *   
 *   nodeCount = computed(() => this.angularFlow.getNodes().length);
 *   
 *   addNode() {
 *     this.angularFlow.addNodes({
 *       id: createNodeId(),
 *       type: 'default',
 *       position: { x: 100, y: 100 },
 *       data: { label: '新節點' }
 *     });
 *   }
 * }
 * 
 * // 2. 使用專門的服務
 * @Component({
 *   template: `<div>專業節點管理</div>`
 * })
 * export class NodeManagementComponent {
 *   private nodeService = useNodeService();
 *   private edgeService = useEdgeService();
 *   private viewportService = useViewport();
 *   
 *   nodes = this.nodeService.nodes;
 *   edges = this.edgeService.edges;
 *   viewport = this.viewportService.viewport;
 * }
 * 
 * // 3. 使用響應式 hooks
 * @Component({
 *   template: `<div>響應式數據</div>`
 * })
 * export class ReactiveComponent {
 *   nodes = useNodes();
 *   edges = useEdges();
 *   
 *   constructor() {
 *     // 監聽節點變化
 *     effect(() => {
 *       console.log('Nodes:', this.nodes());
 *     });
 *   }
 * }
 * ```
 */