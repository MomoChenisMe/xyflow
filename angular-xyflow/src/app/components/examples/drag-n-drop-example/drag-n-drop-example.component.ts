import { 
  Component, 
  signal, 
  viewChild,
  ChangeDetectionStrategy,
  AfterViewInit,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Connection, addEdge } from '@xyflow/system';
import {
  AngularXYFlowComponent,
  ControlsComponent,
  AngularNode,
  AngularEdge,
  AngularXYFlowInstance,
  NodeChange,
  EdgeChange,
} from '../../angular-xyflow';
import { applyNodeChanges, applyEdgeChanges } from '../../angular-xyflow/utils/changes';
import { DragNDropSidebarComponent } from './drag-n-drop-sidebar.component';

@Component({
  selector: 'app-drag-n-drop-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    ControlsComponent,
    DragNDropSidebarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dndflow">
      <div class="wrapper" 
           (drop)="onDrop($event)"
           (dragover)="onDragOver($event)">
        <angular-xyflow
          #angularFlow
          [nodes]="nodes()"
          [edges]="edges()"
          [nodeOrigin]="nodeOrigin"
          (onNodesChange)="onNodesChange($event)"
          (onEdgesChange)="onEdgesChange($event)"
          (onConnect)="onConnect($event)"
          (onInit)="onInit($event)"
        >
          <angular-xyflow-controls />
        </angular-xyflow>
      </div>
      <app-drag-n-drop-sidebar />
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    .dndflow {
      flex-direction: column;
      display: flex;
      height: 100%;
      width: 100%;
    }

    .wrapper {
      flex-grow: 1;
      height: 100%;
      min-height: 0;
    }

    angular-xyflow {
      width: 100%;
      height: 100%;
    }

    app-drag-n-drop-sidebar {
      display: block;
      flex-shrink: 0;
    }

    @media screen and (min-width: 768px) {
      .dndflow {
        flex-direction: row;
      }

      app-drag-n-drop-sidebar {
        width: 20%;
        max-width: 180px;
        height: 100%;
      }
    }
  `]
})
export class DragNDropExampleComponent implements AfterViewInit {
  // 視圖子元素引用
  angularFlow = viewChild.required(AngularXYFlowComponent);

  // 節點原點設置為中心
  readonly nodeOrigin: [number, number] = [0.5, 0.5];

  // 初始節點
  nodes = signal<AngularNode[]>([
    {
      id: '1',
      type: 'input',
      data: { label: 'input node' },
      position: { x: 250, y: 5 },
    },
  ]);

  // 初始邊
  edges = signal<AngularEdge[]>([]);

  // 流實例已初始化標誌
  private flowInitialized = false;
  
  // 節點ID計數器
  private idCounter = 0;

  private getId(): string {
    return `dndnode_${this.idCounter++}`;
  }

  ngAfterViewInit(): void {
    // 組件初始化後，flow 實例就可用了
    this.flowInitialized = true;
  }

  // 初始化
  onInit(event: { nodes: AngularNode[]; edges: AngularEdge[]; viewport: any }): void {
    // onInit 事件觸發時，flow 已準備就緒
    this.flowInitialized = true;
  }

  // 處理節點變更
  onNodesChange(changes: NodeChange<AngularNode>[]): void {
    this.nodes.update(nodes => applyNodeChanges(changes, nodes));
  }

  // 處理邊變更
  onEdgesChange(changes: EdgeChange<AngularEdge>[]): void {
    this.edges.update(edges => applyEdgeChanges(changes, edges));
  }

  // 處理連接
  onConnect(params: Connection): void {
    this.edges.update(edges => addEdge(params, edges));
  }

  // 處理拖動經過
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  // 處理拖放
  onDrop(event: DragEvent): void {
    event.preventDefault();

    const flowComponent = this.angularFlow();
    if (flowComponent && event.dataTransfer) {
      const type = event.dataTransfer.getData('application/reactflow');
      
      // 獲取節點類型，如果沒有則不處理
      if (!type) {
        return;
      }

      // 將螢幕座標轉換為流程座標
      const position = flowComponent.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      // 創建新節點 - 與 React 版本保持一致
      const newNode: AngularNode = {
        id: this.getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      // 更新節點
      this.nodes.update(nds => [...nds, newNode]);
    }
  }
}