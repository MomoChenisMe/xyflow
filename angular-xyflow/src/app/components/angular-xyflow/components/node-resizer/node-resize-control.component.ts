// Angular 核心模組
import {
  Component,
  input,
  output,
  signal,
  computed,
  inject,
  ChangeDetectionStrategy,
  OnDestroy,
  afterNextRender,
  effect,
  viewChild,
  ElementRef,
  Injector,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Position } from '@xyflow/system';
import type { XYResizerInstance, XYResizerChange, XYResizerChildChange } from '@xyflow/system';

// 專案內部模組
import { AngularXYFlowService } from '../../services/angular-xyflow.service';
import { AngularXYResizerService } from '../../services/angular-xy-resizer.service';
import { AngularNode, AngularEdge } from '../../types';
import type { NodeChange } from '../../types';

export enum ResizeControlVariant {
  Handle = 'handle',
  Line = 'line',
}

// 對應 React Flow 的 defaultPositions 配置
const defaultPositions: Record<ResizeControlVariant, string> = {
  [ResizeControlVariant.Line]: 'right',
  [ResizeControlVariant.Handle]: 'bottom-right',
};

export type ResizeDirection = 'x' | 'y' | 'xy' | 'horizontal' | 'vertical';

export interface ResizeEvent {
  event: MouseEvent;
  node: AngularNode;
  direction?: string;
  width?: number;
  height?: number;
}

@Component({
  selector: 'angular-xyflow-node-resize-control',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #controlElement
      [class]="controlClasses()"
      [style]="controlStyle()"
    >
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    /* React Flow標準樣式 - 基礎控制項 */
    .react-flow__resize-control {
      position: absolute;
      pointer-events: all;
      user-select: none;
    }

    /* Handle樣式 - 對應React版本 */
    .react-flow__resize-control.handle {
      width: 5px;
      height: 5px;
      border: 1px solid #fff;
      border-radius: 1px; /* 修正：微圓角，與React Flow原版一致 */
      background-color: var(--xy-resize-background-color, #3367d9);
      translate: -50% -50%; /* CSS Transform優化 */
      box-sizing: content-box; /* 修正：確保5px是內容大小，border額外添加 */
    }

    /* Line樣式 - 對應React版本 */
    .react-flow__resize-control.line {
      border-color: var(--xy-resize-background-color, #3367d9);
      border-width: 0;
      border-style: solid;
    }

    /* 位置樣式 - Handle */
    .react-flow__resize-control.handle.top { left: 50%; top: 0; }
    .react-flow__resize-control.handle.bottom { left: 50%; top: 100%; }
    .react-flow__resize-control.handle.left { left: 0; top: 50%; }
    .react-flow__resize-control.handle.right { left: 100%; top: 50%; }
    .react-flow__resize-control.handle.top-left { left: 0; top: 0; }
    .react-flow__resize-control.handle.top-right { left: 100%; top: 0; }
    .react-flow__resize-control.handle.bottom-left { left: 0; top: 100%; }
    .react-flow__resize-control.handle.bottom-right { left: 100%; top: 100%; }

    /* 位置樣式 - Line */
    .react-flow__resize-control.line.top {
      left: 0; top: 0; width: 100%; height: 1px;
      border-top-width: 1px;
    }
    .react-flow__resize-control.line.bottom {
      left: 0; bottom: 0; width: 100%; height: 1px;
      border-bottom-width: 1px;
    }
    .react-flow__resize-control.line.left {
      left: 0; top: 0; width: 1px; height: 100%;
      border-left-width: 1px;
    }
    .react-flow__resize-control.line.right {
      right: 0; top: 0; width: 1px; height: 100%;
      border-right-width: 1px;
    }

    /* Cursor樣式 - 對應React版本 */
    .react-flow__resize-control.left, .react-flow__resize-control.right {
      cursor: ew-resize;
    }
    .react-flow__resize-control.top, .react-flow__resize-control.bottom {
      cursor: ns-resize;
    }
    .react-flow__resize-control.top-left, .react-flow__resize-control.bottom-right {
      cursor: nwse-resize;
    }
    .react-flow__resize-control.top-right, .react-flow__resize-control.bottom-left {
      cursor: nesw-resize;
    }
  `],
})
export class NodeResizeControlComponent implements OnDestroy {
  // 輸入屬性
  nodeId = input.required<string>();
  position = input<Position | string>();
  variant = input<ResizeControlVariant>(ResizeControlVariant.Handle);
  color = input<string>();
  minWidth = input<number>();
  minHeight = input<number>();
  maxWidth = input<number>();
  maxHeight = input<number>();
  keepAspectRatio = input<boolean>(false);
  resizeDirection = input<ResizeDirection>(); // 新增：控制 resize 方向
  shouldResize = input<(event: MouseEvent, params: any) => boolean>();
  onResize = input<(event: MouseEvent, params: any) => void>();
  onResizeStart = input<(event: MouseEvent, params: any) => void>();
  onResizeEnd = input<(event: MouseEvent, params: any) => void>();
  style = input<Record<string, any>>({});
  handleClassName = input<string>('');
  autoScale = input<boolean>(true); // 新增：自動縮放功能，默認啟用

  // 輸出事件 - 受控模式 Change 事件
  nodeChange = output<NodeChange>();
  resizeStart = output<ResizeEvent>();
  resize = output<ResizeEvent>();
  resizeEnd = output<ResizeEvent>();

  // 視圖子元素
  controlElement = viewChild.required<ElementRef<HTMLDivElement>>('controlElement');

  // 內部狀態
  private resizer: XYResizerInstance | null = null;

  // 注入服務
  private _flowService = inject(AngularXYFlowService<AngularNode, AngularEdge>);
  private _resizerService = inject(AngularXYResizerService);
  private _injector = inject(Injector);

  // 計算實際使用的位置 - 對應 React Flow 的 position ?? defaultPositions[variant] 邏輯
  actualPosition = computed(() => {
    const inputPosition = this.position();
    const variant = this.variant();
    
    // 如果有明確指定位置，使用指定位置；否則使用默認位置
    return inputPosition ?? defaultPositions[variant];
  });

  // 計算屬性 - React Flow 標準類名
  controlClasses = computed(() => {
    const classes = ['react-flow__resize-control'];

    // 添加 nodrag 類別防止拖拽衝突（關鍵修復）
    classes.push('nodrag');

    // 添加變體類別
    const variant = this.variant();
    classes.push(variant);

    // 添加位置類別 - 使用計算後的實際位置
    const position = this.actualPosition();
    if (position) {
      classes.push(String(position));
    }

    // 添加自定義類別
    const customClass = this.handleClassName();
    if (customClass) {
      classes.push(customClass);
    }

    return classes.join(' ');
  });

  // 計算 scale 值 - 模擬 React Flow 的 autoScale 功能
  controlScale = computed(() => {
    const variant = this.variant();
    const autoScale = this.autoScale();
    
    // 只對 Handle 控制點且啟用 autoScale 時計算 scale
    if (variant === ResizeControlVariant.Handle && autoScale) {
      const viewport = this._flowService.viewport();
      const zoom = viewport.zoom;
      
      // 使用 React Flow 相同的公式：Math.max(1 / zoom, 1)
      return Math.max(1 / zoom, 1);
    }
    
    return undefined;
  });

  controlStyle = computed(() => {
    const baseStyle = this.style();
    const color = this.color();
    const scale = this.controlScale();

    let computedStyle = { ...baseStyle };

    // 應用自定義顏色
    if (color) {
      computedStyle['--xy-resize-background-color'] = color;
    }

    // 應用 scale 值 - 模擬 React Flow 的 autoScale 行為
    if (scale !== undefined) {
      computedStyle['scale'] = scale.toString();
    }

    return computedStyle;
  });

  constructor() {
    // 響應式初始化 XYResizer - 使用雙重檢查確保完全準備
    afterNextRender(() => {
      // 🔑 修復：在 afterNextRender 中使用 injector 選項
      effect(() => {
        const nodeId = this.nodeId();
        const node = this._flowService.nodeLookup().get(nodeId);
        const controlElement = this.controlElement();
        
        // 確保所有條件都滿足且還沒有初始化過
        if (nodeId && node && controlElement && !this.resizer) {
          this.initializeResizer();
        }
      }, { injector: this._injector });
      
      // 🔑 新增：響應式更新 resizer 配置，特別是 keepAspectRatio 變化
      effect(() => {
        // 追蹤所有影響 resizer 配置的屬性
        const keepAspectRatio = this.keepAspectRatio();
        const position = this.actualPosition();
        const minWidth = this.minWidth();
        const maxWidth = this.maxWidth();
        const minHeight = this.minHeight();
        const maxHeight = this.maxHeight();
        const resizeDirection = this.resizeDirection();
        
        // 如果 resizer 已經初始化，更新其配置
        if (this.resizer) {
          this.updateResizerConfig();
        }
      }, { injector: this._injector });
    });
  }

  ngOnDestroy(): void {
    // 清理 XYResizer 實例
    if (this.resizer) {
      this._resizerService.destroyResizer(this.nodeId());
    }
  }

  private initializeResizer(): void {
    const domNode = this.controlElement().nativeElement;
    const nodeId = this.nodeId();

    // 創建 XYResizer 實例
    this.resizer = this._resizerService.createResizer({
      domNode,
      nodeId,
      flowService: this._flowService,
      onChange: (change: XYResizerChange, childChanges: XYResizerChildChange[]) => {
        this.handleResizerChange(change, childChanges);
      },
      onEnd: (change: Required<XYResizerChange>) => {
        this.handleResizerEnd(change);
      }
    });

    // 更新 XYResizer 配置
    this.updateResizerConfig();
  }

  private updateResizerConfig(): void {
    if (!this.resizer) return;

    const position = this.actualPosition();
    const positionStr = String(position);
    const keepAspectRatio = this.keepAspectRatio();
    const resizeDirection = this.getResizeDirection();

    this._resizerService.updateResizer(this.nodeId(), {
      controlPosition: positionStr as any, // Cast to ControlPosition
      boundaries: {
        minWidth: this.minWidth() || 10,
        maxWidth: this.maxWidth() || Number.MAX_VALUE,
        minHeight: this.minHeight() || 10,
        maxHeight: this.maxHeight() || Number.MAX_VALUE,
      },
      keepAspectRatio,
      resizeDirection, // 🔑 修復：正確傳遞 resizeDirection
      onResizeStart: (event: any) => {
        this.handleResizerStart(event);
      },
      onResize: (event: any, params: any) => {
        this.handleResizerResize(event, params);
      },
      onResizeEnd: (event: any) => {
        this.handleResizerEnd();
      },
      shouldResize: (event: any, params: any) => {
        const shouldResizeFn = this.shouldResize();
        return shouldResizeFn ? shouldResizeFn(event, params) : true;
      },
    });
  }

  private handleResizerStart(event: MouseEvent | TouchEvent): void {
    const nodeId = this.nodeId();
    const node = this._flowService.nodeLookup().get(nodeId);
    if (!node) return;

    // 調用用戶提供的回調
    const onResizeStartFn = this.onResizeStart();
    if (onResizeStartFn) {
      onResizeStartFn(event as MouseEvent, { node, direction: this.actualPosition() });
    }

    // 觸發 resizeStart 事件
    this.resizeStart.emit({
      event: event as MouseEvent,
      node,
      direction: String(this.actualPosition()),
      width: node.width,
      height: node.height,
    });
  }

  private handleResizerResize(event: MouseEvent | TouchEvent, params: any): void {
    const nodeId = this.nodeId();
    const node = this._flowService.nodeLookup().get(nodeId);
    if (!node) return;

    // 調用用戶提供的回調
    const onResizeFn = this.onResize();
    if (onResizeFn) {
      onResizeFn(event as MouseEvent, { node, direction: this.actualPosition(), ...params });
    }

    // 觸發 resize 事件
    this.resize.emit({
      event: event as MouseEvent,
      node,
      direction: String(this.actualPosition()),
      width: node.width,
      height: node.height,
    });
  }

  private handleResizerEnd(change?: Required<XYResizerChange>): void {
    const nodeId = this.nodeId();
    const node = this._flowService.nodeLookup().get(nodeId);
    if (!node) return;

    // 調用用戶提供的回調
    const onResizeEndFn = this.onResizeEnd();
    if (onResizeEndFn) {
      onResizeEndFn({} as MouseEvent, { node, direction: this.actualPosition() });
    }

    // 觸發 resizeEnd 事件
    this.resizeEnd.emit({
      event: {} as MouseEvent,
      node,
      direction: String(this.actualPosition()),
      width: node.width,
      height: node.height,
    });
  }

  private getResizeDirection(): 'horizontal' | 'vertical' | undefined {
    // 優先使用明確指定的 resizeDirection
    const explicitDirection = this.resizeDirection();
    if (explicitDirection === 'horizontal' || explicitDirection === 'vertical') {
      return explicitDirection;
    }
    
    // 🔑 修復：當 keepAspectRatio 為 true 時，不應限制調整方向
    // 這樣 XYResizer 才能正確處理雙向縮放
    const keepAspectRatio = this.keepAspectRatio();
    if (keepAspectRatio) {
      // keepAspectRatio 模式下，讓 XYResizer 自己處理方向約束
      return undefined;
    }
    
    // 根據位置自動推斷方向（僅在非 keepAspectRatio 模式下）
    const position = String(this.actualPosition());
    if (position === 'left' || position === 'right') {
      return 'horizontal';
    }
    if (position === 'top' || position === 'bottom') {
      return 'vertical';
    }
    
    // 角落位置默認允許雙向調整
    return undefined;
  }

  private handleResizerChange(change: XYResizerChange, childChanges: XYResizerChildChange[]): void {
    const nodeId = this.nodeId();

    // 轉換為 Angular Change 事件 - 受控模式核心
    if (change.x !== undefined || change.y !== undefined) {
      this.nodeChange.emit({
        id: nodeId,
        type: 'position',
        position: { 
          x: change.x ?? 0, 
          y: change.y ?? 0 
        }
      });
    }

    if (change.width !== undefined || change.height !== undefined) {
      this.nodeChange.emit({
        id: nodeId,
        type: 'dimensions',
        dimensions: { 
          width: change.width ?? 0, 
          height: change.height ?? 0 
        }
      });
    }

    // 處理子節點變化
    childChanges.forEach(childChange => {
      this.nodeChange.emit({
        id: childChange.id,
        type: 'position',
        position: childChange.position
      });
    });
  }
}