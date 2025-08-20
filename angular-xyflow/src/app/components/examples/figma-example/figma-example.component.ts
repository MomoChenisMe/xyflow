// Angular 核心模組
import {
  Component,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// XyFlow 系統模組
import { SelectionMode } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  BackgroundComponent,
  ControlsComponent,
  PanelComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  Viewport,
  SelectionContextMenuEvent,
  SelectionStartEvent,
  SelectionEndEvent,
} from '../../angular-xyflow';
import { KeyboardService } from '../../angular-xyflow/services/keyboard.service';

// 面板拖拽配置 - 對應 React 版本的 panOnDrag
const panOnDrag = [1, 2]; // 使用滑鼠中鍵和右鍵拖拽，與React版本一致

@Component({
  selector: 'app-figma-example',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    PanelComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      [defaultNodes]="initialNodes"
      [defaultEdges]="initialEdges"
      [selectNodesOnDrag]="false"
      [panOnDrag]="panOnDragButtons"
      [fitView]="true"
      [selectionOnDrag]="true"
      [selectionMode]="selectionModePartial"
      [panOnScroll]="true"
      [zoomActivationKeyCode]="zoomActivationKey()"
      [multiSelectionKeyCode]="multiSelectionKey()"
      (onPaneContextMenu)="onPaneContextMenu($event)"
      (onMoveStart)="onMoveStart($event)"
      (onMove)="onMove($event)"
      (onMoveEnd)="onMoveEnd($event)"
      (onSelectionContextMenu)="onSelectionContextMenu($event)"
      (onSelectionStart)="onSelectionStart($event)"
      (onSelectionEnd)="onSelectionEnd($event)"
      className="figma-flow"
    >
      <!-- 十字背景 - 對應 React 版本的 BackgroundVariant.Cross -->
      <angular-xyflow-background [variant]="backgroundVariant.Cross" />

      <!-- 控制器 -->
      <angular-xyflow-controls />

      <!-- 右上角面板包含輸入框 - 對應 React 版本的 Panel -->
      <angular-xyflow-panel position="top-right">
        <div class="angular-xyflow-panel">
          <input
            type="text"
            placeholder="name"
            [value]="nameValue()"
            (input)="onNameInput($event)"
            class="figma-input"
          />
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

      .figma-flow {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      }

      /* 輸入框樣式 - 仿照 React 版本的簡潔風格 */
      .figma-input {
        padding: 6px 12px;
        border: 1px solid #e1e5e9;
        border-radius: 4px;
        font-size: 14px;
        background: white;
        outline: none;
        transition: border-color 0.2s ease;
      }

      .figma-input:focus {
        border-color: #0078d4;
        box-shadow: 0 0 0 1px rgba(0, 120, 212, 0.3);
      }

      /* 暗色模式適配 */
      .dark .figma-input {
        background: #2d2d30;
        border-color: #3e3e42;
        color: #cccccc;
      }

      .dark .figma-input:focus {
        border-color: #0078d4;
      }
    `,
  ],
})
export class FigmaExampleComponent {
  // 注入服務
  private keyboardService = inject(KeyboardService);

  // 背景變體枚舉
  backgroundVariant = BackgroundVariant;

  // 選擇模式常量 - 使用正確的枚舉值
  selectionModePartial = SelectionMode.Partial;

  // 面板拖拽按鈕配置
  panOnDragButtons = panOnDrag;

  // 平台特定的按鍵配置 - 使用 computed signals 動態計算
  multiSelectionKey = computed(() => {
    // 與 React 版本一致：使用 Meta 和 Shift 鍵進行多選
    return ['Meta', 'Shift'];
  });

  zoomActivationKey = computed(() => {
    const platform = this.keyboardService.platform();
    return platform === 'mac' ? 'Meta' : 'Control';
  });

  // 輸入框值 - 使用 signal 管理狀態
  nameValue = signal<string>('');

  // 初始節點配置 - 對應 React 版本的 initialNodes
  initialNodes: AngularNode[] = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
      className: 'light',
      selected: false
    },
    {
      id: '2',
      data: { label: 'Node 2' },
      position: { x: 100, y: 100 },
      className: 'light',
      selected: false
    },
    {
      id: '3',
      data: { label: 'Node 3' },
      position: { x: 400, y: 100 },
      className: 'light',
      selected: false
    },
    {
      id: '4',
      data: { label: 'Node 4' },
      position: { x: 400, y: 200 },
      className: 'light',
      selected: false
    },
  ];

  // 初始邊配置 - 對應 React 版本的 initialEdges
  initialEdges: AngularEdge[] = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3' },
  ];

  // 事件處理方法 - 對應 React 版本的事件處理器

  // 輸入框值變更處理
  onNameInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.nameValue.set(target.value);
  }

  // 面板右鍵菜單事件處理
  onPaneContextMenu(event: { event: MouseEvent }): void {
    event.event.preventDefault();
    console.log('context menu');
  }

  // 視窗移動開始事件 - 對應 React 版本的 onMoveStart
  onMoveStart(event: { event?: MouseEvent | TouchEvent | null; viewport: Viewport }): void {
    console.log('move start', event);
  }

  // 視窗移動事件 - 對應 React 版本的 onMove
  onMove(event: { event?: MouseEvent | TouchEvent | null; viewport: Viewport }): void {
    console.log('move', event);
  }

  // 視窗移動結束事件 - 對應 React 版本的 onMoveEnd
  onMoveEnd(event: { event?: MouseEvent | TouchEvent | null; viewport: Viewport }): void {
    console.log('move end', event);
  }

  // 選擇開始事件處理
  onSelectionStart(_event: SelectionStartEvent): void {
    // 處理選擇開始事件
  }

  // 選擇結束事件處理
  onSelectionEnd(_event: SelectionEndEvent<AngularNode, AngularEdge>): void {
    // 處理選擇結束事件
  }

  // 選擇上下文菜單事件處理
  onSelectionContextMenu(event: SelectionContextMenuEvent<AngularNode, AngularEdge>): void {
    event.event.preventDefault();
    // 處理選擇右鍵菜單事件
  }
}
