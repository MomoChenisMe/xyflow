// Angular 核心模組
import {
  Injectable,
  signal,
  computed,
  OnDestroy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// XyFlow 系統模組
import {
  SelectionMode,
  XYPosition,
  getNodesInside,
  type Rect,
  type Transform,
} from '@xyflow/system';

// 專案內部模組
import { AngularXYFlowService } from './angular-xyflow.service';
import { KeyboardService } from './keyboard.service';
import {
  AngularNode,
  AngularEdge,
  SelectionBox,
  SelectionBoxStyle,
  SelectionStartEvent,
  SelectionEndEvent,
  SelectionContextMenuEvent,
  SelectionKeyCode,
  NodeChange,
  EdgeChange,
} from '../types';

@Injectable()
export class SelectionService<
  NodeType extends AngularNode = AngularNode,
  EdgeType extends AngularEdge = AngularEdge
> implements OnDestroy
{
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private _flowService = inject(AngularXYFlowService<NodeType, EdgeType>);
  private _keyboardService = inject(KeyboardService);

  // 選擇框狀態
  private _selectionBox = signal<SelectionBox>({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    active: false,
  });

  // 選擇相關配置
  private _selectionMode = signal<SelectionMode>('full' as SelectionMode);
  private _selectionOnDrag = signal<boolean>(false);
  private _selectionKeyCode = signal<SelectionKeyCode>('shift');

  // 選擇框樣式
  private _selectionBoxStyle = signal<SelectionBoxStyle>({
    backgroundColor: 'rgba(0, 89, 220, 0.08)',
    borderColor: 'rgba(0, 89, 220, 0.8)',
    borderWidth: 1,
    borderStyle: 'dotted',
  });

  // 事件監聽器
  private mouseDownListener?: (event: MouseEvent) => void;
  private mouseMoveListener?: (event: MouseEvent) => void;
  private mouseUpListener?: (event: MouseEvent) => void;
  private keydownListener?: (event: KeyboardEvent) => void;

  // 選擇狀態
  private isSelecting = false;
  private selectionInProgress = false; // 與 React 版本一致：防止點擊事件
  private selectionStarted = false; // 與 React 版本一致：標記選擇已開始
  private startPosition: XYPosition = { x: 0, y: 0 };
  private containerElement?: HTMLElement; // pane元素（用於事件監聽）
  private flowContainerElement?: HTMLElement; // 最外層容器（用於坐標計算）

  // 事件回調
  private onSelectionStart?: (event: SelectionStartEvent) => void;
  private onSelectionEnd?: (
    event: SelectionEndEvent<NodeType, EdgeType>
  ) => void;
  private onSelectionContextMenu?: (
    event: SelectionContextMenuEvent<NodeType, EdgeType>
  ) => void;

  // 公開的只讀信號
  selectionBox = computed(() => this._selectionBox());
  selectionMode = computed(() => this._selectionMode());
  selectionOnDrag = computed(() => this._selectionOnDrag());
  selectionBoxStyle = computed(() => this._selectionBoxStyle());
  isSelectionActive = computed(() => this._selectionBox().active);

  constructor() {}

  // 初始化選擇功能 - 與 React 版本完全一致
  initialize(paneElement: HTMLElement): void {
    if (!this.isBrowser) return;


    // 現在架構正確：直接使用 pane 元素，與 React 版本一致
    // React: Pane 組件處理選取事件
    // Angular: PaneComponent 處理選取事件
    this.containerElement = paneElement;

    // 找到最外層的流容器用於坐標計算
    let flowContainer = paneElement.parentElement;
    while (
      flowContainer &&
      !flowContainer.classList.contains('angular-xyflow')
    ) {
      flowContainer = flowContainer.parentElement;
    }

    this.flowContainerElement = flowContainer || paneElement;
    this.setupEventListeners();
  }

  // 設置選擇模式
  setSelectionMode(mode: SelectionMode): void {
    this._selectionMode.set(mode);
  }

  // 設置拖拽選擇
  setSelectionOnDrag(enabled: boolean): void {
    this._selectionOnDrag.set(enabled);
  }

  // 設置選擇激活按鍵
  setSelectionKeyCode(keyCode: SelectionKeyCode): void {
    this._selectionKeyCode.set(keyCode);
  }

  // 設置選擇框樣式
  setSelectionBoxStyle(style: Partial<SelectionBoxStyle>): void {
    this._selectionBoxStyle.update((current) => ({ ...current, ...style }));
  }

  // 設置事件回調
  setOnSelectionStart(callback: (event: SelectionStartEvent) => void): void {
    this.onSelectionStart = callback;
  }

  setOnSelectionEnd(
    callback: (event: SelectionEndEvent<NodeType, EdgeType>) => void
  ): void {
    this.onSelectionEnd = callback;
  }

  setOnSelectionContextMenu(
    callback: (event: SelectionContextMenuEvent<NodeType, EdgeType>) => void
  ): void {
    this.onSelectionContextMenu = callback;
  }

  // 設置事件監聽器
  private setupEventListeners(): void {
    if (!this.isBrowser || !this.containerElement) return;

    this.mouseDownListener = (event: MouseEvent) => this.handleMouseDown(event);
    this.mouseMoveListener = (event: MouseEvent) => this.handleMouseMove(event);
    this.mouseUpListener = (event: MouseEvent) => this.handleMouseUp(event);

    // 只監聽容器內的鼠標事件
    this.containerElement.addEventListener('mousedown', this.mouseDownListener);
    // 全局監聽 mousemove 和 mouseup 以處理拖拽出容器的情況
    document.addEventListener('mousemove', this.mouseMoveListener);
    document.addEventListener('mouseup', this.mouseUpListener);
  }

  // 處理鼠標按下事件
  private handleMouseDown(event: MouseEvent): void {
    if (!this.containerElement) return;

    // React 版本的關鍵檢查條件
    const elementsSelectable = this._flowService.elementsSelectable();

    if (
      !elementsSelectable ||
      !this.shouldStartSelection(event) ||
      event.button !== 0 // 只處理左鍵點擊
    ) {
      return;
    }

    // React版本的邏輯：只有直接點擊在pane容器上才啟動選取框
    // 現在架構正確，可以直接檢查 event.target === containerElement
    if (event.target !== this.containerElement) {
      return;
    }

    // 防止默認行為
    event.preventDefault();
    // 注意：不要 stopPropagation，讓其他處理器也能接收事件

    // 清空現有選擇（與 React 版本一致）
    this._flowService.clearSelection();

    // 獲取相對於最外層容器的位置（與React版本一致）
    const rect = this.flowContainerElement!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    this.startPosition = { x, y };
    this.isSelecting = true;
    this.selectionStarted = true; // 與 React 版本一致
    this.selectionInProgress = false; // 與 React 版本一致

    // 設置選擇框初始狀態
    this._selectionBox.set({
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      active: true,
    });

    // 設置用戶選擇狀態為 true（正在進行選擇）
    this._flowService.setUserSelectionActive(true);

    // 觸發選擇開始事件
    if (this.onSelectionStart) {
      this.onSelectionStart({ event });
    }
  }

  // 處理鼠標移動事件
  private handleMouseMove(event: MouseEvent): void {
    if (!this.isSelecting || !this.containerElement) return;

    this.selectionInProgress = true; // 與 React 版本一致：標記正在進行選擇

    // 獲取相對於最外層容器的位置（與React版本一致）
    const rect = this.flowContainerElement!.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // 更新選擇框
    this._selectionBox.update((box) => ({
      ...box,
      endX: x,
      endY: y,
    }));

    // 根據選擇模式更新選中的節點和邊
    this.updateSelection();
  }

  // 處理鼠標釋放事件
  private handleMouseUp(event: MouseEvent): void {
    if (!this.isSelecting) return;

    // 防止事件冒泡到 pane 和其他元素，避免觸發點擊清空選擇
    event.preventDefault();
    event.stopPropagation();

    this.isSelecting = false;

    // 獲取選擇框期間檢測到的節點和邊
    const detectedNodes = this.getSelectedNodes();
    const detectedEdges = this.getSelectedEdges();

    // 獲取選擇框的大小來判斷是否為點擊
    const selectionBox = this._selectionBox();
    const dragDistance = Math.sqrt(
      Math.pow(selectionBox.endX - selectionBox.startX, 2) +
        Math.pow(selectionBox.endY - selectionBox.startY, 2)
    );

    // 類似 React 版本：小範圍拖拽視為點擊，清除選擇
    const isClick = dragDistance < 5; // 5px 閾值

    if (isClick && detectedNodes.length === 0 && detectedEdges.length === 0) {
      // 小範圍拖拽且沒有檢測到任何元素：視為點擊空白處，清除選擇
      this._flowService.clearSelection();
    } else {
      // 正常選擇框操作：應用選擇結果
      this.applySelection(detectedNodes, detectedEdges);
    }

    // 重置選擇框
    this._selectionBox.set({
      startX: 0,
      startY: 0,
      endX: 0,
      endY: 0,
      active: false,
    });

    // 重置用戶選擇狀態（選擇過程結束）
    this._flowService.setUserSelectionActive(false);

    // 關鍵修正：只在實際框選操作（非點擊）時更新 NodesSelection 狀態
    // 點擊操作的 NodesSelection 狀態由 handleNodeClick 處理
    if (!isClick) {
      // 更新 NodesSelection 狀態（必須在 userSelectionActive 設為 false 之後）
      this._flowService.updateNodesSelectionActive();
    }

    // 觸發選擇結束事件
    if (this.onSelectionEnd) {
      const finalSelectedNodes = this._flowService.getSelectedNodes();
      const finalSelectedEdges = this._flowService.getSelectedEdges();

      this.onSelectionEnd({
        event,
        nodes: finalSelectedNodes,
        edges: finalSelectedEdges,
      });
    }

    // 與 React 版本一致：只有在特定條件下才重置 selectionInProgress
    // 注意：不要在這裡重置 selectionInProgress，讓 PaneComponent 來處理
    // 這樣可以防止點擊事件冒泡導致的選擇被清空
    
    this.selectionStarted = false; // 與 React 版本一致
  }

  // 檢查是否正在進行選擇（供 PaneComponent 使用）
  isSelectionInProgress(): boolean {
    return this.selectionInProgress;
  }

  // 檢查是否應該開始選擇 - 與 React 版本邏輯保持一致
  private shouldStartSelection(event: MouseEvent): boolean {
    const selectionOnDrag = this._selectionOnDrag();
    const selectionKeyCode = this._selectionKeyCode();

    // 基本條件檢查（與React版本的 isSelecting 邏輯對應）
    // isSelecting = selectionKeyPressed || userSelectionActive || _selectionOnDrag
    const selectionKeyPressed =
      this._keyboardService.isKeyPressed(selectionKeyCode);
    const userSelectionActive = this._selectionBox().active;

    // 如果滿足選擇條件則返回true（與React版本的條件一致）
    return selectionKeyPressed || userSelectionActive || selectionOnDrag;
  }

  // 更新選擇狀態（實時更新）
  private updateSelection(): void {
    const selectedNodes = this.getSelectedNodes();
    const selectedEdges = this.getSelectedEdges();

    // 只提供實時視覺反饋，不修改實際狀態
    // 實際的狀態變更由 applySelection 在選擇結束時處理
    this.updateVisualSelection(selectedNodes, selectedEdges);
  }

  // 獲取選擇框內的節點
  private getSelectedNodes(): NodeType[] {
    const box = this._selectionBox();
    const selectionMode = this._selectionMode();
    const internalNodeLookup = this._flowService.internalNodeLookup();
    const transform = this._flowService.viewport();

    if (!box.active) {
      return [];
    }


    // 使用系統的 getSelectionRect 方法獲取標準化的矩形
    const selectionRect = this.getSelectionRect(box);

    // CRITICAL FIX: Transform selection rect from DOM space to flow space
    // The selection box coordinates are in DOM/screen space, but getNodesInside expects flow space
    // We need to reverse the viewport transformation: (domCoord - translate) / zoom
    const flowSpaceRect = new DOMRect(
      (selectionRect.x - transform.x) / transform.zoom,
      (selectionRect.y - transform.y) / transform.zoom,
      selectionRect.width / transform.zoom,
      selectionRect.height / transform.zoom
    );

    // 轉換為系統期望的 Transform 格式 [x, y, zoom] - 但使用 identity transform 
    // since we've already transformed the rect to flow space
    const systemTransform: Transform = [0, 0, 1];


    // 使用系統的 getNodesInside 函數，與 React 版本一致
    const selectedInternalNodes = getNodesInside(
      internalNodeLookup,
      flowSpaceRect, // Use the transformed rect in flow space
      systemTransform,
      selectionMode === 'partial', // partially
      true // excludeNonSelectableNodes
    );


    // 提取用戶節點 - 優先使用 internals.userNode
    const result: NodeType[] = selectedInternalNodes
      .map((internalNode) => {
        // 優先使用 internals.userNode（原始用戶節點）
        const userNode = internalNode.internals?.userNode as NodeType;
        if (userNode) {
          return userNode;
        }

        // 如果沒有 userNode，從 nodeLookup 中獲取（確保獲得最新的用戶節點）
        const nodeFromLookup = this._flowService
          .nodeLookup()
          .get(internalNode.id);
        if (nodeFromLookup) {
          return nodeFromLookup as NodeType;
        }

        // 最後回退：直接使用 internalNode（移除 internals）
        const { internals, measured, ...userNodeData } = internalNode;
        return userNodeData as NodeType;
      })
      .filter(Boolean);

    return result;
  }

  // 獲取選擇框內的邊
  private getSelectedEdges(): EdgeType[] {
    const selectedNodes = this.getSelectedNodes();
    const connectionLookup = this._flowService.connectionLookup();
    const edgeLookup = this._flowService.edgeLookup();
    const selectedEdgeIds = new Set<string>();
    const selectedEdges: EdgeType[] = [];


    // 與 React 版本一致：檢查 defaultEdgeOptions 的 selectable 屬性
    const defaultEdgeOptions = this._flowService.defaultEdgeOptions();
    const edgesSelectable = defaultEdgeOptions?.selectable ?? true;

    // 使用 connectionLookup 高效查找相連的邊
    selectedNodes.forEach((node) => {
      const connections = connectionLookup.get(node.id);
      if (connections) {
        connections.forEach(({ edgeId }) => {
          const edge = edgeLookup.get(edgeId);
          // 與 React 版本一致：檢查邊線是否可選取
          if (edge && (edge.selectable ?? edgesSelectable)) {
            selectedEdgeIds.add(edgeId);
          }
        });
      }
    });

    // 返回選中的邊對象
    selectedEdgeIds.forEach((edgeId) => {
      const edge = edgeLookup.get(edgeId);
      if (edge) {
        selectedEdges.push(edge);
      }
    });

    return selectedEdges;
  }

  // 獲取選擇框的矩形
  private getSelectionRect(box: SelectionBox): DOMRect {
    const left = Math.min(box.startX, box.endX);
    const top = Math.min(box.startY, box.endY);
    const width = Math.abs(box.endX - box.startX);
    const height = Math.abs(box.endY - box.startY);

    return new DOMRect(left, top, width, height);
  }

  // 生成選擇變更 - 類似 React 版本的 getSelectionChanges
  private getSelectionChanges(
    items: NodeType[] | EdgeType[],
    selectedIds: Set<string>,
    mutateItem = false
  ): Array<NodeChange<NodeType> | EdgeChange<EdgeType>> {
    const changes: Array<NodeChange<NodeType> | EdgeChange<EdgeType>> = [];

    items.forEach((item) => {
      const shouldBeSelected = selectedIds.has(item.id);

      // 只有當選擇狀態真正改變時才創建變更
      if (item.selected !== shouldBeSelected) {
        // 如果 mutateItem 為 true，直接修改項目的 selected 屬性
        if (mutateItem) {
          item.selected = shouldBeSelected;
        }

        changes.push({
          type: 'select',
          id: item.id,
          selected: shouldBeSelected,
        } as NodeChange<NodeType> | EdgeChange<EdgeType>);
      }
    });

    return changes;
  }

  // 更新視覺選擇狀態（實時反饋）- 回到最初能工作的版本
  private updateVisualSelection(nodes: NodeType[], edges: EdgeType[]): void {
    // 獲取目標選擇的 ID 集合
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edgeIds = new Set(edges.map((e) => e.id));

    // 使用最初的方法：直接從service獲取nodes和edges數組
    const allNodes = this._flowService.nodes();
    const allEdges = this._flowService.edges();

    // 收集節點變更事件（不直接修改物件）
    const nodeChangeEvents: NodeChange<NodeType>[] = [];
    allNodes.forEach((node) => {
      const shouldBeSelected = nodeIds.has(node.id);
      if (node.selected !== shouldBeSelected) {
        // 不直接修改原始物件，只收集變更事件
        // node.selected = shouldBeSelected; // 移除這行
        nodeChangeEvents.push({
          type: 'select' as const,
          id: node.id,
          selected: shouldBeSelected
        } as NodeChange<NodeType>);
      }
    });

    // 收集邊線變更事件（不直接修改物件）
    const edgeChangeEvents: EdgeChange<EdgeType>[] = [];
    allEdges.forEach((edge) => {
      const shouldBeSelected = edgeIds.has(edge.id);
      if (edge.selected !== shouldBeSelected) {
        // 不直接修改原始物件，只收集變更事件
        // edge.selected = shouldBeSelected; // 移除這行
        edgeChangeEvents.push({
          type: 'select' as const,
          id: edge.id,
          selected: shouldBeSelected
        } as EdgeChange<EdgeType>);
      }
    });

    // 觸發 Angular 變更檢測（通過創建變更事件）
    // 這是必要的，因為 EdgeWrapperComponent 使用 OnPush 策略
    // 直接修改物件屬性不會觸發變更檢測
    if (nodeChangeEvents.length > 0) {
      this._flowService.triggerNodeChanges(nodeChangeEvents);
    }

    if (edgeChangeEvents.length > 0) {
      this._flowService.triggerEdgeChanges(edgeChangeEvents);
    }

    // 不要在這裡更新 NodesSelection 狀態
    // NodesSelection 狀態只應該在框選結束時的 handleMouseUp 中更新
  }

  // 按照React版本的getSelectionChanges邏輯實現
  private getReactStyleSelectionChanges(
    items: Map<string, NodeType> | Map<string, EdgeType>,
    selectedIds: Set<string>,
    mutateItem = false
  ): Array<NodeChange<NodeType> | EdgeChange<EdgeType>> {
    const changes: Array<NodeChange<NodeType> | EdgeChange<EdgeType>> = [];

    for (const [id, item] of items) {
      const willBeSelected = selectedIds.has(id);

      // React邏輯：只有當選擇狀態真正改變時才創建變更
      // "we don't want to set all items to selected=false on the first selection"
      if (
        !(item.selected === undefined && !willBeSelected) &&
        item.selected !== willBeSelected
      ) {
        if (mutateItem) {
          // React的註解：hack needed for nodes
          item.selected = willBeSelected;
        }

        changes.push({
          type: 'select',
          id: item.id,
          selected: willBeSelected,
        } as NodeChange<NodeType> | EdgeChange<EdgeType>);
      }
    }

    return changes;
  }

  // 應用選擇結果（最終確認）
  private applySelection(nodes: NodeType[], edges: EdgeType[]): void {
    const multiSelectionActive = this._keyboardService.multiSelectionActive();

    // 由於 updateVisualSelection 已經處理了實時反饋
    // 這裡只需要確認最終選擇狀態已正確應用
    // React 版本在 onPointerUp 時不會重複應用選擇，只是清理狀態
  }

  // 檢查選擇上下文菜單
  checkSelectionContextMenu(event: MouseEvent): void {
    const selectedNodes = this._flowService.getSelectedNodes();
    const selectedEdges = this._flowService.getSelectedEdges();

    if (
      (selectedNodes.length > 0 || selectedEdges.length > 0) &&
      this.onSelectionContextMenu
    ) {
      this.onSelectionContextMenu({
        event,
        nodes: selectedNodes,
        edges: selectedEdges,
      });
    }
  }

  // 銷毀服務
  ngOnDestroy(): void {
    this.cleanup();
  }

  // 清理事件監聽器
  private cleanup(): void {
    if (!this.isBrowser || !this.containerElement) return;

    if (this.mouseDownListener) {
      this.containerElement.removeEventListener(
        'mousedown',
        this.mouseDownListener
      );
    }
    if (this.mouseMoveListener) {
      document.removeEventListener('mousemove', this.mouseMoveListener);
    }
    if (this.mouseUpListener) {
      document.removeEventListener('mouseup', this.mouseUpListener);
    }
    if (this.keydownListener) {
      document.removeEventListener('keydown', this.keydownListener);
    }
  }

  // 手動清理
  destroy(): void {
    this.cleanup();
  }
}
