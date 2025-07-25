import {
  Component,
  input,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandleComponent } from '../../Handle/handle.component';
import { Position } from '../../Handle/handle.types';
import { DefaultNodeProps } from '../nodes.types';

/**
 * DefaultNode 組件 - 預設節點組件提供標準的雙向連接節點
 * 
 * 這個組件使用最新的 Angular Signal API 實現，對應 React Flow 的 DefaultNode 組件。
 * 包含一個目標 handle（頂部）和一個源 handle（底部），支援自訂 handle 位置。
 * 
 * @component
 * @selector xy-default-node
 * @example
 * ```html
 * <xy-default-node
 *   [data]="nodeData"
 *   [connectable]="true"
 *   [targetPosition]="Position.Top"
 *   [sourcePosition]="Position.Bottom"
 *   [selected]="true">
 * </xy-default-node>
 * ```
 * 
 * @remarks 這個組件提供標準的節點外觀和行為，包括選中狀態、
 * 懸停效果、拖拽支援等功能。適用於大多數基本的流程圖節點。
 */
@Component({
  selector: 'xy-default-node',
  standalone: true,
  imports: [CommonModule, HandleComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- 目標 Handle -->
    <xy-handle 
      type="target" 
      [position]="targetPosition()" 
      [isConnectable]="connectable() ?? true">
    </xy-handle>
    
    <!-- 節點內容 -->
    <div class="node-content">
      {{ data()?.label || 'Default Node' }}
    </div>
    
    <!-- 源 Handle -->
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
      background: white;
      color: #1a192b;
      text-align: center;
      min-width: 150px;
      min-height: 40px;
    }
    
    .node-content {
      padding: 10px;
      line-height: 1.4;
      font-size: 12px;
    }
    
    :host.selected {
      box-shadow: 0 0 0 2px #ff0071;
    }
    
    :host:hover {
      box-shadow: 0 1px 4px 1px rgba(40, 40, 40, 0.1);
    }
  `],
  host: {
    '[class.selected]': 'selected()',
    '[style.z-index]': 'zIndex()'
  }
})
export class DefaultNodeComponent {
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
  
  /** 目標 Handle 位置 */
  targetPosition = input<Position>(Position.Top);
}