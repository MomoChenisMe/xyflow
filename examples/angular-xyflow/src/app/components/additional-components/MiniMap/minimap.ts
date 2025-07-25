import { Component, input, computed, ChangeDetectionStrategy, OnDestroy, ElementRef, AfterViewInit, ViewChild, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { getInternalNodesBounds, getBoundsOfRects, XYMinimap, type Rect, type XYMinimapInstance, getNodeDimensions, nodeHasDimensions } from './minimap-utils';
import { MiniMapProps } from './minimap.types';
import { Node } from '../../../types/node';

/**
 * MiniMap Component - 完全基於 React Flow 實現
 * 顯示整個流程圖的縮略視圖，支援縮放和平移互動
 */
@Component({
  selector: 'minimap',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="xy-flow__minimap xy-flow__panel bottom right" 
         [style]="panelStyle()"
         [class]="panelClass()"
         data-testid="rf__minimap">
      <svg
        #svgElement
        class="xy-flow__minimap-svg"
        [attr.width]="elementWidth()"
        [attr.height]="elementHeight()"
        [attr.viewBox]="viewBox()"
        role="img"
        [attr.aria-labelledby]="labelledBy()"
        (click)="onSvgClick($event)"
      >
        @if (ariaLabelText()) {
          <title [id]="labelledBy()">{{ ariaLabelText() }}</title>
        }
        
        <!-- 直接渲染MiniMap節點 - 與React版本相同 -->
        @for (nodeId of visibleNodeIds(); track nodeId) {
          @let nodeData = getVisibleNodeData(nodeId);
          @if (nodeData) {
            <rect
              class="xy-flow__minimap-node"
              [class.selected]="!!nodeData.node.selected"
              [attr.x]="nodeData.x"
              [attr.y]="nodeData.y"
              [attr.rx]="nodeBorderRadius()"
              [attr.ry]="nodeBorderRadius()"
              [attr.width]="nodeData.width"
              [attr.height]="nodeData.height"
              [ngStyle]="getNodeStyle(nodeData.node)"
              [attr.shape-rendering]="shapeRendering()"
              (click)="handleNodeClick($event, nodeId)"
            />
          }
        }
        
        <!-- 視口遮罩 - 與 React 版本完全相同的邏輯 -->
        <path
          class="react-flow__minimap-mask"
          [attr.d]="maskPath()"
          fill-rule="evenodd"
          pointer-events="none"
        />
      </svg>
    </div>
  `,
  styles: []
})
export class MiniMapSimple implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('svgElement') svgElement!: ElementRef<SVGSVGElement>;
  
  // Store and transform inputs - 與 React 版本相同的資料結構
  nodeLookup = input.required<Map<string, any>>();
  transform = input.required<[number, number, number]>();
  width = input.required<number>();
  height = input.required<number>();
  translateExtent = input.required<[[number, number], [number, number]]>();
  panZoom = input<any>(null);
  rfId = input.required<string>();
  ariaLabelConfig = input<any>({});
  
  // MiniMap 配置 - 與 React 版本相同的預設值
  style = input<Record<string, any>>({});
  className = input<string>('');
  nodeStrokeColor = input<string | ((node: any) => string)>('#transparent');
  nodeColor = input<string | ((node: any) => string)>('#e2e2e2');
  nodeClassName = input<string | ((node: any) => string)>('');
  nodeBorderRadius = input<number>(5);
  nodeStrokeWidth = input<number | undefined>(undefined);
  nodeComponent = input<any>(null);
  bgColor = input<string | undefined>(undefined);
  maskColor = input<string | undefined>(undefined);
  maskStrokeColor = input<string | undefined>(undefined);
  maskStrokeWidth = input<number | undefined>(undefined);
  position = input<string>('bottom-right');
  onClick = input<((event: MouseEvent, position: { x: number; y: number }) => void) | undefined>(undefined);
  onNodeClick = input<((event: MouseEvent, node: any) => void) | undefined>(undefined);
  pannable = input<boolean>(false);
  zoomable = input<boolean>(false);
  ariaLabel = input<string | null>(null);
  inversePan = input<boolean | undefined>(undefined);
  zoomStep = input<number>(10);
  offsetScale = input<number>(5);
  
  // 常數 - 與 React 版本相同
  private readonly defaultWidth = 200;
  private readonly defaultHeight = 150;
  private readonly ARIA_LABEL_KEY = 'react-flow__minimap-desc';
  
  // XYMinimap 實例
  private minimapInstance: XYMinimapInstance | null = null;
  private viewScaleRef = 0;
  
  // Filter function for hidden nodes - 與React版本完全相同
  private filterHidden = (node: any) => !node.hidden;
  
  // 與 React 版本完全相同的 selector 邏輯
  private selector = computed(() => {
    const transform = this.transform();
    const width = this.width();
    const height = this.height();
    const nodeLookup = this.nodeLookup();
    
    const viewBB: Rect = {
      x: -transform[0] / transform[2],
      y: -transform[1] / transform[2],
      width: width / transform[2],
      height: height / transform[2],
    };
    
    // 修復: 確保與React相同的boundingRect計算
    let boundingRect: Rect;
    if (nodeLookup.size > 0) {
      const nodesBounds = getInternalNodesBounds(nodeLookup, { filter: this.filterHidden });
      boundingRect = getBoundsOfRects(nodesBounds, viewBB);
    } else {
      boundingRect = viewBB;
    }

    const result = {
      viewBB,
      boundingRect,
      rfId: this.rfId(),
      panZoom: this.panZoom(),
      translateExtent: this.translateExtent(),
      flowWidth: width,
      flowHeight: height,
      ariaLabelConfig: this.ariaLabelConfig(),
    };
    
    return result;
  });
  
  // 計算元素尺寸
  elementWidth = computed(() => {
    const style = this.style();
    const styleWidth = style?.['width'];
    
    // 處理不同類型的寬度值
    let result: number;
    if (typeof styleWidth === 'number') {
      result = styleWidth;
    } else if (typeof styleWidth === 'string') {
      // 解析字符串，例如 "200px" -> 200
      result = parseFloat(styleWidth) || this.defaultWidth;
    } else {
      result = this.defaultWidth;
    }
    
    return result;
  });
  
  elementHeight = computed(() => {
    const style = this.style();
    const styleHeight = style?.['height'];
    
    // 處理不同類型的高度值
    let result: number;
    if (typeof styleHeight === 'number') {
      result = styleHeight;
    } else if (typeof styleHeight === 'string') {
      // 解析字符串，例如 "150px" -> 150
      result = parseFloat(styleHeight) || this.defaultHeight;
    } else {
      result = this.defaultHeight;
    }
    
    return result;
  });
  
  // React風格的直接計算 - 與React版本完全一致
  private reactStyleCalculation = computed(() => {
    const { boundingRect, viewBB } = this.selector();
    const elementWidth = this.elementWidth();
    const elementHeight = this.elementHeight();
    const offsetScale = this.offsetScale();
    
    const scaledWidth = boundingRect.width / elementWidth;
    const scaledHeight = boundingRect.height / elementHeight;
    const viewScale = Math.max(scaledWidth, scaledHeight);
    const viewWidth = viewScale * elementWidth;
    const viewHeight = viewScale * elementHeight;
    const offset = offsetScale * viewScale;
    const x = boundingRect.x - (viewWidth - boundingRect.width) / 2 - offset;
    const y = boundingRect.y - (viewHeight - boundingRect.height) / 2 - offset;
    const width = viewWidth + offset * 2;
    const height = viewHeight + offset * 2;
    
    return {
      boundingRect,
      viewBB,
      elementWidth,
      elementHeight,
      scaledWidth,
      scaledHeight,
      viewScale,
      viewWidth,
      viewHeight,
      offset,
      x,
      y,
      width,
      height,
      viewBox: `${x} ${y} ${width} ${height}`
    };
  });
  
  viewBox = computed(() => this.reactStyleCalculation().viewBox);
  
  // 計算遮罩路徑 - 使用React的確切邏輯
  maskPath = computed(() => {
    const calc = this.reactStyleCalculation();
    const { viewBB, x, y, width, height, offset } = calc;
    
    // React版本的確切路徑計算
    return `M${x - offset},${y - offset}h${width + offset * 2}v${height + offset * 2}h${-width - offset * 2}z
        M${viewBB.x},${viewBB.y}h${viewBB.width}v${viewBB.height}h${-viewBB.width}z`;
  });
  
  // Panel 樣式和類別
  panelStyle = computed(() => {
    const style = this.style();
    const bgColor = this.bgColor();
    const maskColor = this.maskColor();
    const maskStrokeColor = this.maskStrokeColor();
    const maskStrokeWidth = this.maskStrokeWidth();
    const nodeColor = this.nodeColor();
    const nodeStrokeColor = this.nodeStrokeColor();
    const nodeStrokeWidth = this.nodeStrokeWidth();
    const viewScale = this.reactStyleCalculation().viewScale;
    
    return {
      ...style,
      '--xy-minimap-background-color-props': typeof bgColor === 'string' ? bgColor : undefined,
      '--xy-minimap-mask-background-color-props': typeof maskColor === 'string' ? maskColor : undefined,
      '--xy-minimap-mask-stroke-color-props': typeof maskStrokeColor === 'string' ? maskStrokeColor : undefined,
      '--xy-minimap-mask-stroke-width-props': typeof maskStrokeWidth === 'number' ? maskStrokeWidth * viewScale : undefined,
      '--xy-minimap-node-background-color-props': typeof nodeColor === 'string' ? nodeColor : undefined,
      '--xy-minimap-node-stroke-color-props': typeof nodeStrokeColor === 'string' ? nodeStrokeColor : undefined,
      '--xy-minimap-node-stroke-width-props': typeof nodeStrokeWidth === 'number' ? nodeStrokeWidth : undefined,
    };
  });
  
  panelClass = computed(() => {
    const className = this.className();
    return `react-flow__minimap ${className}`.trim();
  });
  
  labelledBy = computed(() => `${this.ARIA_LABEL_KEY}-${this.rfId()}`);
  
  // Aria label
  ariaLabelText = computed(() => {
    const customLabel = this.ariaLabel();
    const configLabel = this.ariaLabelConfig()['minimap.ariaLabel'];
    return customLabel ?? configLabel;
  });
  
  // 節點過濾和樣式邏輯 - 從 MiniMapNodes 組件移動過來
  private filterHiddenNodes = (node: any) => !node.hidden;
  
  // 計算可見節點ID
  visibleNodeIds = computed(() => {
    const nodeLookup = this.nodeLookup();
    const nodes: any[] = [];
    nodeLookup.forEach((internalNode) => {
      const node = internalNode.internals.userNode;
      if (!node.hidden && nodeHasDimensions(node)) {
        nodes.push(node);
      }
    });
    return nodes.map(node => node.id);
  });
  
  // 計算節點顏色函數
  private nodeColorFunc = computed(() => this.getAttrFunction(this.nodeColor()));
  private nodeStrokeColorFunc = computed(() => this.getAttrFunction(this.nodeStrokeColor()));
  private nodeClassNameFunc = computed(() => this.getAttrFunction(this.nodeClassName()));
  
  // Shape rendering
  shapeRendering = computed(() => {
    return typeof window === 'undefined' || !!(window as any).chrome ? 'crispEdges' : 'geometricPrecision';
  });
  
  private getAttrFunction(func: any): (node: any) => string {
    return func instanceof Function ? func : () => func;
  }
  
  // 獲取可見節點數據
  protected getVisibleNodeData(nodeId: string) {
    const nodeLookup = this.nodeLookup();
    const internalNode = nodeLookup?.get(nodeId);
    
    if (!internalNode) {
      return null;
    }
    
    const node = internalNode.internals.userNode;
    const { x, y } = internalNode.internals.positionAbsolute;
    const { width, height } = getNodeDimensions(node);
    
    if (!node || node.hidden || !nodeHasDimensions(node)) {
      return null;
    }
    
    return {
      node,
      x,
      y,
      width,
      height,
    };
  }
  
  // 獲取節點樣式
  protected getNodeStyle(node: any) {
    const color = this.nodeColorFunc()(node);
    const strokeColor = this.nodeStrokeColorFunc()(node);
    const strokeWidth = this.nodeStrokeWidth();
    const className = this.nodeClassNameFunc()(node);
    
    const style = node.style || {};
    const { background, backgroundColor } = style;
    const fill = (color || background || backgroundColor) as string;

    return {
      fill,
      stroke: strokeColor,
      strokeWidth,
    };
  }
  
  // 處理節點點擊事件
  protected handleNodeClick(event: MouseEvent, nodeId: string): void {
    const onNodeClick = this.onNodeClick();
    if (onNodeClick) {
      const nodeLookup = this.nodeLookup();
      const node = nodeLookup.get(nodeId)?.internals.userNode;
      if (node) {
        onNodeClick(event, node);
      }
    }
  }
  
  // 事件處理函數
  onSvgClick = (event: MouseEvent) => {
    const onClick = this.onClick();
    if (onClick && this.minimapInstance) {
      const [x, y] = this.minimapInstance.pointer(event) || [0, 0];
      onClick(event, { x, y });
    }
  };
  
  onSvgNodeClick = (event: MouseEvent, nodeId: string) => {
    const onNodeClick = this.onNodeClick();
    if (onNodeClick) {
      const nodeLookup = this.nodeLookup();
      const node = nodeLookup.get(nodeId)?.internals.userNode;
      if (node) {
        onNodeClick(event, node);
      }
    }
  };
  
  constructor() {
    // 設置響應式更新 - 必須在構造函數中使用 effect
    effect(() => {
      this.viewScaleRef = this.reactStyleCalculation().viewScale;
    });
    
    // 設置 minimap 更新效果
    effect(() => {
      // Only update if minimap instance exists
      if (this.minimapInstance) {
        this.updateMinimap();
      }
    });
  }
  
  ngOnInit() {
    // 其他初始化邏輯
  }
  
  ngAfterViewInit() {
    this.initializeMinimap();
    
    // Note: effect moved to constructor to avoid injection context error
    // The updateMinimap will be called via the effect in constructor
  }
  
  ngOnDestroy() {
    this.minimapInstance?.destroy();
  }
  
  private initializeMinimap() {
    if (this.svgElement?.nativeElement && this.panZoom()) {
      this.minimapInstance = XYMinimap({
        domNode: this.svgElement.nativeElement,
        panZoom: this.panZoom()!,
        getTransform: () => this.transform(),
        getViewScale: () => this.viewScaleRef,
      });
    }
  }
  
  private updateMinimap() {
    this.minimapInstance?.update({
      translateExtent: this.translateExtent(),
      width: this.width(),
      height: this.height(),
      inversePan: this.inversePan(),
      pannable: this.pannable(),
      zoomStep: this.zoomStep(),
      zoomable: this.zoomable(),
    });
  }
}