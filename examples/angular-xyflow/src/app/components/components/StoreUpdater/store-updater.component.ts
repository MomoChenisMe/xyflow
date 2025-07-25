import { 
  Component, 
  input,
  output,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  WritableSignal
} from '@angular/core';
import { Node } from '../../../types/node';
import { AngularEdge } from '../../types/edges';

/**
 * StoreUpdater 組件 - 負責處理狀態同步和各種回調事件
 * 
 * 這個組件使用最新的 Angular Signal API 實現，對應 React Flow 的 StoreUpdater 組件。
 * 負責處理 props 變化、狀態同步、連接處理、拖拽事件以及各種回調事件的統一管理。
 * 
 * @component
 * @selector angular-flow-store-updater
 * @example
 * ```html
 * <angular-flow-store-updater 
 *   [nodes]="flowNodes"
 *   [edges]="flowEdges"
 *   [nodesDraggable]="true"
 *   [elementsSelectable]="true"
 *   (onConnect)="handleConnect($event)"
 *   (onNodesChange)="handleNodesChange($event)">
 * </angular-flow-store-updater>
 * ```
 * 
 * @remarks 這個組件是無渲染組件，僅用於狀態管理和事件處理。
 * 它是 Angular Flow 架構中的核心元件，統一管理所有的狀態變化和用戶交互。
 */
@Component({
  selector: 'angular-flow-store-updater',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<!-- 這是一個無渲染組件，僅用於狀態管理 -->`,
  styles: [`
    :host {
      display: none;
    }
  `]
})
export class StoreUpdaterComponent implements OnInit, OnDestroy {

  /** 節點陣列 */
  nodes = input<Node[]>();
  
  /** 邊緣陣列 */
  edges = input<AngularEdge[]>();
  
  /** 預設節點 */
  defaultNodes = input<Node[]>([]);
  
  /** 預設邊緣 */
  defaultEdges = input<AngularEdge[]>([]);
  
  /** 內部節點狀態信號 - 必需輸入 */
  internalNodes = input.required<WritableSignal<Node[]>>();
  
  /** 內部邊緣狀態信號 - 必需輸入 */
  internalAngularEdges = input.required<WritableSignal<AngularEdge[]>>();
  
  /** 視口狀態信號 - 必需輸入 */
  viewport = input.required<WritableSignal<any>>();
  
  /** 節點是否可拖拽 */
  nodesDraggable = input<boolean>(true);
  
  /** 節點是否可連接 */
  nodesConnectable = input<boolean>(true);
  
  /** 節點是否可聚焦 */
  nodesFocusable = input<boolean>(true);
  
  /** 拖拽時是否選擇節點 */
  selectNodesOnDrag = input<boolean>(true);
  
  /** 節點拖拽閾值 */
  nodeDragThreshold = input<number>(1);
  
  /** 節點原點 */
  nodeOrigin = input<[number, number]>([0, 0]);
  
  /** 邊緣是否可聚焦 */
  edgesFocusable = input<boolean>(true);
  
  /** 邊緣是否可重新連接 */
  edgesReconnectable = input<boolean>(true);
  
  /** 選擇時是否提升邊緣層級 */
  elevateAngularEdgesOnSelect = input<boolean>(false);
  
  /** 選擇時是否提升節點層級 */
  elevateNodesOnSelect = input<boolean>(true);
  
  /** 元素是否可選擇 */
  elementsSelectable = input<boolean>(true);
  
  /** 最小縮放比例 */
  minZoom = input<number>(0.5);
  
  /** 最大縮放比例 */
  maxZoom = input<number>(2);
  
  /** 平移範圍限制 */
  translateExtent = input<any>();
  
  /** 是否對齊網格 */
  snapToGrid = input<boolean>(false);
  
  /** 網格大小 */
  snapGrid = input<[number, number]>([15, 15]);
  
  /** 連接模式 */
  connectionMode = input<string>();
  
  /** 點擊時連接 */
  connectOnClick = input<boolean>(true);
  
  /** 預設邊緣選項 */
  defaultAngularEdgeOptions = input<any>();
  
  /** 連接拖拽閾值 */
  connectionDragThreshold = input<number>(1);
  
  /** 是否適應視圖 */
  fitView = input<boolean>(false);
  
  /** 適應視圖選項 */
  fitViewOptions = input<any>();
  
  /** React Flow 實例 ID */
  rfId = input<string>('1');
  
  /** 面板點擊距離 */
  paneClickDistance = input<number>(0);
  
  /** 除錯模式 */
  debug = input<boolean>(false);
  
  /** 連接事件 */
  onConnect = output<{ source: string; target: string; sourceHandle?: string; targetHandle?: string }>();
  
  /** 連接開始事件 */
  onConnectStart = output<{ event: MouseEvent; node: Node; handleId?: string }>();
  
  /** 連接結束事件 */
  onConnectEnd = output<{ event: MouseEvent }>();
  
  /** 點擊連接開始事件 */
  onClickConnectStart = output<{ event: MouseEvent; node: Node; handleId?: string }>();
  
  /** 點擊連接結束事件 */
  onClickConnectEnd = output<{ event: MouseEvent }>();
  
  /** 節點拖拽開始事件 */
  onNodeDragStart = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  
  /** 節點拖拽進行中事件 */
  onNodeDrag = output<{ node: Node; nodes: Node[] }>();
  
  /** 節點拖拽結束事件 */
  onNodeDragStop = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  
  /** 選擇拖拽開始事件 */
  onSelectionDragStart = output<{ event: MouseEvent; nodes: Node[] }>();
  
  /** 選擇拖拽進行中事件 */
  onSelectionDrag = output<{ nodes: Node[] }>();
  
  /** 選擇拖拽結束事件 */
  onSelectionDragStop = output<{ event: MouseEvent; nodes: Node[] }>();
  
  /** 視口移動事件 */
  onMove = output<{ event: MouseEvent | TouchEvent | null; viewport: any }>();
  
  /** 視口移動開始事件 */
  onMoveStart = output<{ event: MouseEvent | TouchEvent; viewport: any }>();
  
  /** 視口移動結束事件 */
  onMoveEnd = output<{ event: MouseEvent | TouchEvent; viewport: any }>();
  
  /** 節點刪除事件 */
  onNodesDelete = output<Node[]>();
  
  /** 邊緣刪除事件 */
  onEdgesDelete = output<AngularEdge[]>();
  
  /** 元素刪除事件 */
  onDelete = output<{ nodes: Node[]; edges: AngularEdge[] }>();
  
  /** 刪除前事件 */
  onBeforeDelete = output<{ nodes: Node[]; edges: AngularEdge[] }>();
  
  /** 節點變更事件 */
  onNodesChange = output<Node[]>();
  
  /** 邊緣變更事件 */
  onEdgesChange = output<AngularEdge[]>();
  
  /** 選擇變更事件 */
  onSelectionChange = output<{ nodes: Node[]; edges: AngularEdge[] }>();
  
  /** 錯誤事件 */
  onError = output<{ message: string; error: Error }>();
  
  /** 初始化事件 */
  onInit = output<any>();

  // 內部狀態
  private isInitialized = false;

  ngOnInit() {
    // 設置初始化標記
    setTimeout(() => {
      this.isInitialized = true;
      
      // 發送初始化事件
      this.onInit.emit({
        getNodes: () => this.internalNodes()(),
        getEdges: () => this.internalAngularEdges()(),
        getViewport: () => this.viewport()(),
        setNodes: (nodes: Node[]) => {
          this.internalNodes().set(nodes);
          this.onNodesChange.emit(nodes);
        },
        setEdges: (edges: AngularEdge[]) => {
          this.internalAngularEdges().set(edges);
          this.onEdgesChange.emit(edges);
        },
        setViewport: (viewport: any) => {
          this.viewport().set(viewport);
        },
        addNodes: (newNodes: Node[]) => {
          const currentNodes = this.internalNodes()();
          const updatedNodes = [...currentNodes, ...newNodes];
          this.internalNodes().set(updatedNodes);
          this.onNodesChange.emit(updatedNodes);
        },
        addEdges: (newEdges: AngularEdge[]) => {
          const currentEdges = this.internalAngularEdges()();
          const updatedEdges = [...currentEdges, ...newEdges];
          this.internalAngularEdges().set(updatedEdges);
          this.onEdgesChange.emit(updatedEdges);
        },
        deleteElements: ({ nodes: nodesToDelete = [], edges: edgesToDelete = [] }: { nodes?: Node[]; edges?: AngularEdge[] }) => {
          const nodeIdsToDelete = nodesToDelete.map((n: Node) => n.id);
          const edgeIdsToDelete = edgesToDelete.map((e: AngularEdge) => e.id);
          
          // 發送刪除前事件
          this.onBeforeDelete.emit({ nodes: nodesToDelete, edges: edgesToDelete });
          
          // 刪除節點
          if (nodeIdsToDelete.length > 0) {
            const currentNodes = this.internalNodes()();
            const remainingNodes = currentNodes.filter((n: Node) => !nodeIdsToDelete.includes(n.id));
            this.internalNodes().set(remainingNodes);
            this.onNodesDelete.emit(nodesToDelete);
            this.onNodesChange.emit(remainingNodes);
          }
          
          // 刪除邊和與刪除節點相關的邊
          const currentEdges = this.internalAngularEdges()();
          const remainingEdges = currentEdges.filter((e: AngularEdge) => 
            !edgeIdsToDelete.includes(e.id) &&
            !nodeIdsToDelete.includes(e.source) && 
            !nodeIdsToDelete.includes(e.target)
          );
          
          if (remainingEdges.length !== currentEdges.length) {
            this.internalAngularEdges().set(remainingEdges);
            this.onEdgesDelete.emit(edgesToDelete);
            this.onEdgesChange.emit(remainingEdges);
          }
          
          // 發送統一刪除事件
          this.onDelete.emit({ nodes: nodesToDelete, edges: edgesToDelete });
        },
        updateNode: (nodeId: string, updates: Partial<Node>) => {
          const currentNodes = this.internalNodes()();
          const updatedNodes = currentNodes.map((n: Node) => 
            n.id === nodeId ? { ...n, ...updates } : n
          );
          this.internalNodes().set(updatedNodes);
          this.onNodesChange.emit(updatedNodes);
        },
        updateNodeData: (nodeId: string, newData: any) => {
          const currentNodes = this.internalNodes()();
          const updatedNodes = currentNodes.map((n: Node) => 
            n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n
          );
          this.internalNodes().set(updatedNodes);
          this.onNodesChange.emit(updatedNodes);
        },
        updateEdge: (edgeId: string, updates: Partial<AngularEdge>) => {
          const currentEdges = this.internalAngularEdges()();
          const updatedEdges = currentEdges.map((e: AngularEdge) => 
            e.id === edgeId ? { ...e, ...updates } : e
          );
          this.internalAngularEdges().set(updatedEdges);
          this.onEdgesChange.emit(updatedEdges);
        },
        fitView: () => {
          this.handleFitView();
        },
        project: (position: { x: number; y: number }) => {
          const vp = this.viewport()();
          return {
            x: (position.x - vp.x) / vp.zoom,
            y: (position.y - vp.y) / vp.zoom
          };
        },
        flowToScreenPosition: (position: { x: number; y: number }) => {
          const vp = this.viewport()();
          return {
            x: position.x * vp.zoom + vp.x,
            y: position.y * vp.zoom + vp.y
          };
        },
        toObject: () => ({
          nodes: this.internalNodes()(),
          edges: this.internalAngularEdges()(),
          viewport: this.viewport()()
        })
      });
    });
  }

  ngOnDestroy() {
    // 清理邏輯
    this.isInitialized = false;
  }

  // === 工具方法 ===
  
  private handleFitView() {
    const nodes = this.internalNodes()();
    if (nodes.length === 0) return;
    
    // 計算所有節點的邊界
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    nodes.forEach((node: Node) => {
      const nodeWidth = 150; // 預設節點寬度
      const nodeHeight = 36;  // 預設節點高度
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });
    
    // 假設容器尺寸
    const containerWidth = 800;
    const containerHeight = 600;
    
    // 計算適應視圖的參數
    const padding = 0.1;
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    const paddingX = contentWidth * padding;
    const paddingY = contentHeight * padding;
    
    const boundingBox = {
      x: minX - paddingX,
      y: minY - paddingY,
      width: contentWidth + paddingX * 2,
      height: contentHeight + paddingY * 2
    };
    
    // 計算縮放比例
    const scaleX = containerWidth / boundingBox.width;
    const scaleY = containerHeight / boundingBox.height;
    const zoom = Math.min(scaleX, scaleY);
    
    // 限制縮放範圍
    const finalZoom = Math.max(this.minZoom(), Math.min(zoom, this.maxZoom()));
    
    // 計算居中位置
    const x = containerWidth / 2 - ((boundingBox.x + boundingBox.width / 2) * finalZoom);
    const y = containerHeight / 2 - ((boundingBox.y + boundingBox.height / 2) * finalZoom);
    
    // 更新視口
    this.viewport().set({ x, y, zoom: finalZoom });
  }

  // === 連接處理方法 ===
  
  public handleConnect(connection: { source: string; target: string; sourceHandle?: string; targetHandle?: string }) {
    // 創建新邊
    const newEdge: AngularEdge = {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      selected: false
    };
    
    const currentEdges = this.internalAngularEdges()();
    const updatedEdges = [...currentEdges, newEdge];
    this.internalAngularEdges().set(updatedEdges);
    this.onEdgesChange.emit(updatedEdges);
    this.onConnect.emit(connection);
  }

  // === 拖曳處理方法 ===
  
  public handleNodeDragStart(event: MouseEvent, node: Node, nodes: Node[]) {
    this.onNodeDragStart.emit({ event, node, nodes });
  }
  
  public handleNodeDrag(node: Node, nodes: Node[]) {
    this.onNodeDrag.emit({ node, nodes });
  }
  
  public handleNodeDragStop(event: MouseEvent, node: Node, nodes: Node[]) {
    this.onNodeDragStop.emit({ event, node, nodes });
    this.onNodesChange.emit(nodes);
  }
  
  public handleSelectionDragStart(event: MouseEvent, nodes: Node[]) {
    this.onSelectionDragStart.emit({ event, nodes });
  }
  
  public handleSelectionDrag(nodes: Node[]) {
    this.onSelectionDrag.emit({ nodes });
  }
  
  public handleSelectionDragStop(event: MouseEvent, nodes: Node[]) {
    this.onSelectionDragStop.emit({ event, nodes });
  }

  // === 移動處理方法 ===
  
  public handleMoveStart(event: MouseEvent | TouchEvent, viewport: any) {
    this.onMoveStart.emit({ event, viewport });
  }
  
  public handleMove(event: MouseEvent | TouchEvent | null, viewport: any) {
    this.onMove.emit({ event, viewport });
  }
  
  public handleMoveEnd(event: MouseEvent | TouchEvent, viewport: any) {
    this.onMoveEnd.emit({ event, viewport });
  }

  // === 錯誤處理方法 ===
  
  public handleError(message: string, error: Error) {
    this.onError.emit({ message, error });
    console.error('Angular Flow Error:', message, error);
  }
}