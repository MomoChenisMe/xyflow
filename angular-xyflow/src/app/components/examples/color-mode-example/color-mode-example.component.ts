import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularXYFlowComponent } from '../../angular-xyflow/angular-xyflow.component';
import { BackgroundComponent } from '../../angular-xyflow/background/background.component';
import { ControlsComponent } from '../../angular-xyflow/controls/controls.component';
import { MinimapComponent } from '../../angular-xyflow/minimap/minimap.component';
import { PanelComponent } from '../../angular-xyflow/panel/panel.component';
import { AngularNode, AngularEdge, NodeChange, EdgeChange } from '../../angular-xyflow/types';
import { applyNodeChanges, applyEdgeChanges } from '../../angular-xyflow/utils/changes';
import { Position, ColorMode, Connection, addEdge } from '@xyflow/system';

const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

@Component({
  selector: 'app-color-mode-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    MinimapComponent,
    PanelComponent
  ],
  template: `
    <angular-xyflow
      [nodes]="nodes()"
      [edges]="edges()"
      [colorMode]="colorMode()"
      [fitView]="true"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnect)="onConnect($event)"
    >
      <angular-xyflow-minimap />
      <angular-xyflow-background />
      <angular-xyflow-controls />

      <angular-xyflow-panel position="top-right">
        <div class="color-mode-panel">
          <select
            [value]="colorMode()"
            (change)="onChange($event)"
            data-testid="colormode-select"
            class="color-mode-select"
          >
            <option value="light">light</option>
            <option value="dark">dark</option>
            <option value="system">system</option>
          </select>
        </div>
      </angular-xyflow-panel>
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

    .color-mode-panel {
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .color-mode-select {
      border: 1px solid #ccc;
      border-radius: 4px;
      padding: 4px 8px;
      font-size: 12px;
      background: #fff;
      cursor: pointer;
      outline: none;
      min-width: 80px;
    }

    .color-mode-select:focus {
      border-color: #007acc;
      box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.2);
    }

    /* 暗色模式下的面板樣式 */
    :host ::ng-deep .xy-flow.dark .color-mode-panel {
      background: rgba(40, 40, 40, 0.9);
      border-color: #555;
      color: #fff;
    }

    :host ::ng-deep .xy-flow.dark .color-mode-select {
      background: #2a2a2a;
      border-color: #555;
      color: #fff;
    }

    :host ::ng-deep .xy-flow.dark .color-mode-select:focus {
      border-color: #4a9eff;
      box-shadow: 0 0 0 2px rgba(74, 158, 255, 0.2);
    }
  `]
})
export class ColorModeExampleComponent {
  // 顏色模式狀態
  colorMode = signal<ColorMode>('light');

  // 節點狀態 - 轉為 controlled mode 信號
  nodes = signal<AngularNode[]>([
    {
      id: 'A',
      type: 'input',
      position: { x: 0, y: 150 },
      data: { label: 'A' } as Record<string, unknown>,
      ...nodeDefaults
    },
    {
      id: 'B',
      position: { x: 250, y: 0 },
      data: { label: 'B' } as Record<string, unknown>,
      ...nodeDefaults
    },
    {
      id: 'C',
      position: { x: 250, y: 150 },
      data: { label: 'C' } as Record<string, unknown>,
      ...nodeDefaults
    },
    {
      id: 'D',
      position: { x: 250, y: 300 },
      data: { label: 'D' } as Record<string, unknown>,
      ...nodeDefaults
    },
  ]);

  // 邊狀態 - 轉為 controlled mode 信號
  edges = signal<AngularEdge[]>([
    {
      id: 'A-B',
      source: 'A',
      target: 'B',
    },
    {
      id: 'A-C',
      source: 'A',
      target: 'C',
    },
    {
      id: 'A-D',
      source: 'A',
      target: 'D',
    },
  ]);

  // Controlled mode event handlers
  onNodesChange(changes: NodeChange<AngularNode>[]): void {
    this.nodes.update(nodes => applyNodeChanges(changes, nodes));
  }

  onEdgesChange(changes: EdgeChange<AngularEdge>[]): void {
    this.edges.update(edges => applyEdgeChanges(changes, edges));
  }

  // 連接事件處理 - 使用 controlled mode
  onConnect(connection: Connection): void {
    this.edges.update(edges => addEdge(connection, edges));
  }

  // 顏色模式變更處理
  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.colorMode.set(target.value as ColorMode);
  }
}
