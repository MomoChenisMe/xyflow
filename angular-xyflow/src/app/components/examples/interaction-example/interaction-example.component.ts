// Angular 核心模組
import {
  Component,
  signal,
  viewChild,
  ChangeDetectionStrategy,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// XyFlow 系統模組
import { Position, type Connection, PanOnScrollMode } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  ControlsComponent,
  MinimapComponent,
  AngularNode,
  AngularEdge,
  Viewport,
} from '../../angular-xyflow';


@Component({
  selector: 'app-interaction-example',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularXYFlowComponent,
    ControlsComponent,
    MinimapComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [nodes]="currentNodes()"
      [edges]="currentEdges()"
      [elementsSelectable]="isSelectable()"
      [nodesDraggable]="isDraggable()"
      [nodesConnectable]="isConnectable()"
      [panOnDrag]="panOnDrag()"
      [panOnScroll]="panOnScroll()"
      [panOnScrollMode]="panOnScrollMode()"
      [zoomOnScroll]="zoomOnScroll()"
      [zoomOnPinch]="zoomOnPinch()"
      [zoomOnDoubleClick]="zoomOnDoubleClick()"
      [nodeDragThreshold]="0"
      [captureElementClick]="captureElementClick()"
      [captureOnPaneScroll]="captureZoomScroll()"
      [onPaneClickHandler]="paneClickHandler()"
      [onNodeClickHandler]="nodeClickHandler()"
      [onEdgeClickHandler]="edgeClickHandler()"
      className="interaction-flow"
      (onNodesChange)="handleNodesChange($event)"
      (onEdgesChange)="handleEdgesChange($event)"
      (onConnect)="handleConnect($event)"
      (onNodeClick)="handleNodeClick($event)"
      (onEdgeClick)="handleEdgeClick($event)"
      (onNodeDragStart)="handleNodeDragStart($event)"
      (onNodeDragStop)="handleNodeDragStop($event)"
      (onPaneClick)="handlePaneClick($event)"
      (onPaneScroll)="handlePaneScroll($event)"
      (onMoveEnd)="handleMoveEnd($event)"
    >
      <angular-xyflow-minimap />
      <angular-xyflow-controls />

      <!-- 控制面板 -->
      <div class="controls-panel" (click)="$event.stopPropagation()">
        <div class="control-group">
          <label for="draggable">
            nodesDraggable
            <input
              id="draggable"
              type="checkbox"
              [checked]="isDraggable()"
              (change)="setIsDraggable($event)"
              class="react-flow__draggable"
            />
          </label>
        </div>
        
        <div class="control-group">
          <label for="connectable">
            nodesConnectable
            <input
              id="connectable"
              type="checkbox"
              [checked]="isConnectable()"
              (change)="setIsConnectable($event)"
              class="react-flow__connectable"
            />
          </label>
        </div>
        
        <div class="control-group">
          <label for="selectable">
            elementsSelectable
            <input
              id="selectable"
              type="checkbox"
              [checked]="isSelectable()"
              (change)="setIsSelectable($event)"
              class="react-flow__selectable"
            />
          </label>
        </div>
        
        <div class="control-group">
          <label for="zoomonscroll">
            zoomOnScroll
            <input
              id="zoomonscroll"
              type="checkbox"
              [checked]="zoomOnScroll()"
              (change)="setZoomOnScroll($event)"
              class="react-flow__zoomonscroll"
            />
          </label>
        </div>
        
        <div class="control-group">
          <label for="zoomonpinch">
            zoomOnPinch
            <input
              id="zoomonpinch"
              type="checkbox"
              [checked]="zoomOnPinch()"
              (change)="setZoomOnPinch($event)"
              class="react-flow__zoomonpinch"
            />
          </label>
        </div>
        
        <div class="control-group">
          <label for="panonscroll">
            panOnScroll
            <input
              id="panonscroll"
              type="checkbox"
              [checked]="panOnScroll()"
              (change)="setPanOnScroll($event)"
              class="react-flow__panonscroll"
            />
          </label>
        </div>
        
        <div class="control-group">
          <label for="panonscrollmode">
            panOnScrollMode
            <select
              id="panonscrollmode"
              [value]="panOnScrollMode()"
              (change)="setPanOnScrollMode($event)"
              class="react-flow__panonscrollmode"
            >
              <option value="free">free</option>
              <option value="horizontal">horizontal</option>
              <option value="vertical">vertical</option>
            </select>
          </label>
        </div>
        
        <div class="control-group">
          <label for="zoomondbl">
            zoomOnDoubleClick
            <input
              id="zoomondbl"
              type="checkbox"
              [checked]="zoomOnDoubleClick()"
              (change)="setZoomOnDoubleClick($event)"
              class="react-flow__zoomondbl"
            />
          </label>
        </div>
        
        <div class="control-group">
          <label for="panondrag">
            panOnDrag
            <input
              id="panondrag"
              type="checkbox"
              [checked]="panOnDrag()"
              (change)="setPanOnDrag($event)"
              class="react-flow__panondrag"
            />
          </label>
        </div>
        
        <div class="control-group">
          <label for="capturezoompaneclick">
            capture onPaneClick
            <input
              id="capturezoompaneclick"
              type="checkbox"
              [checked]="captureZoomClick()"
              (change)="setCaptureZoomClick($event)"
              class="react-flow__capturezoompaneclick"
            />
          </label>
        </div>
        
        <div class="control-group">
          <label for="capturezoompanescroll">
            capture onPaneScroll
            <input
              id="capturezoompanescroll"
              type="checkbox"
              [checked]="captureZoomScroll()"
              (change)="setCaptureZoomScroll($event)"
              class="react-flow__capturezoompanescroll"
            />
          </label>
        </div>
        
        <div class="control-group">
          <label for="captureelementclick">
            capture onElementClick
            <input
              id="captureelementclick"
              type="checkbox"
              [checked]="captureElementClick()"
              (change)="setCaptureElementClick($event)"
              class="react-flow__captureelementclick"
            />
          </label>
        </div>
      </div>
    </angular-xyflow>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    angular-xyflow {
      width: 100%;
      height: 100%;
    }

    .controls-panel {
      position: absolute;
      left: 10px;
      top: 10px;
      z-index: 4;
      background: white;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 16px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      max-height: calc(100vh - 40px);
      overflow-y: auto;
    }

    .dark .controls-panel {
      background: #1a1a1a;
      border-color: #333;
      color: white;
    }

    .control-group {
      margin-bottom: 12px;
    }

    .control-group label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 14px;
    }

    .control-group input[type="checkbox"] {
      margin-left: 8px;
    }

    .control-group select {
      margin-left: 8px;
      padding: 2px 4px;
      border: 1px solid #ccc;
      border-radius: 2px;
    }

    .dark .control-group select {
      background: #333;
      border-color: #555;
      color: white;
    }

    .control-group.disabled {
      opacity: 0.6;
    }

    .control-group.disabled label {
      color: #999;
      cursor: not-allowed;
    }

    .dark .control-group.disabled label {
      color: #666;
    }
  `],
})
export class InteractionExampleComponent {
  // 視圖子元素引用
  angularFlow = viewChild.required(AngularXYFlowComponent);

  // 初始節點數據
  initialNodes = signal<AngularNode[]>([
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
      sourcePosition: Position.Bottom,
    },
    { 
      id: '2', 
      data: { label: 'Node 2' }, 
      position: { x: 100, y: 100 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    { 
      id: '3', 
      data: { label: 'Node 3' }, 
      position: { x: 400, y: 100 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    { 
      id: '4', 
      data: { label: 'Node 4' }, 
      position: { x: 400, y: 200 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
  ]);

  // 初始邊數據
  initialEdges = signal<AngularEdge[]>([
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3' },
  ]);

  // Controlled mode 狀態管理 - 類似 React Flow 的 useNodesState/useEdgesState
  private _currentNodes = signal<AngularNode[]>([
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
      sourcePosition: Position.Bottom,
    },
    { 
      id: '2', 
      data: { label: 'Node 2' }, 
      position: { x: 100, y: 100 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    { 
      id: '3', 
      data: { label: 'Node 3' }, 
      position: { x: 400, y: 100 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    { 
      id: '4', 
      data: { label: 'Node 4' }, 
      position: { x: 400, y: 200 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
  ]);

  private _currentEdges = signal<AngularEdge[]>([
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3' },
  ]);

  // 公開的只讀狀態
  currentNodes = this._currentNodes.asReadonly();
  currentEdges = this._currentEdges.asReadonly();

  // 控制選項 signals - 調整預設值與 React Flow Interaction 範例完全一致
  private _isDraggable = signal<boolean>(false);
  private _isConnectable = signal<boolean>(false);
  private _isSelectable = signal<boolean>(false); // 🔑 確認：預設為 false，與 React Flow Interaction 範例一致
  private _zoomOnScroll = signal<boolean>(false);
  private _zoomOnPinch = signal<boolean>(false);
  private _panOnScroll = signal<boolean>(false);
  private _panOnScrollMode = signal<PanOnScrollMode>(PanOnScrollMode.Free);
  private _zoomOnDoubleClick = signal<boolean>(false);
  private _panOnDrag = signal<boolean>(true);
  private _captureZoomClick = signal<boolean>(false);
  private _captureZoomScroll = signal<boolean>(false);
  private _captureElementClick = signal<boolean>(false);

  // 公開的只讀計算信號
  isDraggable = this._isDraggable.asReadonly();
  isConnectable = this._isConnectable.asReadonly();
  isSelectable = this._isSelectable.asReadonly();
  zoomOnScroll = this._zoomOnScroll.asReadonly();
  zoomOnPinch = this._zoomOnPinch.asReadonly();
  panOnScroll = this._panOnScroll.asReadonly();
  panOnScrollMode = this._panOnScrollMode.asReadonly();
  zoomOnDoubleClick = this._zoomOnDoubleClick.asReadonly();
  panOnDrag = this._panOnDrag.asReadonly();
  captureZoomClick = this._captureZoomClick.asReadonly();
  captureZoomScroll = this._captureZoomScroll.asReadonly();
  captureElementClick = this._captureElementClick.asReadonly();

  // 🔑 條件性事件處理器 - 與 React Flow 完全一致的邏輯
  paneClickHandler = computed(() => 
    this.captureZoomClick() ? this.onPaneClick.bind(this) : undefined
  );
  
  // 🔑 條件性元素點擊處理器 - 與 React Flow 完全一致的格式
  nodeClickHandler = computed(() =>
    this.captureElementClick() 
      ? (data: { event: MouseEvent; node: AngularNode }) => {
          console.log('click', data.node);  // 🔑 React Flow 標準格式
          this.onNodeClick(data.event, data.node);
        }
      : undefined
  );

  edgeClickHandler = computed(() =>
    this.captureElementClick() 
      ? (data: { event: MouseEvent; edge: AngularEdge }) => {
          console.log('click', data.edge);  // 🔑 React Flow 標準格式
          this.onEdgeClick(data.event, data.edge);
        }
      : undefined
  );

  // Controlled mode 事件處理 - 類似 React Flow 的 onNodesChange/onEdgesChange
  
  // 🔑 關鍵修復：處理連接事件，在 controlled 模式下手動添加邊到狀態
  handleConnect(connection: Connection): void {
    console.log('🔗 Connection created:', connection);
    
    // 創建新的 edge 對象 - 使用與 Angular XYFlow 一致的 ID 生成邏輯
    const newEdge: AngularEdge = {
      id: `xy-edge__${connection.source}${connection.sourceHandle || ''}-${connection.target}${connection.targetHandle || ''}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      type: 'default',
    };
    
    // 在 controlled 模式下手動添加到狀態
    console.log('➕ Adding new edge to controlled state:', newEdge);
    this._currentEdges.update(edges => [...edges, newEdge]);
  }

  handleNodesChange(changes: any[]): void {
    // 🔑 Controlled 模式：需要手動應用變更到狀態
    
    // 應用節點變更到當前狀態
    this._currentNodes.update(nodes => {
      return changes.reduce((acc, change) => {
        switch (change.type) {
          case 'select':
            return acc.map((node: AngularNode) => 
              node.id === change.id 
                ? { ...node, selected: change.selected }
                : node
            );
          case 'position':
            return acc.map((node: AngularNode) =>
              node.id === change.id
                ? { 
                    ...node, 
                    position: change.position || node.position,
                    dragging: change.dragging !== undefined ? change.dragging : node.dragging
                  }
                : node
            );
          case 'add':
            return [...acc, change.item];
          case 'remove':
            return acc.filter((node: AngularNode) => node.id !== change.id);
          case 'replace':
            return acc.map((node: AngularNode) =>
              node.id === change.id ? change.item : node
            );
          default:
            return acc;
        }
      }, nodes);
    });
  }

  handleEdgesChange(changes: any[]): void {
    // 🔑 Controlled 模式：需要手動應用變更到狀態
    
    // 應用邊變更到當前狀態
    this._currentEdges.update(edges => {
      return changes.reduce((acc, change) => {
        switch (change.type) {
          case 'select':
            return acc.map((edge: AngularEdge) => 
              edge.id === change.id 
                ? { ...edge, selected: change.selected }
                : edge
            );
          case 'add':
            return [...acc, change.item];
          case 'remove':
            return acc.filter((edge: AngularEdge) => edge.id !== change.id);
          case 'replace':
            return acc.map((edge: AngularEdge) =>
              edge.id === change.id ? change.item : edge
            );
          default:
            return acc;
        }
      }, edges);
    });
  }

  // 事件處理方法
  onNodeDragStart = (event: MouseEvent, node: AngularNode) => {
    // 拖拽開始事件
  };

  onNodeDragStop = (event: MouseEvent, node: AngularNode) => {
    // 拖拽結束事件
  };

  onNodeClick = (event: MouseEvent, node: AngularNode) => {
    // 節點點擊事件
  };

  onEdgeClick = (event: MouseEvent, edge: AngularEdge) => {
    // 邊點擊事件
  };

  onPaneClick = (event: MouseEvent) => {
    // 面板點擊事件
  };

  onPaneScroll = (event?: Event) => {
    // 面板滾動事件
  };

  // 🔑 新增：處理 pane scroll 事件的方法
  handlePaneScroll(data: { event: WheelEvent }): void {
    // 🔑 與 React Flow 完全一致的 console 輸出格式
    console.log('onPaneScroll', data.event);
    this.onPaneScroll(data.event);
  }

  onPaneContextMenu = (event: MouseEvent) => {
    // 面板右鍵選單事件
  };

  onMoveEnd = (data: { event?: MouseEvent | TouchEvent | null; viewport: Viewport }) => {
    // 視窗移動結束事件
  };

  // 🔑 修正：elementsSelectable 和 captureElementClick 應該完全獨立
  // elementsSelectable 控制選擇狀態（由組件內部處理）
  // captureElementClick 只控制是否觸發事件回調
  handleNodeClick(data: { event: MouseEvent; node: AngularNode }): void {
    // ✅ Angular 輸出事件處理（向後兼容，無 console 輸出）
    // 🔑 與 React Flow 一致：只有 captureElementClick=true 時才有 console 輸出
    this.onNodeClick(data.event, data.node);
  }

  handleEdgeClick(data: { event: MouseEvent; edge: AngularEdge }): void {
    // ✅ Angular 輸出事件處理（向後兼容，無 console 輸出）
    // 🔑 與 React Flow 一致：只有 captureElementClick=true 時才有 console 輸出
    this.onEdgeClick(data.event, data.edge);
  }

  handleNodeDragStart(data: { event: MouseEvent; node: AngularNode }): void {
    this.onNodeDragStart(data.event, data.node);
  }

  handleNodeDragStop(data: { event: MouseEvent; node: AngularNode }): void {
    this.onNodeDragStop(data.event, data.node);
  }

  handlePaneClick(data: { event: MouseEvent }): void {
    // 🔑 與 React Flow 完全一致的 Pane 點擊事件
    console.log('onPaneClick', data.event);  // 🔑 React Flow 標準格式
  }

  handleMoveEnd(data: { event?: MouseEvent | TouchEvent | null; viewport: Viewport }): void {
    // 🔑 與 React Flow 完全一致的 console 輸出
    console.log('onMoveEnd', data.viewport);
    this.onMoveEnd(data);
  }

  // 控制選項更新方法
  setIsDraggable(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._isDraggable.set(checked);
  }

  setIsConnectable(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._isConnectable.set(checked);
  }

  setIsSelectable(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._isSelectable.set(checked);
  }

  setZoomOnScroll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._zoomOnScroll.set(checked);
  }

  setZoomOnPinch(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._zoomOnPinch.set(checked);
  }

  setPanOnScroll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._panOnScroll.set(checked);
  }

  setPanOnScrollMode(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as PanOnScrollMode;
    this._panOnScrollMode.set(value);
  }

  setZoomOnDoubleClick(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._zoomOnDoubleClick.set(checked);
  }

  setPanOnDrag(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._panOnDrag.set(checked);
  }

  setCaptureZoomClick(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._captureZoomClick.set(checked);
  }

  setCaptureZoomScroll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._captureZoomScroll.set(checked);
  }

  setCaptureElementClick(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this._captureElementClick.set(checked);
  }
}