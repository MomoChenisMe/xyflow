import { Component, ChangeDetectionStrategy, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelComponent, PanelPosition } from '../panel/panel.component';
import { NodeInspectorComponent } from './node-inspector.component';
import { ChangeLoggerComponent } from './change-logger.component';

@Component({
  selector: 'angular-xyflow-devtools',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    PanelComponent,
    NodeInspectorComponent,
    ChangeLoggerComponent,
  ],
  template: `
    <!-- DevTools 控制面板 (在正常層級) -->
    <angular-xyflow-panel [position]="position()">
      <div class="angular-xyflow__devtools">
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
      </div>
    </angular-xyflow-panel>

    <!-- Change Logger (在正常層級) -->
    @if (changeLoggerActive()) {
      <angular-xyflow-change-logger />
    }

    <!-- 🔑 關鍵修正：Node Inspector 內部自己處理 ViewportPortal -->
    @if (nodeInspectorActive()) {
      <angular-xyflow-node-inspector />
    }
  `,
  styleUrls: ['./devtools.style.css'],
})
export class DevToolsComponent {
  // 輸入屬性
  position = input<PanelPosition>('top-left');

  // 控制各個工具的顯示狀態 - 簡化版設計
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