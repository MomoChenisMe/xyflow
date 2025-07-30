// Angular 核心模組
import { Injectable, signal, computed, OnDestroy } from '@angular/core';

// XyFlow 系統模組
import { XYPanZoom, type PanZoomInstance, type Viewport, type Transform, PanOnScrollMode, fitViewport } from '@xyflow/system';

// 專案內部模組
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

@Injectable()
export class AngularFlowPanZoomService implements OnDestroy {
  private panZoomInstance?: PanZoomInstance;
  private readonly _isDragging = signal(false);
  private doubleClickHandler?: (event: MouseEvent) => void;

  // 公開狀態
  readonly isDragging = computed(() => this._isDragging());

  // 獲取PanZoom實例
  getPanZoomInstance(): PanZoomInstance | undefined {
    return this.panZoomInstance;
  }

  constructor(private _flowService: AngularFlowService) {}


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



    // 創建 XYPanZoom 實例
    this.panZoomInstance = XYPanZoom({
      domNode,
      minZoom,
      maxZoom,
      translateExtent,
      viewport: defaultViewport,
      paneClickDistance,
      onDraggingChange: (isDragging: boolean) => {
        this._isDragging.set(isDragging);
      },
      onPanZoomStart: (event, viewport) => {
        // 可以在這裡發送事件
      },
      onPanZoom: (event, viewport) => {
        // 更新 flowService 的 viewport
        this.updateFlowViewport(viewport);
      },
      onPanZoomEnd: (event, viewport) => {
        // 可以在這裡發送事件
      },
    });

    // 更新 PanZoom 設置 - 阻止 Node、Edge、Controls、MiniMap、Panel、Background 上的 PanZoom 事件
    this.panZoomInstance.update({
      noWheelClassName: 'angular-flow__node angular-flow__edge angular-flow__controls angular-flow__minimap angular-flow__panel angular-flow__background xy-flow__node xy-flow__edge',
      noPanClassName: 'angular-flow__node angular-flow__edge angular-flow__controls angular-flow__minimap angular-flow__panel angular-flow__background xy-flow__node xy-flow__edge',
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
        const viewport: Viewport = {
          x: transform[0],
          y: transform[1],
          zoom: transform[2]
        };
        this.updateFlowViewport(viewport);
      }
    });

    // 如果啟用雙點擊縮放，需要添加自定義處理
    if (zoomOnDoubleClick) {
      this.setupCustomDoubleClickHandler();
    }

  }

  // 設置自定義雙點擊處理器
  private setupCustomDoubleClickHandler(): void {
    if (!this.panZoomInstance) return;

    // 直接在 DOM 元素上添加雙點擊監聽器
    const domElement = this.getDomElement();
    if (!domElement) return;

    // 創建並保存雙點擊處理器
    this.doubleClickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const container = this.getDomElement();
      if (!container) return;
      
      // 首先確認事件目標在當前Flow容器內
      if (!container.contains(target)) {
        return;
      }
      
      // 使用輔助函數在容器範圍內檢查 closest
      const isOnNode = this.isTargetInContainerElement(target, container, '.angular-flow__node, .xy-flow__node');
      const isOnEdge = this.isTargetInContainerElement(target, container, '.angular-flow__edge, .xy-flow__edge');
      const isOnControls = this.isTargetInContainerElement(target, container, '.angular-flow__controls');
      const isOnMiniMap = this.isTargetInContainerElement(target, container, '.angular-flow__minimap');
      const isOnPanel = this.isTargetInContainerElement(target, container, '.angular-flow__panel');
      const isOnBackground = this.isTargetInContainerElement(target, container, '.angular-flow__background');
      
      if (isOnNode || isOnEdge || isOnControls || isOnMiniMap || isOnPanel || isOnBackground) {
        event.stopPropagation();
        event.preventDefault();
        return;
      }
      
      // 背景區域的雙點擊由 D3 處理器處理
    };

    // 添加自定義雙點擊處理器，優先級高於 D3 的處理器
    domElement.addEventListener('dblclick', this.doubleClickHandler, true);
  }

  // 更新 PanZoom 設置
  updatePanZoom(updates: Partial<PanZoomConfig>): void {
    if (!this.panZoomInstance) {
      console.warn('PanZoom not initialized');
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
      console.warn('PanZoom not initialized');
      return;
    }

    this.panZoomInstance.setViewport(viewport, options);
  }

  // 獲取當前 viewport
  getViewport(): Viewport {
    if (!this.panZoomInstance) {
      return { x: 0, y: 0, zoom: 1 };
    }
    return this.panZoomInstance.getViewport();
  }

  // 縮放到適合視口 - 使用系統包的 fitViewport 函數
  async fitView(options?: any): Promise<boolean> {
    if (!this.panZoomInstance) {
      console.warn('PanZoom not initialized');
      return false;
    }

    // 獲取必要的參數
    const internalNodeLookup = this._flowService.internalNodeLookup();
    const dimensions = this._flowService.dimensions();
    const minZoom = this._flowService.minZoom();
    const maxZoom = this._flowService.maxZoom();

    // 如果沒有節點，重置視口
    if (internalNodeLookup.size === 0) {
      this.resetViewport();
      return true;
    }

    try {
      // 使用系統包的 fitViewport 函數，與 React 實現一致
      await fitViewport(
        {
          nodes: internalNodeLookup,
          width: dimensions.width,
          height: dimensions.height,
          panZoom: this.panZoomInstance,
          minZoom,
          maxZoom,
        },
        options
      );

      return true;
    } catch (error) {
      console.error('FitView error:', error);
      return false;
    }
  }

  // 獲取DOM元素
  private getDomElement(): HTMLElement | null {
    // 使用正確的流程容器 - 從 AngularFlowService 獲取當前實例的容器
    return this._flowService.getContainerElement();
  }

  // 輔助函數：檢查目標元素是否在容器範圍內符合選擇器
  private isTargetInContainerElement(target: HTMLElement, container: HTMLElement, selector: string): boolean {
    // 從目標元素開始向上遍歷，但不超出容器範圍
    let currentElement: HTMLElement | null = target;
    
    while (currentElement && container.contains(currentElement)) {
      if (currentElement.matches(selector)) {
        return true;
      }
      currentElement = currentElement.parentElement;
      
      // 如果到達容器本身，停止遍歷
      if (currentElement === container) {
        break;
      }
    }
    
    return false;
  }

  // 放大 - 以視口中心為基準（與 React Flow 一致）
  zoomIn(): void {
    if (!this.panZoomInstance) return;
    
    
    // 使用 D3 的 scaleBy 方法，不指定第三個參數，預設以視口中心為基準
    this.panZoomInstance.scaleBy(1.2);
  }

  // 縮小 - 以視口中心為基準（與 React Flow 一致）
  zoomOut(): void {
    if (!this.panZoomInstance) return;
    
    
    // 使用 D3 的 scaleBy 方法，不指定第三個參數，預設以視口中心為基準
    this.panZoomInstance.scaleBy(1 / 1.2);
  }

  // 重置 viewport
  resetViewport(): void {
    this.setViewport({ x: 0, y: 0, zoom: 1 });
  }

  // 更新 FlowService 的 viewport
  private updateFlowViewport(viewport: Viewport): void {
    const flowInstance = this._flowService.getFlowInstance();
    flowInstance.setViewport(viewport);
  }

  // 清理 PanZoom 實例
  destroy(): void {
    // 清理雙點擊事件監聽器
    if (this.doubleClickHandler) {
      const domElement = this.getDomElement();
      if (domElement) {
        domElement.removeEventListener('dblclick', this.doubleClickHandler, true);
      }
      this.doubleClickHandler = undefined;
    }

    if (this.panZoomInstance) {
      this.panZoomInstance.destroy();
      this.panZoomInstance = undefined;
    }
    this._isDragging.set(false);
  }

  ngOnDestroy(): void {
    this.destroy();
  }
}