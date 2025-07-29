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
import { AngularFlowService } from '../angular-flow.service';
import { PanelComponent, type PanelPosition } from '../panel/panel.component';
import { XYMinimap, type XYMinimapInstance, type Rect } from '@xyflow/system';
import type { XYPosition } from '@xyflow/system';

@Component({
  selector: 'angular-flow-minimap',
  standalone: true,
  imports: [CommonModule, PanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <angular-flow-panel 
      [position]="position()"
      [style]="computedStyle()"
      [className]="'angular-flow__minimap ' + (className() || '')"
      [attr.data-testid]="'af__minimap'"
    >
      <svg 
        #svg
        [attr.width]="elementWidth()"
        [attr.height]="elementHeight()"
        [attr.viewBox]="viewBox()"
        class="angular-flow__minimap-svg"
        role="img"
        [attr.aria-labelledby]="labelledBy"
        (click)="onSvgClick($event)"
      >
        @if (ariaLabel()) {
          <title [id]="labelledBy">{{ ariaLabel() }}</title>
        }
        
        <!-- 節點渲染 -->
        @for (node of visibleNodes(); track node.id) {
          <rect
            [attr.x]="node.position.x"
            [attr.y]="node.position.y"
            [attr.width]="node.width || 150"
            [attr.height]="node.height || 40"
            [attr.fill]="getNodeColor(node)"
            [attr.stroke]="getNodeStrokeColor(node)"
            [attr.stroke-width]="nodeStrokeWidth()"
            [attr.rx]="nodeBorderRadius()"
            [attr.ry]="nodeBorderRadius()"
            [class]="'angular-flow__minimap-node ' + (node.selected ? 'selected' : '') + ' ' + (nodeClassName() || '')"
            [attr.shape-rendering]="shapeRendering"
            (click)="onSvgNodeClick($event, node.id)"
          />
        }
        
        <!-- 視口遮罩 -->
        <path
          class="angular-flow__minimap-mask"
          [attr.d]="maskPath()"
          [attr.fill-rule]="'evenodd'"
          [style.pointer-events]="'none'"
        />
      </svg>
    </angular-flow-panel>
  `,
  styles: [`
    .angular-flow__minimap {
      background-color: var(--xy-minimap-background-color-props, #fff);
      background: var(--xy-minimap-background-color-props, #fff);
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }

    .angular-flow__minimap-svg {
      display: block;
    }

    .angular-flow__minimap-mask {
      fill: var(--xy-minimap-mask-background-color-props, rgba(240, 240, 240, 0.6));
      stroke: var(--xy-minimap-mask-stroke-color-props, transparent);
      stroke-width: var(--xy-minimap-mask-stroke-width-props, 1);
    }
    
    .angular-flow__minimap-node {
      fill: var(--xy-minimap-node-background-color-props, #e2e2e2);
      stroke: var(--xy-minimap-node-stroke-color-props, transparent);
      stroke-width: var(--xy-minimap-node-stroke-width-props, 2);
      cursor: pointer;
    }
    
    .angular-flow__minimap-node.selected {
      fill: var(--xy-minimap-mask-background-color-props, #ff0072);
      stroke: var(--xy-minimap-mask-background-color-props, #ff0072);
    }
  `]
})
export class MinimapComponent implements OnInit, OnDestroy {
  // 注入服務
  private _flowService = inject(AngularFlowService);
  
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
  
  // 節點相關屬性
  readonly nodeColor = input<string | ((node: any) => string)>('#e2e2e2');
  readonly nodeStrokeColor = input<string | ((node: any) => string)>('transparent');
  readonly nodeClassName = input<string | ((node: any) => string)>('');
  readonly nodeBorderRadius = input<number>(5);
  readonly nodeStrokeWidth = input<number>(2);
  
  // 背景和遮罩屬性
  readonly bgColor = input<string>('#fff');
  readonly maskColor = input<string>('rgba(240, 240, 240, 0.6)');
  readonly maskStrokeColor = input<string>('transparent');
  readonly maskStrokeWidth = input<number>(1);
  
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
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
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
  readonly labelledBy = `angular-flow__minimap-desc-${Math.random().toString(36).substr(2, 9)}`;
  
  // 形狀渲染模式 - 不在 computed 中因為訪問 window 不是純函數
  readonly shapeRendering = typeof window === 'undefined' || !!(window as any).chrome ? 'crispEdges' : 'geometricPrecision';
  
  readonly computedStyle = computed(() => {
    const baseStyle = {
      '--xy-minimap-background-color-props': typeof this.bgColor() === 'string' ? this.bgColor() : undefined,
      '--xy-minimap-mask-background-color-props': typeof this.maskColor() === 'string' ? this.maskColor() : undefined,
      '--xy-minimap-mask-stroke-color-props': typeof this.maskStrokeColor() === 'string' ? this.maskStrokeColor() : undefined,
      '--xy-minimap-mask-stroke-width-props': typeof this.maskStrokeWidth() === 'number' ? (this.maskStrokeWidth() * this.viewScale()) : undefined,
      '--xy-minimap-node-background-color-props': typeof this.nodeColor() === 'string' ? this.nodeColor() : undefined,
      '--xy-minimap-node-stroke-color-props': typeof this.nodeStrokeColor() === 'string' ? this.nodeStrokeColor() : undefined,
      '--xy-minimap-node-stroke-width-props': typeof this.nodeStrokeWidth() === 'number' ? this.nodeStrokeWidth() : undefined,
      ...this.customStyle()
    };
    
    // 移除 undefined 值
    return Object.fromEntries(
      Object.entries(baseStyle).filter(([_, value]) => value !== undefined)
    );
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
    const clickHandler = this.onNodeClick();
    if (clickHandler) {
      const node = this.visibleNodes().find(n => n.id === nodeId);
      if (node) {
        clickHandler(event, node);
      }
    }
  }
  
  // 節點樣式方法
  getNodeColor(node: any): string {
    const colorFunc = this.nodeColor();
    if (typeof colorFunc === 'function') {
      return colorFunc(node);
    }
    return colorFunc;
  }
  
  getNodeStrokeColor(node: any): string {
    const colorFunc = this.nodeStrokeColor();
    if (typeof colorFunc === 'function') {
      return colorFunc(node);
    }
    return colorFunc;
  }
}