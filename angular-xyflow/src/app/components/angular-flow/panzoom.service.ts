import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import { XYPanZoom, type PanZoomInstance, type Viewport, type Transform, PanOnScrollMode } from '@xyflow/system';
import { AngularFlowService } from './angular-flow.service';

interface PanZoomConfig {
  domNode: HTMLElement;
  minZoom?: number;
  maxZoom?: number;
  zoomOnScroll?: boolean;
  zoomOnPinch?: boolean;
  panOnScroll?: boolean;
  panOnScrollSpeed?: number;
  panOnScrollMode?: PanOnScrollMode;
  zoomOnDoubleClick?: boolean;
  panOnDrag?: boolean;
  preventScrolling?: boolean;
  paneClickDistance?: number;
  translateExtent?: [[number, number], [number, number]];
  defaultViewport?: Viewport;
}

@Injectable({
  providedIn: 'root'
})
export class AngularFlowPanZoomService implements OnDestroy {
  private panZoomInstance?: PanZoomInstance;
  private readonly _isDragging = signal(false);

  // 公開狀態
  readonly isDragging = computed(() => this._isDragging());

  constructor(private flowService: AngularFlowService) {}

  // 初始化 PanZoom 功能
  initializePanZoom(config: PanZoomConfig): void {
    // 清理現有實例
    this.destroy();

    const {
      domNode,
      minZoom = 0.5,
      maxZoom = 2,
      zoomOnScroll = true,
      zoomOnPinch = true,
      panOnScroll = false,
      panOnScrollSpeed = 0.5,
      panOnScrollMode = PanOnScrollMode.Free,
      zoomOnDoubleClick = true,
      panOnDrag = true,
      preventScrolling = true,
      paneClickDistance = 0,
      translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]],
      defaultViewport = { x: 0, y: 0, zoom: 1 }
    } = config;

    console.log('🔧 初始化 PanZoom 功能', { 
      domNode, 
      minZoom, 
      maxZoom, 
      panOnDrag, 
      zoomOnScroll 
    });

    // 創建 XYPanZoom 實例
    this.panZoomInstance = XYPanZoom({
      domNode,
      minZoom,
      maxZoom,
      translateExtent,
      viewport: defaultViewport,
      paneClickDistance,
      onDraggingChange: (isDragging: boolean) => {
        console.log('🔧 PanZoom dragging state changed:', isDragging);
        this._isDragging.set(isDragging);
      },
      onPanZoomStart: (event, viewport) => {
        console.log('🎯 PanZoom start:', viewport);
        // 可以在這裡發送事件
      },
      onPanZoom: (event, viewport) => {
        console.log('🔧 PanZoom update:', viewport);
        // 更新 flowService 的 viewport
        this.updateFlowViewport(viewport);
      },
      onPanZoomEnd: (event, viewport) => {
        console.log('🎯 PanZoom end:', viewport);
        // 可以在這裡發送事件
      },
    });

    // 更新 PanZoom 設置
    this.panZoomInstance.update({
      noWheelClassName: 'no-wheel',
      noPanClassName: 'no-pan',
      preventScrolling,
      panOnScroll,
      panOnDrag,
      panOnScrollMode,
      panOnScrollSpeed,
      userSelectionActive: false,
      zoomOnPinch,
      zoomOnScroll,
      zoomOnDoubleClick,
      zoomActivationKeyPressed: false,
      lib: 'angular-xyflow',
      onTransformChange: (transform: Transform) => {
        console.log('🔧 Transform changed:', transform);
        const viewport: Viewport = {
          x: transform[0],
          y: transform[1],
          zoom: transform[2]
        };
        this.updateFlowViewport(viewport);
      }
    });

    console.log('✅ PanZoom 功能已初始化');
  }

  // 更新 PanZoom 設置
  updatePanZoom(updates: Partial<PanZoomConfig>): void {
    if (!this.panZoomInstance) {
      console.warn('⚠️ PanZoom 尚未初始化');
      return;
    }

    // 創建完整的更新選項
    const fullUpdate = {
      noWheelClassName: 'no-wheel',
      noPanClassName: 'no-pan',
      preventScrolling: true,
      panOnScroll: false,
      panOnDrag: true,
      panOnScrollMode: PanOnScrollMode.Free,
      panOnScrollSpeed: 0.5,
      userSelectionActive: false,
      zoomOnPinch: true,
      zoomOnScroll: true,
      zoomOnDoubleClick: true,
      zoomActivationKeyPressed: false,
      lib: 'angular-xyflow',
      onTransformChange: (transform: Transform) => {
        const viewport: Viewport = {
          x: transform[0],
          y: transform[1],
          zoom: transform[2]
        };
        this.updateFlowViewport(viewport);
      },
      ...updates
    };

    this.panZoomInstance.update(fullUpdate);
  }

  // 設置 viewport
  setViewport(viewport: Viewport, options?: { duration?: number }): void {
    if (!this.panZoomInstance) {
      console.warn('⚠️ PanZoom 尚未初始化');
      return;
    }

    console.log('🎯 設置 viewport:', viewport);
    this.panZoomInstance.setViewport(viewport, options);
  }

  // 獲取當前 viewport
  getViewport(): Viewport {
    if (!this.panZoomInstance) {
      return { x: 0, y: 0, zoom: 1 };
    }
    return this.panZoomInstance.getViewport();
  }

  // 縮放到適合視口
  fitView(options?: any): void {
    if (!this.panZoomInstance) {
      console.warn('⚠️ PanZoom 尚未初始化');
      return;
    }

    console.log('🎯 執行 fitView');
    // 這裡可以實現 fitView 邏輯
    // 暫時設置一個默認的 viewport
    this.setViewport({ x: 0, y: 0, zoom: 1 });
  }

  // 放大
  zoomIn(): void {
    if (!this.panZoomInstance) return;
    
    const currentViewport = this.getViewport();
    const newZoom = Math.min(currentViewport.zoom * 1.2, 2); // maxZoom = 2
    this.setViewport({ ...currentViewport, zoom: newZoom });
  }

  // 縮小
  zoomOut(): void {
    if (!this.panZoomInstance) return;
    
    const currentViewport = this.getViewport();
    const newZoom = Math.max(currentViewport.zoom / 1.2, 0.5); // minZoom = 0.5
    this.setViewport({ ...currentViewport, zoom: newZoom });
  }

  // 重置 viewport
  resetViewport(): void {
    this.setViewport({ x: 0, y: 0, zoom: 1 });
  }

  // 更新 FlowService 的 viewport
  private updateFlowViewport(viewport: Viewport): void {
    const flowInstance = this.flowService.getFlowInstance();
    flowInstance.setViewport(viewport);
  }

  // 清理 PanZoom 實例
  destroy(): void {
    if (this.panZoomInstance) {
      console.log('🧹 清理 PanZoom 實例');
      this.panZoomInstance.destroy();
      this.panZoomInstance = undefined;
    }
    this._isDragging.set(false);
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}