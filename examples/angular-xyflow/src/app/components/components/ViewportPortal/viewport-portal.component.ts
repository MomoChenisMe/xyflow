import {
  Component,
  input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  ViewContainerRef,
  inject,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewportPortalProps } from './viewport-portal.types';

/**
 * Mock store service for viewport portal
 */
class MockViewportPortalStoreService {
  private state = signal({
    domNode: null as Element | null,
  });

  getState() {
    return this.state();
  }

  setState(updates: any) {
    this.state.update(current => ({ ...current, ...updates }));
  }

  // 計算視口 portal 容器
  getViewportPortalDiv = computed(() => {
    const state = this.getState();
    return state.domNode?.querySelector('.react-flow__viewport-portal') || null;
  });

  // 初始化模擬 DOM
  initializeMockDom() {
    // 在實際應用中，這個容器會由主要的 ReactFlow 組件創建
    const existingContainer = document.querySelector('.react-flow__viewport-portal');
    if (!existingContainer) {
      const container = document.createElement('div');
      container.className = 'react-flow__viewport-portal';
      container.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 100;
        transform-origin: 0 0;
      `;
      
      // 將容器添加到模擬的 flow 容器中
      const flowContainer = this.createMockFlowContainer();
      flowContainer.appendChild(container);
      this.setState({ domNode: flowContainer });
    } else {
      this.setState({ domNode: existingContainer.parentElement });
    }
  }

  private createMockFlowContainer(): HTMLElement {
    let flowContainer = document.querySelector('.react-flow') as HTMLElement;
    if (!flowContainer) {
      flowContainer = document.createElement('div');
      flowContainer.className = 'react-flow';
      flowContainer.style.cssText = `
        position: relative;
        width: 100%;
        height: 100vh;
        overflow: hidden;
      `;
      document.body.appendChild(flowContainer);
    }
    return flowContainer;
  }
}

/**
 * ViewportPortal - Angular equivalent of React ViewportPortal component
 * 
 * 視口入口組件 - 可用於在 flow 的同一視口中添加組件
 * 這些組件會與節點和邊緣一起渲染，遵循相同的坐標系統
 * 並且會受到縮放和平移的影響
 * 
 * 主要功能：
 * - 在 flow 視口中渲染自定義組件
 * - 與節點和邊緣使用相同的坐標系統
 * - 受縮放和平移變換影響
 * - 提供 Portal 功能，將內容渲染到指定容器
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-angular-flow [nodes]="nodes" [edges]="edges">
 *       <xy-viewport-portal>
 *         <div style="transform: translate(100px, 100px); position: absolute;">
 *           這個 div 位於 flow 的 [100, 100] 位置
 *         </div>
 *       </xy-viewport-portal>
 *     </xy-angular-flow>
 *   `
 * })
 * export class FlowComponent {
 *   nodes = [...];
 *   edges = [...];
 * }
 * ```
 * 
 * @remarks 使用 ViewportPortal 渲染的組件會：
 * - 與節點和邊緣位於同一坐標系統
 * - 隨著 flow 的縮放和平移而變換
 * - 需要使用絕對定位來精確控制位置
 */
@Component({
  selector: 'xy-viewport-portal',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Portal 內容會動態插入到目標容器中 -->
    <ng-content></ng-content>
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class ViewportPortalComponent implements OnInit, OnDestroy {
  /** 子元素內容 */
  children = input<any>();
  
  private viewContainerRef = inject(ViewContainerRef);
  private elementRef = inject(ElementRef);
  private store = new MockViewportPortalStoreService();
  private portalElement?: HTMLElement;

  // 計算目標容器
  private targetContainer = computed(() => {
    return this.store.getViewportPortalDiv();
  });

  ngOnInit() {
    // 初始化模擬 DOM（在實際實現中不需要）
    this.store.initializeMockDom();
    
    // 創建 portal 並將內容移動到目標容器
    this.createPortal();
  }

  ngOnDestroy() {
    // 清理 portal 元素
    if (this.portalElement && this.portalElement.parentNode) {
      this.portalElement.parentNode.removeChild(this.portalElement);
    }
  }

  /**
   * 創建 portal - 將組件內容渲染到視口容器中
   */
  private createPortal() {
    const container = this.targetContainer();
    
    if (!container) {
      return;
    }

    // 創建 portal 容器元素
    this.portalElement = document.createElement('div');
    this.portalElement.className = 'xy-viewport-portal-content';
    this.portalElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      pointer-events: auto;
    `;
    
    // 將當前組件的內容移動到 portal 中
    const nativeElement = this.elementRef.nativeElement;
    const parent = nativeElement.parentNode;
    
    if (parent) {
      // 移動所有子節點到 portal
      while (nativeElement.childNodes.length > 0) {
        this.portalElement.appendChild(nativeElement.childNodes[0]);
      }
      
      // 將 portal 添加到目標容器
      container.appendChild(this.portalElement);
    }
  }
}