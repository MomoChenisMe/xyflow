import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeChange } from '../../../angular-xyflow/types';

// 變更資訊組件接口
interface ChangeInfoData {
  change: NodeChange;
  timestamp: number;
}

@Component({
  selector: 'app-change-logger',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="angular-xyflow__devtools-changelogger">
      <div class="angular-xyflow__devtools-title">Change Logger</div>
      @if (changes.length === 0) {
        <div>no changes triggered</div>
      } @else {
        @for (item of changes; track item.timestamp) {
          <div class="change-info">
            <div>node id: {{ getNodeId(item.change) }}</div>
            <div>
              @switch (item.change.type) {
                @case ('add') {
                  <pre>{{ formatAddChange(item.change) }}</pre>
                }
                @case ('dimensions') {
                  {{ formatDimensionsChange(item.change) }}
                }
                @case ('position') {
                  {{ formatPositionChange(item.change) }}
                }
                @case ('remove') {
                  remove
                }
                @case ('replace') {
                  <pre>{{ formatReplaceChange(item.change) }}</pre>
                }
                @case ('select') {
                  {{ item.change.selected ? 'select' : 'unselect' }}
                }
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .angular-xyflow__devtools-changelogger {
      pointer-events: none;
      position: relative;
      top: 50px;
      left: 20px;
      font-family: monospace, sans-serif;
      font-size: 11px;
      background: rgba(255, 255, 255, 0.9);
      padding: 10px;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      max-width: 300px;
      max-height: 400px;
      overflow-y: auto;
    }

    .angular-xyflow__devtools-title {
      font-weight: bold;
      margin-bottom: 5px;
    }

    .change-info {
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }

    .change-info:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }

    .change-info div {
      margin-bottom: 2px;
    }

    .change-info pre {
      margin: 0;
      font-size: 10px;
      white-space: pre-wrap;
      word-break: break-all;
    }
  `],
})
export class ChangeLoggerComponent {
  // 變更記錄列表
  changes: ChangeInfoData[] = [];
  
  // 最大記錄數
  private readonly limit = 20;
  
  // 接收變更事件
  onNodesChange(changes: NodeChange[]): void {
    this.recordChanges(changes);
  }
  
  // 記錄變更
  private recordChanges(newChanges: NodeChange[]): void {
    const timestamp = Date.now();
    
    newChanges.forEach(change => {
      // 添加到開頭
      this.changes.unshift({
        change,
        timestamp: timestamp + Math.random(), // 確保唯一性
      });
      
      // 限制數量
      if (this.changes.length > this.limit) {
        this.changes.pop();
      }
    });
  }

  // 獲取節點 ID
  getNodeId(change: NodeChange): string {
    return 'id' in change ? change.id : '-';
  }

  // 格式化新增變更
  formatAddChange(change: any): string {
    return JSON.stringify(change.item, null, 2);
  }

  // 格式化尺寸變更
  formatDimensionsChange(change: any): string {
    return `${change.dimensions?.width} × ${change.dimensions?.height}`;
  }

  // 格式化位置變更
  formatPositionChange(change: any): string {
    return `position: ${change.position?.x.toFixed(1)}, ${change.position?.y.toFixed(1)}`;
  }

  // 格式化替換變更
  formatReplaceChange(change: any): string {
    return JSON.stringify(change.item, null, 2);
  }
}