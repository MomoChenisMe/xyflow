import { 
  Component, 
  computed, 
  ChangeDetectionStrategy,
  input,
  output,
  viewChild,
  ElementRef,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimplePortal } from './node-toolbar-portal.component';
import { 
  NodeToolbarProps, 
  Position, 
  Align, 
  NodeLookup, 
  InternalNode, 
  Transform 
} from './node-toolbar.types';

// Mock utility functions - in real implementation these would come from @xyflow/system
const getInternalNodesBounds = (nodes: NodeLookup) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    const { x, y } = node.internals.positionAbsolute;
    const { width, height } = node.measured;
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

const getNodeToolbarTransform = (
  nodeRect: { x: number; y: number; width: number; height: number },
  transform: Transform,
  position: Position,
  offset: number,
  align: Align
): string => {
  const { x: nodeX, y: nodeY, width: nodeWidth, height: nodeHeight } = nodeRect;
  const { x: transformX, y: transformY, zoom } = transform;
  
  // Transform node coordinates to screen coordinates
  const screenX = nodeX * zoom + transformX;
  const screenY = nodeY * zoom + transformY;
  const screenWidth = nodeWidth * zoom;
  const screenHeight = nodeHeight * zoom;
  
  let x = screenX;
  let y = screenY;
  
  // Position relative to node
  switch (position) {
    case Position.Top:
      y = screenY - offset;
      x = screenX + screenWidth / 2;
      break;
    case Position.TopLeft:
      y = screenY - offset;
      x = screenX;
      break;
    case Position.TopRight:
      y = screenY - offset;
      x = screenX + screenWidth;
      break;
    case Position.Right:
      y = screenY + screenHeight / 2;
      x = screenX + screenWidth + offset;
      break;
    case Position.Bottom:
      y = screenY + screenHeight + offset;
      x = screenX + screenWidth / 2;
      break;
    case Position.BottomLeft:
      y = screenY + screenHeight + offset;
      x = screenX;
      break;
    case Position.BottomRight:
      y = screenY + screenHeight + offset;
      x = screenX + screenWidth;
      break;
    case Position.Left:
      y = screenY + screenHeight / 2;
      x = screenX - offset;
      break;
  }
  
  // Apply alignment
  if (align === Align.Start) {
    // Already positioned at start
  } else if (align === Align.End) {
    // Adjust for end alignment
    if (position === Position.Top || position === Position.Bottom) {
      x = screenX + screenWidth;
    }
  } else {
    // Center alignment (default)
    if (position === Position.Left || position === Position.Right) {
      y = screenY + screenHeight / 2;
    }
  }
  
  return `translate(${x}px, ${y}px)`;
};

/**
 * NodeToolbar 組件 - 為節點提供工具列或提示框
 * 
 * 這個組件使用最新的 Angular Signal API 實現，可以在自定義節點的一側渲染工具列。
 * 工具列不會隨視圖縮放，確保內容始終可見。支持多種位置和對齊方式。
 * 
 * @component
 * @selector xy-node-toolbar
 * @example
 * ```html
 * <xy-node-toolbar 
 *   [position]="Position.Top" 
 *   [offset]="8"
 *   [align]="Align.Center"
 *   [isVisible]="true">
 *   <button (click)="deleteNode()">刪除</button>
 *   <button (click)="copyNode()">複製</button>
 *   <button (click)="editNode()">編輯</button>
 * </xy-node-toolbar>
 * <xy-handle type="target" [position]="Position.Left" />
 * <div [style]="{ padding: '10px 20px' }">{{ data.label }}</div>
 * <xy-handle type="source" [position]="Position.Right" />
 * ```
 * 
 * @remarks 預設情況下，工具列僅在節點被選中時可見。如果選擇了多個節點，
 * 則不會顯示以防止工具列重疊或混亂。可以通過設置 `isVisible` 為 `true` 來覆蓋此行為。
 */
@Component({
  selector: 'xy-node-toolbar',
  standalone: true,
  imports: [CommonModule, SimplePortal],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isActive() && effectiveNodes().size > 0) {
      <xy-simple-portal targetSelector=".react-flow__renderer">
        <div
          [ngStyle]="wrapperStyle()"
          [class]="toolbarClass()"
          [attr.data-id]="dataId()"
        >
          <ng-content></ng-content>
        </div>
      </xy-simple-portal>
    }
  `,
  styleUrls: ['./node-toolbar.styles.css']
})
export class NodeToolbar {
  /** 節點 ID 或節點 ID 陣列 - 可以為一組節點渲染單一工具列 */
  nodeId = input<string | string[] | undefined>();
  
  /** 是否可見 - 即使節點未被選中時也顯示工具列 */
  isVisible = input<boolean | undefined>();
  
  /** 工具列相對於節點的位置 */
  position = input<Position>(Position.Top);
  
  /** 節點和工具列之間的間距（像素） */
  offset = input<number>(10);
  
  /** 工具列相對於節點的對齊方式 */
  align = input<Align>(Align.Center);
  
  /** CSS 類名 */
  className = input<string | undefined>();
  
  /** CSS 樣式 */
  style = input<{ [key: string]: any } | undefined>();

  /** 來自 Angular Flow 服務的數據 - 節點查找表 */
  nodeLookup = input<Map<string, InternalNode>>(new Map());
  
  /** 來自 Angular Flow 服務的數據 - 變換參數 */
  transform = input<Transform>({ x: 0, y: 0, zoom: 1 });
  
  /** 選中節點數量 */
  selectedNodesCount = input<number>(0);
  
  /** 上下文節點 ID */
  contextNodeId = input<string | undefined>();

  /** 計算屬性 - 有效節點 ID 列表 */
  effectiveNodeIds = computed(() => {
    const nodeId = this.nodeId();
    const contextNodeId = this.contextNodeId();
    
    if (Array.isArray(nodeId)) {
      return nodeId;
    }
    
    return [nodeId || contextNodeId || ''];
  });

  /** 計算屬性 - 有效節點集合 */
  effectiveNodes = computed(() => {
    const nodeIds = this.effectiveNodeIds();
    const nodeLookup = this.nodeLookup();
    const nodes = new Map<string, InternalNode>();
    
    if (!nodeLookup) {
      return nodes;
    }
    
    nodeIds.forEach(id => {
      const node = nodeLookup.get(id);
      if (node) {
        nodes.set(node.id, node);
      }
    });
    
    return nodes;
  });

  /** 計算屬性 - 工具列是否啟用 */
  isActive = computed(() => {
    const isVisible = this.isVisible();
    const nodes = this.effectiveNodes();
    const selectedNodesCount = this.selectedNodesCount();
    
    // 如果明確設置了 isVisible，則使用該值
    if (typeof isVisible === 'boolean') {
      return isVisible;
    }
    
    // 預設情況下，只有在節點被選中且僅選中一個節點時才顯示工具列
    return nodes.size === 1 && 
           Array.from(nodes.values())[0]?.selected && 
           selectedNodesCount === 1;
  });

  nodeRect = computed(() => {
    const nodes = this.effectiveNodes();
    return getInternalNodesBounds(nodes);
  });

  zIndex = computed(() => {
    const nodes = this.effectiveNodes();
    const nodesArray = Array.from(nodes.values());
    return Math.max(...nodesArray.map(node => node.internals.z + 1));
  });

  wrapperStyle = computed(() => {
    const nodeRect = this.nodeRect();
    const transform = this.transform();
    const position = this.position();
    const offset = this.offset();
    const align = this.align();
    const zIndex = this.zIndex();
    const style = this.style();
    
    return {
      position: 'absolute',
      transform: getNodeToolbarTransform(nodeRect, transform, position, offset, align),
      zIndex,
      ...style,
    };
  });

  toolbarClass = computed(() => {
    const classes = ['react-flow__node-toolbar'];
    const className = this.className();
    
    if (className) {
      classes.push(className);
    }
    
    return classes.join(' ');
  });

  dataId = computed(() => {
    const nodes = this.effectiveNodes();
    const nodesArray = Array.from(nodes.values());
    return nodesArray.reduce((acc, node) => `${acc}${node.id} `, '').trim();
  });
}