import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFlowComponent } from '../../angular-flow/angular-flow.component';
import { BackgroundComponent } from '../../angular-flow/background/background.component';
import { ControlsComponent } from '../../angular-flow/controls/controls.component';
import { MinimapComponent } from '../../angular-flow/minimap/minimap.component';
import { PanelComponent } from '../../angular-flow/panel/panel.component';
import { AngularNode, AngularEdge } from '../../angular-flow/types';
import { Position, ColorMode } from '@xyflow/system';

const nodeDefaults = {
  sourcePosition: Position.Right,
  targetPosition: Position.Left,
};

@Component({
  selector: 'app-color-mode-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    MinimapComponent,
    PanelComponent
  ],
  template: `
    <angular-flow
      [defaultNodes]="initialNodes"
      [defaultEdges]="initialEdges"
      [colorMode]="colorMode()"
      [fitView]="true"
      (onConnect)="onConnect($event)"
    >
      <angular-flow-minimap />
      <angular-flow-background />
      <angular-flow-controls />

      <angular-flow-panel position="top-right">
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
      </angular-flow-panel>
    </angular-flow>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    angular-flow {
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

  // 初始節點配置
  initialNodes: AngularNode[] = [
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
  ];

  // 初始邊配置
  initialEdges: AngularEdge[] = [
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
  ];

  // 連接事件處理
  onConnect(connection: any): void {
    console.log('on connect', connection);
    // 在實際應用中，這裡會添加新的邊到 edges 狀態
    // 但對於這個簡單示例，我們只是記錄事件
  }

  // 顏色模式變更處理
  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.colorMode.set(target.value as ColorMode);
  }
}
