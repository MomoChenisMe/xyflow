import { Injectable, computed, inject, signal } from '@angular/core';
import type {
  PanZoomInstance,
  Viewport,
  Transform,
  CoordinateExtent,
} from '@xyflow/system';
import {
  XYPanZoom,
  fitViewport,
  pointToRendererPoint,
  Rect,
  XYPosition,
  PanOnScrollMode,
} from '@xyflow/system';
import { AngularXYFlowService } from './angular-xyflow.service';

@Injectable()
export class AngularXYFlowPanZoomService {
  // 依賴注入
  private _flowService = inject(AngularXYFlowService);

  // PanZoom 實例
  panZoomInstance: PanZoomInstance | null = null;

  // 移除不再使用的視口輔助函數

  // 私有狀態
  private _isDragging = signal(false);
  private _isZooming = signal(false);
  private domElement: HTMLElement | null = null;
  private destroyHandlers: (() => void)[] = [];
  
  // 儲存當前的 PanZoom 配置
  private currentConfig: any = {};

  // 對外暴露的計算屬性
  isDragging = computed(() => this._isDragging());
  isZooming = computed(() => this._isZooming());

  // 視窗事件回調
  private onMoveStart?: (data: {
    event?: MouseEvent | TouchEvent;
    position: XYPosition;
  }) => void;
  private onMove?: (data: {
    event?: MouseEvent | TouchEvent;
    position: XYPosition;
    deltaX: number;
    deltaY: number;
  }) => void;
  private onMoveEnd?: (data: {
    event?: MouseEvent | TouchEvent;
    position: XYPosition;
  }) => void;
  private onPaneContextMenu?: (event: MouseEvent) => void;

  constructor() {}

  // 初始化 PanZoom 功能
  initializePanZoom(config: {
    domNode: HTMLElement;
    minZoom: number;
    maxZoom: number;
    zoomOnScroll?: boolean;
    zoomOnPinch?: boolean;
    panOnScroll?: boolean;
    panOnScrollSpeed?: number;
    zoomOnDoubleClick?: boolean;
    panOnDrag?: boolean | number[];
    preventScrolling?: boolean;
    paneClickDistance?: number;
    defaultViewport?: Viewport;
    onPaneContextMenu?: (event: MouseEvent) => void;
  }) {
    if (this.panZoomInstance) {
      console.warn('PanZoom already initialized');
      return;
    }

    this.domElement = config.domNode;
    
    // 儲存回調函數
    this.onPaneContextMenu = config.onPaneContextMenu;

    // 創建 PanZoom 實例
    this.panZoomInstance = XYPanZoom({
      domNode: config.domNode,
      minZoom: config.minZoom,
      maxZoom: config.maxZoom,
      translateExtent: [
        [-Infinity, -Infinity],
        [Infinity, Infinity],
      ],
      viewport: config.defaultViewport || { x: 0, y: 0, zoom: 1 },
      paneClickDistance: config.paneClickDistance ?? 0,
      onDraggingChange: (dragging: boolean) => {
        this._isDragging.set(dragging);
      },
      onPanZoomStart: (
        event: MouseEvent | TouchEvent | null,
        viewport: Viewport
      ) => {
        this._isZooming.set(true);
        this.handleMoveStart();
      },
      onPanZoom: (
        event: MouseEvent | TouchEvent | null,
        viewport: Viewport
      ) => {
        // 移除過於頻繁的 log，只在真正需要時才輸出
        if (event) {
          this.handleMove(event);
        }
        // 同步 viewport 到服務
        this._flowService.setViewport(viewport);
      },
      onPanZoomEnd: () => {
        this._isZooming.set(false);
        this.handleMoveEnd();
      },
    });

    // 建立並儲存配置
    this.currentConfig = {
      noWheelClassName: 'nowheel',
      noPanClassName: 'nopan',
      preventScrolling: config.preventScrolling ?? true,
      panOnScroll: config.panOnScroll ?? false,
      panOnDrag: config.panOnDrag ?? true,
      panOnScrollMode: PanOnScrollMode.Free,
      panOnScrollSpeed: config.panOnScrollSpeed ?? 0.5,
      userSelectionActive: false,
      zoomOnPinch: config.zoomOnPinch ?? true,
      zoomOnScroll: config.zoomOnScroll ?? true,
      zoomOnDoubleClick: config.zoomOnDoubleClick ?? true,
      zoomActivationKeyPressed: false,
      lib: 'angular',
      onTransformChange: (transform: Transform) => {
        this._flowService.setViewport({
          x: transform[0],
          y: transform[1],
          zoom: transform[2],
        });
      },
      onPaneContextMenu: this.onPaneContextMenu, // ✅ 正確傳遞給update方法
    };

    // 更新 PanZoom 的設置
    this.panZoomInstance.update(this.currentConfig);

    // 設置初始視口（如果提供）
    if (config.defaultViewport) {
      this.setViewport(config.defaultViewport);
    }

    // 存儲銷毀函數
    this.destroyHandlers.push(() => {
      this.panZoomInstance?.destroy();
      this.panZoomInstance = null;
    });
  }

  // 處理移動開始事件
  private handleMoveStart() {
    // 直接使用 undefined，避免使用 deprecated window.event
    const position = this.getEventPosition(undefined);

    if (this.onMoveStart) {
      this.onMoveStart({ position });
    }
  }

  // 處理移動事件
  private handleMove(event?: MouseEvent | TouchEvent, position?: XYPosition) {
    const eventPosition = position || this.getEventPosition(event);

    if (this.onMove && eventPosition) {
      this.onMove({
        event,
        position: eventPosition,
        deltaX: 0, // TODO: 計算實際的 delta
        deltaY: 0, // TODO: 計算實際的 delta
      });
    }
  }

  // 處理移動結束事件
  private handleMoveEnd() {
    // 直接使用 undefined，避免使用 deprecated window.event
    const position = this.getEventPosition(undefined);

    if (this.onMoveEnd) {
      this.onMoveEnd({ position });
    }
  }

  // 獲取事件位置
  private getEventPosition(event?: MouseEvent | TouchEvent): XYPosition {
    if (!event || !this.domElement) {
      return { x: 0, y: 0 };
    }

    const rect = this.domElement.getBoundingClientRect();
    const clientX =
      'clientX' in event ? event.clientX : event.touches[0]?.clientX || 0;
    const clientY =
      'clientY' in event ? event.clientY : event.touches[0]?.clientY || 0;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  // 設置事件回調
  setOnMoveStart(callback: typeof this.onMoveStart) {
    this.onMoveStart = callback;
  }

  setOnMove(callback: typeof this.onMove) {
    this.onMove = callback;
  }

  setOnMoveEnd(callback: typeof this.onMoveEnd) {
    this.onMoveEnd = callback;
  }

  // 獲取 PanZoom 實例
  getPanZoomInstance(): PanZoomInstance | null {
    return this.panZoomInstance;
  }

  // 設置視口 - 立即設置視口位置和縮放級別
  setViewport(viewport: Viewport, options?: { duration?: number }) {
    if (!this.panZoomInstance) {
      console.warn('PanZoom not initialized');
      return;
    }

    // 使用 PanZoom 實例來設置視口
    this.panZoomInstance.setViewport(viewport, options);
  }

  // 獲取當前視口
  getViewport(): Viewport {
    if (!this.panZoomInstance) {
      return { x: 0, y: 0, zoom: 1 };
    }
    return this.panZoomInstance.getViewport();
  }

  // 設置事件回調
  setPaneContextMenuCallback(callback?: (event: MouseEvent) => void): void {
    this.onPaneContextMenu = callback;
    
    // 更新現有配置
    if (this.currentConfig && this.panZoomInstance) {
      this.currentConfig.onPaneContextMenu = callback;
      this.panZoomInstance.update(this.currentConfig);
    }
  }

  // 更新用戶選擇狀態
  updateUserSelectionActive(isActive: boolean): void {
    if (this.currentConfig && this.panZoomInstance) {
      this.currentConfig.userSelectionActive = isActive;
      this.panZoomInstance.update(this.currentConfig);
    }
  }

  // 更新縮放激活按鍵狀態
  updateZoomActivationKeyPressed(isPressed: boolean): void {
    if (this.currentConfig && this.panZoomInstance) {
      this.currentConfig.zoomActivationKeyPressed = isPressed;
      this.panZoomInstance.update(this.currentConfig);
    }
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

    // Debug: 計算節點邊界
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    const nodeDetails: any[] = [];
    internalNodeLookup.forEach((node, id) => {
      const x = node.internals.positionAbsolute.x;
      const y = node.internals.positionAbsolute.y;
      const width = node.measured.width;
      const height = node.measured.height;
      nodeDetails.push({
        id,
        x,
        y,
        width,
        height,
        right: x + width,
        bottom: y + height,
      });
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    const nodeBounds = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    // 計算 padding 後的實際視窗區域
    const padding = options?.padding || 0.1;
    const paddingPixels =
      typeof padding === 'number'
        ? {
            top: dimensions.height * padding,
            right: dimensions.width * padding,
            bottom: dimensions.height * padding,
            left: dimensions.width * padding,
          }
        : {
            top: dimensions.height * (padding.top || 0),
            right: dimensions.width * (padding.right || 0),
            bottom: dimensions.height * (padding.bottom || 0),
            left: dimensions.width * (padding.left || 0),
          };

    const availableWidth =
      dimensions.width - paddingPixels.left - paddingPixels.right;
    const availableHeight =
      dimensions.height - paddingPixels.top - paddingPixels.bottom;

    // 計算縮放比例
    const scaleX = availableWidth / nodeBounds.width;
    const scaleY = availableHeight / nodeBounds.height;


    try {
      // 使用系統包的 fitViewport 函數，與 React 實現一致
      // 使用與 React Flow 相同的默認 padding
      const fitViewOptions = options || {};
      if (!fitViewOptions.padding) {
        fitViewOptions.padding = 0.1; // 與 React Flow 一致
      }

      // 稍微增加 padding 以確保節點 4 完全在視窗內
      // 這是因為 Angular 版本的測量可能有細微差異
      if (typeof fitViewOptions.padding === 'number') {
        fitViewOptions.padding = Math.max(fitViewOptions.padding, 0.12); // 增加到 12%
      }

      await fitViewport(
        {
          nodes: internalNodeLookup,
          width: dimensions.width,
          height: dimensions.height,
          panZoom: this.panZoomInstance,
          minZoom,
          maxZoom,
        },
        fitViewOptions
      );

      return true;
    } catch (error) {
      console.error('FitView error:', error);
      return false;
    }
  }


  // 縮放功能 - 使用與 React Flow 相同的縮放係數 (1.2)
  zoomIn(options?: { duration?: number }) {
    if (!this.panZoomInstance) return;
    // 使用 scaleBy 而非 scaleTo，與 React Flow 保持一致
    // React Flow 使用 1.2 作為縮放係數
    return this.panZoomInstance.scaleBy(1.2, options);
  }

  zoomOut(options?: { duration?: number }) {
    if (!this.panZoomInstance) return;
    // 使用 scaleBy 而非 scaleTo，與 React Flow 保持一致
    // React Flow 使用 1/1.2 (約 0.833) 作為縮放係數
    return this.panZoomInstance.scaleBy(1 / 1.2, options);
  }

  zoomTo(zoom: number, options?: { duration?: number }) {
    if (!this.panZoomInstance) return;
    this.panZoomInstance.scaleTo(zoom, options);
  }

  // 平移功能
  setCenter(
    x: number,
    y: number,
    options?: { zoom?: number; duration?: number }
  ) {
    if (!this.panZoomInstance) return;
    const dimensions = this._flowService.dimensions();
    const zoom = options?.zoom || this.getViewport().zoom;
    const newViewport = {
      x: dimensions.width / 2 - x * zoom,
      y: dimensions.height / 2 - y * zoom,
      zoom: zoom,
    };
    this.setViewport(newViewport, options);
  }

  // 重置視口
  resetViewport() {
    this.setViewport({ x: 0, y: 0, zoom: 1 });
  }

  // 屏幕座標轉換為流程座標
  screenToFlowPosition(position: XYPosition): XYPosition {
    const viewport = this.getViewport();
    return {
      x: (position.x - viewport.x) / viewport.zoom,
      y: (position.y - viewport.y) / viewport.zoom,
    };
  }

  // 流程座標轉換為屏幕座標
  flowToScreenPosition(position: XYPosition): XYPosition {
    const viewport = this.getViewport();
    return {
      x: position.x * viewport.zoom + viewport.x,
      y: position.y * viewport.zoom + viewport.y,
    };
  }


  // 更新平移滾輪設置
  updatePanOnScroll(enabled: boolean): void {
    if (this.panZoomInstance && this.currentConfig) {
      this.currentConfig.panOnScroll = enabled;
      this.panZoomInstance.update(this.currentConfig);
    }
  }

  // 更新平移滾輪速度設置
  updatePanOnScrollSpeed(speed: number): void {
    if (this.panZoomInstance && this.currentConfig) {
      this.currentConfig.panOnScrollSpeed = speed;
      this.panZoomInstance.update(this.currentConfig);
    }
  }

  // 銷毀服務
  destroy() {
    this.destroyHandlers.forEach((handler) => handler());
    this.destroyHandlers = [];
    this.panZoomInstance = null;
    this.domElement = null;
  }
}
