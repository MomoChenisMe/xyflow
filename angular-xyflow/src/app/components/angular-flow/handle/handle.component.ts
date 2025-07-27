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
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { type Connection } from '@xyflow/system';
import { AngularFlowService } from '../angular-flow.service';
import { Handle } from '../types';

@Component({
  selector: 'angular-flow-handle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div 
      #handleElement
      class="angular-flow__handle"
      [class]="handleClasses()"
      [style.position]="'absolute'"
      [style.transform]="handleTransform()"
      [style.width]="'8px'"
      [style.height]="'8px'"
      [style.background]="handleColor()"
      [style.border]="'1px solid #555'"
      [style.border-radius]="'50%'"
      [style.cursor]="'crosshair'"
      [style.pointer-events]="isConnectable() ? 'auto' : 'none'"
      [style.opacity]="isConnectable() ? 1 : 0.5"
      [style.z-index]="4"
      (mousedown)="handleMouseDown($event)"
      (mouseup)="handleMouseUp($event)"
      (mouseenter)="handleMouseEnter($event)"
      (mouseleave)="handleMouseLeave($event)"
      (click)="onHandleClick($event)"
    ></div>
  `,
  styles: [`
    .angular-flow__handle {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #1a192b;
      border: 1px solid #555;
      border-radius: 50%;
      cursor: crosshair;
      z-index: 4;
    }

    .angular-flow__handle:hover {
      background: #ff0072;
      border-color: #ff0072;
    }

    .angular-flow__handle.source {
      /* Source specific styles */
    }

    .angular-flow__handle.target {
      /* Target specific styles */
    }

    .angular-flow__handle.position-top {
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
    }

    .angular-flow__handle.position-right {
      top: 50%;
      right: -4px;
      transform: translateY(-50%);
    }

    .angular-flow__handle.position-bottom {
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
    }

    .angular-flow__handle.position-left {
      top: 50%;
      left: -4px;
      transform: translateY(-50%);
    }

    .angular-flow__handle.connecting {
      background: #ff0072;
      border-color: #ff0072;
      box-shadow: 0 0 6px 2px rgba(255, 0, 114, 0.25);
    }

    .angular-flow__handle.valid-connection {
      background: #00ff88;
      border-color: #00ff88;
    }

    .angular-flow__handle.invalid-connection {
      background: #ff4444;
      border-color: #ff4444;
    }

    .angular-flow__handle.selected {
      background: #ff0072;
      border-color: #ff0072;
      box-shadow: 0 0 8px 2px rgba(255, 0, 114, 0.4);
      transform: scale(1.2);
    }
  `]
})
export class HandleComponent implements OnInit, OnDestroy {
  // 輸入屬性
  readonly type = input.required<'source' | 'target'>();
  readonly position = input.required<Position>();
  readonly nodeId = input.required<string>();
  readonly handleId = input<string>();
  readonly isConnectable = input<boolean>(true);
  readonly selected = input<boolean>(false);
  
  // 輸出事件
  readonly connectStart = output<{ event: MouseEvent; nodeId: string; handleType: 'source' | 'target'; handleId?: string }>();
  readonly connectEnd = output<Connection>();
  readonly handleClick = output<{ event: MouseEvent; nodeId: string; handleType: 'source' | 'target'; handleId?: string }>();
  
  // 視圖子元素
  readonly handleElement = viewChild.required<ElementRef<HTMLDivElement>>('handleElement');
  
  // 內部狀態
  private readonly isConnecting = signal(false);
  private readonly connectionValid = signal<boolean | null>(null);
  private readonly isHovered = signal(false);
  
  // 注入服務
  private flowService = inject(AngularFlowService);
  
  // 計算屬性
  readonly handleClasses = computed(() => {
    const classes = ['angular-flow__handle', this.type(), `position-${this.position()}`];
    
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

  ngOnInit() {
    // 初始化邏輯
  }

  ngOnDestroy() {
    // 清理邏輯
  }

  // 事件處理方法
  handleMouseDown(event: MouseEvent) {
    // 只有 source handle 可以開始連接，或者 target handle 也能開始連接（取決於需求）
    // 這裡我們允許兩種類型都能開始連接，但要確保只能連到相對類型
    if (!this.isConnectable()) return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.isConnecting.set(true);
    
    // 計算 handle 的視窗座標
    const handleElement = this.handleElement().nativeElement;
    const rect = handleElement.getBoundingClientRect();
    const viewport = this.flowService.viewport();
    const handlePosition = {
      x: (rect.left + rect.width / 2 - viewport.x) / viewport.zoom,
      y: (rect.top + rect.height / 2 - viewport.y) / viewport.zoom
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

    // 獲取當前節點
    const node = this.flowService.nodeLookup().get(this.nodeId());
    if (!node) return;

    // 開始連接
    this.flowService.startConnection(node, handle, handlePosition);
    
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

  handleMouseUp(event: MouseEvent) {
    if (!this.isConnecting()) return;
    
    this.isConnecting.set(false);
    this.connectionValid.set(null);
    
    // 獲取鼠標位置並檢查是否有磁吸的 handle
    const viewport = this.flowService.viewport();
    const mousePosition = {
      x: (event.clientX - viewport.x) / viewport.zoom,
      y: (event.clientY - viewport.y) / viewport.zoom
    };
    
    const fromHandle = {
      nodeId: this.nodeId(),
      type: this.type(),
      id: this.handleId() || null
    };

    const closestHandle = this.flowService.findClosestHandle(mousePosition, fromHandle);
    
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
        
        this.connectEnd.emit(connection);
      }
    }
    
    // 結束連接
    this.flowService.endConnection(connection);
  }

  handleMouseEnter(_event: MouseEvent) {
    this.isHovered.set(true);
  }

  handleMouseLeave(_event: MouseEvent) {
    this.isHovered.set(false);
  }

  onHandleClick(event: MouseEvent) {
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
  private updateConnectionLine(event: MouseEvent) {
    if (!this.isConnecting()) return;
    
    // 獲取當前鼠標位置並轉換為視窗座標
    const viewport = this.flowService.viewport();
    const mousePosition = {
      x: (event.clientX - viewport.x) / viewport.zoom,
      y: (event.clientY - viewport.y) / viewport.zoom
    };
    
    // 創建來源 handle 對象用於查找最近的 handle
    const fromHandle = {
      nodeId: this.nodeId(),
      type: this.type(),
      id: this.handleId() || null
    };

    // 尋找最近的有效 handle 進行磁吸
    const closestHandle = this.flowService.findClosestHandle(mousePosition, fromHandle);
    
    let finalPosition = mousePosition;
    let toHandle: Handle | null = null;
    let toNode = null;

    if (closestHandle) {
      // 磁吸到最近的 handle
      finalPosition = { x: closestHandle.x, y: closestHandle.y };
      toHandle = closestHandle;
      toNode = this.flowService.nodeLookup().get(closestHandle.nodeId) || null;
    }
    
    // 更新連接狀態
    this.flowService.updateConnection(finalPosition, toHandle, toNode);
    
    // 更新連接有效性顯示
    this.updateConnectionValidity(toHandle, toNode);
  }
  
  // 更新連接有效性
  private updateConnectionValidity(toHandle: Handle | null, toNode: any) {
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