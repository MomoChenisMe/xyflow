import { ReactFlowState, ConnectionState, NoConnection, Transform } from './store-types';
import { ConnectionMode } from '../components/Handle/handle.types';

/**
 * 初始連接狀態
 */
export const initialConnectionState: NoConnection = {
  inProgress: false,
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

/**
 * 初始變換矩陣
 */
export const initialTransform: Transform = [0, 0, 1];

/**
 * 默認的無障礙標籤配置
 */
export const defaultAriaLabelConfig = {
  'node.a11yDescription.ariaLiveMessage': (params: { x: number; y: number; direction?: string }) => 
    `Node moved to position ${params.x}, ${params.y}`,
  'node.a11yDescription.selected': (params: { label?: string }) => 
    `Node ${params.label || 'node'} selected`,
  'node.a11yDescription.deselected': (params: { label?: string }) => 
    `Node ${params.label || 'node'} deselected`,
  'edge.a11yDescription.selected': (params: { source: string; target: string }) => 
    `Edge from ${params.source} to ${params.target} selected`,
  'edge.a11yDescription.deselected': (params: { source: string; target: string }) => 
    `Edge from ${params.source} to ${params.target} deselected`,
  'flow.a11yDescription.selection': (params: { nodeCount: number; edgeCount: number }) => 
    `Selected ${params.nodeCount} nodes and ${params.edgeCount} edges`,
  'flow.a11yDescription.viewport': (params: { x: number; y: number; zoom: number }) => 
    `Viewport at position ${params.x}, ${params.y} with zoom ${params.zoom.toFixed(2)}`,
};

/**
 * 創建初始狀態
 */
export function createInitialState(overrides: Partial<ReactFlowState> = {}): ReactFlowState {
  const baseState: ReactFlowState = {
    // 數據
    nodes: [],
    edges: [],
    
    // 視窗狀態
    x: 0,
    y: 0,
    zoom: 1,
    transform: initialTransform,
    width: 1000,
    height: 600,
    minZoom: 0.1,
    maxZoom: 10,
    
    // 交互狀態
    isDragging: false,
    paneDragging: false,
    preventScrolling: false,
    nodesSelectionActive: false,
    userSelectionActive: false,
    userSelectionRect: null,
    multiSelectionActive: false,
    
    // 連接狀態
    connection: initialConnectionState,
    connectionMode: ConnectionMode.Strict,
    connectionClickStartHandle: null,
    connectionRadius: 20,
    connectionDragThreshold: 1,
    
    // 選擇狀態
    selectedNodes: new Set(),
    selectedEdges: new Set(),
    
    // 查找表
    nodeLookup: new Map(),
    edgeLookup: new Map(),
    connectionLookup: new Map(),
    parentLookup: new Map(),
    
    // 行為配置
    nodesDraggable: true,
    nodesConnectable: true,
    nodesFocusable: true,
    edgesFocusable: true,
    edgesReconnectable: true,
    elementsSelectable: true,
    selectNodesOnDrag: true,
    elevateNodesOnSelect: true,
    elevateEdgesOnSelect: false,
    
    // 自動平移
    autoPanOnConnect: true,
    autoPanOnNodeFocus: true,
    autoPanSpeed: 15,
    
    // 適應視圖
    fitViewQueued: false,
    fitViewResolver: null,
    
    // 範圍限制
    nodeExtent: undefined,
    translateExtent: undefined,
    
    // 默認選項
    defaultEdgeOptions: undefined,
    hasDefaultNodes: false,
    hasDefaultEdges: true,  // Enable edge management by default
    
    // DOM 相關
    domNode: null,
    panZoom: null,
    
    // 識別信息
    rfId: `angular-flow-${Date.now()}`,
    lib: 'xy',  // Match xy-flow__handle CSS classes
    
    // CSS 類名
    noPanClassName: 'nopan',
    
    // 初始化標誌
    initialized: false,
    debug: false,
    
    // 無障礙
    ariaLiveMessage: '',
    ariaLabelConfig: defaultAriaLabelConfig,
    
    // 驗證函數
    isValidConnection: undefined,
    
    // 閾值
    nodeDragThreshold: 1,
    nodeClickDistance: 2,
    
    // 點擊連接
    connectOnClick: true,
    
    // 對齊網格
    snapGrid: undefined,
    snapToGrid: false,
    
    // 事件回調
    onNodesChange: undefined,
    onEdgesChange: undefined,
    onConnect: undefined,
    onConnectStart: undefined,
    onConnectEnd: undefined,
    onClickConnectStart: undefined,
    onClickConnectEnd: undefined,
    onError: undefined,
    onSelectionChangeHandlers: [],
    
    // 操作方法（將在 store 中實現）
    panBy: () => {},
    setCenter: () => {},
    fitView: () => Promise.resolve(false),
    updateConnection: () => {},
    cancelConnection: () => {},
    addSelectedNodes: () => {},
    addSelectedEdges: () => {},
    unselectNodesAndEdges: () => {},
    setNodes: () => {},
    setEdges: () => {},
    reset: () => {},
  };

  const mergedState = { ...baseState, ...overrides };
  
  // Auto-set hasDefaultEdges if edges are provided
  if (overrides.edges && overrides.edges.length > 0) {
    mergedState.hasDefaultEdges = true;
  }
  
  // Auto-set hasDefaultNodes if nodes are provided  
  if (overrides.nodes && overrides.nodes.length > 0) {
    mergedState.hasDefaultNodes = true;
  }
  
  return mergedState;
}

/**
 * 預設配置
 */
export const presetConfigurations = {
  /**
   * 默認配置
   */
  default: {},
  
  /**
   * 性能優化配置
   */
  performance: {
    elevateNodesOnSelect: false,
    elevateEdgesOnSelect: false,
    selectNodesOnDrag: false,
    autoPanOnConnect: false,
    autoPanOnNodeFocus: false,
  },
  
  /**
   * 無障礙優化配置
   */
  accessibility: {
    nodesFocusable: true,
    edgesFocusable: true,
    ariaLabelConfig: {
      ...defaultAriaLabelConfig,
      // 增強的無障礙配置
      'node.a11yDescription.focus': (params: { label?: string; type?: string }) => 
        `Focused on ${params.type || 'node'} ${params.label || ''}`,
      'edge.a11yDescription.focus': (params: { source: string; target: string; type?: string }) => 
        `Focused on ${params.type || 'edge'} from ${params.source} to ${params.target}`,
    },
  },
  
  /**
   * 移動設備配置
   */
  mobile: {
    connectionRadius: 30,
    nodeDragThreshold: 3,
    nodeClickDistance: 5,
    autoPanSpeed: 20,
    minZoom: 0.2,
    maxZoom: 5,
  },
  
  /**
   * 只讀模式配置
   */
  readonly: {
    nodesDraggable: false,
    nodesConnectable: false,
    elementsSelectable: false,
    edgesReconnectable: false,
    connectOnClick: false,
  },
  
  /**
   * 調試模式配置
   */
  debug: {
    debug: true,
    ariaLiveMessage: 'Debug mode enabled',
  },
  
  /**
   * 高密度顯示配置
   */
  dense: {
    connectionRadius: 15,
    nodeDragThreshold: 0.5,
    nodeClickDistance: 1,
    snapGrid: [10, 10] as [number, number],
    snapToGrid: true,
  },
  
  /**
   * 大型圖形配置
   */
  large: {
    elevateNodesOnSelect: false,
    elevateEdgesOnSelect: false,
    selectNodesOnDrag: false,
    autoPanOnConnect: false,
    preventScrolling: true,
  },
} as const;

/**
 * 根據預設名稱獲取配置
 */
export function getPresetConfiguration(presetName: keyof typeof presetConfigurations): Partial<ReactFlowState> {
  return presetConfigurations[presetName] || {};
}

/**
 * 合併多個預設配置
 */
export function mergePresetConfigurations(
  ...presetNames: (keyof typeof presetConfigurations)[]
): Partial<ReactFlowState> {
  const configs = presetNames.map(name => getPresetConfiguration(name));
  return Object.assign({}, ...configs);
}

/**
 * 創建帶預設的初始狀態
 */
export function createInitialStateWithPreset(
  presetName: keyof typeof presetConfigurations,
  overrides: Partial<ReactFlowState> = {}
): ReactFlowState {
  const presetConfig = getPresetConfiguration(presetName);
  return createInitialState({ ...presetConfig, ...overrides });
}

/**
 * 驗證狀態配置
 */
export function validateStateConfiguration(state: Partial<ReactFlowState>): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // 驗證縮放範圍
  if (state.minZoom !== undefined && state.maxZoom !== undefined) {
    if (state.minZoom >= state.maxZoom) {
      errors.push('minZoom must be less than maxZoom');
    }
    if (state.minZoom < 0.01) {
      warnings.push('minZoom is very small, may cause performance issues');
    }
    if (state.maxZoom > 50) {
      warnings.push('maxZoom is very large, may cause performance issues');
    }
  }
  
  // 驗證視窗尺寸
  if (state.width !== undefined && state.width <= 0) {
    errors.push('width must be greater than 0');
  }
  if (state.height !== undefined && state.height <= 0) {
    errors.push('height must be greater than 0');
  }
  
  // 驗證連接配置
  if (state.connectionRadius !== undefined && state.connectionRadius < 0) {
    errors.push('connectionRadius must be non-negative');
  }
  
  // 驗證對齊網格
  if (state.snapGrid !== undefined) {
    const [gridX, gridY] = state.snapGrid;
    if (gridX <= 0 || gridY <= 0) {
      errors.push('snapGrid values must be greater than 0');
    }
  }
  
  // 驗證閾值
  if (state.nodeDragThreshold !== undefined && state.nodeDragThreshold < 0) {
    warnings.push('nodeDragThreshold should be non-negative');
  }
  
  if (state.nodeClickDistance !== undefined && state.nodeClickDistance < 0) {
    warnings.push('nodeClickDistance should be non-negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 狀態配置建議
 */
export function getConfigurationRecommendations(state: Partial<ReactFlowState>): string[] {
  const recommendations: string[] = [];
  
  // 性能建議
  if (state.elevateNodesOnSelect !== false) {
    recommendations.push('Consider disabling elevateNodesOnSelect for large graphs');
  }
  
  if (state.selectNodesOnDrag !== false) {
    recommendations.push('Consider disabling selectNodesOnDrag for better touch support');
  }
  
  // 無障礙建議
  if (state.nodesFocusable === false && state.edgesFocusable === false) {
    recommendations.push('Consider enabling focus for accessibility');
  }
  
  // 用戶體驗建議
  if (state.connectionRadius !== undefined && state.connectionRadius < 15) {
    recommendations.push('Consider increasing connectionRadius for better touch support');
  }
  
  if (state.snapToGrid === true && !state.snapGrid) {
    recommendations.push('snapGrid should be defined when snapToGrid is enabled');
  }
  
  return recommendations;
}