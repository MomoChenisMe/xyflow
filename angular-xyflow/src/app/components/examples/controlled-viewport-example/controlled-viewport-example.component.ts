import { Component, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularXYFlowComponent } from '../../angular-xyflow/angular-xyflow.component';
import { BackgroundComponent } from '../../angular-xyflow/background/background.component';
import { ControlsComponent } from '../../angular-xyflow/controls/controls.component';
import { MinimapComponent } from '../../angular-xyflow/minimap/minimap.component';
import { PanelComponent } from '../../angular-xyflow/panel/panel.component';
import {
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  Viewport,
  NodeChange,
  EdgeChange,
} from '../../angular-xyflow/types';
import { applyNodeChanges, applyEdgeChanges } from '../../angular-xyflow/utils/changes';
import { Connection, addEdge } from '@xyflow/system';

@Component({
  selector: 'app-controlled-viewport-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    MinimapComponent,
    PanelComponent,
  ],
  template: `
    <angular-xyflow
      #angularFlow
      [nodes]="nodes()"
      [edges]="edges()"
      [className]="'controlled-viewport-flow'"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
    >
      <angular-xyflow-background [variant]="backgroundVariant.Dots" />
      <angular-xyflow-minimap />
      <angular-xyflow-controls />

      <angular-xyflow-panel position="top-left">
        <div class="angular-xyflow-panel">
          <button (click)="updateViewport()" class="flow-button">
            update viewport
          </button>
          <button (click)="fitView()" class="flow-button">fitView</button>
          <button (click)="toggleViewport()" class="flow-button">
            toggle viewport
          </button>
        </div>
      </angular-xyflow-panel>
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

      .controlled-viewport-flow {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
          sans-serif;
      }

      /* 使用與 basic 範例相同的樣式 */
    `,
  ],
})
export class ControlledViewportExampleComponent {
  // 背景變體枚舉
  backgroundVariant = BackgroundVariant;

  // Angular Flow 組件引用
  angularFlow = viewChild.required<AngularXYFlowComponent>('angularFlow');

  // 視口狀態管理
  private viewport1 = signal<Viewport>({ x: 0, y: 0, zoom: 1 });
  private viewport2 = signal<Viewport>({ x: 100, y: 100, zoom: 1.5 });
  currentViewportIndex = signal(0);

  // 節點狀態 - 轉為 controlled mode 信號
  nodes = signal<AngularNode[]>([
    {
      id: '1a',
      type: 'input',
      data: { label: 'Node 1' } as Record<string, unknown>,
      position: { x: 250, y: 5 },
      className: 'light',
    },
    {
      id: '2a',
      data: { label: 'Node 2' } as Record<string, unknown>,
      position: { x: 100, y: 100 },
      className: 'light',
    },
    {
      id: '3a',
      data: { label: 'Node 3' } as Record<string, unknown>,
      position: { x: 400, y: 100 },
      className: 'light',
    },
    {
      id: '4a',
      data: { label: 'Node 4' } as Record<string, unknown>,
      position: { x: 400, y: 200 },
      className: 'light',
    },
  ]);

  // 邊狀態 - 轉為 controlled mode 信號
  edges = signal<AngularEdge[]>([
    { id: 'e1-2', source: '1a', target: '2a' },
    { id: 'e1-3', source: '1a', target: '3a' },
  ]);

  // Controlled mode event handlers
  onNodesChange(changes: NodeChange<AngularNode>[]): void {
    this.nodes.update(nodes => applyNodeChanges(changes, nodes));
  }

  onEdgesChange(changes: EdgeChange<AngularEdge>[]): void {
    this.edges.update(edges => applyEdgeChanges(changes, edges));
  }

  onConnect(connection: Connection): void {
    this.edges.update(edges => addEdge(connection, edges));
  }

  constructor() {
    // 初始化時設置第一個視口
    setTimeout(() => {
      this.angularFlow().setViewport(this.viewport1());
    }, 0);
  }

  // 更新當前視口的 y 坐標 - 與 React 版本行為一致
  updateViewport(): void {
    const currentIndex = this.currentViewportIndex();
    const flow = this.angularFlow();
    
    // 獲取當前實際的視口狀態（包含 fitView 後的 zoom 等變化）
    const currentActualViewport = flow.getViewport();
    const updated = { ...currentActualViewport, y: currentActualViewport.y + 10 };
    
    // 更新實際視口
    flow.setViewport(updated);
    
    // 同步更新對應的 signal 狀態以保持一致性
    if (currentIndex === 0) {
      this.viewport1.set(updated);
    } else {
      this.viewport2.set(updated);
    }
  }

  // 適合視圖 - 使用 panZoomService.fitView() 方法，與 React 版本邏輯一致
  fitView(): void {
    this.angularFlow().performFitView();
  }

  // 切換視口 - 與 React 版本行為一致
  toggleViewport(): void {
    const newIndex = this.currentViewportIndex() === 0 ? 1 : 0;
    this.currentViewportIndex.set(newIndex);

    // 立即應用新視口
    const flow = this.angularFlow();
    const targetViewport = newIndex === 0 ? this.viewport1() : this.viewport2();
    flow.setViewport(targetViewport);
  }
}
