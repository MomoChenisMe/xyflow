import { 
  Component, 
  computed, 
  effect, 
  signal,
  AfterViewInit, 
  OnDestroy,
  ChangeDetectionStrategy,
  input,
  output,
  viewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Panel } from '../Controls/panel.component';
import { MiniMapNodes } from './minimap-nodes.component';
import { MiniMapProps, XYPosition } from './minimap.types';
import { PanelPosition } from '../Controls/controls.types';

// Mock implementations for @xyflow/system functions
// In a real implementation, these would be imported from @xyflow/system
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface XYMinimapInstance {
  destroy(): void;
  update(config: any): void;
  pointer(event: MouseEvent): [number, number] | null;
}

// Simple mock implementations
const getInternalNodesBounds = (nodeLookup: Map<string, any>, options: { filter: (node: any) => boolean }): Rect[] => {
  const bounds: Rect[] = [];
  nodeLookup.forEach((internalNode) => {
    const node = internalNode.internals.userNode;
    if (options.filter(node)) {
      const { x, y } = internalNode.internals.positionAbsolute;
      const width = node.measured?.width ?? node.width ?? 150;
      const height = node.measured?.height ?? node.height ?? 40;
      bounds.push({ x, y, width, height });
    }
  });
  return bounds;
};

const getBoundsOfRects = (rects: Rect[], viewBB: Rect): Rect => {
  if (rects.length === 0) return viewBB;
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  rects.forEach(rect => {
    minX = Math.min(minX, rect.x);
    minY = Math.min(minY, rect.y);
    maxX = Math.max(maxX, rect.x + rect.width);
    maxY = Math.max(maxY, rect.y + rect.height);
  });
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
};

const XYMinimap = (config: {
  domNode: SVGSVGElement;
  panZoom: any;
  getTransform: () => [number, number, number];
  getViewScale: () => number;
}): XYMinimapInstance => {
  return {
    destroy: () => {},
    update: () => {},
    pointer: () => [0, 0]
  };
};

const defaultWidth = 200;
const defaultHeight = 150;

/**
 * MiniMap 組件 - 顯示流程圖的小型概覽
 * 
 * 這個組件使用最新的 Angular Signal API 實現，顯示所有節點和邊的小型概覽，
 * 並高亮顯示當前視圖範圍。支持點擊導航、縮放和平移功能。
 * 
 * @component
 * @selector xy-minimap
 * @example
 * ```html
 * <xy-flow [nodes]="nodes" [edges]="edges">
 *   <xy-minimap 
 *     [nodeColor]="'#ccc'"
 *     [nodeStrokeWidth]="2"
 *     [maskColor]="'rgba(255, 0, 0, 0.2)'"
 *     [pannable]="true"
 *     [zoomable]="true"
 *     (onClick)="handleMiniMapClick($event)">
 *   </xy-minimap>
 * </xy-flow>
 * ```
 */
@Component({
  selector: 'xy-minimap',
  standalone: true,
  imports: [CommonModule, Panel, MiniMapNodes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <xy-panel
      [className]="panelClass()"
      [position]="position()"
      [style]="panelStyle()"
      testId="rf__minimap"
      [ariaLabel]="effectiveAriaLabel()"
    >
      <svg
        #svgElement
        [attr.width]="elementWidth()"
        [attr.height]="elementHeight()"
        [attr.viewBox]="viewBox()"
        class="react-flow__minimap-svg"
        role="img"
        [attr.aria-labelledby]="labelledBy()"
        (click)="handleSvgClick($event)"
      >
        @if (effectiveAriaLabel()) {
          <title [id]="labelledBy()">{{ effectiveAriaLabel() }}</title>
        }

        <xy-minimap-nodes
          [nodeLookup]="nodeLookup()"
          [nodeIds]="nodeIds()"
          [nodeColor]="nodeColor()"
          [nodeStrokeColor]="nodeStrokeColor()"
          [nodeClassName]="nodeClassName()"
          [nodeBorderRadius]="nodeBorderRadius()"
          [nodeStrokeWidth]="nodeStrokeWidth()"
          [nodeComponent]="nodeComponent()"
          (onNodeClick)="handleNodeClick($event.event, $event.nodeId)"
        />
        
        <path
          class="react-flow__minimap-mask"
          [attr.d]="maskPath()"
          fill-rule="evenodd"
          pointer-events="none"
        />
      </svg>
    </xy-panel>
  `,
  styleUrls: ['./minimap.styles.css']
})
export class MiniMapComponent implements AfterViewInit, OnDestroy {
  /** SVG 元素引用 */
  svgElement = viewChild<ElementRef<SVGSVGElement>>('svgElement');

  /** Angular Flow 服務必需的輸入 - 節點查找表 */
  nodeLookup = input<Map<string, any>>(new Map());
  
  /** 視圖變換參數 [x, y, zoom] */
  transform = input<[number, number, number]>([0, 0, 1]);
  
  /** 流程圖寬度 */
  width = input<number>(800);
  
  /** 流程圖高度 */
  height = input<number>(600);
  
  /** 平移範圍限制 */
  translateExtent = input<[[number, number], [number, number]]>([[-Infinity, -Infinity], [Infinity, Infinity]]);
  
  /** 平移縮放實例 */
  panZoom = input<any>(null);
  
  /** 流程圖實例 ID */
  rfId = input<string>('minimap-1');
  
  /** 無障礙標籤配置 */
  ariaLabelConfig = input<any>({});

  /** 內聯樣式 */
  style = input<{ [key: string]: any } | undefined>();
  
  /** CSS 類名 */
  className = input<string | undefined>();
  
  /** 節點邊框顏色 */
  nodeStrokeColor = input<string | ((node: any) => string) | undefined>();
  
  /** 節點填充顏色 */
  nodeColor = input<string | ((node: any) => string) | undefined>();
  
  /** 節點 CSS 類名 */
  nodeClassName = input<string | ((node: any) => string)>('');
  
  /** 節點邊框圓角 */
  nodeBorderRadius = input<number>(5);
  
  /** 節點邊框寬度 */
  nodeStrokeWidth = input<number | undefined>();
  
  /** 自定義節點組件 */
  nodeComponent = input<any>();
  
  /** 背景顏色 */
  bgColor = input<string | undefined>();
  
  /** 遮罩顏色 */
  maskColor = input<string | undefined>();
  
  /** 遮罩邊框顏色 */
  maskStrokeColor = input<string | undefined>();
  
  /** 遮罩邊框寬度 */
  maskStrokeWidth = input<number | undefined>();
  
  /** 面板位置 */
  position = input<PanelPosition>(PanelPosition.BottomRight);
  
  /** 是否可平移 */
  pannable = input<boolean>(false);
  
  /** 是否可縮放 */
  zoomable = input<boolean>(false);
  
  /** 自定義 ARIA 標籤 */
  ariaLabel = input<string | null | undefined>();
  
  /** 反向平移 */
  inversePan = input<boolean | undefined>();
  
  /** 縮放步長 */
  zoomStep = input<number>(10);
  
  /** 偏移縮放係數 */
  offsetScale = input<number>(5);

  /** 點擊事件 */
  onClick = output<{ event: MouseEvent; position: XYPosition }>();
  
  /** 節點點擊事件 */
  onNodeClick = output<{ event: MouseEvent; node: any }>();

  private readonly ARIA_LABEL_KEY = 'react-flow__minimap-desc';
  private minimapInstance: XYMinimapInstance | null = null;
  private viewScaleRef = signal(0);

  // Filter function for hidden nodes (matches React implementation)
  private filterHidden = (node: any) => !node.hidden;

  /** 計算屬性 - 選擇器數據 (匹配 React 實現) */
  private selectorData = computed(() => {
    const nodeLookup = this.nodeLookup();
    const transform = this.transform();
    const width = this.width();
    const height = this.height();
    
    if (!nodeLookup || !transform || !width || !height) {
      return null;
    }

    const viewBB: Rect = {
      x: -transform[0] / transform[2],
      y: -transform[1] / transform[2],
      width: width / transform[2],
      height: height / transform[2],
    };

    const boundingRect = nodeLookup.size > 0
      ? getBoundsOfRects(getInternalNodesBounds(nodeLookup, { filter: this.filterHidden }), viewBB)
      : viewBB;

    return {
      viewBB,
      boundingRect,
      rfId: this.rfId(),
      panZoom: this.panZoom(),
      translateExtent: this.translateExtent(),
      flowWidth: width,
      flowHeight: height,
      ariaLabelConfig: this.ariaLabelConfig(),
    };
  });

  /** 計算屬性 - 元素寬度 */
  elementWidth = computed(() => {
    const style = this.style();
    return (style?.['width'] as number) ?? defaultWidth;
  });

  /** 計算屬性 - 元素高度 */
  elementHeight = computed(() => {
    const style = this.style();
    return (style?.['height'] as number) ?? defaultHeight;
  });

  /** 計算屬性 - 核心計算 (匹配 React 實現) */
  private calculations = computed(() => {
    const selectorData = this.selectorData();
    if (!selectorData) return null;

    const { boundingRect, viewBB } = selectorData;
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
    };
  });

  /** 計算屬性 - viewBox 字符串 */
  viewBox = computed(() => {
    const calc = this.calculations();
    if (!calc) return '0 0 200 150';
    return `${calc.x} ${calc.y} ${calc.width} ${calc.height}`;
  });

  /** 計算屬性 - 遮罩路徑 */
  maskPath = computed(() => {
    const calc = this.calculations();
    if (!calc) return '';

    const { viewBB, x, y, width, height, offset } = calc;
    return `M${x - offset},${y - offset}h${width + offset * 2}v${height + offset * 2}h${-width - offset * 2}z
        M${viewBB.x},${viewBB.y}h${viewBB.width}v${viewBB.height}h${-viewBB.width}z`;
  });

  /** 計算屬性 - ARIA 標識符 */
  labelledBy = computed(() => `${this.ARIA_LABEL_KEY}-${this.rfId()}`);

  /** 計算屬性 - 有效的 ARIA 標籤 */
  effectiveAriaLabel = computed(() => {
    const ariaLabel = this.ariaLabel();
    const ariaLabelConfig = this.ariaLabelConfig();
    return ariaLabel ?? ariaLabelConfig['minimap.ariaLabel'];
  });

  /** 計算屬性 - 面板 CSS 類名 */
  panelClass = computed(() => {
    const classes = ['react-flow__minimap'];
    const className = this.className();
    if (className) {
      classes.push(className);
    }
    return classes.join(' ');
  });

  /** 計算屬性 - 面板樣式 */
  panelStyle = computed(() => {
    const calc = this.calculations();
    const viewScale = calc?.viewScale ?? 1;
    const style = this.style();
    const bgColor = this.bgColor();
    const maskColor = this.maskColor();
    const maskStrokeColor = this.maskStrokeColor();
    const maskStrokeWidth = this.maskStrokeWidth();
    const nodeColor = this.nodeColor();
    const nodeStrokeColor = this.nodeStrokeColor();
    const nodeStrokeWidth = this.nodeStrokeWidth();

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

  /** 計算屬性 - 節點 ID 列表 */
  nodeIds = computed(() => {
    const nodeLookup = this.nodeLookup();
    if (!nodeLookup) return [];
    const ids: string[] = [];
    nodeLookup.forEach((_, id) => ids.push(id));
    return ids;
  });

  constructor() {
    // Update viewScale reference
    effect(() => {
      const calc = this.calculations();
      if (calc) {
        this.viewScaleRef.set(calc.viewScale);
      }
    });

    // Update minimap when properties change
    effect(() => {
      if (this.minimapInstance) {
        this.updateMinimap();
      }
    });
  }

  ngAfterViewInit() {
    this.initializeMinimap();
  }

  ngOnDestroy() {
    this.minimapInstance?.destroy();
  }

  private initializeMinimap() {
    const svgElement = this.svgElement();
    const panZoom = this.panZoom();
    if (svgElement?.nativeElement && panZoom) {
      this.minimapInstance = XYMinimap({
        domNode: svgElement.nativeElement,
        panZoom: panZoom,
        getTransform: () => this.transform(),
        getViewScale: () => this.viewScaleRef(),
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

  /**
   * 處理 SVG 點擊事件
   */
  handleSvgClick(event: MouseEvent) {
    if (this.minimapInstance) {
      const [x, y] = this.minimapInstance.pointer(event) || [0, 0];
      this.onClick.emit({ event, position: { x, y } });
    }
  }

  /**
   * 處理節點點擊事件
   */
  handleNodeClick(event: MouseEvent, nodeId: string) {
    const nodeLookup = this.nodeLookup();
    if (nodeLookup) {
      const node = nodeLookup.get(nodeId)?.internals.userNode;
      if (node) {
        this.onNodeClick.emit({ event, node });
      }
    }
  }
}