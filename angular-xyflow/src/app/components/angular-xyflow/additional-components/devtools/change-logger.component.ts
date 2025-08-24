import { Component, ChangeDetectionStrategy, signal, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NodeChange } from '../../types';
import { AngularXYFlowService } from '../../services/angular-xyflow.service';

// 變更資訊組件接口
interface ChangeInfoData {
  change: NodeChange;
  timestamp: number;
}

@Component({
  selector: 'angular-xyflow-change-logger',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <div class="angular-xyflow__devtools-changelogger">
      <div class="angular-xyflow__devtools-title">Change Logger</div>
      @if (changes().length === 0) {
        <div>no changes triggered</div>
      } @else {
        @for (item of changes(); track item.timestamp) {
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
  // 注入服務
  private _flowService = inject(AngularXYFlowService);
  
  // 變更記錄列表 - 使用 signal
  changes = signal<ChangeInfoData[]>([]);
  
  // 最大記錄數  
  private readonly limit = 20;
  
  // 前一次的節點狀態，用於比較變化
  private previousNodes: any[] = [];
  
  constructor() {
    // 監聽節點變化 - 對應 React 版本的 onNodesChange 政截機制
    effect(() => {
      const currentNodes = this._flowService.nodes();
      if (this.previousNodes.length > 0) {
        const changes = this.detectNodeChanges(this.previousNodes, currentNodes);
        if (changes.length > 0) {
          this.recordChanges(changes);
        }
      }
      this.previousNodes = JSON.parse(JSON.stringify(currentNodes)); // 深度複製
    });
  }
  
  // 檢測節點變化 - 對應 React 版本的變化檢測邏輯
  private detectNodeChanges(prevNodes: any[], currentNodes: any[]): NodeChange[] {
    const changes: NodeChange[] = [];
    
    // 檢查新增的節點
    currentNodes.forEach(node => {
      const prevNode = prevNodes.find(n => n.id === node.id);
      if (!prevNode) {
        changes.push({ type: 'add', item: node } as NodeChange);
        return;
      }
      
      // 檢查位置變化
      if (prevNode.position.x !== node.position.x || prevNode.position.y !== node.position.y) {
        changes.push({
          type: 'position',
          id: node.id,
          position: { x: node.position.x, y: node.position.y }
        } as NodeChange);
      }
      
      // 檢查尺寸變化
      const prevWidth = prevNode.measured?.width || prevNode.width;
      const prevHeight = prevNode.measured?.height || prevNode.height;
      const currentWidth = node.measured?.width || node.width;
      const currentHeight = node.measured?.height || node.height;
      
      if (prevWidth !== currentWidth || prevHeight !== currentHeight) {
        changes.push({
          type: 'dimensions',
          id: node.id,
          dimensions: { width: currentWidth, height: currentHeight }
        } as NodeChange);
      }
      
      // 檢查選擇狀態變化
      if (prevNode.selected !== node.selected) {
        changes.push({
          type: 'select',
          id: node.id,
          selected: node.selected
        } as NodeChange);
      }
    });
    
    // 檢查刪除的節點
    prevNodes.forEach(prevNode => {
      const currentNode = currentNodes.find(n => n.id === prevNode.id);
      if (!currentNode) {
        changes.push({ type: 'remove', id: prevNode.id } as NodeChange);
      }
    });
    
    return changes;
  }
  
  // 記錄變更 - 對應 React 版本的記錄機制
  private recordChanges(newChanges: NodeChange[]): void {
    const timestamp = Date.now();
    
    this.changes.update(currentChanges => {
      const updatedChanges = [...currentChanges];
      
      newChanges.forEach(change => {
        // 添加到開頭，新記錄在前
        updatedChanges.unshift({
          change,
          timestamp: timestamp + Math.random(),
        });
      });
      
      // 限制數量，與 React 版本一致
      if (updatedChanges.length > this.limit) {
        return updatedChanges.slice(0, this.limit);
      }
      
      return updatedChanges;
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