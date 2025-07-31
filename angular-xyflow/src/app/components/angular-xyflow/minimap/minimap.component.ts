import { 
  Component, 
  input, 
  computed,
  inject,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  viewChild,
  ElementRef,
  OnInit,
  OnDestroy,
  effect,
  ViewEncapsulation
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularXYFlowService } from '../services/angular-xyflow.service';
import { PanelComponent, type PanelPosition } from '../panel/panel.component';
import { XYMinimap, type XYMinimapInstance, type Rect } from '@xyflow/system';
import type { XYPosition } from '@xyflow/system';

@Component({
  selector: 'angular-xyflow-minimap',
  standalone: true,
  imports: [CommonModule, PanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <angular-xyflow-panel 
      [position]="position()"
      [style]="computedStyle()"
      [className]="'xy-flow__minimap ' + (className() || '')"
      [attr.data-testid]="'af__minimap'"
    >
      <svg:svg 
        #svg
        [attr.width]="elementWidth()"
        [attr.height]="elementHeight()"
        [attr.viewBox]="viewBox()"
        class="xy-flow__minimap-svg"
        role="img"
        [attr.aria-labelledby]="labelledBy"
        (click)="onSvgClick($event)"
      >
        @if (ariaLabel()) {
          <svg:title [id]="labelledBy">{{ ariaLabel() }}</svg:title>
        }
        
        <!-- 節點渲染 -->
        @for (node of visibleNodes(); track node.id) {
          <svg:rect
            [attr.x]="getNodeVisualPosition(node).x"
            [attr.y]="getNodeVisualPosition(node).y"
            [attr.width]="node.width || 150"
            [attr.height]="node.height || 40"
            [attr.fill]="getNodeColor(node)"
            [attr.stroke]="getNodeStrokeColor(node)"
            [attr.stroke-width]="nodeStrokeWidth()"
            [attr.rx]="nodeBorderRadius()"
            [attr.ry]="nodeBorderRadius()"
            [class]="'xy-flow__minimap-node ' + (shouldShowSelected(node) ? 'selected' : '') + ' ' + (nodeClassName() || '')"
            [attr.shape-rendering]="shapeRendering"
            (click)="onSvgNodeClick($event, node.id)"
          />
        }
        
        <!-- 視口遮罩 -->
        <svg:path
          class="xy-flow__minimap-mask"
          [attr.d]="maskPath()"
          [attr.fill-rule]="'evenodd'"
          [style.pointer-events]="'none'"
        />
      </svg:svg>
    </angular-xyflow-panel>
  `,
  styles: [`
    .xy-flow__minimap {
      background: var(
        --xy-minimap-background-color-props,
        var(--xy-minimap-background-color, var(--xy-minimap-background-color-default))
      );
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    
    .xy-flow.dark .xy-flow__minimap {
      border-color: #555;
    }
    
    .xy-flow__minimap-svg {
      display: block;
    }
    
    .xy-flow__minimap-mask {
      fill: var(
        --xy-minimap-mask-background-color-props,
        var(--xy-minimap-mask-background-color, var(--xy-minimap-mask-background-color-default))
      );
      stroke: var(
        --xy-minimap-mask-stroke-color-props,
        var(--xy-minimap-mask-stroke-color, var(--xy-minimap-mask-stroke-color-default))
      );
      stroke-width: var(
        --xy-minimap-mask-stroke-width-props,
        var(--xy-minimap-mask-stroke-width, var(--xy-minimap-mask-stroke-width-default))
      );
    }
    
    .xy-flow__minimap-node {
      fill: var(
        --xy-minimap-node-background-color-props,
        var(--xy-minimap-node-background-color, var(--xy-minimap-node-background-color-default))
      );
      stroke: var(
        --xy-minimap-node-stroke-color-props,
        var(--xy-minimap-node-stroke-color, var(--xy-minimap-node-stroke-color-default))
      );
      stroke-width: var(
        --xy-minimap-node-stroke-width-props,
        var(--xy-minimap-node-stroke-width, var(--xy-minimap-node-stroke-width-default))
      );
      cursor: pointer;
    }
    
    .xy-flow__minimap-node.selected {
      fill: #ff0072;
      stroke: #ff0072;
    }
  `]
})
export class MinimapComponent implements OnInit, OnDestroy {
  // 注入服務
  private _flowService = inject(AngularXYFlowService);
  
  constructor() {
    // 設置XYMinimap實例
    effect(() => {
      const svgEl = this.svg()?.nativeElement;
      const panZoom = this._flowService.getPanZoomInstance();
      
      if (svgEl && panZoom) {
        this.minimapInstance = XYMinimap({
          domNode: svgEl,
          panZoom,
          getTransform: () => {
            const viewport = this._flowService.viewport();
            return [viewport.x, viewport.y, viewport.zoom];
          },
          getViewScale: () => this.viewScaleRef,
        });
        
        this.updateMinimap();
      }
    });
    
    // 監聽viewScale變化
    effect(() => {
      this.viewScaleRef = this.viewScale();
    });
    
    // 監聽其他屬性變化並更新minimap
    effect(() => {
      this.updateMinimap();
    });
  }
  
  // 視圖子元素引用
  readonly svg = viewChild<ElementRef<SVGSVGElement>>('svg');
  
  // 輸入屬性 - 基本配置
  readonly customStyle = input<Record<string, any>>({});
  readonly className = input<string>('');
  
  // 節點相關屬性 - 不設置預設值，讓系統包的 CSS 變數處理
  readonly nodeColor = input<string | ((node: any) => string)>();
  readonly nodeStrokeColor = input<string | ((node: any) => string)>();
  readonly nodeClassName = input<string | ((node: any) => string)>('');
  readonly nodeBorderRadius = input<number>(5);
  readonly nodeStrokeWidth = input<number>();
  
  // 背景和遮罩屬性 - 不設置預設值，讓系統包的 CSS 變數處理
  readonly bgColor = input<string>();
  readonly maskColor = input<string>();
  readonly maskStrokeColor = input<string>();
  readonly maskStrokeWidth = input<number>();
  
  // 位置和交互屬性
  readonly position = input<PanelPosition>('bottom-right');
  readonly pannable = input<boolean>(false);
  readonly zoomable = input<boolean>(false);
  readonly inversePan = input<boolean>(false);
  readonly zoomStep = input<number>(10);
  readonly offsetScale = input<number>(5);
  
  // 無障礙屬性
  readonly ariaLabel = input<string | null>('Mini Map');
  
  // 事件回調
  readonly onClick = input<((event: MouseEvent, position: XYPosition) => void) | null>(null);
  readonly onNodeClick = input<((event: MouseEvent, node: any) => void) | null>(null);
  
  // 內部狀態
  private minimapInstance: XYMinimapInstance | null = null;
  private viewScaleRef = 0;
  
  // 計算屬性
  readonly visibleNodes = computed(() => {
    const nodes = this._flowService.nodes();
    return nodes.filter(node => !node.hidden);
  });
  
  readonly boundingRect = computed(() => {
    const viewport = this._flowService.viewport();
    const viewBB: Rect = {
      x: -viewport.x / viewport.zoom,
      y: -viewport.y / viewport.zoom,
      width: this._flowService.dimensions().width / viewport.zoom,
      height: this._flowService.dimensions().height / viewport.zoom,
    };
    
    const nodes = this.visibleNodes();
    if (nodes.length === 0) {
      return viewBB;
    }
    
    // 手動計算節點邊界
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    nodes.forEach(node => {
      const nodeWidth = node.width || 150;
      const nodeHeight = node.height || 40;
      
      // 使用統一位置計算系統獲取視覺位置（考慮 origin）
      const visualPosition = this._flowService.getNodeVisualPosition(node);
      
      minX = Math.min(minX, visualPosition.x);
      minY = Math.min(minY, visualPosition.y);
      maxX = Math.max(maxX, visualPosition.x + nodeWidth);
      maxY = Math.max(maxY, visualPosition.y + nodeHeight);
    });
    
    const nodeBounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
    
    // 合併viewBB和nodeBounds
    const combinedMinX = Math.min(viewBB.x, nodeBounds.x);
    const combinedMinY = Math.min(viewBB.y, nodeBounds.y);
    const combinedMaxX = Math.max(viewBB.x + viewBB.width, nodeBounds.x + nodeBounds.width);
    const combinedMaxY = Math.max(viewBB.y + viewBB.height, nodeBounds.y + nodeBounds.height);
    
    return {
      x: combinedMinX,
      y: combinedMinY,
      width: combinedMaxX - combinedMinX,
      height: combinedMaxY - combinedMinY
    };
  });
  
  readonly elementWidth = computed(() => {
    const width = this.customStyle()['width'] as number;
    return width || 200;
  });
  readonly elementHeight = computed(() => {
    const height = this.customStyle()['height'] as number;
    return height || 150;
  });
  
  readonly viewScale = computed(() => {
    const rect = this.boundingRect();
    const scaledWidth = rect.width / this.elementWidth();
    const scaledHeight = rect.height / this.elementHeight();
    return Math.max(scaledWidth, scaledHeight);
  });
  
  readonly viewBox = computed(() => {
    const rect = this.boundingRect();
    const offset = this.offsetScale() * this.viewScale();
    const viewWidth = this.viewScale() * this.elementWidth();
    const viewHeight = this.viewScale() * this.elementHeight();
    const x = rect.x - (viewWidth - rect.width) / 2 - offset;
    const y = rect.y - (viewHeight - rect.height) / 2 - offset;
    const width = viewWidth + offset * 2;
    const height = viewHeight + offset * 2;
    
    return `${x} ${y} ${width} ${height}`;
  });
  
  readonly viewBB = computed(() => {
    const viewport = this._flowService.viewport();
    return {
      x: -viewport.x / viewport.zoom,
      y: -viewport.y / viewport.zoom,
      width: this._flowService.dimensions().width / viewport.zoom,
      height: this._flowService.dimensions().height / viewport.zoom,
    };
  });
  
  readonly maskPath = computed(() => {
    const rect = this.boundingRect();
    const offset = this.offsetScale() * this.viewScale();
    const viewWidth = this.viewScale() * this.elementWidth();
    const viewHeight = this.viewScale() * this.elementHeight();
    const x = rect.x - (viewWidth - rect.width) / 2 - offset;
    const y = rect.y - (viewHeight - rect.height) / 2 - offset;
    const width = viewWidth + offset * 2;
    const height = viewHeight + offset * 2;
    const viewBB = this.viewBB();
    
    return `M${x - offset},${y - offset}h${width + offset * 2}v${height + offset * 2}h${-width - offset * 2}z
        M${viewBB.x},${viewBB.y}h${viewBB.width}v${viewBB.height}h${-viewBB.width}z`;
  });
  
  // 生成唯一ID - 不在 computed 中因為 Math.random() 不是純函數
  readonly labelledBy = `angular-xyflow__minimap-desc-${Math.random().toString(36).substr(2, 9)}`;
  
  // 形狀渲染模式 - 不在 computed 中因為訪問 window 不是純函數
  readonly shapeRendering = typeof window === 'undefined' || !!(window as any).chrome ? 'crispEdges' : 'geometricPrecision';
  
  readonly computedStyle = computed(() => {
    const baseStyle: Record<string, any> = {
      ...this.customStyle()
    };
    
    // 只有在明確設置值的時候才添加 CSS 變數
    const bgColor = this.bgColor();
    if (bgColor && typeof bgColor === 'string') {
      baseStyle['--xy-minimap-background-color-props'] = bgColor;
    }
    
    const maskColor = this.maskColor();
    if (maskColor && typeof maskColor === 'string') {
      baseStyle['--xy-minimap-mask-background-color-props'] = maskColor;
    }
    
    const maskStrokeColor = this.maskStrokeColor();
    if (maskStrokeColor && typeof maskStrokeColor === 'string') {
      baseStyle['--xy-minimap-mask-stroke-color-props'] = maskStrokeColor;
    }
    
    const maskStrokeWidth = this.maskStrokeWidth();
    if (typeof maskStrokeWidth === 'number') {
      baseStyle['--xy-minimap-mask-stroke-width-props'] = maskStrokeWidth * this.viewScale();
    }
    
    const nodeColor = this.nodeColor();
    if (nodeColor && typeof nodeColor === 'string') {
      baseStyle['--xy-minimap-node-background-color-props'] = nodeColor;
    }
    
    const nodeStrokeColor = this.nodeStrokeColor();
    if (nodeStrokeColor && typeof nodeStrokeColor === 'string') {
      baseStyle['--xy-minimap-node-stroke-color-props'] = nodeStrokeColor;
    }
    
    const nodeStrokeWidth = this.nodeStrokeWidth();
    if (typeof nodeStrokeWidth === 'number') {
      baseStyle['--xy-minimap-node-stroke-width-props'] = nodeStrokeWidth;
    }
    
    return baseStyle;
  });

  // 生命周期方法
  ngOnInit() {
    // 這裡不需要做任何事情，因為effect已經在構造函數中設置了
  }
  
  ngOnDestroy() {
    this.minimapInstance?.destroy();
  }
  
  // 更新minimap實例
  private updateMinimap() {
    if (!this.minimapInstance) return;
    
    const dimensions = this._flowService.dimensions();
    this.minimapInstance.update({
      translateExtent: [[-Infinity, -Infinity], [Infinity, Infinity]],
      width: dimensions.width,
      height: dimensions.height,
      inversePan: this.inversePan(),
      pannable: this.pannable(),
      zoomStep: this.zoomStep(),
      zoomable: this.zoomable(),
    });
  }
  
  // 統一位置計算方法
  getNodeVisualPosition(node: any) {
    return this._flowService.getNodeVisualPosition(node);
  }

  // 事件處理方法
  onSvgClick(event: MouseEvent) {
    const clickHandler = this.onClick();
    if (clickHandler && this.minimapInstance) {
      const position = this.minimapInstance.pointer(event);
      clickHandler(event, { x: position[0], y: position[1] });
    }
  }
  
  onSvgNodeClick(event: MouseEvent, nodeId: string) {
    event.stopPropagation();
    
    // 根據 React Flow 邏輯：如果交互被禁用，阻止節點點擊事件
    const isSelectable = this._flowService.elementsSelectable();
    if (!isSelectable) {
      event.preventDefault();
      return;
    }
    
    const clickHandler = this.onNodeClick();
    if (clickHandler) {
      const node = this.visibleNodes().find(n => n.id === nodeId);
      if (node) {
        clickHandler(event, node);
      }
    }
  }
  
  // 檢查是否應該顯示選中樣式 - 根據 React Flow 邏輯
  shouldShowSelected(node: any): boolean {
    const isSelectable = this._flowService.elementsSelectable();
    // 只有在交互啟用且節點確實被選中時才顯示選中樣式
    return isSelectable && node.selected;
  }
  
  // 節點樣式方法
  getNodeColor(node: any): string {
    const colorFunc = this.nodeColor();
    if (typeof colorFunc === 'function') {
      return colorFunc(node);
    }
    // 如果沒有設置顏色，返回透明讓 CSS 變數處理
    return colorFunc || 'currentColor';
  }
  
  getNodeStrokeColor(node: any): string {
    const colorFunc = this.nodeStrokeColor();
    if (typeof colorFunc === 'function') {
      return colorFunc(node);
    }
    // 如果沒有設置顏色，返回透明讓 CSS 變數處理
    return colorFunc || 'transparent';
  }
}