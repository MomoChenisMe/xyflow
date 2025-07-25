import { Injectable, computed, signal, effect } from '@angular/core';
import { FlowStoreService } from '../contexts/flow-store.service';

/**
 * Transform 類型：[x, y, zoom]
 */
export type Transform = [number, number, number];

/**
 * Viewport 視窗狀態
 */
export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * FitView 選項
 */
export interface FitViewOptions {
  padding?: number;
  includeHiddenNodes?: boolean;
  minZoom?: number;
  maxZoom?: number;
  duration?: number;
}

/**
 * Zoom 選項
 */
export interface ZoomOptions {
  duration?: number;
}

/**
 * SetCenter 選項
 */
export interface SetCenterOptions {
  zoom?: number;
  duration?: number;
}

/**
 * ViewportHelperFunctions 接口
 */
export interface ViewportHelperFunctions {
  zoomIn: (options?: ZoomOptions) => void;
  zoomOut: (options?: ZoomOptions) => void;
  zoomTo: (zoomLevel: number, options?: ZoomOptions) => void;
  getZoom: () => number;
  setViewport: (viewport: Viewport, options?: { duration?: number }) => void;
  getViewport: () => Viewport;
  fitView: (options?: FitViewOptions) => void;
  setCenter: (x: number, y: number, options?: SetCenterOptions) => void;
  fitBounds: (bounds: [[number, number], [number, number]], options?: FitViewOptions) => void;
  project: (position: { x: number; y: number }) => { x: number; y: number };
  screenToFlowPosition: (position: { x: number; y: number }) => { x: number; y: number };
  flowToScreenPosition: (position: { x: number; y: number }) => { x: number; y: number };
}

/**
 * ViewportService - Angular equivalent of React Flow's viewport-related hooks
 * 
 * 視窗服務 - 提供完整的視窗控制和變換功能
 * 等價於 React Flow 的 useViewport, useViewportHelper, useViewportSync 等 hooks
 * 
 * 主要功能：
 * - 視窗狀態管理（位置、縮放）
 * - 視窗操作（縮放、平移、適應視圖）
 * - 坐標變換（螢幕坐標 ↔ 流程坐標）
 * - 邊界計算和適應
 * - 視窗同步和動畫
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <div>當前縮放: {{ currentZoom() | number:'1.2-2' }}</div>
 *     <button (click)="zoomIn()">放大</button>
 *     <button (click)="zoomOut()">縮小</button>
 *     <button (click)="fitView()">適應視圖</button>
 *     <button (click)="centerAt(100, 100)">居中到 (100,100)</button>
 *   `
 * })
 * export class ViewportControlComponent {
 *   currentZoom = computed(() => this.viewportService.getZoom());
 *   
 *   constructor(private viewportService: ViewportService) {}
 *   
 *   zoomIn() {
 *     this.viewportService.zoomIn({ duration: 300 });
 *   }
 *   
 *   zoomOut() {
 *     this.viewportService.zoomOut({ duration: 300 });
 *   }
 *   
 *   fitView() {
 *     this.viewportService.fitView({ padding: 20, duration: 500 });
 *   }
 *   
 *   centerAt(x: number, y: number) {
 *     this.viewportService.setCenter(x, y, { duration: 400 });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class ViewportService implements ViewportHelperFunctions {
  /** 當前視窗狀態 */
  viewport = computed(() => {
    const [x, y, zoom] = this.store.getTransform();
    return { x, y, zoom };
  });

  /** 當前縮放級別 */
  zoom = computed(() => this.viewport().zoom);

  /** 當前平移位置 */
  position = computed(() => {
    const { x, y } = this.viewport();
    return { x, y };
  });

  /** 視窗變化通知 */
  private viewportChangeSignal = signal(0);

  constructor(private store: FlowStoreService) {
    // 監聽視窗變化
    effect(() => {
      const viewport = this.viewport();
      this.viewportChangeSignal.update(v => v + 1);
      console.log('Viewport changed:', viewport);
    });
  }

  // ===================
  // 基礎視窗操作
  // ===================
  
  /**
   * 獲取當前視窗狀態
   */
  getViewport(): Viewport {
    return this.viewport();
  }

  /**
   * 設置視窗狀態
   */
  setViewport(viewport: Viewport, options?: { duration?: number }): void {
    this.store.setTransform([viewport.x, viewport.y, viewport.zoom]);
    
    // 在實際實現中，這裡會處理動畫
    if (options?.duration) {
      console.log(`Animating viewport change over ${options.duration}ms`);
      // 實現動畫邏輯
    }
  }

  /**
   * 獲取當前縮放級別
   */
  getZoom(): number {
    return this.zoom();
  }

  /**
   * 設置縮放級別（保持中心點）
   */
  zoomTo(zoomLevel: number, options?: ZoomOptions): void {
    const state = this.store.getState();
    const { x, y } = this.getViewport();
    const clampedZoom = Math.max(state.minZoom, Math.min(state.maxZoom, zoomLevel));
    
    this.setViewport({ x, y, zoom: clampedZoom }, options);
  }

  /**
   * 放大
   */
  zoomIn(options?: ZoomOptions): void {
    const currentZoom = this.getZoom();
    const state = this.store.getState();
    const newZoom = Math.min(currentZoom * 1.2, state.maxZoom);
    this.zoomTo(newZoom, options);
  }

  /**
   * 縮小
   */
  zoomOut(options?: ZoomOptions): void {
    const currentZoom = this.getZoom();
    const state = this.store.getState();
    const newZoom = Math.max(currentZoom / 1.2, state.minZoom);
    this.zoomTo(newZoom, options);
  }

  // ===================
  // 平移操作
  // ===================
  
  /**
   * 平移視窗
   */
  panBy(delta: { x: number; y: number }, options?: { duration?: number }): void {
    const { x, y, zoom } = this.getViewport();
    this.setViewport({ x: x + delta.x, y: y + delta.y, zoom }, options);
  }

  /**
   * 平移到指定位置
   */
  panTo(position: { x: number; y: number }, options?: { duration?: number }): void {
    const { zoom } = this.getViewport();
    this.setViewport({ x: position.x, y: position.y, zoom }, options);
  }

  /**
   * 設置中心點
   */
  setCenter(x: number, y: number, options?: SetCenterOptions): void {
    const state = this.store.getState();
    const zoom = options?.zoom || this.getZoom();
    const centerX = state.width / 2 - x * zoom;
    const centerY = state.height / 2 - y * zoom;
    
    this.setViewport({ x: centerX, y: centerY, zoom }, { duration: options?.duration });
  }

  // ===================
  // 適應視圖
  // ===================
  
  /**
   * 適應視圖以包含所有節點
   */
  fitView(options?: FitViewOptions): void {
    const nodes = this.store.getNodes();
    
    if (nodes.length === 0) {
      console.warn('No nodes to fit view');
      return;
    }
    
    const visibleNodes = options?.includeHiddenNodes 
      ? nodes 
      : nodes.filter(node => !node.hidden);
    
    if (visibleNodes.length === 0) {
      console.warn('No visible nodes to fit view');
      return;
    }
    
    // 計算所有節點的邊界
    const bounds = this.calculateNodesBounds(visibleNodes);
    this.fitBounds(bounds, options);
  }

  /**
   * 適應到指定邊界
   */
  fitBounds(bounds: [[number, number], [number, number]], options?: FitViewOptions): void {
    const state = this.store.getState();
    const [[x1, y1], [x2, y2]] = bounds;
    const padding = options?.padding || 20;
    
    const boundWidth = x2 - x1;
    const boundHeight = y2 - y1;
    
    if (boundWidth === 0 || boundHeight === 0) {
      console.warn('Invalid bounds for fitBounds');
      return;
    }
    
    // 計算適合的縮放級別
    const scaleX = (state.width - 2 * padding) / boundWidth;
    const scaleY = (state.height - 2 * padding) / boundHeight;
    let zoom = Math.min(scaleX, scaleY);
    
    // 應用縮放限制
    const minZoom = options?.minZoom ?? state.minZoom;
    const maxZoom = options?.maxZoom ?? state.maxZoom;
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom));
    
    // 計算中心點
    const centerX = (x1 + x2) / 2;
    const centerY = (y1 + y2) / 2;
    
    this.setCenter(centerX, centerY, { zoom, duration: options?.duration });
  }

  /**
   * 適應到指定節點
   */
  fitToNode(nodeId: string, options?: FitViewOptions): void {
    const nodes = this.store.getNodes();
    const node = nodes.find(n => n.id === nodeId);
    
    if (!node) {
      console.warn(`Node with id ${nodeId} not found`);
      return;
    }
    
    const bounds = this.calculateNodesBounds([node]);
    this.fitBounds(bounds, options);
  }

  /**
   * 計算節點邊界
   */
  private calculateNodesBounds(nodes: any[]): [[number, number], [number, number]] {
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    
    nodes.forEach(node => {
      const x = node.position.x;
      const y = node.position.y;
      const width = node.width || 150;
      const height = node.height || 40;
      
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + width);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + height);
    });
    
    return [[minX, minY], [maxX, maxY]];
  }

  // ===================
  // 坐標變換
  // ===================
  
  /**
   * 投影流程坐標到螢幕坐標
   */
  project(position: { x: number; y: number }): { x: number; y: number } {
    const { x, y, zoom } = this.getViewport();
    return {
      x: position.x * zoom + x,
      y: position.y * zoom + y,
    };
  }

  /**
   * 螢幕坐標轉流程坐標
   */
  screenToFlowPosition(position: { x: number; y: number }): { x: number; y: number } {
    const { x, y, zoom } = this.getViewport();
    return {
      x: (position.x - x) / zoom,
      y: (position.y - y) / zoom,
    };
  }

  /**
   * 流程坐標轉螢幕坐標
   */
  flowToScreenPosition(position: { x: number; y: number }): { x: number; y: number } {
    return this.project(position);
  }

  /**
   * 獲取可見區域邊界（流程坐標）
   */
  getVisibleBounds(): { x: number; y: number; width: number; height: number } {
    const state = this.store.getState();
    const topLeft = this.screenToFlowPosition({ x: 0, y: 0 });
    const bottomRight = this.screenToFlowPosition({ x: state.width, y: state.height });
    
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }

  // ===================
  // 視窗同步
  // ===================
  
  /**
   * 同步視窗與外部系統
   */
  syncViewport(externalViewport?: Viewport): void {
    if (externalViewport) {
      this.setViewport(externalViewport);
    }
    
    // 觸發視窗同步事件
    this.store.updateState({ 
      transform: [this.viewport().x, this.viewport().y, this.viewport().zoom] 
    });
  }

  /**
   * 重置視窗到初始狀態
   */
  resetViewport(): void {
    this.setViewport({ x: 0, y: 0, zoom: 1 });
  }

  // ===================
  // 工具方法
  // ===================
  
  /**
   * 檢查點是否在可見區域內
   */
  isPointVisible(point: { x: number; y: number }): boolean {
    const bounds = this.getVisibleBounds();
    return point.x >= bounds.x && 
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && 
           point.y <= bounds.y + bounds.height;
  }

  /**
   * 檢查矩形是否與可見區域相交
   */
  isRectVisible(rect: { x: number; y: number; width: number; height: number }, partially = true): boolean {
    const bounds = this.getVisibleBounds();
    
    if (partially) {
      // 部分可見：有任何重疊
      return !(rect.x + rect.width < bounds.x || 
               bounds.x + bounds.width < rect.x ||
               rect.y + rect.height < bounds.y || 
               bounds.y + bounds.height < rect.y);
    } else {
      // 完全可見：矩形完全在邊界內
      return rect.x >= bounds.x && 
             rect.x + rect.width <= bounds.x + bounds.width &&
             rect.y >= bounds.y && 
             rect.y + rect.height <= bounds.y + bounds.height;
    }
  }

  /**
   * 獲取當前縮放比例的像素精度
   */
  getPixelPrecision(): number {
    const zoom = this.getZoom();
    return 1 / zoom;
  }

  /**
   * 將像素距離轉換為流程坐標距離
   */
  pixelToFlowDistance(pixelDistance: number): number {
    return pixelDistance / this.getZoom();
  }

  /**
   * 將流程坐標距離轉換為像素距離
   */
  flowToPixelDistance(flowDistance: number): number {
    return flowDistance * this.getZoom();
  }
}

/**
 * Angular 版本的 useViewport hook
 */
export function useViewport(): ViewportService {
  return new ViewportService(new FlowStoreService());
}

/**
 * Angular 版本的 useViewportHelper hook
 */
export function useViewportHelper(): ViewportHelperFunctions {
  return new ViewportService(new FlowStoreService());
}