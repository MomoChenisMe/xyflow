import {
  Component,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandleComponent } from '../../Handle/handle.component';
import { Position } from '../../Handle/handle.types';
import { OutputNodeProps } from '../nodes.types';

/**
 * OutputNode 組件 - 輸出節點組件只能作為數據終點的節點
 * 
 * 這個組件使用最新的 Angular Signal API 實現，對應 React Flow 的 OutputNode 組件。
 * 僅包含一個目標 handle（頂部），用於流程的結束點，不能向其他節點發送連接。
 * 
 * @component
 * @selector xy-output-node
 * @example
 * ```html
 * <xy-output-node
 *   [data]="nodeData"
 *   [connectable]="true"
 *   [targetPosition]="Position.Top"
 *   [selected]="true">
 * </xy-output-node>
 * ```
 * 
 * @remarks 這個組件專門用於流程圖的結束節點，具有特殊的漸層背景樣式，
 * 幫助用戶快速識別數據流的出口點。
 */
@Component({
  selector: 'xy-output-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 目標 Handle（僅輸入） -->
    <xy-handle 
      type="target" 
      [position]="targetPosition()" 
      [isConnectable]="connectable() ?? true">
    </xy-handle>
    
    <!-- 節點內容 -->
    <div class="node-content">
      {{ data()?.label || 'Output' }}
    </div>
  `,
  styles: [`
    :host {
      display: block;
      position: relative;
      border: 1px solid #1a192b;
      border-radius: 3px;
      background: #fff;
      color: #1a192b;
      text-align: center;
      min-width: 150px;
      min-height: 40px;
      border-right: 4px solid #ff0072;
    }
    
    .node-content {
      padding: 10px;
      line-height: 1.4;
      font-size: 12px;
      font-weight: 500;
    }
    
    :host.selected {
      box-shadow: 0 0 0 2px #ff0071;
    }
    
    :host:hover {
      box-shadow: 0 1px 4px 1px rgba(40, 40, 40, 0.1);
    }
    
    /* 輸出節點特殊樣式 */
    :host {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      color: white;
      border-color: #f093fb;
    }
  `],
  host: {
    '[class.selected]': 'selected()',
    '[style.z-index]': 'zIndex()'
  }
})
export class OutputNodeComponent {
  /** 節點唯一標識符 - 必需輸入 */
  id = input.required<string>();
  
  /** 節點數據 */
  data = input<any>();
  
  /** 是否正在拖拽 */
  dragging = input<boolean>();
  
  /** 是否被選中 */
  selected = input<boolean>();
  
  /** 節點類型 */
  type = input<string>();
  
  /** X 座標位置 - 必需輸入 */
  xPos = input.required<number>();
  
  /** Y 座標位置 - 必需輸入 */
  yPos = input.required<number>();
  
  /** Z 軸層級 - 必需輸入 */
  zIndex = input.required<number>();
  
  /** 是否可拖拽 */
  draggable = input<boolean>();
  
  /** 是否可選擇 */
  selectable = input<boolean>();
  
  /** 是否可刪除 */
  deletable = input<boolean>();
  
  /** 是否可連接 */
  connectable = input<boolean>();
  
  /** 是否可聚焦 */
  focusable = input<boolean>();
  
  /** 節點寬度 */
  width = input<number>();
  
  /** 節點高度 */
  height = input<number>();
  
  /** 父節點 ID */
  parentId = input<string>();
  
  /** 是否隱藏 */
  hidden = input<boolean>();
  
  /** 是否已初始化 */
  initialized = input<boolean>();
  
  /** 是否為父節點 */
  isParent = input<boolean>();
  
  /** 內聯樣式 */
  style = input<any>();
  
  /** CSS 類名 */
  className = input<string>();
  
  /** 無障礙標籤 */
  ariaLabel = input<string>();
  
  /** 無障礙標籤關聯 */
  ariaLabelledBy = input<string>();
  
  /** 無障礙描述關聯 */
  ariaDescribedBy = input<string>();
  
  /** 元素角色 */
  role = input<string>();
  
  /** 目標 Handle 位置 */
  targetPosition = input<Position>(Position.Top);
}