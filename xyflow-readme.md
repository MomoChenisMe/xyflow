# React Flow 架構分析與 Angular 轉換完整規格書

## 專案概述

React Flow 是一個高度可自訂的節點編輯器框架，提供建立流程圖、工作流編輯器和圖形化介面的完整解決方案。本文檔提供完整的架構分析，作為轉換到 Angular 的詳細規格書。

## 核心架構分析

### 1. 狀態管理系統

React Flow 使用 Zustand 作為狀態管理工具，管理以下核心狀態：

```typescript
interface ReactFlowState {
  // 節點和邊緣數據
  nodes: Node[];
  edges: Edge[];
  nodeLookup: Map<string, InternalNode>;
  edgeLookup: Map<string, Edge>;
  connectionLookup: Map<string, Map<string, Edge>>;
  
  // 視口狀態
  transform: [number, number, number]; // [x, y, zoom]
  panZoom: PanZoomInstance | null;
  minZoom: number;
  maxZoom: number;
  translateExtent: CoordinateExtent;
  
  // 互動狀態
  connection: ConnectionState;
  multiSelectionActive: boolean;
  userSelectionRect: SelectionRect | null;
  
  // 配置選項
  nodeOrigin: NodeOrigin;
  nodeExtent: CoordinateExtent;
  elevateNodesOnSelect: boolean;
  elevateEdgesOnSelect: boolean;
  
  // 事件處理器
  onNodesChange?: OnNodesChange;
  onEdgesChange?: OnEdgesChange;
  onConnect?: OnConnect;
  // ... 更多事件處理器
}
```

### 2. 組件層次結構

```
ReactFlow
├── Wrapper (處理初始化和尺寸)
├── GraphView
│   ├── FlowRenderer (處理視圖和互動)
│   │   ├── Viewport
│   │   │   ├── EdgeRenderer
│   │   │   │   ├── MarkerDefinitions
│   │   │   │   └── Edge Components
│   │   │   ├── ConnectionLine
│   │   │   ├── NodeRenderer
│   │   │   │   └── Node Components
│   │   │   └── ViewportPortal
│   │   └── UserSelection
│   └── ZoomPane (處理縮放和平移)
├── StoreUpdater (同步 props 到 store)
├── SelectionListener
├── Attribution
└── A11yDescriptions
```

### 3. 核心組件功能詳解

#### ReactFlow 主組件
- 接收所有配置 props (140+ 個屬性)
- 初始化 store 和 context
- 管理整體布局和樣式
- 提供完整的事件系統

#### FlowRenderer
- 處理使用者互動（拖曳、選擇、縮放）
- 管理鍵盤快捷鍵
- 協調視圖更新
- 處理平移和縮放邏輯

#### NodeRenderer
- 渲染所有節點
- 管理節點的 ResizeObserver
- 處理節點互動事件
- 支援虛擬化渲染

#### EdgeRenderer
- 渲染所有邊緣
- 處理邊緣更新和重連
- 管理標記定義（箭頭）
- 支援不同邊緣類型

### 4. 完整節點系統

#### 節點基礎類型
```typescript
interface Node<Data = any, Type = string> {
  id: string;
  type?: Type;
  position: XYPosition;
  data: Data;
  style?: CSSProperties;
  className?: string;
  selected?: boolean;
  draggable?: boolean;
  selectable?: boolean;
  connectable?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  width?: number;
  height?: number;
  parentId?: string;
  expandParent?: boolean;
  extent?: 'parent' | CoordinateExtent;
  zIndex?: number;
  resizing?: boolean;
  ariaRole?: AriaRole;
  domAttributes?: HTMLAttributes;
}
```

#### 內部節點表示
```typescript
interface InternalNode extends Node {
  measured: { width: number; height: number };
  internals: {
    positionAbsolute: XYPosition;
    z: number;
    userNode: Node;
    handleBounds?: HandleBounds;
    isParent: boolean;
  };
}
```

#### 內建節點類型
1. **InputNode** - 只有輸出連接點
2. **OutputNode** - 只有輸入連接點  
3. **DefaultNode** - 同時有輸入和輸出連接點
4. **GroupNode** - 可包含其他節點的群組節點

### 5. 完整邊緣系統

#### 邊緣基礎類型
```typescript
interface Edge<Data = any, Type = string> {
  id: string;
  type?: Type;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  data?: Data;
  style?: CSSProperties;
  animated?: boolean;
  selected?: boolean;
  deletable?: boolean;
  selectable?: boolean;
  focusable?: boolean;
  label?: ReactNode;
  labelStyle?: CSSProperties;
  labelShowBg?: boolean;
  labelBgStyle?: CSSProperties;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  interactionWidth?: number;
  markerStart?: EdgeMarker;
  markerEnd?: EdgeMarker;
  reconnectable?: boolean | HandleType;
  updatable?: boolean;
  pathOptions?: any;
  ariaRole?: AriaRole;
  domAttributes?: SVGAttributes;
}
```

#### 內建邊緣類型
1. **BezierEdge** - 貝茲曲線（預設）
2. **StraightEdge** - 直線
3. **StepEdge** - 階梯線
4. **SmoothStepEdge** - 平滑階梯線
5. **SimpleBezierEdge** - 簡單貝茲曲線

### 6. 附加組件系統

#### Background 組件
```typescript
interface BackgroundProps {
  id?: string;
  gap?: number | [number, number];
  size?: number;
  offset?: number;
  lineWidth?: number;
  variant?: BackgroundVariant; // 'dots' | 'lines' | 'cross'
  style?: CSSProperties;
  className?: string;
}
```

#### Controls 組件
```typescript
interface ControlsProps {
  showZoom?: boolean;
  showFitView?: boolean;
  showInteractive?: boolean;
  fitViewOptions?: FitViewOptions;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onInteractiveChange?: (interactiveStatus: boolean) => void;
  style?: CSSProperties;
  className?: string;
  position?: PanelPosition;
  orientation?: 'horizontal' | 'vertical';
}
```

#### MiniMap 組件
```typescript
interface MiniMapProps<NodeType extends Node = Node> {
  style?: CSSProperties;
  className?: string;
  nodeStrokeColor?: string | ((node: NodeType) => string);
  nodeColor?: string | ((node: NodeType) => string);
  nodeClassName?: string | ((node: NodeType) => string);
  nodeBorderRadius?: number;
  nodeStrokeWidth?: number;
  maskColor?: string;
  maskStrokeColor?: string;
  maskStrokeWidth?: number;
  position?: PanelPosition;
  onClick?: (event: MouseEvent, position: XYPosition) => void;
  onNodeClick?: (event: MouseEvent, node: NodeType) => void;
  pannable?: boolean;
  zoomable?: boolean;
  ariaLabel?: string;
  inversePan?: boolean;
  zoomStep?: number;
  offsetScale?: number;
}
```

#### NodeToolbar 組件
```typescript
interface NodeToolbarProps {
  nodeId?: string;
  isVisible?: boolean;
  position?: Position;
  offset?: number;
  align?: Align;
  style?: CSSProperties;
  className?: string;
  children: ReactNode;
}
```

#### NodeResizer 組件
```typescript
interface NodeResizerProps {
  nodeId?: string;
  color?: string;
  handleClassName?: string;
  handleStyle?: CSSProperties;
  lineClassName?: string;
  lineStyle?: CSSProperties;
  isVisible?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  keepAspectRatio?: boolean;
  shouldResize?: ShouldResize;
  onResizeStart?: OnResizeStart;
  onResize?: OnResize;
  onResizeEnd?: OnResizeEnd;
}
```

### 7. Hook 系統完整列表

#### 核心 Hooks
```typescript
// 主要 Hook
useReactFlow(): ReactFlowInstance
useNodes(): Node[]
useEdges(): Edge[]
useViewport(): Viewport
useStoreApi(): StoreApi
useStore(selector): T

// 狀態管理 Hooks
useNodesState(initialNodes): [Node[], Dispatch<SetStateAction<Node[]>>]
useEdgesState(initialEdges): [Edge[], Dispatch<SetStateAction<Edge[]>>]

// 事件 Hooks  
useOnViewportChange(options): void
useOnSelectionChange(options): void
useNodesInitialized(options): boolean

// 互動 Hooks
useUpdateNodeInternals(): (nodeId: string | string[]) => void
useConnection(): ConnectionInProgress
useHandleConnections(params): Connection[]
useNodeConnections(params): Connection[]
useNodesData(nodeIds): NodeData[]
useKeyPress(keyCode): boolean

// 內部 Hooks
useInternalNode(nodeId): InternalNode
useVisibleNodeIds(): string[]
useVisibleEdgeIds(): string[]
useColorModeClass(colorMode): string
```

### 8. 完整事件系統

#### 節點事件
```typescript
// 滑鼠事件
onNodeClick?: NodeMouseHandler;
onNodeDoubleClick?: NodeMouseHandler;
onNodeMouseEnter?: NodeMouseHandler;
onNodeMouseMove?: NodeMouseHandler;
onNodeMouseLeave?: NodeMouseHandler;
onNodeContextMenu?: NodeMouseHandler;

// 拖拽事件
onNodeDragStart?: OnNodeDrag;
onNodeDrag?: OnNodeDrag;
onNodeDragStop?: OnNodeDrag;

// 狀態變更事件
onNodesChange?: OnNodesChange;
onNodesDelete?: (nodes: Node[]) => void;
```

#### 邊緣事件
```typescript
// 滑鼠事件
onEdgeClick?: EdgeMouseHandler;
onEdgeDoubleClick?: EdgeMouseHandler;
onEdgeMouseEnter?: EdgeMouseHandler;
onEdgeMouseMove?: EdgeMouseHandler;
onEdgeMouseLeave?: EdgeMouseHandler;
onEdgeContextMenu?: EdgeMouseHandler;

// 連接事件
onConnect?: OnConnect;
onConnectStart?: OnConnectStart;
onConnectEnd?: OnConnectEnd;
onReconnect?: OnReconnect;
onReconnectStart?: OnReconnectStart;
onReconnectEnd?: OnReconnectEnd;

// 狀態變更事件
onEdgesChange?: OnEdgesChange;
onEdgesDelete?: (edges: Edge[]) => void;
```

#### 視圖事件
```typescript
// 移動事件
onMove?: OnMove;
onMoveStart?: OnMoveStart;
onMoveEnd?: OnMoveEnd;

// 選擇事件
onSelectionChange?: OnSelectionChange;
onSelectionDrag?: OnSelectionDrag;
onSelectionDragStart?: SelectionDragHandler;
onSelectionDragStop?: SelectionDragHandler;
onSelectionContextMenu?: SelectionEventHandler;
onSelectionStart?: SelectionEventHandler;
onSelectionEnd?: SelectionEventHandler;

// 畫布事件
onPaneClick?: (event: MouseEvent) => void;
onPaneMouseEnter?: (event: MouseEvent) => void;
onPaneMouseMove?: (event: MouseEvent) => void;
onPaneMouseLeave?: (event: MouseEvent) => void;
onPaneScroll?: (event?: WheelEvent) => void;
onPaneContextMenu?: (event: MouseEvent) => void;
```

### 9. 工具函數系統

#### 邊緣工具函數
```typescript
addEdge(edgeParams: Edge | Connection, edges: Edge[]): Edge[]
reconnectEdge(oldEdge: Edge, newConnection: Connection): Edge
getConnectedEdges(nodes: Node[], edges: Edge[]): Edge[]
getIncomers(node: Node, nodes: Node[], edges: Edge[]): Node[]
getOutgoers(node: Node, nodes: Node[], edges: Edge[]): Node[]
```

#### 節點工具函數
```typescript
getNodesBounds(nodes: (Node | { x: number; y: number; width: number; height: number })[]): Rect
isNode(element: Node | Edge): element is Node
getIntersectingNodes(node: Node | Rect, nodes: Node[], partially?: boolean): Node[]
```

#### 邊緣路徑工具函數
```typescript
getBezierPath(params: GetBezierPathParams): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number]
getStraightPath(params: GetStraightPathParams): [path: string, labelX: number, labelY: number]
getSmoothStepPath(params: GetSmoothStepPathParams): [path: string, labelX: number, labelY: number, offsetX: number, offsetY: number]
getSimpleBezierPath(params: GetSimpleBezierPathParams): [path: string, labelX: number, labelY: number]
```

#### 變更處理函數
```typescript
applyNodeChanges(changes: NodeChange[], nodes: Node[]): Node[]
applyEdgeChanges(changes: EdgeChange[], edges: Edge[]): Edge[]
```

#### 視圖工具函數
```typescript
getViewportForBounds(bounds: Rect, width: number, height: number, minZoom: number, maxZoom: number, padding?: number): Viewport
fitView(options?: FitViewOptions): Promise<boolean>
```

### 10. 進階功能系統

#### 性能優化
- **虛擬化渲染**: `onlyRenderVisibleElements`
- **批次更新**: BatchProvider 系統
- **記憶化**: React.memo 和 useMemo 優化
- **ResizeObserver**: 高效的尺寸監聽

#### 無障礙支援
```typescript
interface AriaLabelConfig {
  'node-1': string;
  'edge-2-3': string;
  // ...
}

// A11y 描述組件
A11yDescriptions: ({ rfId, disableKeyboardA11y }) => JSX.Element
```

#### 子流程支援
- 支援嵌套的流程圖
- 遞迴渲染子流程
- 子流程狀態管理

#### 觸控設備支援
- 手勢識別
- 觸控拖拽
- 多點觸控縮放

## Angular 轉換策略

### 1. 狀態管理轉換
```typescript
// Zustand → Angular Signals
const nodes = signal<Node[]>([]);
const edges = signal<Edge[]>([]);
const nodeLookup = computed(() => new Map(nodes().map(n => [n.id, n])));

// Store hooks → Signal-based services
@Injectable({ providedIn: 'root' })
export class AngularFlowStore {
  private _nodes = signal<Node[]>([]);
  public readonly nodes = this._nodes.asReadonly();
  // ...
}
```

### 2. 組件架構轉換
```typescript
// React components → Angular standalone components
@Component({
  selector: 'angular-flow',
  standalone: true,
  imports: [CommonModule, ...],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AngularFlow {
  // Props → Input signals
  nodes = input<Node[]>([]);
  edges = input<Edge[]>([]);
  
  // Callbacks → Output signals
  onNodeClick = output<{ event: MouseEvent; node: Node }>();
  onEdgeClick = output<{ event: MouseEvent; edge: Edge }>();
}
```

### 3. Hook 轉換策略
```typescript
// useReactFlow → AngularFlowService
@Injectable()
export class AngularFlowService {
  private store = inject(AngularFlowStore);
  
  getNodes(): Node[] { return this.store.nodes(); }
  addNode(node: Node): void { this.store.addNode(node); }
  // ...
}

// useNodes → Signal subscription
export function injectNodes(): Signal<Node[]> {
  const store = inject(AngularFlowStore);
  return store.nodes;
}
```

### 4. 事件處理轉換
```typescript
// React synthetic events → Angular event binding
// (onClick) → (click)
// (onDoubleClick) → (dblclick)
// React event handlers → Angular EventEmitter outputs
```

### 5. 樣式處理轉換
```typescript
// CSS modules → Angular component styles
// Dynamic styles → [ngStyle] binding
// CSS-in-JS → Angular @Component styles
```

## 實作優先順序

### 階段 1: 核心基礎 (必要)
1. ✅ 基礎 AngularFlow 組件
2. ✅ 基礎狀態管理 (AngularFlowStore)
3. ✅ 基礎節點和邊緣渲染
4. ❌ 完整的事件系統
5. ❌ 基礎互動 (拖拽、選擇、縮放)

### 階段 2: 附加組件 (重要)
1. ❌ Background 組件
2. ❌ Controls 組件  
3. ❌ MiniMap 組件
4. ❌ NodeToolbar 組件
5. ❌ NodeResizer 組件

### 階段 3: Hook 系統 (重要)
1. ❌ AngularFlowService (useReactFlow 等價物)
2. ❌ Node/Edge 管理服務
3. ❌ 視圖管理服務
4. ❌ 連接管理服務
5. ❌ 事件管理服務

### 階段 4: 完整邊緣系統 (中等)
1. ❌ 所有邊緣類型實作
2. ❌ 自訂邊緣支援
3. ❌ 邊緣路徑計算工具
4. ❌ 邊緣動畫支援

### 階段 5: 完整節點系統 (中等)
1. ❌ 自訂節點支援
2. ❌ 節點模板系統
3. ❌ 節點拖拽手柄
4. ❌ 節點群組功能

### 階段 6: 工具函數 (中等)
1. ❌ 邊緣操作工具
2. ❌ 節點操作工具
3. ❌ 視圖操作工具
4. ❌ 變更處理工具

### 階段 7: 範例轉換 (中等)
1. ❌ 基礎範例 (20+)
2. ❌ 進階範例 (30+)
3. ❌ 整合範例 (10+)

### 階段 8: 進階功能 (較低)
1. ❌ 性能優化 (虛擬化)
2. ❌ 無障礙支援
3. ❌ 觸控設備支援
4. ❌ 子流程支援
5. ❌ 外部狀態管理整合

## 技術挑戰與解決方案

### 1. 性能挑戰
- **問題**: 大量節點渲染性能
- **解決**: 使用 OnPush 變更偵測 + 虛擬滾動
- **解決**: Signal-based 響應式更新

### 2. 互動複雜性
- **問題**: 複雜的拖拽和選擇邏輯
- **解決**: 分層的事件處理系統
- **解決**: 狀態機模式管理互動狀態

### 3. 類型安全
- **問題**: 動態節點和邊緣類型
- **解決**: 泛型約束和類型守衛
- **解決**: 嚴格的 TypeScript 配置

### 4. 響應式設計
- **問題**: 複雜的狀態依賴關係
- **解決**: Signal + computed + effect 組合
- **解決**: 清晰的狀態更新流程

## 測試策略

### 1. 單元測試
- Service 邏輯測試
- 工具函數測試
- 狀態管理測試

### 2. 組件測試
- 組件渲染測試
- 事件處理測試
- 屬性綁定測試

### 3. 整合測試
- 完整流程測試
- 跨組件互動測試
- 性能測試

### 4. E2E 測試
- 使用者場景測試
- 瀏覽器相容性測試
- 觸控設備測試

## 結論

本規格書提供了完整的 React Flow 到 Angular 轉換指南。實作將分為 8 個階段，從核心功能開始，逐步實作所有進階功能。預計完成後，Angular 版本將提供與 React Flow 相同的功能和開發體驗，同時充分利用 Angular v20 的最新特性。