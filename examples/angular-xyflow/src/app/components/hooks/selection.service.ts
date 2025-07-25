import { Injectable, computed, signal, effect } from '@angular/core';
import { FlowStoreService } from '../contexts/flow-store.service';
import { NodeService } from './node.service';
import { EdgeService } from './edge.service';
import { NodeBase } from '../components/Nodes/nodes.types';
import { Edge } from './edge.service';

/**
 * 選擇變化事件參數
 */
export interface SelectionChangeParams {
  nodes: NodeBase[];
  edges: Edge[];
}

/**
 * 選擇變化回調函數
 */
export type OnSelectionChangeFunc = (params: SelectionChangeParams) => void;

/**
 * 選擇變化選項
 */
export interface SelectionChangeOptions {
  onChange: OnSelectionChangeFunc;
}

/**
 * 批量選擇選項
 */
export interface BatchSelectionOptions {
  nodes?: string[];
  edges?: string[];
  append?: boolean; // 是否追加到現有選擇
}

/**
 * 區域選擇選項
 */
export interface AreaSelectionOptions {
  x: number;
  y: number;
  width: number;
  height: number;
  partially?: boolean; // 是否部分重疊也算選中
}

/**
 * 選擇過濾器
 */
export interface SelectionFilter {
  nodes?: (node: NodeBase) => boolean;
  edges?: (edge: Edge) => boolean;
}

/**
 * SelectionService - Angular equivalent of React Flow's selection hooks
 * 
 * 選擇服務 - 提供完整的選擇管理功能
 * 等價於 React Flow 的 useOnSelectionChange, selection管理 等功能
 * 
 * 主要功能：
 * - 選擇狀態管理
 * - 選擇變化監聽
 * - 批量選擇操作
 * - 區域選擇
 * - 選擇過濾
 * - 選擇歷史記錄
 * - 響應式選擇狀態
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <div>選中節點數: {{ selectedNodeCount() }}</div>
 *     <div>選中邊緣數: {{ selectedEdgeCount() }}</div>
 *     <div>選擇狀態: {{ hasSelection() ? '有選擇' : '無選擇' }}</div>
 *     
 *     <button (click)="selectAllNodes()">全選節點</button>
 *     <button (click)="selectAllEdges()">全選邊緣</button>
 *     <button (click)="clearSelection()">清除選擇</button>
 *     <button (click)="invertSelection()">反向選擇</button>
 *   `
 * })
 * export class SelectionComponent {
 *   selectedNodeCount = computed(() => this.selectionService.getSelectedNodes().length);
 *   selectedEdgeCount = computed(() => this.selectionService.getSelectedEdges().length);
 *   hasSelection = computed(() => this.selectionService.hasAnySelection());
 *   
 *   constructor(private selectionService: SelectionService) {
 *     // 監聽選擇變化
 *     this.selectionService.onSelectionChange({
 *       onChange: (params) => {
 *         console.log('Selection changed:', params);
 *       }
 *     });
 *   }
 *   
 *   selectAllNodes() {
 *     this.selectionService.selectAllNodes();
 *   }
 *   
 *   selectAllEdges() {
 *     this.selectionService.selectAllEdges();
 *   }
 *   
 *   clearSelection() {
 *     this.selectionService.clearAllSelection();
 *   }
 *   
 *   invertSelection() {
 *     this.selectionService.invertSelection();
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  /** 選擇變化處理器列表 */
  private selectionChangeHandlers = signal<OnSelectionChangeFunc[]>([]);
  
  /** 選擇歷史記錄 */
  private selectionHistory = signal<SelectionChangeParams[]>([]);
  
  /** 當前選擇歷史索引 */
  private historyIndex = signal(0);
  
  /** 最大歷史記錄數 */
  private readonly maxHistorySize = 50;

  /** 響應式選擇狀態 */
  selectedNodes = computed(() => this.nodeService.getSelectedNodes());
  selectedEdges = computed(() => this.edgeService.getSelectedEdges());
  selectedNodeIds = computed(() => this.nodeService.getSelectedNodeIds());
  selectedEdgeIds = computed(() => this.edgeService.getSelectedEdgeIds());
  
  /** 選擇統計 */
  selectedNodeCount = computed(() => this.selectedNodes().length);
  selectedEdgeCount = computed(() => this.selectedEdges().length);
  totalSelectionCount = computed(() => this.selectedNodeCount() + this.selectedEdgeCount());
  
  /** 選擇狀態檢查 */
  hasNodeSelection = computed(() => this.selectedNodeCount() > 0);
  hasEdgeSelection = computed(() => this.selectedEdgeCount() > 0);
  hasAnySelection = computed(() => this.totalSelectionCount() > 0);
  hasMultipleSelection = computed(() => this.totalSelectionCount() > 1);

  constructor(
    private store: FlowStoreService,
    private nodeService: NodeService,
    private edgeService: EdgeService
  ) {
    // 監聽選擇變化並觸發回調
    effect(() => {
      const nodes = this.selectedNodes();
      const edges = this.selectedEdges();
      const params: SelectionChangeParams = { nodes, edges };
      
      // 觸發所有選擇變化處理器
      this.selectionChangeHandlers().forEach(handler => {
        handler(params);
      });
      
      // 添加到歷史記錄
      this.addToHistory(params);
    });
  }

  // ===================
  // 選擇變化監聽
  // ===================

  /**
   * 註冊選擇變化監聽器
   */
  onSelectionChange(options: SelectionChangeOptions): () => void {
    const currentHandlers = this.selectionChangeHandlers();
    this.selectionChangeHandlers.set([...currentHandlers, options.onChange]);
    
    // 返回取消監聽的函數
    return () => {
      const handlers = this.selectionChangeHandlers();
      const index = handlers.indexOf(options.onChange);
      if (index > -1) {
        const newHandlers = [...handlers];
        newHandlers.splice(index, 1);
        this.selectionChangeHandlers.set(newHandlers);
      }
    };
  }

  /**
   * 移除選擇變化監聽器
   */
  removeSelectionChangeHandler(handler: OnSelectionChangeFunc): void {
    const handlers = this.selectionChangeHandlers();
    const index = handlers.indexOf(handler);
    if (index > -1) {
      const newHandlers = [...handlers];
      newHandlers.splice(index, 1);
      this.selectionChangeHandlers.set(newHandlers);
    }
  }

  /**
   * 清除所有選擇變化監聽器
   */
  clearSelectionChangeHandlers(): void {
    this.selectionChangeHandlers.set([]);
  }

  // ===================
  // 基礎選擇操作
  // ===================

  /**
   * 獲取選中的節點
   */
  getSelectedNodes(): NodeBase[] {
    return this.selectedNodes();
  }

  /**
   * 獲取選中的邊緣
   */
  getSelectedEdges(): Edge[] {
    return this.selectedEdges();
  }

  /**
   * 獲取選中的節點 ID
   */
  getSelectedNodeIds(): string[] {
    return this.selectedNodeIds();
  }

  /**
   * 獲取選中的邊緣 ID
   */
  getSelectedEdgeIds(): string[] {
    return this.selectedEdgeIds();
  }

  /**
   * 選擇節點
   */
  selectNodes(nodeIds: string[], append = false): void {
    if (append) {
      const currentIds = this.selectedNodeIds();
      const newIds = [...new Set([...currentIds, ...nodeIds])];
      this.nodeService.selectNodes(newIds);
    } else {
      this.nodeService.clearSelection();
      this.nodeService.selectNodes(nodeIds);
    }
  }

  /**
   * 選擇邊緣
   */
  selectEdges(edgeIds: string[], append = false): void {
    if (append) {
      const currentIds = this.selectedEdgeIds();
      const newIds = [...new Set([...currentIds, ...edgeIds])];
      this.edgeService.selectEdges(newIds);
    } else {
      this.edgeService.selectEdges(edgeIds);
    }
  }

  /**
   * 取消選擇節點
   */
  unselectNodes(nodeIds: string[]): void {
    this.nodeService.unselectNodes(nodeIds);
  }

  /**
   * 取消選擇邊緣
   */
  unselectEdges(edgeIds: string[]): void {
    this.edgeService.unselectEdges(edgeIds);
  }

  /**
   * 清除節點選擇
   */
  clearNodeSelection(): void {
    this.nodeService.clearSelection();
  }

  /**
   * 清除邊緣選擇
   */
  clearEdgeSelection(): void {
    const selectedEdgeIds = this.selectedEdgeIds();
    if (selectedEdgeIds.length > 0) {
      this.edgeService.unselectEdges(selectedEdgeIds);
    }
  }

  /**
   * 清除所有選擇
   */
  clearAllSelection(): void {
    this.clearNodeSelection();
    this.clearEdgeSelection();
  }

  // ===================
  // 批量選擇操作
  // ===================

  /**
   * 批量選擇
   */
  batchSelect(options: BatchSelectionOptions): void {
    const { nodes = [], edges = [], append = false } = options;
    
    if (!append) {
      this.clearAllSelection();
    }
    
    if (nodes.length > 0) {
      this.selectNodes(nodes, append);
    }
    
    if (edges.length > 0) {
      this.selectEdges(edges, append);
    }
  }

  /**
   * 選擇所有節點
   */
  selectAllNodes(): void {
    this.nodeService.selectAllNodes();
  }

  /**
   * 選擇所有邊緣
   */
  selectAllEdges(): void {
    this.edgeService.selectAllEdges();
  }

  /**
   * 選擇所有元素
   */
  selectAll(): void {
    this.selectAllNodes();
    this.selectAllEdges();
  }

  /**
   * 反向選擇節點
   */
  invertNodeSelection(): void {
    const allNodes = this.nodeService.getNodes();
    const selectedIds = new Set(this.selectedNodeIds());
    const unselectedIds = allNodes
      .filter(node => !selectedIds.has(node.id))
      .map(node => node.id);
    
    this.clearNodeSelection();
    this.selectNodes(unselectedIds);
  }

  /**
   * 反向選擇邊緣
   */
  invertEdgeSelection(): void {
    const allEdges = this.edgeService.getEdges();
    const selectedIds = new Set(this.selectedEdgeIds());
    const unselectedIds = allEdges
      .filter(edge => !selectedIds.has(edge.id))
      .map(edge => edge.id);
    
    this.clearEdgeSelection();
    this.selectEdges(unselectedIds);
  }

  /**
   * 反向選擇
   */
  invertSelection(): void {
    this.invertNodeSelection();
    this.invertEdgeSelection();
  }

  // ===================
  // 條件選擇
  // ===================

  /**
   * 按條件選擇節點
   */
  selectNodesByCondition(predicate: (node: NodeBase) => boolean, append = false): void {
    const allNodes = this.nodeService.getNodes();
    const matchingNodeIds = allNodes
      .filter(predicate)
      .map(node => node.id);
    
    this.selectNodes(matchingNodeIds, append);
  }

  /**
   * 按條件選擇邊緣
   */
  selectEdgesByCondition(predicate: (edge: Edge) => boolean, append = false): void {
    const allEdges = this.edgeService.getEdges();
    const matchingEdgeIds = allEdges
      .filter(predicate)
      .map(edge => edge.id);
    
    this.selectEdges(matchingEdgeIds, append);
  }

  /**
   * 按節點類型選擇
   */
  selectNodesByType(nodeType: string, append = false): void {
    this.selectNodesByCondition(node => node.type === nodeType, append);
  }

  /**
   * 按邊緣類型選擇
   */
  selectEdgesByType(edgeType: string, append = false): void {
    this.selectEdgesByCondition(edge => edge.type === edgeType, append);
  }

  /**
   * 按節點數據選擇
   */
  selectNodesByData(dataFilter: (data: any) => boolean, append = false): void {
    this.selectNodesByCondition(node => dataFilter(node.data), append);
  }

  // ===================
  // 區域選擇
  // ===================

  /**
   * 按區域選擇節點
   */
  selectNodesInArea(area: AreaSelectionOptions, append = false): void {
    const allNodes = this.nodeService.getNodes();
    const selectedNodeIds: string[] = [];
    
    allNodes.forEach(node => {
      const nodeRect = {
        x: node.position.x,
        y: node.position.y,
        width: node.width || 150,
        height: node.height || 40,
      };
      
      if (this.isRectIntersecting(nodeRect, area, area.partially)) {
        selectedNodeIds.push(node.id);
      }
    });
    
    this.selectNodes(selectedNodeIds, append);
  }

  /**
   * 檢查矩形是否相交
   */
  private isRectIntersecting(
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number },
    partially = true
  ): boolean {
    const r1 = {
      left: rect1.x,
      right: rect1.x + rect1.width,
      top: rect1.y,
      bottom: rect1.y + rect1.height,
    };
    
    const r2 = {
      left: rect2.x,
      right: rect2.x + rect2.width,
      top: rect2.y,
      bottom: rect2.y + rect2.height,
    };
    
    if (partially) {
      // 部分相交：任何重疊
      return !(r1.right < r2.left || r2.right < r1.left || r1.bottom < r2.top || r2.bottom < r1.top);
    } else {
      // 完全包含：rect1 完全在 rect2 內
      return r1.left >= r2.left && r1.right <= r2.right && r1.top >= r2.top && r1.bottom <= r2.bottom;
    }
  }

  // ===================
  // 選擇歷史
  // ===================

  /**
   * 添加到選擇歷史
   */
  private addToHistory(params: SelectionChangeParams): void {
    const history = this.selectionHistory();
    const newHistory = [...history];
    
    // 移除當前索引之後的歷史記錄
    const currentIndex = this.historyIndex();
    newHistory.splice(currentIndex + 1);
    
    // 添加新記錄
    newHistory.push(params);
    
    // 限制歷史記錄數量
    if (newHistory.length > this.maxHistorySize) {
      newHistory.shift();
    }
    
    this.selectionHistory.set(newHistory);
    this.historyIndex.set(newHistory.length - 1);
  }

  /**
   * 撤銷選擇
   */
  undoSelection(): boolean {
    const currentIndex = this.historyIndex();
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const historyItem = this.selectionHistory()[newIndex];
      
      this.restoreSelection(historyItem);
      this.historyIndex.set(newIndex);
      return true;
    }
    return false;
  }

  /**
   * 重做選擇
   */
  redoSelection(): boolean {
    const currentIndex = this.historyIndex();
    const history = this.selectionHistory();
    
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      const historyItem = history[newIndex];
      
      this.restoreSelection(historyItem);
      this.historyIndex.set(newIndex);
      return true;
    }
    return false;
  }

  /**
   * 恢復選擇狀態
   */
  private restoreSelection(params: SelectionChangeParams): void {
    // 暫時禁用歷史記錄以避免循環
    const nodeIds = params.nodes.map(node => node.id);
    const edgeIds = params.edges.map(edge => edge.id);
    
    this.clearAllSelection();
    this.batchSelect({ nodes: nodeIds, edges: edgeIds });
  }

  /**
   * 清除選擇歷史
   */
  clearSelectionHistory(): void {
    this.selectionHistory.set([]);
    this.historyIndex.set(0);
  }

  // ===================
  // 選擇狀態查詢
  // ===================

  /**
   * 檢查節點是否被選中
   */
  isNodeSelected(nodeId: string): boolean {
    return this.nodeService.isNodeSelected(nodeId);
  }

  /**
   * 檢查邊緣是否被選中
   */
  isEdgeSelected(edgeId: string): boolean {
    return this.edgeService.isEdgeSelected(edgeId);
  }

  /**
   * 檢查是否有選擇
   */
  hasSelection(): boolean {
    return this.hasAnySelection();
  }

  /**
   * 檢查是否有多選
   */
  hasMultiSelection(): boolean {
    return this.hasMultipleSelection();
  }

  /**
   * 獲取選擇摘要
   */
  getSelectionSummary(): {
    nodeCount: number;
    edgeCount: number;
    totalCount: number;
    nodes: NodeBase[];
    edges: Edge[];
  } {
    return {
      nodeCount: this.selectedNodeCount(),
      edgeCount: this.selectedEdgeCount(),
      totalCount: this.totalSelectionCount(),
      nodes: this.selectedNodes(),
      edges: this.selectedEdges(),
    };
  }

  // ===================
  // 選擇過濾
  // ===================

  /**
   * 應用選擇過濾器
   */
  applySelectionFilter(filter: SelectionFilter): void {
    if (filter.nodes) {
      const selectedNodes = this.selectedNodes();
      const filteredNodeIds = selectedNodes
        .filter(filter.nodes)
        .map(node => node.id);
      
      this.clearNodeSelection();
      this.selectNodes(filteredNodeIds);
    }
    
    if (filter.edges) {
      const selectedEdges = this.selectedEdges();
      const filteredEdgeIds = selectedEdges
        .filter(filter.edges)
        .map(edge => edge.id);
      
      this.clearEdgeSelection();
      this.selectEdges(filteredEdgeIds);
    }
  }
}

/**
 * Angular 版本的 useOnSelectionChange hook
 */
export function useOnSelectionChange(options: SelectionChangeOptions): () => void {
  const selectionService = new SelectionService(
    new FlowStoreService(),
    new NodeService(new FlowStoreService()),
    new EdgeService(new FlowStoreService())
  );
  
  return selectionService.onSelectionChange(options);
}