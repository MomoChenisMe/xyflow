import { 
  Component, 
  input, 
  output, 
  viewChild, 
  ElementRef,
  computed,
  signal,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Position } from '@xyflow/system';
import { type Connection } from '@xyflow/system';

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
  `]
})
export class HandleComponent implements OnInit, OnDestroy {
  // 輸入屬性
  readonly type = input.required<'source' | 'target'>();
  readonly position = input.required<Position>();
  readonly nodeId = input.required<string>();
  readonly handleId = input<string>();
  readonly isConnectable = input<boolean>(true);
  
  // 輸出事件
  readonly connectStart = output<{ event: MouseEvent; nodeId: string; handleType: 'source' | 'target'; handleId?: string }>();
  readonly connectEnd = output<Connection>();
  
  // 視圖子元素
  readonly handleElement = viewChild.required<ElementRef<HTMLDivElement>>('handleElement');
  
  // 內部狀態
  private readonly isConnecting = signal(false);
  private readonly connectionValid = signal<boolean | null>(null);
  private readonly isHovered = signal(false);
  
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
    if (!this.isConnectable() || this.type() !== 'source') return;
    
    event.preventDefault();
    event.stopPropagation();
    
    this.isConnecting.set(true);
    
    this.connectStart.emit({
      event,
      nodeId: this.nodeId(),
      handleType: this.type(),
      handleId: this.handleId()
    });
    
    // 添加全局事件監聽器
    const handleMouseMove = (e: MouseEvent) => {
      // 連接線邏輯
      this.updateConnectionValidity(e);
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
    
    // 檢查是否在有效的目標 handle 上釋放
    const target = event.target as HTMLElement;
    const targetHandle = target.closest('.angular-flow__handle.target');
    
    if (targetHandle) {
      const targetNodeId = targetHandle.getAttribute('data-node-id');
      const targetHandleId = targetHandle.getAttribute('data-handle-id');
      
      if (targetNodeId && targetNodeId !== this.nodeId()) {
        const connection: Connection = {
          source: this.nodeId(),
          sourceHandle: this.handleId() || null,
          target: targetNodeId,
          targetHandle: targetHandleId || null
        };
        
        this.connectEnd.emit(connection);
      }
    }
  }

  handleMouseEnter(event: MouseEvent) {
    this.isHovered.set(true);
  }

  handleMouseLeave(event: MouseEvent) {
    this.isHovered.set(false);
  }

  // 更新連接有效性
  private updateConnectionValidity(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const targetHandle = target.closest('.angular-flow__handle.target');
    
    if (targetHandle) {
      const targetNodeId = targetHandle.getAttribute('data-node-id');
      // 檢查是否是有效的連接目標
      const isValid = targetNodeId && targetNodeId !== this.nodeId();
      this.connectionValid.set(!!isValid);
    } else {
      this.connectionValid.set(null);
    }
  }
}