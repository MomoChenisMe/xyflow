import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularFlowComponent } from '../../angular-flow/angular-flow.component';
import { PanelComponent } from '../../angular-flow/panel/panel.component';
import { AngularNode, AngularEdge } from '../../angular-flow/types';
import type { Connection } from '@xyflow/system';

@Component({
  selector: 'app-click-distance-example',
  standalone: true,
  imports: [CommonModule, FormsModule, AngularFlowComponent, PanelComponent],
  template: `
    <angular-xyflow
      [defaultNodes]="initialNodes"
      [defaultEdges]="initialEdges"
      [paneClickDistance]="paneClickDistance()"
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

  // 初始節點配置
  initialNodes: AngularNode[] = [
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
  ];

  // 初始邊配置
  initialEdges: AngularEdge[] = [
    { id: 'e1-2', source: '1a', target: '2a', ariaLabel: undefined },
    { id: 'e1-3', source: '1a', target: '3a' },
  ];

  // 處理距離變更
  onDistanceChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.paneClickDistance.set(Number(target.value));
    console.log('Click distance changed to:', target.value);
  }

  // 處理連接事件
  onConnect(params: Connection): void {
    console.log('Connection created:', params);
    // 在實際應用中，這裡會更新邊的狀態
  }

  // 處理面板點擊
  onPaneClick(data: { event: MouseEvent }): void {
    console.log('pane click', data.event);
  }
}
