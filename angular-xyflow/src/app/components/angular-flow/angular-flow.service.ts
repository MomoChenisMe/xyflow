import { Injectable, inject, signal, computed, WritableSignal, Signal } from '@angular/core';
import { 
  type PanZoomInstance,
  type XYDragInstance, 
  type NodeBase,
  type EdgeBase,
  type XYPosition,
  type Viewport as SystemViewport,
  type Connection,
  addEdge as systemAddEdge,
  evaluateAbsolutePosition,
  getConnectedEdges,
  getIncomers,
  getOutgoers
} from '@xyflow/system';
import { AngularNode, AngularEdge, Viewport, AngularFlowInstance } from './types';

@Injectable({
  providedIn: 'root'
})
export class AngularFlowService<NodeType extends AngularNode = AngularNode, EdgeType extends AngularEdge = AngularEdge> {
  // 核心信號狀態
  private _nodes: WritableSignal<NodeType[]> = signal([]);
  private _edges: WritableSignal<EdgeType[]> = signal([]);
  private _viewport: WritableSignal<Viewport> = signal({ x: 0, y: 0, zoom: 1 });
  private _selectedNodes: WritableSignal<string[]> = signal([]);
  private _selectedEdges: WritableSignal<string[]> = signal([]);
  private _initialized: WritableSignal<boolean> = signal(false);
  private _minZoom: WritableSignal<number> = signal(0.5);
  private _maxZoom: WritableSignal<number> = signal(2);
  private _fitViewQueued: WritableSignal<boolean> = signal(false);

  // 計算信號
  readonly nodes: Signal<NodeType[]> = computed(() => this._nodes());
  readonly edges: Signal<EdgeType[]> = computed(() => this._edges());
  readonly viewport: Signal<Viewport> = computed(() => this._viewport());
  readonly selectedNodes: Signal<string[]> = computed(() => this._selectedNodes());
  readonly selectedEdges: Signal<string[]> = computed(() => this._selectedEdges());
  readonly initialized: Signal<boolean> = computed(() => this._initialized());
  readonly minZoom: Signal<number> = computed(() => this._minZoom());
  readonly maxZoom: Signal<number> = computed(() => this._maxZoom());

  // 節點和邊的查找映射
  readonly nodeLookup: Signal<Map<string, NodeType>> = computed(() => {
    const lookup = new Map<string, NodeType>();
    this._nodes().forEach(node => lookup.set(node.id, node));
    return lookup;
  });

  readonly edgeLookup: Signal<Map<string, EdgeType>> = computed(() => {
    const lookup = new Map<string, EdgeType>();
    this._edges().forEach(edge => lookup.set(edge.id, edge));
    return lookup;
  });

  // PanZoom 和 Drag 實例
  private panZoom: PanZoomInstance | null = null;
  private drag: XYDragInstance | null = null;
  private handle: any | null = null;

  // 流程實例API
  getFlowInstance(): AngularFlowInstance<NodeType, EdgeType> {
    return {
      getNodes: () => [...this._nodes()],
      getNode: (id: string) => this.nodeLookup().get(id),
      getEdges: () => [...this._edges()],
      getEdge: (id: string) => this.edgeLookup().get(id),
      setNodes: (nodes: NodeType[] | ((nodes: NodeType[]) => NodeType[])) => {
        if (typeof nodes === 'function') {
          this._nodes.update(nodes);
        } else {
          this._nodes.set([...nodes]);
        }
      },
      setEdges: (edges: EdgeType[] | ((edges: EdgeType[]) => EdgeType[])) => {
        if (typeof edges === 'function') {
          this._edges.update(edges);
        } else {
          this._edges.set([...edges]);
        }
      },
      addNodes: (nodes: NodeType | NodeType[]) => {
        const nodesToAdd = Array.isArray(nodes) ? nodes : [nodes];
        this._nodes.update(existingNodes => [...existingNodes, ...nodesToAdd]);
      },
      addEdges: (edges: EdgeType | EdgeType[]) => {
        const edgesToAdd = Array.isArray(edges) ? edges : [edges];
        this._edges.update(existingEdges => [...existingEdges, ...edgesToAdd]);
      },
      updateNode: (id: string, nodeUpdate: Partial<NodeType> | ((node: NodeType) => Partial<NodeType>)) => {
        this._nodes.update(nodes => 
          nodes.map(node => {
            if (node.id === id) {
              const update = typeof nodeUpdate === 'function' ? nodeUpdate(node) : nodeUpdate;
              return { ...node, ...update };
            }
            return node;
          })
        );
      },
      updateNodeData: (id: string, dataUpdate: any | ((node: NodeType) => any)) => {
        this._nodes.update(nodes => 
          nodes.map(node => {
            if (node.id === id) {
              const newData = typeof dataUpdate === 'function' ? dataUpdate(node) : dataUpdate;
              return { ...node, data: { ...node.data, ...newData } };
            }
            return node;
          })
        );
      },
      updateEdge: (id: string, edgeUpdate: Partial<EdgeType> | ((edge: EdgeType) => Partial<EdgeType>)) => {
        this._edges.update(edges => 
          edges.map(edge => {
            if (edge.id === id) {
              const update = typeof edgeUpdate === 'function' ? edgeUpdate(edge) : edgeUpdate;
              return { ...edge, ...update };
            }
            return edge;
          })
        );
      },
      deleteElements: (elements: { nodes?: { id: string }[]; edges?: { id: string }[] }) => {
        if (elements.nodes?.length) {
          const nodeIdsToDelete = new Set(elements.nodes.map(n => n.id));
          this._nodes.update(nodes => nodes.filter(node => !nodeIdsToDelete.has(node.id)));
        }
        if (elements.edges?.length) {
          const edgeIdsToDelete = new Set(elements.edges.map(e => e.id));
          this._edges.update(edges => edges.filter(edge => !edgeIdsToDelete.has(edge.id)));
        }
      },
      fitView: (options?) => {
        this._fitViewQueued.set(true);
        // 實際的 fitView 邏輯會在組件中處理
      },
      setViewport: (viewport: Viewport) => {
        this._viewport.set({ ...viewport });
      },
      getViewport: () => ({ ...this._viewport() }),
      toObject: () => ({
        nodes: [...this._nodes()],
        edges: [...this._edges()],
        viewport: { ...this._viewport() }
      })
    };
  }

  // 初始化方法
  initialize(container: HTMLElement, options?: {
    nodes?: NodeType[];
    edges?: EdgeType[];
    defaultViewport?: Viewport;
    minZoom?: number;
    maxZoom?: number;
  }) {
    if (options?.nodes) {
      this._nodes.set([...options.nodes]);
    }
    if (options?.edges) {
      this._edges.set([...options.edges]);
    }
    if (options?.defaultViewport) {
      this._viewport.set({ ...options.defaultViewport });
    }
    if (options?.minZoom !== undefined) {
      this._minZoom.set(options.minZoom);
    }
    if (options?.maxZoom !== undefined) {
      this._maxZoom.set(options.maxZoom);
    }

    // 初始化 PanZoom, Drag, Handle 會在實際需要時創建
    // this.panZoom = XYPanZoom({ ... });
    // this.drag = XYDrag({ ... });
    // this.handle = XYHandle;

    this._initialized.set(true);
  }

  // 連接處理
  onConnect(connection: Connection) {
    if (this.isValidConnection(connection)) {
      const newEdge = this.createEdgeFromConnection(connection);
      this._edges.update(edges => systemAddEdge(newEdge as any, edges as any) as EdgeType[]);
    }
  }

  // 驗證連接是否有效
  private isValidConnection(connection: Connection): boolean {
    const { source, target, sourceHandle, targetHandle } = connection;
    
    // 基本驗證
    if (!source || !target || source === target) {
      return false;
    }

    // 檢查節點是否存在
    const sourceNode = this.nodeLookup().get(source);
    const targetNode = this.nodeLookup().get(target);
    
    if (!sourceNode || !targetNode) {
      return false;
    }

    // 檢查是否已存在相同連接
    const existingEdge = this._edges().find(edge => 
      edge.source === source && 
      edge.target === target && 
      edge.sourceHandle === sourceHandle && 
      edge.targetHandle === targetHandle
    );

    return !existingEdge;
  }

  // 從連接創建邊
  private createEdgeFromConnection(connection: Connection): EdgeType {
    return {
      id: `e${connection.source}-${connection.target}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'default'
    } as EdgeType;
  }

  // 清理方法
  destroy() {
    this.panZoom?.destroy();
    this.drag?.destroy();
    this.handle?.destroy();
    this._initialized.set(false);
  }

  // 節點選擇
  selectNode(nodeId: string, multiSelect = false) {
    if (multiSelect) {
      this._selectedNodes.update(selected => 
        selected.includes(nodeId) 
          ? selected.filter(id => id !== nodeId)
          : [...selected, nodeId]
      );
    } else {
      this._selectedNodes.set([nodeId]);
    }
    
    // 更新節點的選中狀態
    this._nodes.update(nodes => 
      nodes.map(node => ({
        ...node,
        selected: this._selectedNodes().includes(node.id)
      }))
    );
  }

  // 清除選擇
  clearSelection() {
    this._selectedNodes.set([]);
    this._selectedEdges.set([]);
    this._nodes.update(nodes => 
      nodes.map(node => ({ ...node, selected: false }))
    );
    this._edges.update(edges => 
      edges.map(edge => ({ ...edge, selected: false }))
    );
  }

  // 獲取 PanZoom 實例
  getPanZoom(): PanZoomInstance | null {
    return this.panZoom;
  }

  // 獲取 Drag 實例
  getDrag(): XYDragInstance | null {
    return this.drag;
  }

  // 獲取 Handle 實例
  getHandle(): any | null {
    return this.handle;
  }
}