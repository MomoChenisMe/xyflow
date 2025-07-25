import {
  Component,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandleComponent } from '../../Handle/handle.component';
import { Position } from '../../Handle/handle.types';
import { InputNodeProps } from '../nodes.types';

/**
 * InputNode 組件 - 輸入節點組件只能作為數據源的節點
 * 
 * 這個組件使用最新的 Angular Signal API 實現，對應 React Flow 的 InputNode 組件。
 * 僅包含一個源 handle（底部），用於流程的起始點，不能接收來自其他節點的連接。
 * 
 * @component
 * @selector xy-input-node
 * @example
 * ```html
 * <xy-input-node
 *   [data]="nodeData"
 *   [connectable]="true"
 *   [sourcePosition]="Position.Bottom"
 *   [selected]="true">
 * </xy-input-node>
 * ```
 * 
 * @remarks 這個組件專門用於流程圖的起始節點，具有特殊的漸層背景樣式，
 * 幫助用戶快速識別數據流的入口點。
 */
@Component({
  selector: 'xy-input-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 節點內容 -->
    <div class="node-content">
      {{ data()?.label || 'Input' }}
    </div>
    
    <!-- 源 Handle（僅輸出） -->
    <xy-handle 
      type="source" 
      [position]="sourcePosition()" 
      [isConnectable]="connectable() ?? true">
    </xy-handle>
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
      border-left: 4px solid #0041d0;
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
    
    /* 輸入節點特殊樣式 */
    :host {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-color: #667eea;
    }
  `],
  host: {
    '[class.selected]': 'selected()',
    '[style.z-index]': 'zIndex()'
  }
})
export class InputNodeComponent {
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
  
  /** 源 Handle 位置 */
  sourcePosition = input<Position>(Position.Bottom);
}