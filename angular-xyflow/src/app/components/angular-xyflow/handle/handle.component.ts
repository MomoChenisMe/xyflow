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
  CUSTOM_ELEMENTS_SCHEMA
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
      class="angular-xyflow__handle"
      [class]="handleClasses()"
      [attr.data-handleid]="handleId() || null"
      [attr.data-handlepos]="position()"
      [attr.data-nodeid]="nodeId()"
      [style.position]="'absolute'"
      [style.transform]="handleTransform()"
      [style.width]="'8px'"
      [style.height]="'8px'"
      [style.background]="handleColor()"
      [style.border]="'1px solid #555'"
      [style.border-radius]="'50%'"
      [style.cursor]="'crosshair'"
      [style.pointer-events]="canConnect() ? 'auto' : 'none'"
      [style.opacity]="canConnect() ? 1 : 0.5"
      [style.z-index]="4"
      (mousedown)="handleMouseDown($event)"
      (mouseup)="handleMouseUp($event)"
      (mouseenter)="handleMouseEnter($event)"
      (mouseleave)="handleMouseLeave($event)"
      (click)="onHandleClick($event)"
    ></div>
  `,
  styles: [`
    .angular-xyflow__handle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #1a192b;
      border: 1px solid #555;
      border-radius: 50%;
      cursor: crosshair;
      z-index: 4;
    }

    .angular-xyflow__handle:hover {
      background: #ff0072;
      border-color: #ff0072;
    }

    .angular-xyflow__handle.source {
      /* Source specific styles */
    }

    .angular-xyflow__handle.target {
      /* Target specific styles */
    }

    .angular-xyflow__handle.position-top {
      top: 0;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .angular-xyflow__handle.position-right {
      top: 50%;
      right: 0;
      transform: translate(50%, -50%);
    }

    .angular-xyflow__handle.position-bottom {
      top: auto;
      left: 50%;
      bottom: 0;
      transform: translate(-50%, 50%);
    }

    .angular-xyflow__handle.position-left {
      top: 50%;
      left: 0;
      transform: translate(-50%, -50%);
    }

    .angular-xyflow__handle.connecting {
      background: #ff0072;
      border-color: #ff0072;
      box-shadow: 0 0 6px 2px rgba(255, 0, 114, 0.25);
    }

    .angular-xyflow__handle.valid-connection {
      background: #00ff88;
      border-color: #00ff88;
    }

    .angular-xyflow__handle.invalid-connection {
      background: #ff4444;
      border-color: #ff4444;
    }

    .angular-xyflow__handle.selected {
      /* Handle 點擊不應該改變位置和樣式，參考 React Flow 行為 */
      /* background: #ff0072;
      border-color: #ff0072;
      box-shadow: 0 0 8px 2px rgba(255, 0, 114, 0.4);
      transform: scale(1.2); */
    }
  `]
})
export class HandleComponent implements OnDestroy {
  // 輸入屬性
  readonly type = input.required<'source' | 'target'>();
  readonly position = input.required<Position>();
  readonly nodeId = input.required<string>();
  readonly handleId = input<string>();
  readonly isConnectable = input<boolean>(true);
  readonly selected = input<boolean>(false);
  
  // 輸出事件
  readonly connectStart = output<{ event: MouseEvent; nodeId: string; handleType: 'source' | 'target'; handleId?: string }>();
  readonly connectEnd = output<{ connection?: Connection; event: MouseEvent }>();
  readonly handleClick = output<{ event: MouseEvent; nodeId: string; handleType: 'source' | 'target'; handleId?: string }>();
  
  // 視圖子元素
  readonly handleElement = viewChild.required<ElementRef<HTMLDivElement>>('handleElement');
  
  // 內部狀態
  private readonly isConnecting = signal(false);
  private readonly connectionValid = signal<boolean | null>(null);
  private readonly isHovered = signal(false);
  
  // 注入服務
  private _flowService = inject(AngularXYFlowService);
  
  // 計算屬性
  readonly canConnect = computed(() => {
    const globalConnectable = this._flowService.nodesConnectable();
    const handleConnectable = this.isConnectable();
    return globalConnectable && handleConnectable;
  });

  readonly handleClasses = computed(() => {
    // 核心類：angular-flow__handle, source/target（用於DOM查詢器），position類
    const classes = ['angular-xyflow__handle', this.type(), `position-${this.position()}`];
    
    if (this.isConnecting()) {
      classes.push('connecting');
    }
    
    if (this.connectionValid() === true) {
      classes.push('valid-connection');
    } else if (this.connectionValid() === false) {
      classes.push('invalid-connection');
    }
    
    if (this.isHovered()) {
      classes.push('hovered');
    }
    
    if (this.selected()) {
      classes.push('selected');
    }
    
    return classes.join(' ');
  });
  
  readonly handleTransform = computed(() => {
    // Handle 位置調整邏輯
    return '';
  });
  
  readonly handleColor = computed(() => {
    if (this.connectionValid() === true) {
      return '#00ff88';
    } else if (this.connectionValid() === false) {
      return '#ff4444';
    } else if (this.isConnecting() || this.isHovered()) {
      return '#ff0072';
    }
    return '#1a192b';
  });

  ngOnDestroy(): void {
    // 清理邏輯
  }

  // 事件處理方法
  handleMouseDown(event: MouseEvent): void {
    // 檢查是否允許連接
    if (!this.canConnect()) return;
    
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
    const handleCenterX = handleRect.left + handleRect.width / 2 - containerRect.left;
    const handleCenterY = handleRect.top + handleRect.height / 2 - containerRect.top;
    
    const handlePosition = {
      x: (handleCenterX - viewport.x) / viewport.zoom,
      y: (handleCenterY - viewport.y) / viewport.zoom
    };

    // 創建 Handle 對象
    const handle: Handle = {
      id: this.handleId() || null,
      nodeId: this.nodeId(),
      position: this.position(),
      type: this.type(),
      x: handlePosition.x,
      y: handlePosition.y
    };

    // 開始連接
    this._flowService.startConnection(node, handle, handlePosition);
    
    this.connectStart.emit({
      event,
      nodeId: this.nodeId(),
      handleType: this.type(),
      handleId: this.handleId()
    });
    
    // 添加全局事件監聽器
    const handleMouseMove = (e: MouseEvent) => {
      this.updateConnectionLine(e);
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      this.handleMouseUp(e);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }

  handleMouseUp(event: MouseEvent): void {
    if (!this.isConnecting()) return;
    
    this.isConnecting.set(false);
    this.connectionValid.set(null);
    
    // 獲取鼠標位置並檢查是否有磁吸的 handle
    const mousePosition = this._flowService.screenToFlow({
      x: event.clientX,
      y: event.clientY
    });
    
    const fromHandle = {
      nodeId: this.nodeId(),
      type: this.type(),
      id: this.handleId() || null
    };

    const closestHandle = this._flowService.findClosestHandle(mousePosition, fromHandle);
    
    let connection: Connection | undefined;
    
    if (closestHandle && closestHandle.nodeId !== this.nodeId()) {
      // 檢查連接類型是否有效
      const isValidConnection = 
        (this.type() === 'source' && closestHandle.type === 'target') ||
        (this.type() === 'target' && closestHandle.type === 'source');
        
      if (isValidConnection) {
        connection = {
          source: this.type() === 'source' ? this.nodeId() : closestHandle.nodeId,
          sourceHandle: this.type() === 'source' ? (this.handleId() || null) : closestHandle.id,
          target: this.type() === 'source' ? closestHandle.nodeId : this.nodeId(),
          targetHandle: this.type() === 'source' ? closestHandle.id : (this.handleId() || null)
        };
        
        this.connectEnd.emit({ connection, event });
      }
    }
    
    // 無論是否有連接，都發出connectEnd事件（用於AddNodeOnEdgeDrop等功能） 
    if (!connection) {
      this.connectEnd.emit({ event });
    }
    
    // 結束連接
    this._flowService.endConnection(connection);
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
      handleId: this.handleId()
    });
  }

  // 更新連接線位置和狀態
  private updateConnectionLine(event: MouseEvent): void {
    if (!this.isConnecting()) return;
    
    // 使用服務的座標轉換方法將螢幕座標轉換為流座標
    const flowPosition = this._flowService.screenToFlow({
      x: event.clientX,
      y: event.clientY
    });
    
    // 創建來源 handle 對象用於查找最近的 handle
    const fromHandle = {
      nodeId: this.nodeId(),
      type: this.type(),
      id: this.handleId() || null
    };

    // 尋找最近的有效 handle 進行磁吸
    const closestHandle = this._flowService.findClosestHandle(flowPosition, fromHandle);
    
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
      const isSourceToTarget = this.type() === 'source' && toHandle.type === 'target';
      const isTargetToSource = this.type() === 'target' && toHandle.type === 'source';
      
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