import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  OnInit,
  OnDestroy,
  input,
  output,
  effect,
  viewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandleProps, HandleType, Connection, OnConnect } from './handle.types';
import { NodeIdService } from '../../contexts/node-id.service';
import { FlowStoreService } from '../../store/flow-store.service';
import { AngularFlowService } from '../../hooks/angular-flow.service';
import { 
  XYHandle,
  getHostForElement, 
  isMouseEvent, 
  addEdge, 
  Position,
  ConnectionMode
} from '@xyflow/system';

/**
 * Error messages - 錯誤訊息
 */
const errorMessages = {
  'error010': () => 'Handle component needs to be wrapped in a NodeIdProvider or used inside a custom node.',
};

/**
 * Handle 組件 - 用於自定義節點中定義連接點
 * 
 * 這個組件使用最新的 Angular Signal API 實現，處理節點之間的連接邏輯。
 * 使用 @xyflow/system 的 XYHandle 實現核心連接功能。
 * 
 * @component
 * @selector xy-handle
 * @example
 * ```html
 * <xy-handle 
 *   type="source" 
 *   position="Position.Right"
 *   [isConnectable]="true"
 *   (onConnect)="handleConnect($event)">
 * </xy-handle>
 * ```
 */
@Component({
  selector: 'xy-handle',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      #handleElement
      [attr.data-handleid]="handleId()"
      [attr.data-nodeid]="nodeId()"
      [attr.data-handlepos]="position().toString()"
      [attr.data-id]="dataId()"
      [class]="handleClasses()"
      [style]="style()"
      [attr.data-testid]="'rf__handle-' + (handleId() || 'default')"
      (mousedown)="onPointerDown($event)"
      (touchstart)="onPointerDown($event)"
      (click)="onClick($event)">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .react-flow__handle,
    .xy-flow__handle {
      position: absolute;
      pointer-events: all;
      min-width: 5px;
      min-height: 5px;
      cursor: crosshair;
      border-radius: 100%;
      border: 1px solid #1a192b;
      background: #1a192b;
    }
    
    .react-flow__handle.connectable,
    .xy-flow__handle.connectable {
      cursor: crosshair;
    }
    
    .react-flow__handle.connectable:hover,
    .xy-flow__handle.connectable:hover {
      background: #ff0071;
      border-color: #ff0071;
    }
    
    .react-flow__handle-top,
    .xy-flow__handle-top {
      top: -4px;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .react-flow__handle-bottom,
    .xy-flow__handle-bottom {
      bottom: -4px;
      left: 50%;
      transform: translateX(-50%);
    }
    
    .react-flow__handle-left,
    .xy-flow__handle-left {
      left: -4px;
      top: 50%;
      transform: translateY(-50%);
    }
    
    .react-flow__handle-right,
    .xy-flow__handle-right {
      right: -4px;
      top: 50%;
      transform: translateY(-50%);
    }
    
    .react-flow__handle.connectionindicator,
    .xy-flow__handle.connectionindicator {
      background: #ff0071;
      border-color: #ff0071;
    }
    
    .react-flow__handle.connectingfrom,
    .xy-flow__handle.connectingfrom {
      background: #ff6060;
      border-color: #ff6060;
    }
    
    .react-flow__handle.connectingto.valid,
    .xy-flow__handle.connectingto.valid {
      background: #55dd99;
      border-color: #55dd99;
    }
    
    .react-flow__handle.clickconnecting,
    .xy-flow__handle.clickconnecting {
      background: #ff0071;
      border-color: #ff0071;
    }
  `]
})
export class HandleComponent implements OnInit, OnDestroy {
  /** 連接點類型 - 'source' 或 'target' */
  type = input<HandleType>('source');
  
  /** 連接點位置 - Top, Bottom, Left, Right */
  position = input<Position>(Position.Top);
  
  /** 連接點唯一識別碼 */
  id = input<string | undefined>();
  
  /** 是否允許連接 */
  isConnectable = input<boolean>(true);
  
  /** 是否允許作為連接起點 */
  isConnectableStart = input<boolean>(true);
  
  /** 是否允許作為連接終點 */
  isConnectableEnd = input<boolean>(true);
  
  /** 自定義連接驗證函數 */
  isValidConnection = input<((connection: Connection) => boolean) | undefined>();
  
  /** CSS 類名 */
  className = input<string | undefined>();
  
  /** 內聯樣式 */
  style = input<any>();
  
  /** 滑鼠按下事件處理器 */
  onMouseDown = input<((event: MouseEvent) => void) | undefined>();
  
  /** 觸摸開始事件處理器 */
  onTouchStart = input<((event: TouchEvent) => void) | undefined>();
  
  /** 連接成功事件 */
  onConnect = output<Connection>();

  private store = inject(FlowStoreService);
  private angularFlowService = inject(AngularFlowService, { optional: true });
  private nodeIdService = inject(NodeIdService, { optional: true });

  /** 連接點 DOM 元素引用 */
  handleElement = viewChild<ElementRef<HTMLDivElement>>('handleElement');
  
  /** 計算屬性 - 連接點 ID */
  handleId = computed(() => this.id() || null);
  
  /** 計算屬性 - 是否為目標連接點 */
  isTarget = computed(() => this.type() === 'target');
  
  /** 計算屬性 - 節點 ID */
  nodeId = computed(() => this.nodeIdService?.getNodeId() || null);
  
  // Store 狀態
  storeState = computed(() => this.store.getState());
  connectOnClick = computed(() => this.storeState().connectOnClick);
  noPanClassName = computed(() => this.storeState().noPanClassName);
  rfId = computed(() => this.storeState().rfId);

  /** 計算屬性 - 連接狀態 */
  connectionState = computed(() => {
    const state = this.storeState();
    const { connectionClickStartHandle: clickHandle, connectionMode, connection } = state;
    const { fromHandle, toHandle, isValid } = connection;
    const nodeId = this.nodeId();
    const handleId = this.handleId();
    const type = this.type();
    const connectingTo = toHandle?.nodeId === nodeId && toHandle?.id === handleId && toHandle?.type === type;

    return {
      connectingFrom: fromHandle?.nodeId === nodeId && fromHandle?.id === handleId && fromHandle?.type === type,
      connectingTo,
      clickConnecting: clickHandle?.nodeId === nodeId && clickHandle?.id === handleId && clickHandle?.type === type,
      isPossibleEndHandle:
        connectionMode === ConnectionMode.Strict
          ? fromHandle?.type !== type
          : nodeId !== fromHandle?.nodeId || handleId !== fromHandle?.id,
      connectionInProcess: !!fromHandle,
      clickConnectionInProcess: !!clickHandle,
      valid: connectingTo && isValid,
    };
  });

  // 數據 ID
  dataId = computed(() => {
    const nodeId = this.nodeId();
    const handleId = this.handleId();
    const rfId = this.rfId();
    
    // 確保所有值都有效，避免返回帶有 null 的字符串
    const safeRfId = rfId || 'angular-flow';
    const safeNodeId = nodeId || 'unknown';
    const safeHandleId = handleId || 'default';
    
    return `${safeRfId}-${safeNodeId}-${safeHandleId}-${this.type()}`;
  });

  /** 計算屬性 - CSS 類名 */
  handleClasses = computed(() => {
    const connectionState = this.connectionState();
    const classes = [
      'react-flow__handle',
      'xy-flow__handle',
      `react-flow__handle-${this.position()}`,
      `xy-flow__handle-${this.position()}`,
      'nodrag',
      this.noPanClassName(),
      this.className(),
    ].filter(Boolean);

    // 添加狀態類名
    if (!this.isTarget()) classes.push('source');
    if (this.isTarget()) classes.push('target');
    if (this.isConnectable()) classes.push('connectable');
    if (this.isConnectableStart()) classes.push('connectablestart');
    if (this.isConnectableEnd()) classes.push('connectableend');
    if (connectionState.clickConnecting) classes.push('clickconnecting');
    if (connectionState.connectingFrom) classes.push('connectingfrom');
    if (connectionState.connectingTo) classes.push('connectingto');
    if (connectionState.valid) classes.push('valid');

    // 連接指示器
    if (
      this.isConnectable() &&
      (!connectionState.connectionInProcess || connectionState.isPossibleEndHandle) &&
      (connectionState.connectionInProcess || connectionState.clickConnectionInProcess 
        ? this.isConnectableEnd() 
        : this.isConnectableStart())
    ) {
      classes.push('connectionindicator');
    }

    return classes.join(' ');
  });

  ngOnInit() {
    console.log('Handle component initialized', { 
      type: this.type(), 
      position: this.position(), 
      id: this.id(),
      nodeIdService: !!this.nodeIdService,
      nodeId: this.nodeId()
    });
    
    // 驗證節點 ID 和 NodeIdService
    if (!this.nodeIdService) {
      console.log('No NodeIdService available');
      this.store.getState().onError?.('010', errorMessages['error010']());
      return;
    }
    
    if (!this.nodeId()) {
      console.log('No nodeId available from NodeIdService');
      this.store.getState().onError?.('010', 'Handle component could not get node ID from NodeIdService.');
    }
  }

  ngOnDestroy() {
    // 清理邏輯
  }

  /**
   * 擴展的連接處理器
   */
  private onConnectExtended = (params: Connection) => {
    console.log('🔗 onConnectExtended called with:', params);
    const { defaultEdgeOptions, onConnect: onConnectAction, hasDefaultEdges } = this.store.getState();

    const edgeParams = {
      id: `edge-${Date.now()}`,
      ...defaultEdgeOptions,
      ...params,
    };
    
    console.log('🔗 Edge creation params:', {
      hasDefaultEdges,
      edgeParams,
      currentEdgesCount: this.store.getState().edges.length
    });

    if (hasDefaultEdges) {
      console.log('🔗 Adding edge using AngularFlowService...');
      
      if (this.angularFlowService) {
        console.log('🔗 AngularFlowService is available');
        const currentEdges = this.angularFlowService.getEdges();
        console.log('🔗 Current edges from AngularFlowService:', currentEdges.length, currentEdges);
        
        // Convert to AngularEdge format
        const angularEdge = {
          id: edgeParams.id,
          source: edgeParams.source,
          target: edgeParams.target,
          sourceHandle: edgeParams.sourceHandle,
          targetHandle: edgeParams.targetHandle
        };
        
        console.log('🔗 Adding edge via AngularFlowService:', angularEdge);
        this.angularFlowService.addEdges([angularEdge]);
        
        // Verify edge was added
        const newEdges = this.angularFlowService.getEdges();
        console.log('🔗 Edges after addition:', newEdges.length, newEdges);
      } else {
        console.log('🔗 AngularFlowService not available, falling back to store');
        const { edges, setEdges } = this.store.getState();
        const newEdges = addEdge(edgeParams, edges);
        setEdges(newEdges as any);
      }
    } else {
      console.log('🔗 hasDefaultEdges is false, not adding to store');
    }

    console.log('🔗 Calling onConnect actions...');
    onConnectAction?.(edgeParams);
    this.onConnect.emit(edgeParams);
  };

  /**
   * 創建合適的更新連接函數，將@xyflow/system的格式轉換為ConnectionState Union type
   */
  private createUpdateConnectionWrapper() {
    return (connectionUpdate: any) => {
      console.log('XYHandle updateConnection called with:', connectionUpdate);
      
      const currentState = this.store.getState();
      
      // 如果傳入的是完整的ConnectionState，直接使用
      if (connectionUpdate && typeof connectionUpdate.inProgress === 'boolean') {
        this.store.updateConnection(connectionUpdate);
        return;
      }
      
      // 否則，基於當前狀態構造合適的ConnectionState
      const currentConnection = currentState.connection;
      
      // 如果當前沒有連接進行中且新的更新也沒有開始連接，保持NoConnection狀態
      if (!currentConnection.inProgress && !connectionUpdate?.inProgress && !connectionUpdate?.fromHandle) {
        return;
      }
      
      // 如果是開始連接或有連接進行中，創建ConnectionInProgress狀態
      if (connectionUpdate?.fromHandle || currentConnection.inProgress) {
        const connectionInProgress = {
          inProgress: true as const,
          isValid: connectionUpdate?.isValid ?? currentConnection.isValid ?? null,
          from: connectionUpdate?.from ?? (currentConnection.inProgress ? currentConnection.from : { x: 0, y: 0 }),
          fromHandle: connectionUpdate?.fromHandle ?? (currentConnection.inProgress ? currentConnection.fromHandle : null),
          fromPosition: connectionUpdate?.fromPosition ?? (currentConnection.inProgress ? currentConnection.fromPosition : null),
          fromNode: connectionUpdate?.fromNode ?? (currentConnection.inProgress ? currentConnection.fromNode : null),
          to: connectionUpdate?.to ?? (currentConnection.inProgress ? currentConnection.to : { x: 0, y: 0 }),
          toHandle: connectionUpdate?.toHandle ?? (currentConnection.inProgress ? currentConnection.toHandle : null),
          toPosition: connectionUpdate?.toPosition ?? (currentConnection.inProgress ? currentConnection.toPosition : null),
          toNode: connectionUpdate?.toNode ?? (currentConnection.inProgress ? currentConnection.toNode : null)
        };
        
        console.log('Updating to ConnectionInProgress:', connectionInProgress);
        this.store.updateConnection(connectionInProgress);
      } else {
        // 結束連接，回到NoConnection狀態
        const noConnection = {
          inProgress: false as const,
          isValid: null,
          from: null,
          fromHandle: null,
          fromPosition: null,
          fromNode: null,
          to: null,
          toHandle: null,
          toPosition: null,
          toNode: null
        };
        
        console.log('Updating to NoConnection');
        this.store.updateConnection(noConnection);
      }
    };
  }

  /**
   * 指針按下事件處理器 - 完全遵循React版本
   */
  onPointerDown(event: MouseEvent | TouchEvent) {
    console.log('Handle onPointerDown triggered', { 
      type: this.type, 
      nodeId: this.nodeId(), 
      handleId: this.handleId() 
    });
    
    const nodeId = this.nodeId();
    if (!nodeId) {
      console.log('No nodeId available');
      return;
    }

    const isMouseTriggered = isMouseEvent(event);

    if (
      this.isConnectableStart() &&
      ((isMouseTriggered && (event as MouseEvent).button === 0) || !isMouseTriggered)
    ) {
      console.log('Handle passing conditions - calling XYHandle.onPointerDown');
      let currentStore = this.store.getState();
      
      // 調試store狀態
      console.log('🔍 Store state for XYHandle:', {
        connectionDragThreshold: currentStore.connectionDragThreshold,
        connectionMode: currentStore.connectionMode, 
        connectionRadius: currentStore.connectionRadius,
        hasNodeLookup: !!currentStore.nodeLookup,
        nodeLookupSize: currentStore.nodeLookup?.size,
        hasDomNode: !!currentStore.domNode,
        lib: currentStore.lib,
        rfId: currentStore.rfId,
        nodesCount: currentStore.nodes?.length,
        edgesCount: currentStore.edges?.length
      });
      
      // 檢查store實例
      console.log('🔍 Handle store instance:', {
        storeId: this.store.constructor.name,
        storeHashCode: (this.store as any).hashCode || 'unknown'
      });
      
      // 如果nodeLookup是空的，嘗試手動更新
      if (!currentStore.nodeLookup || currentStore.nodeLookup.size === 0) {
        console.log('⚠️ nodeLookup is empty, trying to update lookup tables...');
        this.store.updateLookupTables();
        const updatedStore = this.store.getState();
        console.log('🔄 After updateLookupTables, nodeLookupSize:', updatedStore.nodeLookup?.size);
        
        // 檢查angularFlowService是否有不同的store
        if (this.angularFlowService) {
          const serviceNodes = this.angularFlowService.getNodes();
          console.log('🔍 AngularFlowService nodes:', serviceNodes.length);
          if (serviceNodes.length > 0) {
            console.log('⚠️ AngularFlowService has nodes, but handle store is empty!');
            // 嘗試從AngularFlowService同步節點
            this.store.setNodes(serviceNodes);
            this.store.updateLookupTables();
            const reUpdatedStore = this.store.getState();
            console.log('🔄 After syncing from AngularFlowService, nodeLookupSize:', reUpdatedStore.nodeLookup?.size);
            
            // 🔥 CRITICAL: 重新獲取更新後的store狀態
            currentStore = this.store.getState();
            console.log('🔄 Re-fetched store state, new nodeLookupSize:', currentStore.nodeLookup?.size);
          }
        }
      }

      // 修復domNode問題 - 從DOM中查找正確的容器
      let domNode = currentStore.domNode as HTMLDivElement;
      if (!domNode) {
        // 如果store中沒有domNode，嘗試從DOM中找到wrapper容器
        domNode = document.querySelector('.react-flow__wrapper') as HTMLDivElement || 
                  document.querySelector('.xy-flow__wrapper') as HTMLDivElement ||
                  document.querySelector('[data-testid="rf__wrapper"]') as HTMLDivElement;
        console.log('🔧 Fallback domNode found:', !!domNode, domNode?.className);
      }
      
      // 調試所有關鍵參數
      const xyHandleParams = {
        autoPanOnConnect: currentStore.autoPanOnConnect,
        connectionMode: currentStore.connectionMode,
        connectionRadius: currentStore.connectionRadius,
        domNode: domNode,
        nodeLookup: currentStore.nodeLookup as any,
        lib: currentStore.lib,
        isTarget: this.isTarget(),
        handleId: this.handleId(),
        nodeId,
        flowId: currentStore.rfId,
        panBy: (delta: { x: number; y: number }) => {
          currentStore.panBy(delta);
          return Promise.resolve(false);
        },
        cancelConnection: currentStore.cancelConnection.bind(currentStore),
        onConnectStart: currentStore.onConnectStart,
        onConnectEnd: currentStore.onConnectEnd,
        updateConnection: (params: any) => {
          console.log('🔄 XYHandle updateConnection called with:', params);
          currentStore.updateConnection(params);
        },
        onConnect: this.onConnectExtended,
        isValidConnection: this.isValidConnection() || currentStore.isValidConnection,
        getTransform: () => this.store.getState().transform,
        getFromHandle: () => this.store.getConnection()().fromHandle as any,
        autoPanSpeed: currentStore.autoPanSpeed,
        dragThreshold: 0, // 🔥 BYPASS: Set to 0 to immediately start connection without drag threshold
      };
      
      console.log('🔍 XYHandle.onPointerDown parameters:', {
        hasDomNode: !!xyHandleParams.domNode,
        domNodeType: xyHandleParams.domNode?.constructor.name,
        hasNodeLookup: !!xyHandleParams.nodeLookup,
        nodeLookupSize: xyHandleParams.nodeLookup?.size,
        connectionMode: xyHandleParams.connectionMode,
        dragThreshold: xyHandleParams.dragThreshold,
        isTarget: xyHandleParams.isTarget,
        handleId: xyHandleParams.handleId,
        nodeId: xyHandleParams.nodeId,
        flowId: xyHandleParams.flowId,
        lib: xyHandleParams.lib
      });

      try {
        XYHandle.onPointerDown(event, xyHandleParams);
        console.log('XYHandle.onPointerDown completed successfully');
      } catch (error) {
        console.error('Error in XYHandle.onPointerDown:', error);
      }
    }

    // 調用原始事件處理器
    if (isMouseTriggered) {
      this.onMouseDown()?.(event as MouseEvent);
    } else {
      this.onTouchStart()?.(event as TouchEvent);
    }
  }

  /**
   * 點擊事件處理器
   */
  onClick(event: MouseEvent) {
    try {
      console.log('Handle onClick called', { connectOnClick: this.connectOnClick(), nodeId: this.nodeId(), handleId: this.handleId() });
      
      if (!this.connectOnClick()) {
        console.log('connectOnClick is false, returning');
        return;
      }

    const nodeId = this.nodeId();
    const handleId = this.handleId();
    const state = this.store.getState();
    const {
      onClickConnectStart,
      onClickConnectEnd,
      connectionClickStartHandle,
      connectionMode,
      isValidConnection: isValidConnectionStore,
      lib,
      rfId: flowId,
      nodeLookup,
      connection: connectionState,
    } = state;
    
    console.log('🔍 Store lib value:', lib);

    console.log('Handle onClick state check:', {
      nodeId,
      handleId,
      type: this.type,
      connectionClickStartHandle,
      isConnectableStart: this.isConnectableStart,
      isConnectableEnd: this.isConnectableEnd,
      hasStartHandle: !!connectionClickStartHandle
    });

    if (!nodeId) {
      console.log('Returning early - no nodeId');
      return;
    }
    
    if (!connectionClickStartHandle && !this.isConnectableStart()) {
      console.log('Returning early - no start handle and not connectable start', {
        hasStartHandle: !!connectionClickStartHandle,
        isConnectableStart: this.isConnectableStart(),
        isConnectableEnd: this.isConnectableEnd()
      });
      return;
    }
    
    // For target handles that already have a start connection, check if they're connectable as end
    if (connectionClickStartHandle && !this.isConnectableEnd()) {
      console.log('Returning early - has start handle but not connectable end', {
        isConnectableEnd: this.isConnectableEnd()
      });
      return;
    }
    

    if (!connectionClickStartHandle) {
      console.log('Starting connection from handle:', { nodeId, handleId, type: this.type() });
      onClickConnectStart?.(event, { nodeId, handleId, handleType: this.type() });
      this.store.setState({ connectionClickStartHandle: { nodeId, type: this.type(), id: handleId } });
      console.log('Connection start handle set in store');
      // Verify it was actually set
      const newState = this.store.getState();
      console.log('Store state after setting start handle:', { 
        connectionClickStartHandle: newState.connectionClickStartHandle 
      });
      return;
    }

    console.log('Completing connection to handle:', { 
      nodeId, 
      handleId, 
      type: this.type(),
      fromHandle: connectionClickStartHandle 
    });

    const doc = getHostForElement(event.target);
    const isValidConnectionHandler = this.isValidConnection() || isValidConnectionStore;
    
    // Emergency nodeLookup population if empty
    let workingNodeLookup = nodeLookup;
    if (!workingNodeLookup || workingNodeLookup.size === 0) {
      console.error('ERROR: nodeLookup is empty or undefined!', { 
        hasNodeLookup: !!workingNodeLookup, 
        size: workingNodeLookup?.size 
      });
      
      // Emergency fallback: populate nodeLookup with nodes from store.nodes
      console.log('🚨 Attempting to populate nodeLookup as emergency fallback...');
      const currentNodes = this.store.getState().nodes;
      console.log('🚨 Current nodes from store:', currentNodes.length);
      console.log('🚨 Store instance:', this.store);
      console.log('🚨 Store constructor:', this.store.constructor.name);
      
      // Try using AngularFlowService as fallback source of nodes
      if (currentNodes.length === 0 && this.angularFlowService) {
        console.log('🚨 Trying AngularFlowService as fallback...');
        const angularFlowNodes = this.angularFlowService.getNodes();
        console.log('🚨 AngularFlowService nodes:', angularFlowNodes.length);
        
        if (angularFlowNodes.length > 0) {
          console.log('🚨 Using AngularFlowService nodes to populate store...');
          this.store.setNodes(angularFlowNodes);
          
          // Get updated state
          const updatedState = this.store.getState();
          console.log('🚨 Updated nodeLookup size after using AngularFlowService:', updatedState.nodeLookup.size);
          
          // Use updated nodeLookup
          workingNodeLookup = updatedState.nodeLookup;
        }
      } else if (currentNodes.length > 0) {
        // Call setNodes to trigger nodeLookup population
        this.store.setNodes(currentNodes);
        console.log('🚨 Called setNodes to populate nodeLookup');
        
        // Get updated state
        const updatedState = this.store.getState();
        console.log('🚨 Updated nodeLookup size:', updatedState.nodeLookup.size);
        
        // Use updated nodeLookup
        workingNodeLookup = updatedState.nodeLookup;
      }
    }
    
    // Debug: Check if the event target is what we expect
    console.log('onClick event target check:', {
      target: event.target,
      targetClasses: (event.target as HTMLElement).className,
      targetNodeId: (event.target as HTMLElement).getAttribute('data-nodeid'),
      targetHandleId: (event.target as HTMLElement).getAttribute('data-handleid'),
      targetDataId: (event.target as HTMLElement).getAttribute('data-id')
    });
    
    console.log('Preparing XYHandle.isValid call:', {
      handle: { nodeId, id: handleId, type: this.type },
      fromNodeId: connectionClickStartHandle.nodeId,
      fromHandleId: connectionClickStartHandle.id || null,
      fromType: connectionClickStartHandle.type,
      connectionMode,
      hasNodeLookup: !!nodeLookup,
      nodeLookupSize: nodeLookup?.size,
      hasLib: !!lib,
      hasDoc: !!doc,
      flowId
    });
    
    // Check if nodes exist in lookup
    if (workingNodeLookup) {
      console.log('NodeLookup check:', {
        fromNodeExists: workingNodeLookup.has(connectionClickStartHandle.nodeId),
        toNodeExists: workingNodeLookup.has(nodeId),
        fromNode: workingNodeLookup.get(connectionClickStartHandle.nodeId),
        toNode: workingNodeLookup.get(nodeId)
      });
    }

    // Try calling isValid with different parameters to debug
    let validResult;
    try {
      const targetElement = event.target as HTMLElement;
      const params = {
        handle: {
          nodeId,
          id: handleId || null,  // Ensure null instead of undefined
          type: this.type(),
        },
        connectionMode,
        fromNodeId: connectionClickStartHandle.nodeId,
        fromHandleId: connectionClickStartHandle.id || null,
        fromType: connectionClickStartHandle.type,
        isValidConnection: isValidConnectionHandler || (() => true),  // Default to always valid
        flowId: flowId || 'angular-flow',
        doc: doc || document,
        lib: lib || 'xy',  // Use 'xy' to match xy-flow__handle classes
        nodeLookup: workingNodeLookup as any,
      };
      
      console.log('🔍 Pre-isValid debugging:', {
        event: {
          type: event.type,
          clientX: event.clientX,
          clientY: event.clientY,
          target: {
            className: targetElement.className,
            dataNodeId: targetElement.getAttribute('data-nodeid'),
            dataHandleId: targetElement.getAttribute('data-handleid'),
            dataId: targetElement.getAttribute('data-id')
          }
        },
        params: {
          handle: params.handle,
          connectionMode: params.connectionMode,
          fromNodeId: params.fromNodeId,
          fromHandleId: params.fromHandleId,
          fromType: params.fromType,
          lib: params.lib,
          flowId: params.flowId,
          nodeLookupSize: workingNodeLookup.size
        }
      });
      
      // Check DOM query that XYHandle.isValid will perform
      const expectedQuery = `.${params.lib}-flow__handle[data-id="${params.flowId}-${params.handle.nodeId}-${params.handle.id}-${params.handle.type}"]`;
      const queryResult = doc.querySelector(expectedQuery);
      console.log('🔍 DOM query check:', {
        query: expectedQuery,
        found: !!queryResult,
        className: queryResult?.className,
        attributes: queryResult ? {
          dataId: queryResult.getAttribute('data-id'),
          dataNodeId: queryResult.getAttribute('data-nodeid'),
          dataHandleId: queryResult.getAttribute('data-handleid')
        } : null
      });
      
      // Check elementFromPoint that XYHandle.isValid will perform
      const elementFromPoint = doc.elementFromPoint(event.clientX, event.clientY);
      console.log('🔍 ElementFromPoint check:', {
        found: !!elementFromPoint,
        className: elementFromPoint?.className,
        isHandleClass: elementFromPoint?.classList.contains(`${params.lib}-flow__handle`)
      });
      
      // Check handle classes on target element
      const targetClasses = {
        hasTargetClass: targetElement.classList.contains('target'),
        hasSourceClass: targetElement.classList.contains('source'),
        hasConnectable: targetElement.classList.contains('connectable'),
        hasConnectableEnd: targetElement.classList.contains('connectableend'),
        expectedType: params.handle.type
      };
      console.log('🔍 Target element classes:', targetClasses);
      
      // Check node in nodeLookup for handle bounds
      const targetNode = workingNodeLookup.get(nodeId);
      console.log('🔍 Target node check:', {
        nodeFound: !!targetNode,
        hasInternals: !!targetNode?.internals,
        hasHandleBounds: !!targetNode?.internals?.handleBounds,
        handleBounds: targetNode?.internals?.handleBounds
      });
      
      validResult = XYHandle.isValid(event, params);
      
      console.log('🔍 Post-isValid result:', {
        isValid: validResult.isValid,
        hasConnection: !!validResult.connection,
        connection: validResult.connection,
        hasToHandle: !!validResult.toHandle,
        toHandle: validResult.toHandle,
        hasHandleDomNode: !!validResult.handleDomNode
      });
      
    } catch (error) {
      console.error('Error calling XYHandle.isValid:', error);
      validResult = { connection: null, isValid: false };
    }

    const { connection, isValid } = validResult;
    console.log('XYHandle.isValid result:', { connection, isValid });

    if (isValid && connection) {
      console.log('Valid connection! Calling onConnectExtended with:', connection);
      this.onConnectExtended(connection);
    } else {
      console.log('Invalid connection or no connection returned');
    }

    const connectionClone = structuredClone(connectionState) as any;
    delete connectionClone.inProgress;
    connectionClone.toPosition = connectionClone.toHandle ? connectionClone.toHandle.position : null;
    onClickConnectEnd?.(event as unknown as MouseEvent, connectionClone);

    this.store.setState({ connectionClickStartHandle: null });
    } catch (error) {
      console.error('Error in Handle onClick:', error);
    }
  }
}