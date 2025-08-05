import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularNode } from '../../../angular-xyflow/types';

// 節點信息組件的接口
interface NodeInfoData {
  id: string;
  type: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  data: any;
}

@Component({
  selector: 'app-node-inspector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="angular-xyflow__devtools-nodeinspector">
      @for (node of nodes(); track node.id) {
        @let x = node.position?.x || 0;
        @let y = node.position?.y || 0;
        @let width = node.measured?.width || node.width || 150;
        @let height = node.measured?.height || node.height || 40;
        
        <div
            class="angular-xyflow__devtools-nodeinfo"
            [style.position]="'absolute'"
            [style.transform]="'translate(' + x + 'px, ' + (y + height) + 'px)'"
            [style.width.px]="width * 2"
          >
            <div>id: {{ node.id }}</div>
            <div>type: {{ node.type || 'default' }}</div>
            <div>
              position: {{ x.toFixed(1) }}, {{ y.toFixed(1) }}
            </div>
            <div>
              dimensions: {{ width }} × {{ height }}
            </div>
            <div>data: {{ formatData(node.data) }}</div>
          </div>
      }
    </div>
  `,
  styles: [`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 10;
    }
    
    .angular-xyflow__devtools-nodeinspector {
      pointer-events: none;
      font-family: monospace, sans-serif;
      font-size: 10px;
      position: relative;
      width: 100%;
      height: 100%;
    }

    .angular-xyflow__devtools-nodeinfo {
      top: 5px;
      background: rgba(255, 255, 255, 0.9);
      border: 1px solid #ccc;
      padding: 5px;
      border-radius: 3px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .angular-xyflow__devtools-nodeinfo div {
      margin-bottom: 2px;
    }

    .angular-xyflow__devtools-nodeinfo div:last-child {
      margin-bottom: 0;
    }
  `],
})
export class NodeInspectorComponent {
  // 輸入屬性 - 從父組件接收節點資料
  nodes = input.required<AngularNode[]>();

  // 格式化資料顯示
  formatData(data: any): string {
    return JSON.stringify(data, null, 2);
  }
}