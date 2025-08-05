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
  readonly type = input.required<'source' | 'target'>();
  readonly position = input.required<Position>();
  readonly nodeId = input.required<string>();
  readonly handleId = input<string>();
  readonly isConnectable = input<boolean>(true);
  readonly selected = input<boolean>(false);
  readonly style = input<Record<string, any>>({});

  // 輸出事件
  readonly connectStart = output<{
    event: MouseEvent;
    nodeId: string;
    handleType: 'source' | 'target';
    handleId?: string;
  }>();
  readonly connectEnd = output<{
    connection?: Connection;
    event: MouseEvent;
  }>();
  readonly handleClick = output<{
    event: MouseEvent;
    nodeId: string;
    handleType: 'source' | 'target';
    handleId?: string;
  }>();

  // 視圖子元素
  readonly handleElement =
    viewChild.required<ElementRef<HTMLDivElement>>('handleElement');

  // 內部狀態
  private readonly isConnecting = signal(false);
  private readonly connectionValid = signal<boolean | null>(null);
  private readonly isHovered = signal(false);

  // 用於追踪是否是當前 handle 開始的連線
  private isCurrentConnectionSource = false;

  // 注入服務
  private _flowService = inject(AngularXYFlowService);

  // 計算屬性 - 符合 React Flow 標準的 CSS 類別系統
  readonly handleClasses = computed(() => {
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

  // 自定義樣式 - 合併用戶樣式但不覆蓋關鍵定位屬性
  readonly customStyle = computed(() => {
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
  readonly canConnect = computed(() => {
    const globalConnectable = this._flowService.nodesConnectable();
    const handleConnectable = this.isConnectable();
    return globalConnectable && handleConnectable;
  });

  ngOnDestroy(): void {
    // 清理連線狀態
    if (this.isCurrentConnectionSource) {
      this.isConnecting.set(false);
      this.connectionValid.set(null);
      this.isCurrentConnectionSource = false;

      // 如果組件在連線過程中被銷毀，取消連線
      this._flowService.cancelConnection();
    }
  }

  // 事件處理方法
  handleMouseDown(event: MouseEvent): void {
    // 檢查是否允許連接
    if (!this.canConnect()) return;

    // React Flow 邏輯：只有左鍵點擊（button === 0）才觸發連接功能
    if (event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();

    this.isConnecting.set(true);
    this.isCurrentConnectionSource = true; // 標記這個 handle 是連線的來源

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
    this._flowService.startConnection(node, handle, handlePosition, event);

    // 也通過組件輸出發出事件（為了向後兼容）
    this.connectStart.emit({
      event,
      nodeId: this.nodeId(),
      handleType: this.type(),
      handleId: this.handleId(),
    });

    // 添加全局事件監聽器
    const handleMouseMove = (e: MouseEvent) => {
      if (this.isCurrentConnectionSource) {
        this.updateConnectionLine(e);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (this.isCurrentConnectionSource) {
        this.handleGlobalMouseUp(e);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }


  private handleGlobalMouseUp(event: MouseEvent): void {
    if (!this.isConnecting() || !this.isCurrentConnectionSource) return;

    this.isConnecting.set(false);
    this.connectionValid.set(null);
    this.isCurrentConnectionSource = false; // 重置連線來源標記

    // 獲取鼠標位置並檢查是否有磁吸的 handle
    const mousePosition = this._flowService.screenToFlow({
      x: event.clientX,
      y: event.clientY,
    });

    const fromHandle = {
      nodeId: this.nodeId(),
      type: this.type(),
      id: this.handleId() || null,
    };

    const closestHandle = this._flowService.findClosestHandle(
      mousePosition,
      fromHandle
    );

    let connection: Connection | undefined;

    if (closestHandle && closestHandle.nodeId !== this.nodeId()) {
      // 檢查連接類型是否有效
      const isValidConnection =
        (this.type() === 'source' && closestHandle.type === 'target') ||
        (this.type() === 'target' && closestHandle.type === 'source');

      if (isValidConnection) {
        connection = {
          source:
            this.type() === 'source' ? this.nodeId() : closestHandle.nodeId,
          sourceHandle:
            this.type() === 'source'
              ? this.handleId() || null
              : closestHandle.id,
          target:
            this.type() === 'source' ? closestHandle.nodeId : this.nodeId(),
          targetHandle:
            this.type() === 'source'
              ? closestHandle.id
              : this.handleId() || null,
        };
      }
    }

    // 重要：無論連接是否有效，都要結束連接狀態
    // 這與 React Flow 的行為一致
    this._flowService.endConnection(connection, event);

    // 也通過組件輸出發出事件（為了向後兼容）
    this.connectEnd.emit({ connection, event });
  }

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

  // 更新連接線位置和狀態
  private updateConnectionLine(event: MouseEvent): void {
    if (!this.isConnecting() || !this.isCurrentConnectionSource) return;

    // 使用服務的座標轉換方法將螢幕座標轉換為流座標
    const flowPosition = this._flowService.screenToFlow({
      x: event.clientX,
      y: event.clientY,
    });

    // 創建來源 handle 對象用於查找最近的 handle
    const fromHandle = {
      nodeId: this.nodeId(),
      type: this.type(),
      id: this.handleId() || null,
    };

    // 尋找最近的有效 handle 進行磁吸
    const closestHandle = this._flowService.findClosestHandle(
      flowPosition,
      fromHandle
    );

    let finalPosition = flowPosition;
    let toHandle: Handle | null = null;
    let toNode = null;

    if (closestHandle) {
      // 磁吸到最近的 handle
      finalPosition = { x: closestHandle.x, y: closestHandle.y };
      toHandle = closestHandle;
      toNode = this._flowService.nodeLookup().get(closestHandle.nodeId) || null;
    }

    // 更新連接狀態
    this._flowService.updateConnection(finalPosition, toHandle, toNode);

    // 更新連接有效性顯示
    this.updateConnectionValidity(toHandle, toNode);
  }

  // 更新連接有效性
  private updateConnectionValidity(toHandle: Handle | null, toNode: any): void {
    if (toHandle && toNode && toNode.id !== this.nodeId()) {
      // 檢查是否是有效的連接目標
      const isSourceToTarget =
        this.type() === 'source' && toHandle.type === 'target';
      const isTargetToSource =
        this.type() === 'target' && toHandle.type === 'source';

      if (isSourceToTarget || isTargetToSource) {
        this.connectionValid.set(true);
      } else {
        this.connectionValid.set(false);
      }
    } else {
      this.connectionValid.set(null);
    }
  }
}
