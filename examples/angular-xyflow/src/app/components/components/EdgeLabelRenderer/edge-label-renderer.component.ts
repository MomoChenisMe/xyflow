import {
  Component,
  input,
  OnInit,
  OnDestroy,
  ViewContainerRef,
  TemplateRef,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { EdgeLabelRendererProps } from './edge-label-renderer.types';

/**
 * Mock store service - 模擬 React Flow 的 store
 * 在實際實現中，這應該是真正的 Angular Flow store
 */
class MockFlowStoreService {
  private domNode = signal<Element | null>(null);

  // 模擬獲取 edge label renderer 容器
  getEdgeLabelRenderer = computed(() => {
    const dom = this.domNode();
    return dom?.querySelector('.react-flow__edgelabel-renderer') || null;
  });

  // 設置 DOM 節點（在實際實現中會由主要的 Flow 組件設置）
  setDomNode(node: Element | null) {
    this.domNode.set(node);
  }

  // 模擬初始化 DOM 結構
  initializeMockDom() {
    // 在實際應用中，這個容器會由主要的 ReactFlow 組件創建
    const existingContainer = document.querySelector('.react-flow__edgelabel-renderer');
    if (!existingContainer) {
      const container = document.createElement('div');
      container.className = 'react-flow__edgelabel-renderer';
      container.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
        overflow: hidden;
        z-index: 1000;
      `;
      document.body.appendChild(container);
      this.setDomNode(container);
    } else {
      this.setDomNode(existingContainer);
    }
  }
}

/**
 * EdgeLabelRenderer - Angular equivalent of React EdgeLabelRenderer
 * 
 * 邊緣標籤渲染器 - 允許在 SVG 邊緣上渲染復雜的 HTML 標籤
 * 這個組件是一個 portal，將標籤渲染到位於邊緣頂部的 div 中
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-base-edge [id]="id" [path]="edgePath" />
 *     <xy-edge-label-renderer>
 *       <div 
 *         [style.position]="'absolute'"
 *         [style.transform]="'translate(-50%, -50%) translate(' + labelX + 'px,' + labelY + 'px)'"
 *         [style.background]="'#ffcc00'"
 *         [style.padding]="'10px'"
 *         class="nodrag nopan">
 *         {{ data.label }}
 *       </div>
 *     </xy-edge-label-renderer>
 *   `
 * })
 * export class CustomEdgeComponent {
 *   // ... component logic
 * }
 * ```
 * 
 * @remarks EdgeLabelRenderer 默認沒有指針事件。如果要添加鼠標交互，
 * 需要設置樣式 pointerEvents: 'all' 並在標籤或要交互的元素上添加 'nopan' 類
 */
@Component({
  selector: 'xy-edge-label-renderer',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Portal 內容會動態插入到目標容器中 -->
    <ng-content></ng-content>
  `
})
export class EdgeLabelRendererComponent implements OnInit, OnDestroy {
  /** 子元素內容 */
  children = input<any>();

  private viewContainerRef = inject(ViewContainerRef);
  private store = new MockFlowStoreService();
  private portalElement?: HTMLElement;

  // 計算目標容器
  private targetContainer = computed(() => {
    return this.store.getEdgeLabelRenderer();
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
   * 創建 portal - 將組件內容渲染到目標容器中
   */
  private createPortal() {
    const container = this.targetContainer();
    
    if (!container) {
      return;
    }

    // 創建 portal 容器元素
    this.portalElement = document.createElement('div');
    this.portalElement.className = 'xy-edge-label-portal';
    
    // 將當前組件的內容移動到 portal 中
    const nativeElement = this.viewContainerRef.element.nativeElement;
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

// 類型導出
export type { EdgeLabelRendererProps };