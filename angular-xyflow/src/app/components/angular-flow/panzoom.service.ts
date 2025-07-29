// Angular 核心模組
import { Injectable, signal, computed, OnDestroy } from '@angular/core';

// XyFlow 系統模組
import { XYPanZoom, type PanZoomInstance, type Viewport, type Transform, PanOnScrollMode } from '@xyflow/system';

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
      
      // 檢查是否點擊在 Node、Edge、Controls、MiniMap、Panel、Background 上
      const isOnNode = target.closest('.angular-flow__node, .xy-flow__node');
      const isOnEdge = target.closest('.angular-flow__edge, .xy-flow__edge');
      const isOnControls = target.closest('.angular-flow__controls');
      const isOnMiniMap = target.closest('.angular-flow__minimap');
      const isOnPanel = target.closest('.angular-flow__panel');
      const isOnBackground = target.closest('.angular-flow__background');
      
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

  // 縮放到適合視口
  fitView(options?: any): void {
    if (!this.panZoomInstance) {
      console.warn('PanZoom not initialized');
      return;
    }

    
    const nodes = this._flowService.nodes();
    if (nodes.length === 0) {
      this.resetViewport();
      return;
    }

    // 獲取DOM元素的實際尺寸
    const domElement = this.getDomElement();
    if (!domElement) {
      console.warn('Unable to get container element');
      return;
    }

    const rect = domElement.getBoundingClientRect();
    const containerWidth = rect.width;
    const containerHeight = rect.height;

    // 計算所有節點的邊界
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach(node => {
      const nodeWidth = (node as any).width || 150;
      const nodeHeight = (node as any).height || 40;
      
      minX = Math.min(minX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxX = Math.max(maxX, node.position.x + nodeWidth);
      maxY = Math.max(maxY, node.position.y + nodeHeight);
    });

    // 計算邊界尺寸
    const boundingWidth = maxX - minX;
    const boundingHeight = maxY - minY;
    
    // 計算適合的縮放級別
    const padding = options?.padding || { top: 100, left: 50, right: 50, bottom: 50 };
    const paddingTop = typeof padding.top === 'string' ? parseFloat(padding.top) : (padding.top || 0);
    const paddingLeft = typeof padding.left === 'string' ? parseFloat(padding.left) : (padding.left || 0);
    const paddingRight = typeof padding.right === 'string' ? parseFloat(padding.right) : (padding.right || 0);
    const paddingBottom = typeof padding.bottom === 'string' ? parseFloat(padding.bottom) : (padding.bottom || 0);
    
    const availableWidth = containerWidth - paddingLeft - paddingRight;
    const availableHeight = containerHeight - paddingTop - paddingBottom;
    
    const zoomX = availableWidth / boundingWidth;
    const zoomY = availableHeight / boundingHeight;
    const zoom = Math.min(zoomX, zoomY, 2); // maxZoom = 2
    
    // 計算中心位置
    const centerX = (containerWidth - boundingWidth * zoom) / 2 - minX * zoom + paddingLeft - paddingRight;
    const centerY = (containerHeight - boundingHeight * zoom) / 2 - minY * zoom + paddingTop - paddingBottom;
    
    // 應用新的 viewport
    this.setViewport({
      x: centerX,
      y: centerY,
      zoom: Math.max(zoom, 0.5) // minZoom = 0.5
    });
  }

  // 獲取DOM元素
  private getDomElement(): HTMLElement | null {
    // 這裡應該返回當前的DOM節點
    // 暫時通過查詢選擇器獲取
    return document.querySelector('.angular-flow') as HTMLElement;
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