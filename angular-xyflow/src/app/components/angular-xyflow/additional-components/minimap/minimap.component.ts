import { 
  Component, 
  input, 
  computed,
  inject,
  ChangeDetectionStrategy,
  CUSTOM_ELEMENTS_SCHEMA,
  viewChild,
  ElementRef,
  OnDestroy,
  effect,
  ViewEncapsulation,
  contentChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularXYFlowService } from '../../services/angular-xyflow.service';
import { PanelComponent, type PanelPosition } from '../panel/panel.component';
import { 
  XYMinimap, 
  type XYMinimapInstance, 
  type Rect,
  getInternalNodesBounds,
  getBoundsOfRects,
  type GetInternalNodesBoundsParams
} from '@xyflow/system';
import type { XYPosition } from '@xyflow/system';
import { MinimapNodeTemplateDirective } from '../../directives/minimap-node-template.directive';
import type { MinimapNodeTemplateContext, MinimapNodeComponentProps } from '../../types';

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
          @if (customNodeTemplate(); as template) {
            <!-- 使用自定義節點模板 -->
            <svg:g [attr.class]="'xy-flow__minimap-node ' + (shouldShowSelected(node) ? 'selected' : '') + ' ' + (nodeClassName() || '')" (click)="onSvgNodeClick($event, node.id)">
              <ng-container 
                [ngTemplateOutlet]="template.templateRef"
                [ngTemplateOutletContext]="getCustomNodeContext(node)"
              />
            </svg:g>
          } @else {
            <!-- 預設節點渲染 -->
            <svg:rect
              [attr.x]="getNodeVisualPosition(node).x"
              [attr.y]="getNodeVisualPosition(node).y"
              [attr.width]="getNodeMeasuredWidth(node)"
              [attr.height]="getNodeMeasuredHeight(node)"
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
export class MinimapComponent implements OnDestroy {
  // 注入服務
  private _flowService = inject(AngularXYFlowService);
  
  constructor() {
    // 監聽 viewScale 變化並更新引用
    effect(() => {
      this.viewScaleRef = this.viewScale();
    });
    
    // 設置XYMinimap實例 - 使用就緒狀態確保正確初始化
    effect(() => {
      const svgEl = this.svg()?.nativeElement;
      const panZoomReady = this._flowService.panZoomReady();
      const panZoom = this._flowService.getPanZoomInstance();
      const pannable = this.pannable();
      const zoomable = this.zoomable();
      
      // 重要：確保PanZoom就緒且交互功能啟用時才初始化 XYMinimap
      if (svgEl && panZoomReady && panZoom && (pannable || zoomable) && !this.minimapInstance) {
        console.log('MiniMap: Initializing with pannable:', pannable, 'zoomable:', zoomable, 'panZoomReady:', panZoomReady);
        
        this.minimapInstance = XYMinimap({
          domNode: svgEl,
          panZoom,
          getTransform: () => {
            const viewport = this._flowService.viewport();
            return [viewport.x, viewport.y, viewport.zoom];
          },
          getViewScale: () => this.viewScaleRef,
        });
        
        // 立即更新配置
        this.updateMinimapConfig();
      }
      // 如果交互功能被禁用且實例存在，則銷毀實例
      else if (!pannable && !zoomable && this.minimapInstance) {
        console.log('MiniMap: Destroying instance - no interaction enabled');
        this.minimapInstance.destroy();
        this.minimapInstance = null;
      }
    });
    
    // 專門的配置更新 effect - 分離配置更新邏輯
    effect(() => {
      const pannable = this.pannable();
      const zoomable = this.zoomable();
      const inversePan = this.inversePan();
      const zoomStep = this.zoomStep();
      const dimensions = this._flowService.dimensions();
      
      // 確保在配置變化時立即更新
      if (this.minimapInstance) {
        this.updateMinimapConfig();
      }
    });
    
    // 監聽視窗變化 - 確保視窗變化時立即更新
    effect(() => {
      const viewport = this._flowService.viewport();
      const dimensions = this._flowService.dimensions();
      
      // 這個 effect 的存在確保當視窗或容器尺寸變化時，
      // boundingRect 和相關的計算屬性會重新計算
      // React 版本中這是通過 useStore 自動處理的
    });
    
    // 監聽節點變化 - 確保節點增減或移動時更新
    effect(() => {
      const nodes = this._flowService.nodes();
      const internalNodeLookup = this._flowService.internalNodeLookup();
      
      // 觸發重新計算，確保節點變化時邊界會更新
    });
  }
  
  // 視圖子元素引用
  svg = viewChild<ElementRef<SVGSVGElement>>('svg');
  
  // 自定義 minimap 節點模板
  customNodeTemplate = contentChild(MinimapNodeTemplateDirective);
  
  // 輸入屬性 - 基本配置
  customStyle = input<Record<string, any>>({});
  className = input<string>('');
  
  // 節點相關屬性 - 不設置預設值，讓系統包的 CSS 變數處理
  nodeColor = input<string | ((node: any) => string)>();
  nodeStrokeColor = input<string | ((node: any) => string)>();
  nodeClassName = input<string | ((node: any) => string)>('');
  nodeBorderRadius = input<number>(5);
  nodeStrokeWidth = input<number>();
  
  // 背景和遮罩屬性 - 不設置預設值，讓系統包的 CSS 變數處理
  bgColor = input<string>();
  maskColor = input<string>();
  maskStrokeColor = input<string>();
  maskStrokeWidth = input<number>();
  
  // 位置和交互屬性
  position = input<PanelPosition>('bottom-right');
  pannable = input<boolean>(false);
  zoomable = input<boolean>(false);
  inversePan = input<boolean>(false);
  zoomStep = input<number>(10);
  offsetScale = input<number>(5);
  
  // 無障礙屬性
  ariaLabel = input<string | null>('Mini Map');
  
  // 事件回調
  onClick = input<((event: MouseEvent, position: XYPosition) => void) | null>(null);
  onNodeClick = input<((event: MouseEvent, node: any) => void) | null>(null);
  
  // 內部狀態
  private minimapInstance: XYMinimapInstance | null = null;
  private viewScaleRef = 0;
  
  // 計算屬性
  visibleNodes = computed(() => {
    const nodes = this._flowService.nodes();
    return nodes.filter(node => !node.hidden);
  });
  
  boundingRect = computed(() => {
    const viewport = this._flowService.viewport();
    const dimensions = this._flowService.dimensions();
    
    // 計算 viewBB - 與 React 版本一致的邏輯
    const viewBB: Rect = {
      x: -viewport.x / viewport.zoom,
      y: -viewport.y / viewport.zoom,
      width: dimensions.width / viewport.zoom,
      height: dimensions.height / viewport.zoom,
    };
    
    // 獲取內部節點查找表
    const internalNodeLookup = this._flowService.internalNodeLookup();
    
    // 如果沒有節點，直接返回 viewBB
    if (internalNodeLookup.size === 0) {
      return viewBB;
    }
    
    // 使用系統包的函數計算節點邊界 - 與 React 版本完全一致
    const filterHidden = (node: any) => !node.hidden;
    const nodesBounds = getInternalNodesBounds(internalNodeLookup, { 
      filter: filterHidden 
    } as GetInternalNodesBoundsParams<any>);
    
    // 合併 viewBB 和節點邊界 - 與 React 版本一致
    return getBoundsOfRects(nodesBounds, viewBB);
  });
  
  elementWidth = computed(() => {
    const width = this.customStyle()['width'] as number;
    return width || 200;
  });
  elementHeight = computed(() => {
    const height = this.customStyle()['height'] as number;
    return height || 150;
  });
  
  viewScale = computed(() => {
    const rect = this.boundingRect();
    const scaledWidth = rect.width / this.elementWidth();
    const scaledHeight = rect.height / this.elementHeight();
    return Math.max(scaledWidth, scaledHeight);
  });
  
  viewBox = computed(() => {
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
  
  viewBB = computed(() => {
    const viewport = this._flowService.viewport();
    const dimensions = this._flowService.dimensions();
    return {
      x: -viewport.x / viewport.zoom,
      y: -viewport.y / viewport.zoom,
      width: dimensions.width / viewport.zoom,
      height: dimensions.height / viewport.zoom,
    };
  });
  
  maskPath = computed(() => {
    const rect = this.boundingRect();
    const offset = this.offsetScale() * this.viewScale();
    const viewWidth = this.viewScale() * this.elementWidth();
    const viewHeight = this.viewScale() * this.elementHeight();
    const x = rect.x - (viewWidth - rect.width) / 2 - offset;
    const y = rect.y - (viewHeight - rect.height) / 2 - offset;
    const width = viewWidth + offset * 2;
    const height = viewHeight + offset * 2;
    const viewBB = this.viewBB();
    
    // 與 React 版本完全一致的 mask path 計算
    return `M${x - offset},${y - offset}h${width + offset * 2}v${height + offset * 2}h${-width - offset * 2}z
        M${viewBB.x},${viewBB.y}h${viewBB.width}v${viewBB.height}h${-viewBB.width}z`;
  });
  
  // 生成唯一ID - 不在 computed 中因為 Math.random() 不是純函數
  labelledBy = `angular-xyflow__minimap-desc-${Math.random().toString(36).substr(2, 9)}`;
  
  // 形狀渲染模式 - 不在 computed 中因為訪問 window 不是純函數
  shapeRendering = typeof window === 'undefined' || !!(window as any).chrome ? 'crispEdges' : 'geometricPrecision';
  
  computedStyle = computed(() => {
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

  
  ngOnDestroy() {
    this.minimapInstance?.destroy();
  }
  
  // 更新minimap配置 - 改進的配置更新方法
  private updateMinimapConfig(): void {
    if (!this.minimapInstance) {
      console.warn('MiniMap: Cannot update config - instance not initialized');
      return;
    }
    
    try {
      const dimensions = this._flowService.dimensions();
      const config = {
        translateExtent: [[-Infinity, -Infinity], [Infinity, Infinity]] as [[number, number], [number, number]],
        width: dimensions.width,
        height: dimensions.height,
        inversePan: this.inversePan(),
        pannable: this.pannable(),
        zoomStep: this.zoomStep(),
        zoomable: this.zoomable(),
      };
      
      console.log('MiniMap: Updating config:', config);
      this.minimapInstance.update(config);
      
    } catch (error) {
      console.error('MiniMap: Failed to update config:', error);
    }
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
  
  // 獲取自定義節點模板的上下文
  getCustomNodeContext(node: any): MinimapNodeTemplateContext {
    const visualPosition = this.getNodeVisualPosition(node);
    
    // 對於標準節點類型使用固定尺寸，自定義節點使用實際測量尺寸
    let width: number;
    let height: number;
    
    if (this.isStandardNodeType(node.type)) {
      // 標準節點類型使用固定的預設尺寸，與 React Flow 行為一致
      width = node.width || 150;
      height = node.height || 40;
    } else {
      // 自定義節點使用實際測量尺寸
      const nodeInternals = this._flowService.getNodeInternals(node.id);
      width = nodeInternals?.measured.width || node.width || 150;
      height = nodeInternals?.measured.height || node.height || 40;
    }
    
    const selected = this.shouldShowSelected(node);
    const color = this.getNodeColor(node);
    const strokeColor = this.getNodeStrokeColor(node);
    const strokeWidth = this.nodeStrokeWidth();
    const borderRadius = this.nodeBorderRadius();
    
    const componentProps: MinimapNodeComponentProps = {
      node,
      x: visualPosition.x,
      y: visualPosition.y,
      width,
      height,
      selected,
      color,
      strokeColor,
      strokeWidth,
      borderRadius,
    };
    
    return {
      $implicit: componentProps,
      node,
      x: visualPosition.x,
      y: visualPosition.y,
      width,
      height,
      selected,
      color,
      strokeColor,
      strokeWidth,
      borderRadius,
    };
  }
  
  // 判斷是否為標準節點類型
  private isStandardNodeType(nodeType?: string): boolean {
    const standardTypes = ['default', 'input', 'output'];
    return !nodeType || standardTypes.includes(nodeType);
  }
  
  // 獲取節點的 minimap 顯示寬度（區分標準節點和自定義節點）
  getNodeMeasuredWidth(node: any): number {
    if (this.isStandardNodeType(node.type)) {
      // 標準節點類型使用固定的預設尺寸，與 React Flow 行為一致
      return node.width || 150;
    } else {
      // 自定義節點使用實際測量尺寸
      const nodeInternals = this._flowService.getNodeInternals(node.id);
      return nodeInternals?.measured.width || node.width || 150;
    }
  }
  
  // 獲取節點的 minimap 顯示高度（區分標準節點和自定義節點）
  getNodeMeasuredHeight(node: any): number {
    if (this.isStandardNodeType(node.type)) {
      // 標準節點類型使用固定的預設尺寸，與 React Flow 行為一致
      return node.height || 40;
    } else {
      // 自定義節點使用實際測量尺寸
      const nodeInternals = this._flowService.getNodeInternals(node.id);
      return nodeInternals?.measured.height || node.height || 40;
    }
  }
}