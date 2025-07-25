import {
  Component,
  input,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  SelectionListenerProps, 
  OnSelectionChangeFunc, 
  SelectionChangeParams,
  SelectorSlice 
} from './selection-listener.types';
import { NodeBase } from '../Nodes/nodes.types';
import { AngularFlowProviderService } from '../ReactFlowProvider/angular-flow-provider.service';

/**
 * Mock store service for selection listening
 */
class MockSelectionStoreService {
  private state = signal({
    nodeLookup: new Map() as Map<string, any>,
    edgeLookup: new Map() as Map<string, any>,
    onSelectionChangeHandlers: [] as OnSelectionChangeFunc[],
  });

  getState() {
    return this.state();
  }

  setState(updates: any) {
    this.state.update(current => ({ ...current, ...updates }));
  }

  // 計算選中的節點和邊緣
  getSelectedItems = computed(() => {
    const state = this.getState();
    const selectedNodes: any[] = [];
    const selectedEdges: any[] = [];

    // 遍歷節點查找選中的項目
    for (const [, node] of state.nodeLookup) {
      if (node.selected) {
        selectedNodes.push(node.internals?.userNode || node);
      }
    }

    // 遍歷邊緣查找選中的項目
    for (const [, edge] of state.edgeLookup) {
      if (edge.selected) {
        selectedEdges.push(edge);
      }
    }

    return { selectedNodes, selectedEdges };
  });

  // 檢查是否有選擇變化處理器
  hasSelectionChangeHandlers = computed(() => {
    return this.getState().onSelectionChangeHandlers.length > 0;
  });

  // 初始化測試數據
  initTestData() {
    const testNodes = [
      {
        id: 'node-1',
        selected: true,
        internals: {
          userNode: { id: 'node-1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } }
        }
      },
      {
        id: 'node-2',
        selected: false,
        internals: {
          userNode: { id: 'node-2', position: { x: 300, y: 200 }, data: { label: 'Node 2' } }
        }
      },
    ];

    const testEdges = [
      { id: 'edge-1', source: 'node-1', target: 'node-2', selected: true },
    ];

    const nodeLookup = new Map(testNodes.map(node => [node.id, node]));
    const edgeLookup = new Map(testEdges.map(edge => [edge.id, edge]));
    
    this.setState({
      nodeLookup,
      edgeLookup,
      onSelectionChangeHandlers: [],
    });
  }
}

/**
 * SelectionListenerInner - 內部監聽器組件
 * 
 * 實際執行選擇變化監聽邏輯的內部組件
 */
@Component({
  selector: 'xy-selection-listener-inner',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<!-- 無需模板，純邏輯組件 -->`,
  styles: [`
    :host {
      display: none;
    }
  `]
})
export class SelectionListenerInnerComponent<NodeType extends NodeBase = NodeBase, EdgeType = any> 
  implements OnInit, OnDestroy {
  
  /** 選擇變化回調函數 */
  onSelectionChange = input<OnSelectionChangeFunc<NodeType, EdgeType>>();

  private store = new MockSelectionStoreService();
  private previousSelection = signal<SelectorSlice<NodeType, EdgeType> | null>(null);

  // 當前選擇狀態
  private currentSelection = computed(() => {
    const selection = this.store.getSelectedItems();
    return {
      selectedNodes: selection.selectedNodes as NodeType[],
      selectedEdges: selection.selectedEdges as EdgeType[],
    };
  });

  constructor() {
    // 監聽選擇變化
    effect(() => {
      const current = this.currentSelection();
      const previous = this.previousSelection();

      // 檢查是否真的有變化
      if (this.hasSelectionChanged(previous, current)) {
        this.handleSelectionChange(current);
        this.previousSelection.set(current);
      }
    });
  }

  ngOnInit() {
    this.store.initTestData();
    
    // 初始化時觸發一次選擇變化
    const initialSelection = this.currentSelection();
    this.handleSelectionChange(initialSelection);
    this.previousSelection.set(initialSelection);
  }

  ngOnDestroy() {
    // 清理邏輯
  }

  /**
   * 檢查選擇是否發生變化
   */
  private hasSelectionChanged(
    previous: SelectorSlice<NodeType, EdgeType> | null,
    current: SelectorSlice<NodeType, EdgeType>
  ): boolean {
    if (!previous) {
      return true;
    }

    // 比較節點 ID 數組
    const prevNodeIds = previous.selectedNodes.map((node: any) => node.id).sort();
    const currNodeIds = current.selectedNodes.map((node: any) => node.id).sort();
    
    // 比較邊緣 ID 數組
    const prevEdgeIds = previous.selectedEdges.map((edge: any) => edge.id).sort();
    const currEdgeIds = current.selectedEdges.map((edge: any) => edge.id).sort();

    // 檢查數組是否相等
    return !this.arraysEqual(prevNodeIds, currNodeIds) || 
           !this.arraysEqual(prevEdgeIds, currEdgeIds);
  }

  /**
   * 比較兩個數組是否相等
   */
  private arraysEqual(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 處理選擇變化
   */
  private handleSelectionChange(selection: SelectorSlice<NodeType, EdgeType>) {
    const params: SelectionChangeParams<NodeType, EdgeType> = {
      nodes: selection.selectedNodes,
      edges: selection.selectedEdges,
    };

    // 調用組件級別的回調
    const callback = this.onSelectionChange();
    if (callback) {
      callback(params);
    }

    // 調用 store 中註冊的處理器
    const state = this.store.getState();
    state.onSelectionChangeHandlers.forEach((handler: OnSelectionChangeFunc) => {
      handler(params);
    });
  }
}

/**
 * SelectionListener - Angular equivalent of React SelectionListener component
 * 
 * 選擇監聽器組件 - 用於監聽節點和邊緣的選擇變化
 * 這是一個輔助組件，只有在用戶傳遞了 onSelectionChange 監聽器時才會掛載
 * 
 * 主要功能：
 * - 監聽節點和邊緣的選擇狀態變化
 * - 當選擇發生變化時觸發回調函數
 * - 支持多個選擇變化處理器
 * - 優化性能，只在必要時進行監聽
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-angular-flow [nodes]="nodes" [edges]="edges">
 *       <xy-selection-listener [onSelectionChange]="handleSelectionChange">
 *       </xy-selection-listener>
 *     </xy-angular-flow>
 *   `
 * })
 * export class FlowComponent {
 *   nodes = [...];
 *   edges = [...];
 *   
 *   handleSelectionChange(params: SelectionChangeParams) {
 *     console.log('Selected nodes:', params.nodes);
 *     console.log('Selected edges:', params.edges);
 *   }
 * }
 * ```
 * 
 * @remarks 現在我們有了 onNodesChange 和 onEdgesChange 監聽器，
 * 是否還需要這個組件還有待討論。但為了保持 API 兼容性，我們保留了它。
 */
@Component({
  selector: 'xy-selection-listener',
  standalone: true,
  imports: [CommonModule, SelectionListenerInnerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (shouldRender()) {
      <xy-selection-listener-inner [onSelectionChange]="onSelectionChange()">
      </xy-selection-listener-inner>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
  `]
})
export class SelectionListenerComponent<NodeType extends NodeBase = NodeBase, EdgeType = any> 
  implements OnInit {
  
  /** 選擇變化回調函數 */
  onSelectionChange = input<OnSelectionChangeFunc<NodeType, EdgeType>>();

  private store = new MockSelectionStoreService();

  // 判斷是否應該渲染內部組件
  shouldRender = computed(() => {
    return !!this.onSelectionChange() || this.store.hasSelectionChangeHandlers();
  });

  ngOnInit() {
    this.store.initTestData();
  }
}