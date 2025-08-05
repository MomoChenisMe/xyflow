import { Component, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelComponent, PanelPosition } from '../../../angular-xyflow/panel/panel.component';
import { NodeInspectorComponent } from './node-inspector.component';
import { ChangeLoggerComponent } from './change-logger.component';
import { AngularNode } from '../../../angular-xyflow/types';

@Component({
  selector: 'app-devtools',
  standalone: true,
  imports: [
    CommonModule,
    PanelComponent,
    NodeInspectorComponent,
    ChangeLoggerComponent,
  ],
  template: `
    <angular-xyflow-panel [position]="position">
      <button
        class="devtool-button"
        [class.active]="nodeInspectorActive()"
        (click)="toggleNodeInspector()"
        title="Toggle Node Inspector"
      >
        Node Inspector
      </button>
      <button
        class="devtool-button"
        [class.active]="changeLoggerActive()"
        (click)="toggleChangeLogger()"
        title="Toggle Change Logger"
      >
        Change Logger
      </button>
    </angular-xyflow-panel>
    @if (changeLoggerActive()) {
      <app-change-logger />
    }
    @if (nodeInspectorActive()) {
      <app-node-inspector [nodes]="nodes()" />
    }
  `,
  styleUrls: ['./devtools.style.css'],
})
export class DevToolsComponent {
  // 輸入屬性
  nodes = input.required<AngularNode[]>();
  
  // 控制面板位置
  position: PanelPosition = 'top-left';

  // 控制各個工具的顯示狀態
  nodeInspectorActive = signal(false);
  changeLoggerActive = signal(false);

  // 切換 Node Inspector
  toggleNodeInspector(): void {
    this.nodeInspectorActive.update((active) => !active);
  }

  // 切換 Change Logger
  toggleChangeLogger(): void {
    this.changeLoggerActive.update((active) => !active);
  }
}