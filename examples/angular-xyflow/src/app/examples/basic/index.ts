import { Component, signal, inject, ChangeDetectionStrategy, computed, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// 導入 AngularFlow 相關組件 (對應 React Flow 組件)
import { AngularFlowComponent } from '../../components/container/ReactFlow/angular-flow.component';
import { BackgroundComponent } from '../../components/additional-components/Background/background.component';
import { MiniMapComponent } from '../../components/additional-components/MiniMap/minimap.component';
import { ControlsComponent } from '../../components/additional-components/Controls/controls.component';
import { PanelComponent } from '../../components/components/Panel/panel.component';

// 導入類型和服務
import { AngularNode } from '../../components/types/nodes';
import { AngularEdge } from '../../components/types/edges';
import { BackgroundVariant } from '../../components/types/constants';
import { ViewportService } from '../../components/hooks/viewport.service';
import { FlowStoreService } from '../../components/store/flow-store.service';
import { Connection } from '../../components/components/Handle/handle.types';

/**
 * Angular Basic 範例
 * 對應 React 的 /examples/react/src/examples/Basic/index.tsx
 *
 * 主要功能：
 * - 基本的節點和邊線展示
 * - 拖拽操作
 * - 節點選擇
 * - 視窗控制
 * - 動態節點操作
 */

@Component({
  selector: 'angular-flow-basic',
  standalone: true,
  imports: [
    CommonModule,
    AngularFlowComponent,
    BackgroundComponent,
    MiniMapComponent,
    ControlsComponent,
    PanelComponent
  ],
  providers: [FlowStoreService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="xy-flow-basic-example" style="width: 100%; height: 100%; position: relative;">
      <angular-flow
        [nodes]="nodes()"
        [edges]="edges()"
        [viewport]="currentViewport()"
        [minZoom]="0.2"
        [maxZoom]="4"
        [fitView]="true"
        [fitViewOptions]="fitViewOptions"
        [nodesDraggable]="true"
        [selectNodesOnDrag]="false"
        [elevateEdgesOnSelect]="true"
        [elevateNodesOnSelect]="false"
        [nodeDragThreshold]="0"
        (onNodesChange)="onNodesChange($event)"
        (onNodePositionChange)="onNodePositionChange($event)"
        [style.border]="'2px solid blue'"
        (onNodeClick)="onNodeClick($event)"
        (onNodeDragStop)="onNodeDragStop($event)"
        (onNodeDragStart)="onNodeDragStart($event)"
        (onNodeDrag)="onNodeDrag($event)"
        (onSelectionDragStart)="onSelectionDragStart($event)"
        (onSelectionDrag)="onSelectionDrag($event)"
        (onSelectionDragStop)="onSelectionDragStop($event)"
        (onConnect)="onConnect($event)"
        (onViewportChange)="handleViewportChange($event)"
        (onMove)="handleMove($event)"
        (onMoveStart)="handleMoveStart($event)"
        (onMoveEnd)="handleMoveEnd($event)"
        className="react-flow-basic-example"
        style="width: 100%; height: 100%;"
      >
        <!-- Background -->
        <xy-background 
          [variant]="backgroundVariant.Dots"
          [transform]="[currentViewport().x, currentViewport().y, currentViewport().zoom]"
          [rfId]="'angular-flow-1'"
        ></xy-background>

        <!-- MiniMap -->
        <xy-minimap 
          [nodeLookup]="nodeLookup()"
          [transform]="transform()"
          [width]="800"
          [height]="600"
          [translateExtent]="[[-1000, -1000], [1000, 1000]]"
          [rfId]="'angular-flow-1'"
          [ariaLabelConfig]="{}"
        ></xy-minimap>

        <!-- Controls -->
        <xy-controls
          [showZoom]="true"
          [showFitView]="true"
          [showInteractive]="true"
          [isInteractive]="isInteractive()"
          [minZoomReached]="minZoomReached()"
          [maxZoomReached]="maxZoomReached()"
          (onZoomIn)="handleZoomIn()"
          (onZoomOut)="handleZoomOut()"
          (onFitView)="handleFitView()"
          (onInteractiveChange)="handleToggleInteractive()"
        ></xy-controls>

        <!-- Control Panel -->
        <xy-panel position="top-right">
          <div class="button-panel">
            <button (click)="resetTransform()">reset transform</button>
            <button (click)="updatePos()">change pos</button>
            <button (click)="toggleClassnames()">toggle classnames</button>
            <button (click)="logToObject()">toObject</button>
            <button (click)="deleteSelectedElements()">deleteSelectedElements</button>
            <button (click)="deleteSomeElements()">deleteSomeElements</button>
            <button (click)="onSetNodes()">setNodes</button>
            <button (click)="onUpdateNode()">updateNode</button>
            <button (click)="addNode()">addNode</button>
          </div>
        </xy-panel>
      </angular-flow>
    </div>
  `,
  styles: [`
    :host {
      width: 100%;
      height: 100%;
      display: block;
    }
    
    .xy-flow-basic-example {
      width: 100%;
      height: 100%;
      position: relative;
    }

    .button-panel {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .button-panel button {
      padding: 5px 10px;
      border: 1px solid #eee;
      background: #fefefe;
      border-radius: 3px;
      cursor: pointer;
      font-size: 11px;
      color: inherit;
      display: block;
      width: 100%;
      min-width: 140px;
      text-align: left;
      white-space: nowrap;
      transition: background-color 0.2s ease;
    }

    .button-panel button:hover {
      background: #f4f4f4;
    }
    
    .button-panel button:active {
      background: #e8e8e8;
    }

    /* Ensure angular-flow and child components take full size */
    :host ::ng-deep angular-flow {
      display: block;
      width: 100%;
      height: 100%;
    }

    :host ::ng-deep .react-flow {
      width: 100%;
      height: 100%;
    }
  `]
})
export class BasicExample {
  // 注入服務
  private viewportService = inject(ViewportService);
  private flowStoreService = inject(FlowStoreService);
  private cdr = inject(ChangeDetectorRef);

  // 常數
  public backgroundVariant = BackgroundVariant;

  // 初始節點數據 (對應 React 版本的 initialNodes)
  public initialNodes: AngularNode[] = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
      className: 'light',
    },
    {
      id: '2',
      data: { label: 'Node 2' },
      position: { x: 100, y: 100 },
      className: 'light',
    },
    {
      id: '3',
      data: { label: 'Node 3' },
      position: { x: 400, y: 100 },
      className: 'light',
    },
    {
      id: '4',
      data: { label: 'Node 4' },
      position: { x: 400, y: 200 },
      className: 'light',
    },
  ];

  // 初始邊線數據 (對應 React 版本的 initialEdges)
  public initialEdges: AngularEdge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3' },
  ];

  // 響應式狀態
  public nodes = signal<AngularNode[]>(this.initialNodes);
  public edges = signal<AngularEdge[]>(this.initialEdges);
  public isInteractive = signal<boolean>(true);
  public currentViewport = signal({ x: 0, y: 0, zoom: 1 });

  // 計算屬性 for Controls component
  public minZoomReached = computed(() => {
    return this.currentViewport().zoom <= 0.2;
  });

  public maxZoomReached = computed(() => {
    return this.currentViewport().zoom >= 4;
  });

  // fitView 選項 (對應 React 版本)
  public fitViewOptions = {
    padding: { top: '100px', left: '0%', right: '10%', bottom: 0.1 }
  };

  // MiniMap required properties
  public nodeLookup = computed(() => {
    const nodes = this.nodes();
    const lookup = new Map();
    nodes.forEach((node, index) => {
      lookup.set(node.id, {
        internals: {
          userNode: node,
          positionAbsolute: node.position,
          z: index
        }
      });
    });
    return lookup;
  });

  public transform = computed((): [number, number, number] => {
    const viewport = this.currentViewport();
    return [viewport.x, viewport.y, viewport.zoom];
  });

  // 事件處理器 (對應 React 版本的事件處理)
  onNodeDrag(event: any) {
    console.log('drag', event.node, event.nodes);
    // 注意：NodeRenderer 已經處理了位置更新，這裡只需要記錄日誌
  }

  onNodeDragStart(event: any) {
    console.log('drag start', event.node, event.nodes);
  }

  onNodeDragStop(event: any) {
    console.log('drag stop', event.node, event.nodes);
  }

  onNodeClick(event: any) {
    console.log('click', event.node);
  }

  onNodesChange(nodes: any[]) {
    console.log('🔥 BasicExample onNodesChange called with', nodes.length, 'nodes');
    console.log('🔥 Event received successfully in BasicExample!');
    
    // 檢查節點位置是否真的有變化
    const currentNodes = this.nodes();
    const positionChanged = nodes.some((newNode, index) => {
      const oldNode = currentNodes.find(n => n.id === newNode.id);
      if (oldNode) {
        const changed = oldNode.position.x !== newNode.position.x || oldNode.position.y !== newNode.position.y;
        if (changed) {
          console.log(`Node ${newNode.id} position changed from (${oldNode.position.x}, ${oldNode.position.y}) to (${newNode.position.x}, ${newNode.position.y})`);
        }
        return changed;
      }
      return false;
    });
    
    if (positionChanged) {
      console.log('✅ Position changed - updating nodes signal');
    }
    
    // 🔥 CRITICAL: Update internal nodes to reflect position changes
    // This is similar to React's controlled mode where you handle onNodesChange
    this.nodes.set(nodes as AngularNode[]);
    
    // 手動觸發變更檢測以確保 UI 更新
    this.cdr.markForCheck();
  }

  onSelectionDragStart(event: any) {
    console.log('selection drag start', event.nodes);
  }

  onSelectionDrag(event: any) {
    console.log('selection drag', event.nodes);
    // 注意：NodeRenderer 已經處理了選擇拖拉的位置更新
  }

  onSelectionDragStop(event: any) {
    console.log('selection drag stop', event.nodes);
  }

  onConnect(connection: Connection) {
    console.log('onConnect', connection);
    const newEdge: AngularEdge = {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
    };
    this.edges.update(edges => [...edges, newEdge]);
  }

  onNodePositionChange(event: { node: any; position: { x: number; y: number } }) {
    console.log('🎯 BasicExample onNodePositionChange called:', {
      nodeId: event.node.id,
      oldPosition: event.node.position,
      newPosition: event.position
    });
    
    // Update the specific node's position in the nodes signal
    this.nodes.update(nodes =>
      nodes.map(n => 
        n.id === event.node.id 
          ? { ...n, position: event.position }
          : n
      )
    );
    
    // 手動觸發變更檢測以確保 UI 更新
    this.cdr.markForCheck();
    
    console.log('✅ BasicExample updated node position successfully');
  }

  // 控制方法 (對應 React 版本的控制方法)

  /**
   * 更新節點位置 - 隨機重新排列所有節點
   */
  updatePos() {
    this.nodes.update(nodes =>
      nodes.map(node => ({
        ...node,
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
      }))
    );
  }

  /**
   * 記錄當前流程對象到控制台
   */
  logToObject() {
    const flowObject = {
      nodes: this.nodes(),
      edges: this.edges(),
      viewport: this.viewportService.getViewport()
    };
    console.log(flowObject);
  }

  /**
   * 重置視窗變換
   */
  resetTransform() {
    this.viewportService.setViewport({ x: 0, y: 0, zoom: 1 });
  }

  /**
   * 切換節點類名 (淺色/深色主題)
   */
  toggleClassnames() {
    this.nodes.update(nodes =>
      nodes.map(node => ({
        ...node,
        className: node.className === 'light' ? 'dark' : 'light',
      }))
    );
  }

  /**
   * 刪除選中的元素
   */
  deleteSelectedElements() {
    const selectedNodes = this.nodes().filter(node => node.selected);
    const selectedEdges = this.edges().filter(edge => edge.selected);

    if (selectedNodes.length > 0) {
      this.nodes.update(nodes =>
        nodes.filter(node => !selectedNodes.some(selected => selected.id === node.id))
      );
    }

    if (selectedEdges.length > 0) {
      this.edges.update(edges =>
        edges.filter(edge => !selectedEdges.some(selected => selected.id === edge.id))
      );
    }
  }

  /**
   * 刪除特定元素
   */
  deleteSomeElements() {
    // 刪除節點 '2' 和邊線 'e1-3'
    this.nodes.update(nodes => nodes.filter(node => node.id !== '2'));
    this.edges.update(edges => edges.filter(edge => edge.id !== 'e1-3'));
  }

  /**
   * 設置新的節點和邊線集合
   */
  onSetNodes() {
    this.nodes.set([
      { id: 'a', position: { x: 0, y: 0 }, data: { label: 'Node a' } },
      { id: 'b', position: { x: 0, y: 150 }, data: { label: 'Node b' } },
    ]);

    this.edges.set([{ id: 'a-b', source: 'a', target: 'b' }]);

    // 調用 fitView
    this.viewportService.fitView();
  }

  /**
   * 更新特定節點的數據
   */
  onUpdateNode() {
    this.nodes.update(nodes =>
      nodes.map(node => {
        if (node.id === '1' || node.id === '2') {
          return {
            ...node,
            data: { ...node.data, label: 'update' }
          };
        }
        return node;
      })
    );
  }

  /**
   * 添加新節點
   */
  addNode() {
    const newNode: AngularNode = {
      id: `${Math.random()}`,
      data: { label: 'Node' },
      position: { x: Math.random() * 300, y: Math.random() * 300 },
      className: 'light',
    };

    this.nodes.update(nodes => [...nodes, newNode]);
    this.viewportService.fitView();
  }

  /**
   * Controls 事件處理器 (直接更新 viewport)
   */
  handleZoomIn() {
    this.currentViewport.update(viewport => ({
      ...viewport,
      zoom: Math.min(4, viewport.zoom * 1.2)
    }));
    console.log('Zoom in to:', this.currentViewport().zoom);
  }

  handleZoomOut() {
    this.currentViewport.update(viewport => ({
      ...viewport,
      zoom: Math.max(0.2, viewport.zoom * 0.8)
    }));
    console.log('Zoom out to:', this.currentViewport().zoom);
  }

  handleFitView() {
    // Simple fit view implementation
    this.currentViewport.set({ x: 0, y: 0, zoom: 1 });
    console.log('Fit view reset');
  }

  handleToggleInteractive() {
    this.isInteractive.update(state => !state);
    console.log('Interactive state:', this.isInteractive() ? 'Unlocked' : 'Locked');
  }

  // === Viewport/Move Event Handlers (matching React Flow behavior) ===

  handleViewportChange(viewport: { x: number; y: number; zoom: number }) {
    this.currentViewport.set(viewport);
    console.log('Viewport changed:', viewport);
  }

  handleMove(event: { viewport: { x: number; y: number; zoom: number } }) {
    this.currentViewport.set(event.viewport);
    console.log('Move:', event.viewport);
  }

  handleMoveStart(event: { viewport: { x: number; y: number; zoom: number } }) {
    console.log('Move start:', event.viewport);
  }

  handleMoveEnd(event: { viewport: { x: number; y: number; zoom: number } }) {
    console.log('Move end:', event.viewport);
  }
}
