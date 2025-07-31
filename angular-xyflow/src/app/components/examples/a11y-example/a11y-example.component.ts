import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularFlowComponent } from '../../angular-flow/angular-flow.component';
import { BackgroundComponent } from '../../angular-flow/background/background.component';
import { ControlsComponent } from '../../angular-flow/controls/controls.component';
import { MinimapComponent } from '../../angular-flow/minimap/minimap.component';
import { PanelComponent } from '../../angular-flow/panel/panel.component';
import {
  AngularNode,
  AngularEdge,
  BackgroundVariant,
} from '../../angular-flow/types';
import { Position } from '@xyflow/system';

@Component({
  selector: 'app-a11y-example',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    MinimapComponent,
    PanelComponent,
  ],
  template: `
    <angular-flow
      [defaultNodes]="initialNodes"
      [defaultEdges]="initialEdges"
      [selectNodesOnDrag]="false"
      [elevateEdgesOnSelect]="true"
      [elevateNodesOnSelect]="false"
      [nodeDragThreshold]="0"
      [autoPanOnNodeFocus]="autoPanOnNodeFocus()"
      [className]="'a11y-flow'"
    >
      <angular-flow-background [variant]="backgroundVariant.Dots" />
      <angular-flow-minimap />
      <angular-flow-controls />

      <angular-flow-panel position="top-right">
        <div class="angular-flow-panel">
          <label for="focusPannable" class="checkbox-label">
            <input
              id="focusPannable"
              type="checkbox"
              [checked]="autoPanOnNodeFocus()"
              (change)="onAutoPanChange($event)"
              class="xy-theme__checkbox"
            />
            autoPanOnNodeFocus
          </label>
        </div>
      </angular-flow-panel>
    </angular-flow>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      angular-flow {
        width: 100%;
        height: 100%;
      }

      .a11y-flow {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
          sans-serif;
      }

      /* A11y 特定樣式覆蓋 - 增強視覺回饋 */

      :host ::ng-deep .angular-flow__node.selected {
        --xy-node-boxshadow-selected: 0 0 0 2px rgba(255, 0, 114, 0.2);
      }
    `,
  ],
})
export class A11yExampleComponent {
  // 背景變體枚舉
  backgroundVariant = BackgroundVariant;

  // 自動聚焦平移功能的信號
  autoPanOnNodeFocus = signal(true);

  // 初始節點配置
  initialNodes: AngularNode[] = [
    {
      id: '1',
      type: 'input',
      data: {
        label: 'A11y Node 1',
        domAttributes: {
          tabIndex: 10,
          'aria-roledescription': 'A11y Node',
        },
      } as Record<string, unknown>,
      position: { x: 250, y: 5 },
    },
    {
      id: '2',
      data: { label: 'Node 2' } as Record<string, unknown>,
      position: { x: 1000, y: 100 },
    },
    {
      id: '3',
      data: {
        label: 'Node 3',
        ariaRole: 'button',
      } as Record<string, unknown>,
      position: { x: 100, y: 100 },
    },
    {
      id: '4',
      data: { label: 'Node 4' } as Record<string, unknown>,
      position: { x: 300, y: 100 },
    },
    {
      id: '5',
      data: { label: 'Node 5' } as Record<string, unknown>,
      position: { x: 400, y: 200 },
    },
    {
      id: '6',
      data: { label: 'Node 6' } as Record<string, unknown>,
      position: { x: -1000, y: 200 },
    },
  ];

  // 初始邊配置
  initialEdges: AngularEdge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3' },
    { id: 'e1-4', source: '1', target: '4' },
    { id: 'e1-5', source: '4', target: '5' },
    { id: 'e1-6', source: '3', target: '6' },
  ];

  // 事件處理方法
  onAutoPanChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.autoPanOnNodeFocus.set(target.checked);

    // Angular Flow 組件會自動響應 autoPanOnNodeFocus 信號的變化
    console.log('autoPanOnNodeFocus changed to:', target.checked);
  }
}
