import { Injectable, computed, signal, effect, ElementRef, Directive, input, HostListener, Signal, WritableSignal } from '@angular/core';
import { FlowStoreService } from '../contexts/flow-store.service';
import { NodeService } from './node.service';

/**
 * 拖拽選項
 */
export interface DragOptions {
  disabled?: boolean;
  noDragClassName?: string;
  handleSelector?: string;
  nodeId?: string;
  isSelectable?: boolean;
  nodeClickDistance?: number;
}

/**
 * 移動選中節點選項
 */
export interface MoveSelectedNodesOptions {
  factor?: number;
  direction?: { x: number; y: number };
}

/**
 * 鍵盤按鍵代碼
 */
export type KeyCode = string | string[];

/**
 * 鍵盤按鍵選項
 */
export interface UseKeyPressOptions {
  target?: EventTarget | null;
  actOnKeyUp?: boolean;
}

/**
 * 全局鍵盤處理選項
 */
export interface GlobalKeyHandlerOptions {
  deleteKeyCode?: KeyCode;
  multiSelectionKeyCode?: KeyCode;
}

/**
 * InteractionService - Angular equivalent of React Flow's interaction hooks
 * 
 * 交互服務 - 提供完整的用戶交互功能
 * 等價於 React Flow 的 useDrag, useMoveSelectedNodes, useKeyPress, useGlobalKeyHandler 等 hooks
 * 
 * 主要功能：
 * - 節點拖拽管理
 * - 鍵盤事件處理
 * - 節點移動和選擇
 * - 全局快捷鍵
 * - 多選操作
 * - 鼠標和觸摸事件
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <div 
 *       [appNodeDrag]="{ nodeId: 'node-1', disabled: false }"
 *       class="draggable-node">
 *       可拖拽節點
 *     </div>
 *     
 *     <div>拖拽狀態: {{ isDragging() }}</div>
 *     <div>空格鍵按下: {{ isSpacePressed() }}</div>
 *   `
 * })
 * export class InteractiveComponent {
 *   isDragging = computed(() => this.interactionService.isDragging());
 *   isSpacePressed = this.interactionService.useKeyPress(' ');
 *   
 *   constructor(private interactionService: InteractionService) {
 *     // 設置全局快捷鍵
 *     this.interactionService.useGlobalKeyHandler({
 *       deleteKeyCode: ['Delete', 'Backspace'],
 *       multiSelectionKeyCode: ['Meta', 'Control']
 *     });
 *   }
 * }
 * ```
 */
@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  /** 拖拽狀態信號 */
  private draggingSignal = signal(false);
  
  /** 按鍵狀態映射 */
  private keyPressStates = new Map<string, WritableSignal<boolean>>();
  
  /** 多選鍵狀態 */
  private multiSelectionKeySignal = signal(false);
  
  /** 當前拖拽的節點 ID */
  private draggingNodeIdSignal = signal<string | null>(null);

  /** 響應式屬性 */
  isDragging = computed(() => this.draggingSignal());
  draggingNodeId = computed(() => this.draggingNodeIdSignal());
  isMultiSelectionKeyPressed = computed(() => this.multiSelectionKeySignal());

  constructor(
    private store: FlowStoreService,
    private nodeService: NodeService
  ) {
    // 監聽拖拽狀態變化
    effect(() => {
      const dragging = this.isDragging();
      this.store.updateState({ isDragging: dragging });
    });
  }

  // ===================
  // 拖拽功能
  // ===================

  /**
   * 開始拖拽
   */
  startDrag(nodeId: string): void {
    this.draggingSignal.set(true);
    this.draggingNodeIdSignal.set(nodeId);
    
    // 更新節點拖拽狀態
    this.nodeService.updateNode(nodeId, { dragging: true });
    
    console.log(`Started dragging node: ${nodeId}`);
  }

  /**
   * 結束拖拽
   */
  endDrag(): void {
    const draggingNodeId = this.draggingNodeId();
    
    this.draggingSignal.set(false);
    this.draggingNodeIdSignal.set(null);
    
    // 更新節點拖拽狀態
    if (draggingNodeId) {
      this.nodeService.updateNode(draggingNodeId, { dragging: false });
    }
    
    console.log('Ended dragging');
  }

  /**
   * 拖拽節點到新位置
   */
  dragNodeTo(nodeId: string, position: { x: number; y: number }): void {
    this.nodeService.updateNode(nodeId, { position });
  }

  /**
   * 檢查是否可以開始拖拽
   */
  canStartDrag(event: MouseEvent | TouchEvent, options: DragOptions): boolean {
    if (options.disabled) return false;
    
    // 檢查 noDragClassName
    if (options.noDragClassName) {
      const target = event.target as HTMLElement;
      if (target.closest(`.${options.noDragClassName}`)) {
        return false;
      }
    }
    
    // 檢查 handleSelector
    if (options.handleSelector) {
      const target = event.target as HTMLElement;
      if (!target.closest(options.handleSelector)) {
        return false;
      }
    }
    
    return true;
  }

  // ===================
  // 節點移動功能
  // ===================

  /**
   * 移動選中的節點
   */
  moveSelectedNodes(direction: { x: number; y: number }, options: MoveSelectedNodesOptions = {}): void {
    const selectedNodes = this.nodeService.getSelectedNodes();
    const factor = options.factor || 1;
    
    selectedNodes.forEach(node => {
      const newPosition = {
        x: node.position.x + direction.x * factor,
        y: node.position.y + direction.y * factor,
      };
      
      this.nodeService.updateNode(node.id, { position: newPosition });
    });
    
    console.log(`Moved ${selectedNodes.length} nodes by (${direction.x * factor}, ${direction.y * factor})`);
  }

  /**
   * 使用箭頭鍵移動選中節點
   */
  moveSelectedNodesWithArrowKeys(keyCode: string, shiftPressed = false): void {
    const arrowKeyDirections: Record<string, { x: number; y: number }> = {
      'ArrowUp': { x: 0, y: -1 },
      'ArrowDown': { x: 0, y: 1 },
      'ArrowLeft': { x: -1, y: 0 },
      'ArrowRight': { x: 1, y: 0 },
    };
    
    const direction = arrowKeyDirections[keyCode];
    if (!direction) return;
    
    const factor = shiftPressed ? 10 : 1; // Shift 鍵加速移動
    this.moveSelectedNodes(direction, { factor });
  }

  // ===================
  // 鍵盤事件處理
  // ===================

  /**
   * 監聽特定按鍵
   */
  useKeyPress(keyCode: KeyCode, options: UseKeyPressOptions = {}): Signal<boolean> {
    const keys = Array.isArray(keyCode) ? keyCode : [keyCode];
    const compositeKey = keys.join('+');
    
    if (!this.keyPressStates.has(compositeKey)) {
      const keySignal = signal(false);
      this.keyPressStates.set(compositeKey, keySignal);
      
      // 設置事件監聽器
      this.setupKeyListeners(keys, keySignal, options);
    }
    
    return this.keyPressStates.get(compositeKey)!;
  }

  /**
   * 設置按鍵監聽器
   */
  private setupKeyListeners(
    keys: string[], 
    keySignal: WritableSignal<boolean>, 
    options: UseKeyPressOptions
  ): void {
    const target = options.target || window;
    const eventType = options.actOnKeyUp ? 'keyup' : 'keydown';
    const oppositeEventType = options.actOnKeyUp ? 'keydown' : 'keyup';
    
    const handleKeyEvent: EventListener = (evt: Event) => {
      const event = evt as KeyboardEvent;
      if (this.isInputDOMNode(event)) return;
      
      const pressedKeys = new Set<string>();
      if (event.ctrlKey) pressedKeys.add('Control');
      if (event.metaKey) pressedKeys.add('Meta');
      if (event.shiftKey) pressedKeys.add('Shift');
      if (event.altKey) pressedKeys.add('Alt');
      pressedKeys.add(event.key);
      
      const allKeysPressed = keys.every(key => pressedKeys.has(key));
      keySignal.set(allKeysPressed);
    };
    
    const handleOppositeEvent: EventListener = (evt: Event) => {
      const event = evt as KeyboardEvent;
      if (this.isInputDOMNode(event)) return;
      keySignal.set(false);
    };
    
    target.addEventListener(eventType, handleKeyEvent);
    target.addEventListener(oppositeEventType, handleOppositeEvent);
    
    // 在實際實現中，應該在組件銷毀時清理事件監聽器
  }

  /**
   * 全局鍵盤處理器
   */
  useGlobalKeyHandler(options: GlobalKeyHandlerOptions): void {
    const deleteKeys = Array.isArray(options.deleteKeyCode) 
      ? options.deleteKeyCode 
      : options.deleteKeyCode ? [options.deleteKeyCode] : ['Delete', 'Backspace'];
    
    const multiSelectionKeys = Array.isArray(options.multiSelectionKeyCode)
      ? options.multiSelectionKeyCode
      : options.multiSelectionKeyCode ? [options.multiSelectionKeyCode] : ['Meta', 'Control'];
    
    // 監聽刪除鍵
    const deleteKeySignal = this.useKeyPress(deleteKeys);
    effect(() => {
      if (deleteKeySignal()) {
        this.handleDeleteKey();
      }
    });
    
    // 監聽多選鍵
    const multiSelectionKeySignal = this.useKeyPress(multiSelectionKeys);
    effect(() => {
      this.multiSelectionKeySignal.set(multiSelectionKeySignal());
    });
    
    // 監聽箭頭鍵移動
    ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].forEach(key => {
      const arrowKeySignal = this.useKeyPress(key);
      effect(() => {
        if (arrowKeySignal()) {
          const shiftPressed = this.useKeyPress('Shift')();
          this.moveSelectedNodesWithArrowKeys(key, shiftPressed);
        }
      });
    });
    
    // 監聽全選 (Ctrl+A / Cmd+A)
    const selectAllSignal = this.useKeyPress(['Control', 'a']);
    const selectAllMacSignal = this.useKeyPress(['Meta', 'a']);
    effect(() => {
      if (selectAllSignal() || selectAllMacSignal()) {
        this.handleSelectAll();
      }
    });
    
    // 監聽復制 (Ctrl+C / Cmd+C)
    const copySignal = this.useKeyPress(['Control', 'c']);
    const copyMacSignal = this.useKeyPress(['Meta', 'c']);
    effect(() => {
      if (copySignal() || copyMacSignal()) {
        this.handleCopy();
      }
    });
    
    // 監聽粘貼 (Ctrl+V / Cmd+V)
    const pasteSignal = this.useKeyPress(['Control', 'v']);
    const pasteMacSignal = this.useKeyPress(['Meta', 'v']);
    effect(() => {
      if (pasteSignal() || pasteMacSignal()) {
        this.handlePaste();
      }
    });
  }

  /**
   * 處理刪除按鍵
   */
  private handleDeleteKey(): void {
    const selectedNodes = this.nodeService.getSelectedNodes();
    const selectedNodeIds = selectedNodes.map(node => node.id);
    
    if (selectedNodeIds.length > 0) {
      // 刪除選中的節點和相關邊緣
      this.nodeService.removeNodes(selectedNodeIds);
      console.log(`Deleted ${selectedNodeIds.length} nodes`);
    }
  }

  /**
   * 處理全選
   */
  private handleSelectAll(): void {
    this.nodeService.selectAllNodes();
    console.log('Selected all nodes');
  }

  /**
   * 處理復制
   */
  private handleCopy(): void {
    const selectedNodes = this.nodeService.getSelectedNodes();
    if (selectedNodes.length > 0) {
      // 在實際實現中，這裡會將節點信息復制到剪貼板
      console.log(`Copied ${selectedNodes.length} nodes`);
    }
  }

  /**
   * 處理粘貼
   */
  private handlePaste(): void {
    // 在實際實現中，這裡會從剪貼板讀取並創建節點
    console.log('Paste operation');
  }

  // ===================
  // 工具方法
  // ===================

  /**
   * 檢查事件目標是否為輸入 DOM 節點
   */
  private isInputDOMNode(event: Event): boolean {
    const target = event.target as HTMLElement;
    const inputTags = ['INPUT', 'TEXTAREA', 'SELECT'];
    return inputTags.includes(target.tagName) || target.isContentEditable;
  }

  /**
   * 獲取鼠標/觸摸位置
   */
  getEventPosition(event: MouseEvent | TouchEvent): { x: number; y: number } {
    if (event instanceof MouseEvent) {
      return { x: event.clientX, y: event.clientY };
    } else {
      const touch = event.touches[0] || event.changedTouches[0];
      return { x: touch.clientX, y: touch.clientY };
    }
  }

  /**
   * 計算拖拽距離
   */
  calculateDragDistance(
    startPosition: { x: number; y: number },
    currentPosition: { x: number; y: number }
  ): number {
    const dx = currentPosition.x - startPosition.x;
    const dy = currentPosition.y - startPosition.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 檢查是否超過拖拽閾值
   */
  exceedsDragThreshold(distance: number, threshold = 5): boolean {
    return distance > threshold;
  }

  // ===================
  // 狀態重置
  // ===================

  /**
   * 重置所有交互狀態
   */
  resetInteractionState(): void {
    this.draggingSignal.set(false);
    this.draggingNodeIdSignal.set(null);
    this.multiSelectionKeySignal.set(false);
    
    // 重置所有按鍵狀態
    this.keyPressStates.forEach(keySignal => {
      keySignal.set(false);
    });
    
    console.log('Reset interaction state');
  }
}

/**
 * NodeDrag 指令 - 為元素添加節點拖拽功能
 * 等價於 React Flow 的 useDrag hook
 */
@Directive({
  selector: '[appNodeDrag]',
  standalone: true
})
export class NodeDragDirective {
  public appNodeDrag = input<DragOptions>({});
  
  private isDragging = false;
  private startPosition: { x: number; y: number } | null = null;
  private originalNodePosition: { x: number; y: number } | null = null;

  constructor(
    private elementRef: ElementRef,
    private interactionService: InteractionService,
    private nodeService: NodeService
  ) {}

  @HostListener('mousedown', ['$event'])
  @HostListener('touchstart', ['$event'])
  onPointerDown(event: MouseEvent | TouchEvent): void {
    if (!this.interactionService.canStartDrag(event, this.appNodeDrag())) {
      return;
    }

    event.preventDefault();
    
    const nodeId = this.appNodeDrag().nodeId;
    if (!nodeId) return;

    const node = this.nodeService.getNode(nodeId);
    if (!node) return;

    this.isDragging = true;
    this.startPosition = this.interactionService.getEventPosition(event);
    this.originalNodePosition = { ...node.position };
    
    this.interactionService.startDrag(nodeId);
    
    // 如果節點未被選中且可選擇，則選中它
    if (this.appNodeDrag().isSelectable && !this.nodeService.isNodeSelected(nodeId)) {
      this.nodeService.selectNode(nodeId);
    }
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onPointerMove(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging || !this.startPosition || !this.originalNodePosition) {
      return;
    }

    event.preventDefault();
    
    const currentPosition = this.interactionService.getEventPosition(event);
    const deltaX = currentPosition.x - this.startPosition.x;
    const deltaY = currentPosition.y - this.startPosition.y;
    
    const nodeId = this.appNodeDrag().nodeId;
    if (!nodeId) return;

    // 更新節點位置
    const newPosition = {
      x: this.originalNodePosition.x + deltaX,
      y: this.originalNodePosition.y + deltaY,
    };
    
    this.interactionService.dragNodeTo(nodeId, newPosition);
  }

  @HostListener('document:mouseup', ['$event'])
  @HostListener('document:touchend', ['$event'])
  onPointerUp(event: MouseEvent | TouchEvent): void {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.startPosition = null;
    this.originalNodePosition = null;
    
    this.interactionService.endDrag();
  }
}

/**
 * Angular 版本的 useDrag hook
 */
export function useDrag(options: DragOptions): { dragging: Signal<boolean> } {
  const interactionService = new InteractionService(
    new FlowStoreService(),
    new NodeService(new FlowStoreService())
  );
  
  return {
    dragging: interactionService.isDragging
  };
}

/**
 * Angular 版本的 useMoveSelectedNodes hook
 */
export function useMoveSelectedNodes(): (direction: { x: number; y: number }, options?: MoveSelectedNodesOptions) => void {
  const interactionService = new InteractionService(
    new FlowStoreService(),
    new NodeService(new FlowStoreService())
  );
  
  return (direction, options) => interactionService.moveSelectedNodes(direction, options);
}

/**
 * Angular 版本的 useInteractionKeyPress hook (簡化版)
 */
export function useInteractionKeyPress(keyCode: KeyCode, options?: UseKeyPressOptions): Signal<boolean> {
  const interactionService = new InteractionService(
    new FlowStoreService(),
    new NodeService(new FlowStoreService())
  );
  
  return interactionService.useKeyPress(keyCode, options);
}

/**
 * Angular 版本的 useGlobalKeyHandler hook
 */
export function useGlobalKeyHandler(options: GlobalKeyHandlerOptions): void {
  const interactionService = new InteractionService(
    new FlowStoreService(),
    new NodeService(new FlowStoreService())
  );
  
  interactionService.useGlobalKeyHandler(options);
}