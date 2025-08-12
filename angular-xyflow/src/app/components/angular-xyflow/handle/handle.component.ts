// Angular 核心模組
import {
  Component,
  input,
  output,
  viewChild,
  ElementRef,
  computed,
  signal,
  inject,
  ChangeDetectionStrategy,
  OnDestroy,
  afterNextRender,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Position } from '@xyflow/system';
import { type Connection } from '@xyflow/system';

// 專案內部模組
import { AngularXYFlowService } from '../services/angular-xyflow.service';
import { Handle } from '../types';

@Component({
  selector: 'angular-xyflow-handle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div
      #handleElement
      [class]="handleClasses()"
      [attr.data-handleid]="handleId() || null"
      [attr.data-handlepos]="position()"
      [attr.data-nodeid]="nodeId()"
      [attr.data-handletype]="type()"
      [style]="customStyle()"
      (mousedown)="handleMouseDown($event)"
      (mouseenter)="handleMouseEnter($event)"
      (mouseleave)="handleMouseLeave($event)"
      (click)="onHandleClick($event)"
    ></div>
  `,
  styles: [
    `
      /* Handle 樣式由 xy-flow__handle CSS 類別控制，不在組件中定義 */
    `,
  ],
})
export class HandleComponent implements OnDestroy {
  // 輸入屬性
  type = input.required<'source' | 'target'>();
  position = input.required<Position>();
  nodeId = input.required<string>();
  handleId = input<string>();
  isConnectable = input<boolean>(true);
  isConnectableStart = input<boolean>(true); // 是否可以作為連線起點
  isConnectableEnd = input<boolean>(true);   // 是否可以作為連線終點
  selected = input<boolean>(false);
  style = input<Record<string, any>>({});

  // 輸出事件
  connectStart = output<{
    event: MouseEvent;
    nodeId: string;
    handleType: 'source' | 'target';
    handleId?: string;
  }>();
  connectEnd = output<{
    connection?: Connection;
    event: MouseEvent;
  }>();
  handleClick = output<{
    event: MouseEvent;
    nodeId: string;
    handleType: 'source' | 'target';
    handleId?: string;
  }>();

  // 視圖子元素
  handleElement =
    viewChild.required<ElementRef<HTMLDivElement>>('handleElement');

  // 內部狀態
  private isConnecting = signal(false);
  private connectionValid = signal<boolean | null>(null);
  private isHovered = signal(false);

  // 注入服務
  private _flowService = inject(AngularXYFlowService);

  // 計算屬性 - 符合 React Flow 標準的 CSS 類別系統
  handleClasses = computed(() => {
    const classes = ['xy-flow__handle'];

    // 添加位置類別 - 與 React Flow 一致
    const position = this.position();

    if (position) {
      // Position枚舉值已經是小寫字符串（如'bottom'），直接使用
      classes.push(`xy-flow__handle-${position}`);
    }

    // 添加類型類別
    const type = this.type();
    if (type) {
      classes.push(type);
    }

    // 添加狀態類別
    if (this.isConnecting()) {
      classes.push('connecting');
    }

    if (this.connectionValid() === true) {
      classes.push('connectionindicator', 'valid');
    } else if (this.connectionValid() === false) {
      classes.push('connectionindicator', 'invalid');
    }

    if (this.selected()) {
      classes.push('selected');
    }

    // 添加連接狀態類別 - 與 React Flow 一致
    if (this.isConnectable()) {
      classes.push('connectable');
    } else {
      classes.push('disconnected');
    }

    return classes.join(' ');
  });

  // 自定義樣式 - 合併用戶樣式來不覆蓋關鍵定位屬性
  customStyle = computed(() => {
    const userStyle = this.style();
    if (Object.keys(userStyle).length === 0) {
      return null;
    }

    // 創建樣式對象的副本
    const style = { ...userStyle };

    // 移除可能干擾CSS定位的關鍵屬性
    // 這些屬性應該由CSS類別控制，而不是內聯樣式
    delete style['position'];
    delete style['left'];
    delete style['right'];
    delete style['transform'];

    // 對於 top/bottom，我們允許細微調整，但要確保不破壞基本定位
    // 這允許像 color-selector-node 中的多個handle定位
    if (style['top'] && typeof style['top'] === 'string') {
      // 將百分比值轉換為CSS自定義屬性，避免覆蓋transform定位
      if (style['top'].includes('%')) {
        style['--handle-offset-y'] = style['top'];
        delete style['top'];
      }
      // 保留像素值和其他單位的 top 設置
    }
    if (style['bottom'] && typeof style['bottom'] === 'string') {
      if (style['bottom'].includes('%')) {
        style['--handle-offset-y'] = `-${style['bottom']}`;
        delete style['bottom'];
      }
      // 保留像素值和其他單位的 bottom 設置
    }

    return Object.keys(style).length > 0 ? style : null;
  });

  // 計算是否可以連接
  canConnect = computed(() => {
    const globalConnectable = this._flowService.nodesConnectable();
    const handleConnectable = this.isConnectable();
    return globalConnectable && handleConnectable;
  });

  constructor() {
    // 關鍵：模擬 React Flow Handle 組件的自動行為
    // 在 Handle 首次渲染時，自動觸發 node internals 更新
    // 這確保即使後來 handles 被條件渲染隱藏，系統仍知道它們的位置

    // 使用 afterNextRender 進行首次初始化
    afterNextRender(() => {
      const nodeId = this.nodeId();
      // 測量當前節點的 handle bounds
      const bounds = this._flowService.measureNodeHandleBounds(nodeId);
      if (bounds && (bounds.source.length > 0 || bounds.target.length > 0)) {
        // 首次渲染，強制儲存到快取
        this._flowService.setNodeHandleBounds(nodeId, bounds);
      }
    });

  }

  ngOnDestroy(): void {
    // 重要：不要在組件銷毀時取消連線！
    // 連線的生命週期應該由全局 mouse 事件管理，而不是由 Handle 組件的生命週期管理
    // 這是為了支援條件渲染：當 Handle 因為條件渲染而被移除時，連線狀態應該保持
    // React Flow 也是這樣處理的 - Handle 的銷毀不會影響連線狀態

    // 只清理本地狀態，不影響全局連線狀態
    this.isConnecting.set(false);
    this.connectionValid.set(null);
  }

  // 事件處理方法
  handleMouseDown(event: MouseEvent): void {
    // 檢查是否允許連接
    if (!this.canConnect()) return;

    // 檢查是否可以作為連線起點
    if (!this.isConnectableStart()) return;

    // React Flow 邏輯：只有左鍵點擊（button === 0）才觸發連接功能
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    this.isConnecting.set(true);

    // 獲取當前節點
    const node = this._flowService.nodeLookup().get(this.nodeId());
    if (!node) return;

    // 使用 DOM 測量來獲取 handle 的實際位置
    const handleElement = this.handleElement().nativeElement;
    const handleRect = handleElement.getBoundingClientRect();
    const container = this._flowService.getContainerElement();
    if (!container) return;
    const containerRect = container.getBoundingClientRect();

    // 將螢幕座標轉換為流座標
    const viewport = this._flowService.viewport();
    const handleCenterX =
      handleRect.left + handleRect.width / 2 - containerRect.left;
    const handleCenterY =
      handleRect.top + handleRect.height / 2 - containerRect.top;

    const handlePosition = {
      x: (handleCenterX - viewport.x) / viewport.zoom,
      y: (handleCenterY - viewport.y) / viewport.zoom,
    };

    // 創建 Handle 對象
    const handle: Handle = {
      id: this.handleId() || null,
      nodeId: this.nodeId(),
      position: this.position(),
      type: this.type(),
      x: handlePosition.x,
      y: handlePosition.y,
    };

    // 開始連接並觸發事件（通過服務）
    // 服務現在會管理所有的全局事件監聽器
    this._flowService.startConnection(node, handle, handlePosition, event);

    // 也通過組件輸出發出事件（為了向後兼容）
    this.connectStart.emit({
      event,
      nodeId: this.nodeId(),
      handleType: this.type(),
      handleId: this.handleId(),
    });

    // 注意：不再在這裡添加事件監聽器
    // 所有的 mouse 事件現在都由服務管理
  }

  // 注意：handleGlobalMouseUp 和 updateConnectionLine 方法已移除
  // 所有的連線事件處理現在都在服務層管理

  handleMouseEnter(_event: MouseEvent): void {
    this.isHovered.set(true);
  }

  handleMouseLeave(_event: MouseEvent): void {
    this.isHovered.set(false);
  }

  onHandleClick(event: MouseEvent): void {
    // 阻止事件冒泡
    event.stopPropagation();

    this.handleClick.emit({
      event,
      nodeId: this.nodeId(),
      handleType: this.type(),
      handleId: this.handleId(),
    });
  }

}
