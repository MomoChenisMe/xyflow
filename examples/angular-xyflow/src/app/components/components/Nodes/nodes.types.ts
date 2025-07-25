import { Position } from '../Handle/handle.types';

/**
 * 節點基礎接口
 */
export interface NodeBase<T = any> {
  /** 節點 ID */
  id: string;
  /** 節點位置 */
  position: { x: number; y: number };
  /** 節點數據 */
  data?: T;
  /** 節點類型 */
  type?: string;
  /** 是否選中 */
  selected?: boolean;
  /** 是否正在拖拽 */
  dragging?: boolean;
  /** 是否可選擇 */
  selectable?: boolean;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 是否可刪除 */
  deletable?: boolean;
  /** 是否可連接 */
  connectable?: boolean;
  /** 是否可聚焦 */
  focusable?: boolean;
  /** 節點寬度 */
  width?: number;
  /** 節點高度 */
  height?: number;
  /** 父節點 ID */
  parentId?: string;
  /** 層級索引 */
  zIndex?: number;
  /** 展開狀態 */
  expanded?: boolean;
  /** 節點樣式 */
  style?: any;
  /** CSS 類名 */
  className?: string;
  /** 是否隱藏 */
  hidden?: boolean;
  /** ARIA 標籤 */
  ariaLabel?: string;
  /** DOM 屬性 */
  domAttributes?: Record<string, any>;
}

/**
 * 內部節點接口 - 包含運行時數據
 */
export interface InternalNode extends NodeBase {
  /** 測量的節點尺寸 */
  measured: {
    width?: number;
    height?: number;
  };
  /** 內部位置數據 */
  internals: {
    positionAbsolute: { x: number; y: number };
    z: number;
    handleBounds?: {
      source?: Array<{
        id?: string;
        position: Position;
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
      target?: Array<{
        id?: string;
        position: Position;
        x: number;
        y: number;
        width: number;
        height: number;
      }>;
    };
  };
}

/**
 * 節點組件屬性
 */
export interface NodeProps {
  /** 節點 ID */
  id: string;
  /** 節點數據 */
  data?: any;
  /** 是否拖拽中 */
  dragging?: boolean;
  /** 是否選中 */
  selected?: boolean;
  /** 節點類型 */
  type?: string;
  /** 節點位置 X */
  xPos: number;
  /** 節點位置 Y */
  yPos: number;
  /** 層級索引 */
  zIndex: number;
  /** 是否可拖拽 */
  draggable?: boolean;
  /** 是否可選擇 */
  selectable?: boolean;
  /** 是否可刪除 */
  deletable?: boolean;
  /** 是否可連接 */
  connectable?: boolean;
  /** 是否可聚焦 */
  focusable?: boolean;
  /** 節點寬度 */
  width?: number;
  /** 節點高度 */
  height?: number;
  /** 父節點 ID */
  parentId?: string;
  /** 是否隱藏 */
  hidden?: boolean;
  /** 初始化完成 */
  initialized?: boolean;
  /** 是否為子節點 */
  isParent?: boolean;
  /** 節點樣式 */
  style?: any;
  /** CSS 類名 */
  className?: string;
  /** ARIA 標籤 */
  ariaLabel?: string;
  /** ARIA 描述 */
  ariaLabelledBy?: string;
  /** ARIA 描述 */
  ariaDescribedBy?: string;
  /** 角色 */
  role?: string;
}

/**
 * NodeWrapper 組件屬性
 */
export interface NodeWrapperProps extends NodeProps {
  /** 節點類型映射 */
  nodeTypes?: Record<string, any>;
  /** 點擊事件 */
  onClick?: (event: MouseEvent, node: NodeBase) => void;
  /** 雙擊事件 */
  onDoubleClick?: (event: MouseEvent, node: NodeBase) => void;
  /** 右鍵菜單事件 */
  onContextMenu?: (event: MouseEvent, node: NodeBase) => void;
  /** 滑鼠進入事件 */
  onMouseEnter?: (event: MouseEvent, node: NodeBase) => void;
  /** 滑鼠移動事件 */
  onMouseMove?: (event: MouseEvent, node: NodeBase) => void;
  /** 滑鼠離開事件 */
  onMouseLeave?: (event: MouseEvent, node: NodeBase) => void;
  /** 拖拽開始事件 */
  onDragStart?: (event: DragEvent, node: NodeBase) => void;
  /** 拖拽中事件 */
  onDrag?: (event: DragEvent, node: NodeBase) => void;
  /** 拖拽結束事件 */
  onDragStop?: (event: DragEvent, node: NodeBase) => void;
  /** 錯誤處理 */
  onError?: (code: string, message: string) => void;
  /** React Flow 實例 ID */
  rfId?: string;
  /** 禁用平移的類名 */
  noPanClassName?: string;
  /** 禁用鍵盤無障礙功能 */
  disableKeyboardA11y?: boolean;
  /** 節點原點 */
  nodeOrigin?: [number, number];
  /** 節點範圍 */
  nodeExtent?: [[number, number], [number, number]];
}

/**
 * 預設節點屬性
 */
export interface DefaultNodeProps extends NodeProps {
  /** 源 Handle 位置 */
  sourcePosition?: Position;
  /** 目標 Handle 位置 */
  targetPosition?: Position;
}

/**
 * 輸入節點屬性
 */
export interface InputNodeProps extends NodeProps {
  /** 源 Handle 位置 */
  sourcePosition?: Position;
}

/**
 * 輸出節點屬性
 */
export interface OutputNodeProps extends NodeProps {
  /** 目標 Handle 位置 */
  targetPosition?: Position;
}

/**
 * 群組節點屬性
 */
export interface GroupNodeProps extends NodeProps {
  /** 群組樣式 */
  style?: any;
}

/**
 * 內建節點類型
 */
export type BuiltInNode = 'input' | 'output' | 'default' | 'group';

/**
 * 節點事件類型
 */
export interface NodeEvents {
  onClick?: (event: MouseEvent, node: NodeBase) => void;
  onDoubleClick?: (event: MouseEvent, node: NodeBase) => void;
  onContextMenu?: (event: MouseEvent, node: NodeBase) => void;
  onMouseEnter?: (event: MouseEvent, node: NodeBase) => void;
  onMouseMove?: (event: MouseEvent, node: NodeBase) => void;
  onMouseLeave?: (event: MouseEvent, node: NodeBase) => void;
  onDragStart?: (event: DragEvent, node: NodeBase) => void;
  onDrag?: (event: DragEvent, node: NodeBase) => void;
  onDragStop?: (event: DragEvent, node: NodeBase) => void;
}

/**
 * 節點變更類型
 */
export interface NodeChange {
  id: string;
  type: 'add' | 'remove' | 'select' | 'position' | 'dimensions' | 'reset';
  [key: string]: any;
}

/**
 * 節點拖拽狀態
 */
export interface NodeDragState {
  isDragging: boolean;
  dragStartPosition?: { x: number; y: number };
  dragOffset?: { x: number; y: number };
}

/**
 * 節點選擇狀態
 */
export interface NodeSelectionState {
  selectedNodeIds: Set<string>;
  lastSelectedNodeId?: string;
  selectionMode: 'single' | 'multi';
}