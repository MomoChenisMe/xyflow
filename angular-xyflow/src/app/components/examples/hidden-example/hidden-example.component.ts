// Angular 核心模組
import {
  Component,
  signal,
  effect,
  untracked,
  viewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Position, Connection } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  BackgroundComponent,
  ControlsComponent,
  PanelComponent,
  MinimapComponent,
  DevToolsComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
} from '../../angular-xyflow';

@Component({
  selector: 'app-hidden-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    PanelComponent,
    MinimapComponent,
    DevToolsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [nodes]="nodes()"
      [edges]="edges()"
      className="angular-xyflow-hidden-example"
      (onConnect)="onConnect($event)"
    >
      <angular-xyflow-background [variant]="backgroundVariant.Dots" />

      <angular-xyflow-minimap [pannable]="true" [zoomable]="true" />

      <angular-xyflow-controls />

      <angular-xyflow-panel position="top-left" className="hidden-control-panel">
        <div class="hidden-control">
          <label class="hidden-checkbox-label">
            <input
              type="checkbox"
              [checked]="isHidden()"
              (change)="toggleHidden($event)"
              class="hidden-checkbox"
            />
            <span>isHidden</span>
          </label>
        </div>
      </angular-xyflow-panel>

      <angular-xyflow-devtools position="top-right" />
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

      .hidden-control-panel {
        z-index: 4 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      .hidden-control {
        padding: 8px 12px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .hidden-checkbox-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        cursor: pointer;
        user-select: none;
        color: #374151;
        font-family: system-ui, -apple-system, sans-serif;
      }

      .hidden-checkbox {
        margin: 0;
        cursor: pointer;
      }
    `,
  ],
})
export class HiddenExampleComponent {
  // 視圖子元素引用
  angularFlow = viewChild.required(AngularXYFlowComponent);

  // 背景變體枚舉
  backgroundVariant = BackgroundVariant;

  // 隱藏狀態控制 Signal - true 表示元素應該被隱藏
  isHidden = signal<boolean>(true);

  // 節點數據 Signal
  nodes = signal<AngularNode[]>([
    {
      id: '1',
      type: 'input',
      hidden: true,
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
      sourcePosition: Position.Bottom,
    },
    {
      id: '2',
      hidden: true,
      data: { label: 'Node 2' },
      position: { x: 100, y: 100 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    {
      id: '3',
      hidden: true,
      data: { label: 'Node 3' },
      position: { x: 400, y: 100 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    },
    {
      id: '4',
      hidden: true,
      data: { label: 'Node 4' },
      position: { x: 400, y: 200 },
      targetPosition: Position.Top,
    },
  ]);

  // 邊數據 Signal
  edges = signal<AngularEdge[]>([
    { id: 'e1-2', source: '1', target: '2', hidden: true },
    { id: 'e1-3', source: '1', target: '3', hidden: true },
    { id: 'e3-4', source: '3', target: '4', hidden: true },
  ]);


  constructor() {
    // 響應 isHidden 變化自動更新所有元素的顯示狀態
    effect(() => {
      const hidden = this.isHidden();

      // 更新節點顯示狀態
      this.nodes.update(currentNodes =>
        this.setElementsHidden(currentNodes, hidden)
      );

      // 更新邊顯示狀態
      this.edges.update(currentEdges =>
        this.setElementsHidden(currentEdges, hidden)
      );
    });
  }

  // 切換隱藏狀態
  toggleHidden(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.isHidden.set(target.checked);
  }

  // 處理新連接 - 確保新建立的邊遵循當前 hidden 狀態
  onConnect(connection: Connection): void {
    const newEdge: AngularEdge = {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? undefined,
      targetHandle: connection.targetHandle ?? undefined,
      hidden: this.isHidden(),
    };

    // 直接更新 edges Signal
    this.edges.update(currentEdges => [...currentEdges, newEdge]);
  }


  // 設定元素隱藏狀態的通用函數 - 只更新 hidden 屬性，保留其他所有狀態
  private setElementsHidden<T extends { hidden?: boolean }>(
    elements: T[],
    hidden: boolean
  ): T[] {
    return elements.map((element) => {
      // 只有當 hidden 狀態實際需要改變時才創建新對象
      if (element.hidden === hidden) {
        return element;
      }

      // 創建淺拷貝並只更新 hidden 屬性
      return {
        ...element,
        hidden,
      };
    });
  }
}
