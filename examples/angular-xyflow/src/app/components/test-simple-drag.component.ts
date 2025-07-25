import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 最簡單的拖拉測試組件
 * 用來檢測最基本的滑鼠事件是否正常工作
 */
@Component({
  selector: 'test-simple-drag',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="test-container">
      <h3>基本滑鼠事件測試</h3>
      
      <!-- 測試 1：最基本的事件檢測 -->
      <div 
        class="test-box basic-events"
        (mousedown)="onMouseDown($event, 'basic')"
        (mouseup)="onMouseUp($event, 'basic')"
        (mousemove)="onMouseMove($event, 'basic')"
        (click)="onClick($event, 'basic')"
      >
        測試 1: 基本事件 (點擊我)
      </div>

      <!-- 測試 2：模擬節點樣式 -->
      <div 
        class="test-box node-style"
        style="position: absolute; top: 120px; left: 20px; user-select: none; pointer-events: all; transform-origin: 0 0; box-sizing: border-box; touch-action: none;"
        (mousedown)="onMouseDown($event, 'node-style')"
        (mouseup)="onMouseUp($event, 'node-style')"
        (mousemove)="onMouseMove($event, 'node-style')"
        (click)="onClick($event, 'node-style')"
      >
        測試 2: 節點樣式 (拖拉我)
      </div>

      <!-- 測試 3：簡單拖拉實現 -->
      <div 
        class="test-box drag-test"
        [style.transform]="'translate(' + dragPosition.x + 'px, ' + dragPosition.y + 'px)'"
        style="position: absolute; top: 200px; left: 20px; user-select: none; cursor: grab;"
        (mousedown)="startDrag($event)"
      >
        測試 3: 簡單拖拉 ({{ dragPosition.x }}, {{ dragPosition.y }})
      </div>

      <!-- 日誌顯示 -->
      <div class="log-area">
        <h4>事件日誌:</h4>
        <div class="log-content">
          @for (log of eventLogs; track $index) {
            <div class="log-item">{{ log }}</div>
          }
        </div>
        <button (click)="clearLogs()">清除日誌</button>
      </div>
    </div>
  `,
  styles: [`
    .test-container {
      padding: 20px;
      position: relative;
      height: 500px;
      border: 2px solid #ccc;
      margin: 20px;
    }
    
    .test-box {
      width: 150px;
      height: 50px;
      padding: 10px;
      margin: 10px 0;
      border: 2px solid #007acc;
      border-radius: 5px;
      background: #f0f8ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      cursor: pointer;
    }
    
    .test-box:hover {
      background: #e6f3ff;
    }
    
    .test-box.dragging {
      cursor: grabbing;
      background: #cce7ff;
      z-index: 1000;
    }
    
    .drag-test {
      background: #ffe6cc;
      border-color: #ff8c00;
    }
    
    .drag-test:hover {
      background: #ffd9b3;
    }
    
    .log-area {
      position: absolute;
      top: 20px;
      left: 200px;
      width: 300px;
      height: 400px;
      border: 1px solid #999;
      padding: 10px;
    }
    
    .log-content {
      height: 320px;
      overflow-y: auto;
      font-family: monospace;
      font-size: 11px;
      border: 1px solid #ddd;
      padding: 5px;
      background: #f9f9f9;
    }
    
    .log-item {
      margin: 2px 0;
    }
    
    button {
      margin-top: 10px;
      padding: 5px 10px;
    }
  `]
})
export class TestSimpleDragComponent {
  eventLogs: string[] = [];
  dragPosition = { x: 0, y: 0 };
  isDragging = false;
  dragStart = { x: 0, y: 0, startX: 0, startY: 0 };

  private addLog(message: string) {
    const timestamp = new Date().toLocaleTimeString();
    this.eventLogs.unshift(`${timestamp}: ${message}`);
    if (this.eventLogs.length > 50) {
      this.eventLogs = this.eventLogs.slice(0, 50);
    }
    console.log(`TestDrag: ${message}`);
  }

  onMouseDown(event: MouseEvent, testType: string) {
    this.addLog(`${testType} - mousedown at (${event.clientX}, ${event.clientY})`);
    event.preventDefault();
  }

  onMouseUp(event: MouseEvent, testType: string) {
    this.addLog(`${testType} - mouseup at (${event.clientX}, ${event.clientY})`);
  }

  onMouseMove(event: MouseEvent, testType: string) {
    this.addLog(`${testType} - mousemove at (${event.clientX}, ${event.clientY})`);
  }

  onClick(event: MouseEvent, testType: string) {
    this.addLog(`${testType} - click at (${event.clientX}, ${event.clientY})`);
  }

  startDrag(event: MouseEvent) {
    this.addLog(`開始拖拉 at (${event.clientX}, ${event.clientY})`);
    this.isDragging = true;
    this.dragStart = {
      x: event.clientX,
      y: event.clientY,
      startX: this.dragPosition.x,
      startY: this.dragPosition.y
    };

    const mouseMoveHandler = (e: MouseEvent) => {
      if (!this.isDragging) return;
      
      const deltaX = e.clientX - this.dragStart.x;
      const deltaY = e.clientY - this.dragStart.y;
      
      this.dragPosition = {
        x: this.dragStart.startX + deltaX,
        y: this.dragStart.startY + deltaY
      };
      
      this.addLog(`拖拉中 delta(${deltaX}, ${deltaY}) pos(${this.dragPosition.x}, ${this.dragPosition.y})`);
    };

    const mouseUpHandler = (e: MouseEvent) => {
      this.addLog(`結束拖拉 at (${e.clientX}, ${e.clientY})`);
      this.isDragging = false;
      document.removeEventListener('mousemove', mouseMoveHandler);
      document.removeEventListener('mouseup', mouseUpHandler);
    };

    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
    
    event.preventDefault();
    event.stopPropagation();
  }

  clearLogs() {
    this.eventLogs = [];
  }
}