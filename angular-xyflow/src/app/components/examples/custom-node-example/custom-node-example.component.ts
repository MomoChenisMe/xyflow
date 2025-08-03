// Angular 核心模組
import {
  Component,
  signal,
  viewChild,
  computed,
  effect,
  ChangeDetectionStrategy,
  inject,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Connection, Position, addEdge } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  BackgroundComponent,
  ControlsComponent,
  PanelComponent,
  MinimapComponent,
  HandleComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  AngularXYFlowInstance,
  NodeTemplateDirective,
  MinimapNodeTemplateDirective,
} from '../../angular-xyflow';
// 自定義節點數據類型
export interface ColorSelectorNodeData extends Record<string, unknown> {
  color: string;
  onChange: (event: Event) => void;
}
// import { CustomViewportComponent } from './custom-viewport.component'; // 不再需要，因為我們修改了現有的 NodeWrapperComponent

@Component({
  selector: 'app-custom-node-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    MinimapComponent,
    NodeTemplateDirective,
    MinimapNodeTemplateDirective,
    HandleComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [nodes]="nodes()"
      [edges]="edges()"
      [minZoom]="0.3"
      [maxZoom]="2"
      [fitView]="true"
      [connectionLineStyle]="connectionLineStyle"
      className="angular-xyflow-custom-node-example"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onNodeClick)="onNodeClick($event)"
      (onNodeDragStop)="onNodeDragStop($event)"
      (onConnect)="onConnect($event)"
    >
      <!-- 自定義背景，顏色會動態變更 -->
      <angular-xyflow-background
        [variant]="backgroundVariant.Dots"
        [bgColor]="bgColor()"
      />

      <!-- 自定義 MiniMap，支援節點顏色變更 -->
      <angular-xyflow-minimap [pannable]="true" [zoomable]="true">
        <!-- 自定義 minimap 節點模板 - 根據節點類型顯示不同顏色 -->
        <ng-template
          angularXyFlowMinimapNode
          let-node="node"
          let-x="x"
          let-y="y"
          let-width="width"
          let-height="height"
          let-selected="selected"
        >
          <svg:rect
            [attr.x]="x"
            [attr.y]="y"
            [attr.width]="width"
            [attr.height]="height"
            [attr.fill]="getMinimapNodeColor(node)"
            [attr.stroke]="getMinimapNodeStrokeColor(node)"
            [attr.stroke-width]="selected ? 2 : 1"
            class="custom-color-node"
          />
        </ng-template>
      </angular-xyflow-minimap>

      <angular-xyflow-controls />

      <!-- 自定義節點模板 - 顏色選擇器節點 -->
      <ng-template
        angularXyFlowNodeTemplate
        let-node="node"
        let-selected="selected"
        let-dragging="dragging"
        let-onColorChange="onColorChange"
        let-onConnectStart="onConnectStart"
        let-onConnectEnd="onConnectEnd"
        let-onHandleClick="onHandleClick"
      >
        <!-- Target handle (左側) -->
        <angular-xyflow-handle
          type="target"
          [position]="Position.Left"
          [nodeId]="node.id"
          [isConnectable]="node.connectable !== false"
          [style]="{ background: '#555' }"
          (connectStart)="onConnectStart && onConnectStart($event)"
          (connectEnd)="onConnectEnd && onConnectEnd($event)"
          (handleClick)="onHandleClick && onHandleClick($event)"
        />

        <!-- 節點內容 -->
        <div class="color-selector-content">
          <div>
            Custom Color Picker Node:
            <strong>{{ node.data['color'] || '#1A192B' }}</strong>
          </div>
          <input
            class="nodrag color-picker"
            type="color"
            [value]="node.data['color'] || '#1A192B'"
            (input)="onColorChange && onColorChange($event)"
          />
        </div>

        <!-- Source handles (右側) -->
        <angular-xyflow-handle
          type="source"
          [position]="Position.Right"
          [nodeId]="node.id"
          [handleId]="'a'"
          [isConnectable]="node.connectable !== false"
          [style]="{ background: '#555', top: '10px' }"
          (connectStart)="onConnectStart && onConnectStart($event)"
          (connectEnd)="onConnectEnd && onConnectEnd($event)"
          (handleClick)="onHandleClick && onHandleClick($event)"
        />
        <angular-xyflow-handle
          type="source"
          [position]="Position.Right"
          [nodeId]="node.id"
          [handleId]="'b'"
          [isConnectable]="node.connectable !== false"
          [style]="{ background: '#555', bottom: '10px', top: 'auto' }"
          (connectStart)="onConnectStart && onConnectStart($event)"
          (connectEnd)="onConnectEnd && onConnectEnd($event)"
          (handleClick)="onHandleClick && onHandleClick($event)"
        />
      </ng-template>
    </angular-xyflow>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      angular-xyflow {
        width: 100%;
        height: 100%;
      }

      .angular-xyflow-panel {
        padding: 12px;
        min-width: 240px;
      }

      .info-panel {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .info-panel h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;
      }

      .info-panel p {
        margin: 8px 0;
        font-size: 14px;
        color: #666;
        line-height: 1.4;
      }

      .info-panel ul {
        margin: 8px 0;
        padding-left: 20px;
        font-size: 14px;
        color: #666;
      }

      .info-panel li {
        margin: 4px 0;
        line-height: 1.4;
      }

      .info-panel strong {
        color: #333;
        font-weight: 600;
      }

      /* 自定義顏色選擇器節點樣式 - 與React版本保持一致 */
      .color-selector-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        width: auto;
        font-size: 12px;
        text-align: center;
        /* 邊框和背景在節點層級設定，不在內容層級 */
      }

      .color-picker {
        width: 50px;
        height: 25px;
        border: 1px solid #ccc;
        border-radius: 3px;
        cursor: pointer;
        flex-shrink: 0;
      }

      /* nodrag 類防止拖拽時移動節點 */
      .nodrag {
        pointer-events: auto;
      }
    `,
  ],
})
export class CustomNodeExampleComponent {
  // 視圖子元素引用
  readonly angularFlow = viewChild.required(AngularXYFlowComponent);

  // 背景變體枚舉
  readonly backgroundVariant = BackgroundVariant;

  // Position 枚舉供模板使用
  readonly Position = Position;

  // 初始背景顏色（與 React 版本一致）
  private readonly initBgColor = '#1A192B';

  // 連接線樣式（與 React 版本一致）
  readonly connectionLineStyle = { stroke: '#fff' };

  // 背景顏色信號
  readonly bgColor = signal<string>(this.initBgColor);

  // 節點和邊的信號
  readonly nodes = signal<AngularNode[]>([]);
  readonly edges = signal<AngularEdge[]>([]);

  // 獲取流程實例
  private get _flow(): AngularXYFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  constructor() {
    // 初始化節點和邊（與 React 版本相似）
    effect(() => {
      this.initializeFlow();
    });
  }

  // 初始化 Flow 數據
  private initializeFlow(): void {
    // 創建顏色變更處理函數
    const onChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const color = target.value;

      // 更新背景顏色
      this.bgColor.set(color);

      // 更新節點數據
      this._flow.setNodes((nodes: AngularNode[]) =>
        nodes.map((node) => {
          if (node.id !== '2' || node.type !== 'selectorNode') {
            return node;
          }

          return {
            ...node,
            data: {
              ...node.data,
              color,
            },
          } as AngularNode;
        })
      );
    };

    // 設置初始節點（與 React 版本相同結構）
    const initialNodes: AngularNode[] = [
      {
        id: '1',
        type: 'input',
        data: { label: 'An input node' },
        position: { x: 0, y: 50 },
        sourcePosition: Position.Right,
      },
      {
        id: '2',
        type: 'selectorNode',
        data: {
          onChange: onChange,
          color: this.initBgColor,
        } as ColorSelectorNodeData,
        style: { border: '1px solid #777', padding: 10 },
        position: { x: 250, y: 50 },
      },
      {
        id: '3',
        type: 'output',
        data: { label: 'Output A' },
        position: { x: 550, y: 25 },
        targetPosition: Position.Left,
      },
      {
        id: '4',
        type: 'output',
        data: { label: 'Output B' },
        position: { x: 550, y: 100 },
        targetPosition: Position.Left,
      },
    ];

    // 設置初始邊（與 React 版本相同）
    const initialEdges: AngularEdge[] = [
      {
        id: 'e1-2',
        source: '1',
        target: '2',
        animated: true,
        style: { stroke: '#fff' },
      },
      {
        id: 'e2a-3',
        source: '2',
        sourceHandle: 'a',
        target: '3',
        animated: true,
        style: { stroke: '#fff' },
      },
      {
        id: 'e2b-4',
        source: '2',
        sourceHandle: 'b',
        target: '4',
        animated: true,
        style: { stroke: '#fff' },
      },
    ];

    this.nodes.set(initialNodes);
    this.edges.set(initialEdges);
  }

  // 事件處理方法
  onNodesChange(nodes: AngularNode[]): void {
    this.nodes.set(nodes);
  }

  onEdgesChange(edges: AngularEdge[]): void {
    this.edges.set(edges);
  }

  onConnect(connection: Connection): void {
    // 使用與 React Flow 相同的模式：addEdge with spread operator
    this._flow.setEdges((edges: AngularEdge[]) => {
      const newEdges = addEdge(
        {
          ...connection,
          animated: true,
          style: { stroke: '#fff' },
        },
        edges
      ) as AngularEdge[];

      return newEdges;
    });
  }

  onNodeClick(data: { event: MouseEvent; node: AngularNode }): void {
    console.log('click', data.node);
  }

  onNodeDragStop(data: {
    event: MouseEvent;
    node: AngularNode;
    nodes: AngularNode[];
  }): void {
    console.log('drag stop', data.node);
  }

  // Minimap 節點顏色邏輯 - 根據節點類型獲取顏色
  getMinimapNodeColor(node: any): string {
    if (node.type === 'selectorNode') {
      const nodeData = node.data as ColorSelectorNodeData;
      return nodeData?.color || this.bgColor();
    }
    return '#fff';
  }

  // Minimap 節點邊框顏色邏輯 - 根據節點類型獲取邊框顏色
  getMinimapNodeStrokeColor(node: any): string {
    if (node.type === 'input') return '#0041d0';
    if (node.type === 'selectorNode') {
      const nodeData = node.data as ColorSelectorNodeData;
      return nodeData?.color || this.bgColor();
    }
    if (node.type === 'output') return '#ff0072';
    return '#eee';
  }
}
