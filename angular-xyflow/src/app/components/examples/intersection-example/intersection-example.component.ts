import {
  Component,
  signal,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AngularXYFlowComponent,
  BackgroundComponent,
  ControlsComponent,
  MinimapComponent,
  AngularNode,
  AngularEdge,
  NodeChange,
} from '../../angular-xyflow';
import { applyNodeChanges } from '../../angular-xyflow/utils/changes';

@Component({
  selector: 'app-intersection-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    MinimapComponent,
    ControlsComponent,
    BackgroundComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [nodes]="nodes()"
      [edges]="edges()"
      [minZoom]="0.2"
      [maxZoom]="4"
      [fitView]="true"
      [selectNodesOnDrag]="false"
      (onNodesChange)="onNodesChange($event)"
      (onNodeClick)="onNodeClick($event)"
      (onNodeDrag)="onNodeDrag($event)"
      (onNodeDragStop)="onNodeDragStop($event)"
    >
      <angular-xyflow-background></angular-xyflow-background>
      <angular-xyflow-minimap></angular-xyflow-minimap>
      <angular-xyflow-controls></angular-xyflow-controls>
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

      h2 {
        margin: 0 0 10px 0;
        color: #333;
      }

      p {
        margin: 0 0 20px 0;
        color: #666;
        font-size: 14px;
      }

      /* 高亮效果樣式 */
      ::ng-deep .highlight {
        box-shadow: 0 0 0 2px #ee3a73 !important;
      }

    `,
  ],
})
export class IntersectionExampleComponent {
  // 初始節點數據 - 與 React 範例完全一致
  nodes = signal<AngularNode[]>([
    {
      id: '0',
      data: { label: 'rectangle' },
      position: { x: 0, y: 0 },
      width: 100,
      height: 100,
      draggable: false,
      style: {
        opacity: 0.5,
      },
    },
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 0, y: 0 },
      width: 200,
      height: 100,
    },
    {
      id: '2',
      data: { label: 'Node 2' },
      position: { x: 0, y: 150 },
    },
    {
      id: '3',
      data: { label: 'Node 3' },
      position: { x: 250, y: 0 },
    },
    {
      id: '4',
      data: { label: 'Node' },
      position: { x: 350, y: 150 },
      style: {
        width: 50,
        height: 50,
      },
    },
  ]);

  // 初始邊數據 - 與 React 範例一致（空陣列）
  edges = signal<AngularEdge[]>([]);

  // Flow 組件引用
  angularFlow = viewChild<AngularXYFlowComponent>('angularFlow');

  /**
   * 節點變化事件處理 - Controlled 模式必需
   * 處理節點位置、選擇狀態等變化
   */
  onNodesChange(changes: NodeChange<AngularNode>[]): void {
    // 使用標準的 applyNodeChanges 工具函數
    this.nodes.update((nodes) => applyNodeChanges(changes, nodes));
  }

  /**
   * 節點點擊事件處理 - 與 React 範例一致
   */
  onNodeClick(event: { event: MouseEvent; node: AngularNode }): void {
    console.log('click', event.node);
  }

  /**
   * 節點拖拽事件處理 - 核心交集檢測功能
   * 與 React 範例的 onNodeDrag 回調完全一致
   * Controlled 模式：直接更新 Signal 狀態
   */
  onNodeDrag(event: { event: MouseEvent; node: AngularNode }): void {
    const draggedNode = event.node;

    // 獲取流組件和服務實例
    const flowComponent = this.angularFlow();
    if (!flowComponent) return;

    const flowService = flowComponent['_flowService']; // 訪問私有服務實例

    // 檢測與其他節點的交集
    const intersectingNodes = flowService.getIntersectingNodes(draggedNode);
    const intersectionIds = intersectingNodes.map((n: any) => n.id);

    // 檢測與固定區域的交集（範例中的固定矩形）
    const isIntersecting = flowService.isNodeIntersecting(draggedNode, {
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    });

    // 輸出到控制台（與 React 範例一致）
    console.log('isIntersecting:', isIntersecting);

    // Controlled 模式：更新 Signal 狀態而不是直接調用 flowInstance.updateNode
    this.nodes.update((currentNodes) =>
      currentNodes.map((node) => {
        const shouldHighlight = intersectionIds.includes(node.id);
        const updatedClassName = shouldHighlight ? 'highlight' : '';

        // 只在 className 發生變化時才更新
        if (node.className !== updatedClassName) {
          return {
            ...node,
            className: updatedClassName,
          };
        }
        return node;
      })
    );
  }

  /**
   * 節點拖拽停止事件處理 - 與 React 範例一致
   * Controlled 模式：更新 Signal 狀態清除高亮
   */
  onNodeDragStop(event: { event: MouseEvent; node: AngularNode }): void {
    console.log('drag stop', event.node);

    // Controlled 模式：清除所有高亮效果
    this.nodes.update((currentNodes) =>
      currentNodes.map((node) => {
        if (node.className === 'highlight') {
          return {
            ...node,
            className: '',
          };
        }
        return node;
      })
    );
  }
}
