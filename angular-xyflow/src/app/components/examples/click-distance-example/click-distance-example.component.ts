import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularXYFlowComponent } from '../../angular-xyflow/angular-xyflow.component';
import { PanelComponent } from '../../angular-xyflow/panel/panel.component';
import { AngularNode, AngularEdge, NodeChange, EdgeChange } from '../../angular-xyflow/types';
import { applyNodeChanges, applyEdgeChanges } from '../../angular-xyflow/utils/changes';
import { Connection, addEdge } from '@xyflow/system';

@Component({
  selector: 'app-click-distance-example',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularXYFlowComponent, PanelComponent],
  template: `
    <angular-xyflow
      [nodes]="nodes()"
      [edges]="edges()"
      [paneClickDistance]="paneClickDistance()"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
      (onPaneClick)="onPaneClick($event)"
    >
      <angular-xyflow-panel position="top-right">
        <div class="angular-xyflow-panel">
          <label for="clickDistance" class="slider-label">
            <input
              id="clickDistance"
              type="range"
              min="0"
              max="100"
              [value]="paneClickDistance()"
              (input)="onDistanceChange($event)"
              class="slider"
            />
            <span>click distance: {{ paneClickDistance() }}</span>
          </label>
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
    `,
  ],
})
export class ClickDistanceExampleComponent {
  // 點擊距離的信號
  paneClickDistance = signal(0);

  // 初始節點配置 - 轉為 controlled mode 信號
  nodes = signal<AngularNode[]>([
    {
      id: '1a',
      type: 'input',
      data: { label: 'Node 1' } as Record<string, unknown>,
      position: { x: 250, y: 5 },
      ariaLabel: 'Input Node 1',
    },
    {
      id: '2a',
      data: { label: 'Node 2' } as Record<string, unknown>,
      position: { x: 100, y: 100 },
      ariaLabel: 'Default Node 2',
    },
    {
      id: '3a',
      data: { label: 'Node 3' } as Record<string, unknown>,
      position: { x: 400, y: 100 },
    },
    {
      id: '4a',
      data: { label: 'Node 4' } as Record<string, unknown>,
      position: { x: 400, y: 200 },
    },
  ]);

  // 初始邊配置 - 轉為 controlled mode 信號
  edges = signal<AngularEdge[]>([
    { id: 'e1-2', source: '1a', target: '2a', ariaLabel: undefined },
    { id: 'e1-3', source: '1a', target: '3a' },
  ]);

  // Controlled mode event handlers
  onNodesChange(changes: NodeChange<AngularNode>[]): void {
    this.nodes.update(nodes => applyNodeChanges(changes, nodes));
  }

  onEdgesChange(changes: EdgeChange<AngularEdge>[]): void {
    this.edges.update(edges => applyEdgeChanges(changes, edges));
  }

  // 處理距離變更
  onDistanceChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.paneClickDistance.set(Number(target.value));
  }

  // 處理連接事件 - 使用 controlled mode
  onConnect(params: Connection): void {
    this.edges.update(edges => addEdge(params, edges));
  }

  // 處理面板點擊
  onPaneClick(data: { event: MouseEvent }): void {
  }
}
