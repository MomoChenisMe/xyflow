# React Flow 範例專案完整說明文件

本文件詳細介紹了 React Flow 範例專案中的所有 57 個範例，涵蓋從基礎使用到進階功能的完整實作。

## 目錄
- [專案結構](#專案結構)
- [基礎範例](#基礎範例)
- [自訂元件範例](#自訂元件範例)
- [互動功能範例](#互動功能範例)
- [Hook 相關範例](#hook-相關範例)
- [佈局和樣式範例](#佈局和樣式範例)
- [進階功能範例](#進階功能範例)
- [狀態管理範例](#狀態管理範例)
- [特殊功能範例](#特殊功能範例)
- [測試架構](#測試架構)

## 專案結構

```
examples/react/
├── src/
│   ├── App/                    # 主應用程式框架
│   │   ├── index.tsx          # 路由和導航
│   │   ├── header.tsx         # 頁面標頭
│   │   └── routes.ts          # 路由配置
│   ├── examples/              # 57 個範例專案
│   │   ├── A11y/             # 無障礙功能
│   │   ├── AddNodeOnEdgeDrop/ # 邊緣拖放添加節點
│   │   ├── Basic/            # 基礎範例
│   │   ├── ...               # 其他範例
│   │   └── Validation/       # 連接驗證
│   └── generic-tests/         # 通用測試組件
├── cypress/                   # E2E 和組件測試
├── package.json              # 依賴管理
└── vite.config.ts            # 建置配置
```

## 基礎範例

### 1. Basic - 基本功能展示

**位置**: `src/examples/Basic/`

**功能**: 展示 React Flow 的基本功能和 API 使用方式。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
} from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

export default function Basic() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

**學習重點**:
- 基本的 ReactFlow 設定
- 使用 `useNodesState` 和 `useEdgesState` 管理狀態
- 實作節點連接功能
- 添加控制面板、小地圖和背景

### 2. Empty - 空白流程處理

**位置**: `src/examples/Empty/`

**功能**: 展示如何處理空白流程並動態添加節點。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type OnConnect,
} from '@xyflow/react';

const initialNodes = [];
const initialEdges = [];

let id = 0;
const getId = () => `dndnode_${id++}`;

export default function Empty() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onPaneClick = useCallback(
    (event) => {
      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode = {
        id: getId(),
        type: 'default',
        position,
        data: { label: 'New Node' },
      };
      
      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneClick={onPaneClick}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

**學習重點**:
- 處理空白流程的初始化
- 動態添加節點到流程中
- 使用 `screenToFlowPosition` 轉換座標
- 實作點擊面板添加節點功能

### 3. DefaultNodes - 預設節點類型

**位置**: `src/examples/DefaultNodes/`

**功能**: 展示所有預設節點類型（input、default、output）。

**實作細節**:
```typescript
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
} from '@xyflow/react';

const initialNodes = [
  {
    id: '1',
    type: 'input',
    position: { x: 100, y: 100 },
    data: { label: 'Input Node' },
  },
  {
    id: '2',
    type: 'default',
    position: { x: 300, y: 100 },
    data: { label: 'Default Node' },
  },
  {
    id: '3',
    type: 'output',
    position: { x: 500, y: 100 },
    data: { label: 'Output Node' },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

export default function DefaultNodes() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
```

**學習重點**:
- 瞭解不同節點類型的特性
- Input 節點只有 source handle
- Output 節點只有 target handle
- Default 節點有 source 和 target handle

### 4. Overview - 完整功能概覽

**位置**: `src/examples/Overview/`

**功能**: 展示所有主要功能和事件處理。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type OnConnect,
  type Node,
  type Edge,
} from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

export default function Overview() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { fitView } = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node: Node) => {
    console.log('Node clicked:', node);
  }, []);

  const onEdgeClick = useCallback((event, edge: Edge) => {
    console.log('Edge clicked:', edge);
  }, []);

  const onPaneClick = useCallback((event) => {
    console.log('Pane clicked');
  }, []);

  const onNodesDelete = useCallback((deleted) => {
    console.log('Nodes deleted:', deleted);
  }, []);

  const onEdgesDelete = useCallback((deleted) => {
    console.log('Edges deleted:', deleted);
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodesDelete={onNodesDelete}
        onEdgesDelete={onEdgesDelete}
        deleteKeyCode={['Backspace', 'Delete']}
        selectionKeyCode={['Shift']}
        multiSelectionKeyCode={['Control']}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

**學習重點**:
- 完整的事件處理機制
- 鍵盤快捷鍵配置
- 節點和邊線的刪除功能
- 多選和選擇功能

## 自訂元件範例

### 1. CustomNode - 自訂節點元件

**位置**: `src/examples/CustomNode/`

**功能**: 展示如何創建自訂節點元件，包含顏色選擇器。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type Node,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';

function ColorSelectorNode({ data, isConnectable }: NodeProps) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
      />
      <div>
        <label htmlFor="color">Color:</label>
        <input
          id="color"
          name="color"
          type="color"
          onChange={onChange}
          defaultValue={data.color}
        />
      </div>
      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
      />
    </>
  );
}

const initialNodes = [
  {
    id: '1',
    type: 'colorSelectorNode',
    position: { x: 100, y: 100 },
    data: { color: '#ff0000' },
  },
];

const nodeTypes = {
  colorSelectorNode: ColorSelectorNode,
};

export default function CustomNode() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

**學習重點**:
- 創建自訂節點元件
- 使用 `Handle` 元件添加連接點
- 節點類型註冊機制
- 節點內部狀態管理

### 2. CustomConnectionLine - 自訂連接線

**位置**: `src/examples/CustomConnectionLine/`

**功能**: 展示如何自訂連接線的外觀和行為。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type ConnectionLineComponentProps,
  getStraightPath,
} from '@xyflow/react';

function CustomConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  connectionLineStyle,
}: ConnectionLineComponentProps) {
  const [edgePath] = getStraightPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
  });

  return (
    <g>
      <path
        fill="none"
        stroke="#222"
        strokeWidth={1.5}
        className="animated"
        d={edgePath}
        style={connectionLineStyle}
      />
      <circle
        cx={toX}
        cy={toY}
        fill="#fff"
        r={3}
        stroke="#222"
        strokeWidth={1.5}
      />
    </g>
  );
}

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
];

export default function CustomConnectionLine() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        connectionLineComponent={CustomConnectionLine}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

**學習重點**:
- 自訂連接線元件
- 使用 SVG 繪製自訂線條
- 連接線動畫效果
- 路徑計算和渲染

### 3. EdgeTypes - 邊線類型配置

**位置**: `src/examples/EdgeTypes/`

**功能**: 展示不同邊線類型的使用方式。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type Edge,
  MarkerType,
} from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
  { id: '3', position: { x: 500, y: 100 }, data: { label: 'Node 3' } },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    type: 'smoothstep',
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
  {
    id: 'e2-3',
    source: '2',
    target: '3',
    type: 'straight',
    style: { stroke: '#f6ab6c', strokeWidth: 3 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#f6ab6c',
    },
  },
];

export default function EdgeTypes() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

**學習重點**:
- 不同邊線類型的使用
- 邊線動畫效果
- 箭頭標記配置
- 邊線樣式自訂

## 互動功能範例

### 1. DragHandle - 拖拽控制點

**位置**: `src/examples/DragHandle/`

**功能**: 展示如何使用拖拽控制點限制節點的拖拽行為。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';

function DragHandleNode({ data }: NodeProps) {
  return (
    <div className="drag-handle-node">
      <Handle type="target" position={Position.Left} />
      <div className="drag-handle" />
      <div className="node-content">
        <strong>{data.label}</strong>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const initialNodes = [
  {
    id: '1',
    type: 'dragHandleNode',
    position: { x: 100, y: 100 },
    data: { label: 'Drag Handle Node' },
    dragHandle: '.drag-handle',
  },
];

const nodeTypes = {
  dragHandleNode: DragHandleNode,
};

export default function DragHandle() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

**學習重點**:
- 使用 `dragHandle` 屬性限制拖拽區域
- 自訂拖拽控制點樣式
- 節點拖拽行為控制

### 2. DragNDrop - 拖放添加節點

**位置**: `src/examples/DragNDrop/`

**功能**: 展示如何從側邊欄拖放節點到流程中。

**實作細節**:
```typescript
import { useCallback, useRef, DragEvent } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type OnConnect,
  type Node,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';

let id = 0;
const getId = () => `dndnode_${id++}`;

export default function DragNDrop() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const { screenToFlowPosition } = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow');

      if (typeof type === 'undefined' || !type) {
        return;
      }

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const newNode = {
        id: getId(),
        type,
        position,
        data: { label: `${type} node` },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition]
  );

  const onDragStart = (event: DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="dndflow">
      <div className="dndflow-sidebar">
        <div className="description">
          You can drag these nodes to the pane on the right.
        </div>
        <div
          className="dnd-node input"
          onDragStart={(event) => onDragStart(event, 'input')}
          draggable
        >
          Input Node
        </div>
        <div
          className="dnd-node"
          onDragStart={(event) => onDragStart(event, 'default')}
          draggable
        >
          Default Node
        </div>
        <div
          className="dnd-node output"
          onDragStart={(event) => onDragStart(event, 'output')}
          draggable
        >
          Output Node
        </div>
      </div>
      <div className="dndflow-wrapper" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
        >
          <Controls />
          <Background variant="dots" gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}
```

**學習重點**:
- 實作拖放功能
- 使用 HTML5 Drag and Drop API
- 座標轉換和定位
- 動態節點創建

### 3. Interaction - 互動設定

**位置**: `src/examples/Interaction/`

**功能**: 展示各種互動設定的開關控制。

**實作細節**:
```typescript
import { useState, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type PanOnScrollMode,
} from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

export default function Interaction() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodesDraggable, setNodesDraggable] = useState(true);
  const [nodesConnectable, setNodesConnectable] = useState(true);
  const [elementsSelectable, setElementsSelectable] = useState(true);
  const [panOnDrag, setPanOnDrag] = useState(true);
  const [panOnScroll, setPanOnScroll] = useState(false);
  const [panOnScrollMode, setPanOnScrollMode] = useState<PanOnScrollMode>('free');
  const [zoomOnScroll, setZoomOnScroll] = useState(true);
  const [zoomOnPinch, setZoomOnPinch] = useState(true);
  const [zoomOnDoubleClick, setZoomOnDoubleClick] = useState(true);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodesDraggable={nodesDraggable}
        nodesConnectable={nodesConnectable}
        elementsSelectable={elementsSelectable}
        panOnDrag={panOnDrag}
        panOnScroll={panOnScroll}
        panOnScrollMode={panOnScrollMode}
        zoomOnScroll={zoomOnScroll}
        zoomOnPinch={zoomOnPinch}
        zoomOnDoubleClick={zoomOnDoubleClick}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      
      <div className="interaction-panel">
        <h3>Interaction Options</h3>
        <label>
          <input
            type="checkbox"
            checked={nodesDraggable}
            onChange={(e) => setNodesDraggable(e.target.checked)}
          />
          Nodes Draggable
        </label>
        <label>
          <input
            type="checkbox"
            checked={nodesConnectable}
            onChange={(e) => setNodesConnectable(e.target.checked)}
          />
          Nodes Connectable
        </label>
        <label>
          <input
            type="checkbox"
            checked={elementsSelectable}
            onChange={(e) => setElementsSelectable(e.target.checked)}
          />
          Elements Selectable
        </label>
        <label>
          <input
            type="checkbox"
            checked={panOnDrag}
            onChange={(e) => setPanOnDrag(e.target.checked)}
          />
          Pan on Drag
        </label>
        <label>
          <input
            type="checkbox"
            checked={zoomOnScroll}
            onChange={(e) => setZoomOnScroll(e.target.checked)}
          />
          Zoom on Scroll
        </label>
      </div>
    </div>
  );
}
```

**學習重點**:
- 互動設定的動態控制
- 各種互動模式的組合使用
- 用戶介面控制項整合
- 即時設定變更

## Hook 相關範例

### 1. UseReactFlow - 核心 Hook 使用

**位置**: `src/examples/UseReactFlow/`

**功能**: 展示 useReactFlow Hook 的各種方法使用。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type OnConnect,
} from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

export default function UseReactFlow() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const {
    zoomIn,
    zoomOut,
    zoomTo,
    getZoom,
    setViewport,
    getViewport,
    fitView,
    setCenter,
    screenToFlowPosition,
    flowToScreenPosition,
    addNodes,
    addEdges,
    getNodes,
    getEdges,
    deleteElements,
  } = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onZoomIn = useCallback(() => zoomIn(), [zoomIn]);
  const onZoomOut = useCallback(() => zoomOut(), [zoomOut]);
  const onZoomTo = useCallback(() => zoomTo(1.5), [zoomTo]);
  const onFitView = useCallback(() => fitView(), [fitView]);
  
  const onCenter = useCallback(() => {
    const node = getNodes().find(n => n.id === '1');
    if (node) {
      setCenter(node.position.x, node.position.y, { zoom: 1.5 });
    }
  }, [setCenter, getNodes]);

  const onAddNode = useCallback(() => {
    const id = (getNodes().length + 1).toString();
    const position = { x: Math.random() * 500, y: Math.random() * 500 };
    addNodes([{ id, position, data: { label: `Node ${id}` } }]);
  }, [addNodes, getNodes]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      
      <div className="controls-panel">
        <button onClick={onZoomIn}>Zoom In</button>
        <button onClick={onZoomOut}>Zoom Out</button>
        <button onClick={onZoomTo}>Zoom to 1.5</button>
        <button onClick={onFitView}>Fit View</button>
        <button onClick={onCenter}>Center on Node 1</button>
        <button onClick={onAddNode}>Add Node</button>
      </div>
    </div>
  );
}
```

**學習重點**:
- useReactFlow Hook 的完整 API
- 視窗操作方法
- 節點和邊線操作方法
- 座標轉換功能

### 2. UseNodesData - 節點資料 Hook

**位置**: `src/examples/UseNodesData/`

**功能**: 展示如何使用 useNodesData Hook 獲取節點資料。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useNodesData,
  type OnConnect,
} from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1', value: 10 } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2', value: 20 } },
  { id: '3', position: { x: 500, y: 100 }, data: { label: 'Node 3', value: 30 } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

function DataDisplay() {
  const node1Data = useNodesData('1');
  const node2Data = useNodesData('2');
  const multipleNodesData = useNodesData(['1', '2', '3']);

  return (
    <div className="data-display">
      <h3>Node Data</h3>
      <div>Node 1: {node1Data?.label} (Value: {node1Data?.value})</div>
      <div>Node 2: {node2Data?.label} (Value: {node2Data?.value})</div>
      <div>
        Total Value: {multipleNodesData?.reduce((sum, data) => sum + (data?.value || 0), 0)}
      </div>
    </div>
  );
}

export default function UseNodesData() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      
      <DataDisplay />
    </div>
  );
}
```

**學習重點**:
- useNodesData Hook 的使用方式
- 單一節點資料獲取
- 多個節點資料獲取
- 資料即時更新

### 3. UseKeyPress - 按鍵處理 Hook

**位置**: `src/examples/UseKeyPress/`

**功能**: 展示如何使用 useKeyPress Hook 處理鍵盤事件。

**實作細節**:
```typescript
import { useCallback, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  useKeyPress,
  type OnConnect,
} from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

export default function UseKeyPress() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { deleteElements, addNodes } = useReactFlow();
  
  const deleteKeyPressed = useKeyPress('Backspace');
  const spaceKeyPressed = useKeyPress('Space');
  const enterKeyPressed = useKeyPress('Enter');

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  useEffect(() => {
    if (deleteKeyPressed) {
      const selectedNodes = nodes.filter(n => n.selected);
      const selectedEdges = edges.filter(e => e.selected);
      deleteElements({ nodes: selectedNodes, edges: selectedEdges });
    }
  }, [deleteKeyPressed, nodes, edges, deleteElements]);

  useEffect(() => {
    if (spaceKeyPressed) {
      const id = (nodes.length + 1).toString();
      const position = { x: Math.random() * 500, y: Math.random() * 500 };
      addNodes([{ id, position, data: { label: `Node ${id}` } }]);
    }
  }, [spaceKeyPressed, nodes.length, addNodes]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      
      <div className="key-info">
        <div>Press Backspace to delete selected elements</div>
        <div>Press Space to add a new node</div>
        <div>Press Enter for custom action</div>
      </div>
    </div>
  );
}
```

**學習重點**:
- useKeyPress Hook 的使用方式
- 鍵盤事件處理
- 快捷鍵功能實作
- 鍵盤狀態監聽

## 佈局和樣式範例

### 1. Layouting - 自動佈局

**位置**: `src/examples/Layouting/`

**功能**: 展示如何使用 Dagre 實現自動佈局。

**實作細節**:
```typescript
import { useCallback, useMemo } from 'react';
import dagre from 'dagre';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type Node,
  type Edge,
} from '@xyflow/react';

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? Position.Left : Position.Top;
    node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 0, y: 0 }, data: { label: 'Node 2' } },
  { id: '3', position: { x: 0, y: 0 }, data: { label: 'Node 3' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

export default function Layouting() {
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(
    () => getLayoutedElements(initialNodes, initialEdges),
    []
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onLayout = useCallback(
    (direction: string) => {
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        nodes,
        edges,
        direction
      );

      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
    },
    [nodes, edges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      
      <div className="layout-controls">
        <button onClick={() => onLayout('TB')}>Vertical Layout</button>
        <button onClick={() => onLayout('LR')}>Horizontal Layout</button>
      </div>
    </div>
  );
}
```

**學習重點**:
- 使用 Dagre 進行自動佈局
- 佈局算法整合
- 動態佈局切換
- 節點位置計算

### 2. Backgrounds - 背景樣式

**位置**: `src/examples/Backgrounds/`

**功能**: 展示不同背景樣式的使用方式。

**實作細節**:
```typescript
import { useState, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  type OnConnect,
  type BackgroundVariant,
} from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

export default function Backgrounds() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [variant, setVariant] = useState<BackgroundVariant>('dots');
  const [gap, setGap] = useState(20);
  const [size, setSize] = useState(1);
  const [color, setColor] = useState('#81818a');

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <Background variant={variant} gap={gap} size={size} color={color} />
      </ReactFlow>
      
      <div className="background-controls">
        <label>
          Variant:
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value as BackgroundVariant)}
          >
            <option value="dots">Dots</option>
            <option value="lines">Lines</option>
            <option value="cross">Cross</option>
          </select>
        </label>
        <label>
          Gap:
          <input
            type="range"
            min="10"
            max="50"
            value={gap}
            onChange={(e) => setGap(Number(e.target.value))}
          />
        </label>
        <label>
          Size:
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
          />
        </label>
        <label>
          Color:
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
      </div>
    </div>
  );
}
```

**學習重點**:
- 不同背景變體的使用
- 背景參數動態調整
- 背景樣式自訂
- 用戶介面控制項

### 3. ColorMode - 顏色模式

**位置**: `src/examples/ColorMode/`

**功能**: 展示明暗主題切換功能。

**實作細節**:
```typescript
import { useState, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Background,
  Controls,
  type OnConnect,
  type ColorMode,
} from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

export default function ColorModeExample() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [colorMode, setColorMode] = useState<ColorMode>('light');

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        colorMode={colorMode}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      
      <div className="color-mode-controls">
        <button
          onClick={() => setColorMode(colorMode === 'light' ? 'dark' : 'light')}
        >
          Toggle {colorMode === 'light' ? 'Dark' : 'Light'} Mode
        </button>
      </div>
    </div>
  );
}
```

**學習重點**:
- 顏色模式切換
- 主題狀態管理
- 動態樣式變更
- 用戶偏好設定

## 進階功能範例

### 1. NodeResizer - 節點尺寸調整

**位置**: `src/examples/NodeResizer/`

**功能**: 展示如何使用 NodeResizer 調整節點大小。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  NodeResizer,
  type OnConnect,
  type NodeProps,
  Handle,
  Position,
} from '@xyflow/react';

function ResizableNode({ data, selected }: NodeProps) {
  return (
    <>
      <NodeResizer
        color="#ff0071"
        isVisible={selected}
        minWidth={100}
        minHeight={30}
      />
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}

const initialNodes = [
  {
    id: '1',
    type: 'ResizableNode',
    position: { x: 100, y: 100 },
    data: { label: 'Resizable Node 1' },
  },
  {
    id: '2',
    type: 'ResizableNode',
    position: { x: 300, y: 100 },
    data: { label: 'Resizable Node 2' },
  },
];

const nodeTypes = {
  ResizableNode,
};

export default function NodeResizerExample() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

**學習重點**:
- NodeResizer 元件使用
- 調整大小功能
- 最小尺寸限制
- 選擇狀態控制

### 2. NodeToolbar - 節點工具列

**位置**: `src/examples/NodeToolbar/`

**功能**: 展示如何使用 NodeToolbar 添加節點工具列。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  NodeToolbar,
  type OnConnect,
  type NodeProps,
  Handle,
  Position,
  useReactFlow,
} from '@xyflow/react';

function ToolbarNode({ id, data, selected }: NodeProps) {
  const { deleteElements, addNodes } = useReactFlow();

  const onDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
  }, [id, deleteElements]);

  const onDuplicate = useCallback(() => {
    const node = {
      id: `${id}_copy`,
      position: { x: Math.random() * 500, y: Math.random() * 500 },
      data: { label: `${data.label} (Copy)` },
      type: 'ToolbarNode',
    };
    addNodes([node]);
  }, [id, data, addNodes]);

  return (
    <>
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <button onClick={onDelete}>Delete</button>
        <button onClick={onDuplicate}>Duplicate</button>
      </NodeToolbar>
      <Handle type="target" position={Position.Left} />
      <div style={{ padding: 10 }}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
}

const initialNodes = [
  {
    id: '1',
    type: 'ToolbarNode',
    position: { x: 100, y: 100 },
    data: { label: 'Node with Toolbar' },
  },
];

const nodeTypes = {
  ToolbarNode,
};

export default function NodeToolbarExample() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

**學習重點**:
- NodeToolbar 元件使用
- 工具列位置控制
- 節點操作功能
- 動態顯示控制

### 3. Stress - 性能壓力測試

**位置**: `src/examples/Stress/`

**功能**: 展示大量節點的性能測試。

**實作細節**:
```typescript
import { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type Node,
  type Edge,
} from '@xyflow/react';

const generateElements = (xNodes: number, yNodes: number) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  let nodeId = 1;
  let reachBottom = false;

  for (let y = 0; y < yNodes; y++) {
    for (let x = 0; x < xNodes; x++) {
      const position = { x: x * 100, y: y * 50 };
      const data = { label: `Node ${nodeId}` };
      const node = {
        id: nodeId.toString(),
        style: { width: 50, height: 25 },
        data,
        position,
      };
      nodes.push(node);

      // Create edges
      if (x < xNodes - 1) {
        edges.push({
          id: `${nodeId}-${nodeId + 1}`,
          source: nodeId.toString(),
          target: (nodeId + 1).toString(),
        });
      }

      if (y < yNodes - 1) {
        edges.push({
          id: `${nodeId}-${nodeId + xNodes}`,
          source: nodeId.toString(),
          target: (nodeId + xNodes).toString(),
        });
      }

      nodeId++;
    }
  }

  return { nodes, edges };
};

export default function Stress() {
  const [xNodes, setXNodes] = useState(10);
  const [yNodes, setYNodes] = useState(10);
  
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => generateElements(xNodes, yNodes),
    [xNodes, yNodes]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const updateNodes = useCallback(() => {
    const { nodes: newNodes, edges: newEdges } = generateElements(xNodes, yNodes);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [xNodes, yNodes, setNodes, setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onlyRenderVisibleElements={false}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      
      <div className="stress-controls">
        <label>
          X Nodes:
          <input
            type="number"
            value={xNodes}
            onChange={(e) => setXNodes(Number(e.target.value))}
            min="1"
            max="50"
          />
        </label>
        <label>
          Y Nodes:
          <input
            type="number"
            value={yNodes}
            onChange={(e) => setYNodes(Number(e.target.value))}
            min="1"
            max="50"
          />
        </label>
        <button onClick={updateNodes}>Update Nodes</button>
        <div>Total Nodes: {nodes.length}</div>
        <div>Total Edges: {edges.length}</div>
      </div>
    </div>
  );
}
```

**學習重點**:
- 大量節點性能測試
- 動態節點生成
- 性能最佳化設定
- 虛擬化渲染

## 狀態管理範例

### 1. SaveRestore - 儲存和恢復狀態

**位置**: `src/examples/SaveRestore/`

**功能**: 展示如何儲存和恢復流程狀態。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  type OnConnect,
} from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

export default function SaveRestore() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const { toObject, setViewport } = useReactFlow();

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const onSave = useCallback(() => {
    const flow = toObject();
    localStorage.setItem('flow', JSON.stringify(flow));
    console.log('Flow saved:', flow);
  }, [toObject]);

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      const flow = JSON.parse(localStorage.getItem('flow') || '{}');

      if (flow && flow.nodes) {
        setNodes(flow.nodes);
        setEdges(flow.edges);
        setViewport(flow.viewport);
      }
    };

    restoreFlow();
  }, [setNodes, setEdges, setViewport]);

  const onReset = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setViewport({ x: 0, y: 0, zoom: 1 });
  }, [setNodes, setEdges, setViewport]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      
      <div className="save-restore-controls">
        <button onClick={onSave}>Save</button>
        <button onClick={onRestore}>Restore</button>
        <button onClick={onReset}>Reset</button>
      </div>
    </div>
  );
}
```

**學習重點**:
- 流程狀態序列化
- 本地儲存整合
- 狀態恢復功能
- 視窗狀態管理

### 2. Redux - Redux 狀態管理

**位置**: `src/examples/Redux/`

**功能**: 展示如何使用 Redux 管理 React Flow 狀態。

**實作細節**:
```typescript
import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  type OnConnect,
  type OnNodesChange,
  type OnEdgesChange,
} from '@xyflow/react';
import { createSlice, configureStore } from '@reduxjs/toolkit';

// Redux slice
const flowSlice = createSlice({
  name: 'flow',
  initialState: {
    nodes: [
      { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
      { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
    ],
    edges: [
      { id: 'e1-2', source: '1', target: '2' },
    ],
  },
  reducers: {
    updateNodes: (state, action) => {
      state.nodes = applyNodeChanges(action.payload, state.nodes);
    },
    updateEdges: (state, action) => {
      state.edges = applyEdgeChanges(action.payload, state.edges);
    },
    addEdge: (state, action) => {
      state.edges = addEdge(action.payload, state.edges);
    },
  },
});

const { updateNodes, updateEdges, addEdge: addEdgeAction } = flowSlice.actions;

// Store
const store = configureStore({
  reducer: {
    flow: flowSlice.reducer,
  },
});

function ReduxFlow() {
  const nodes = useSelector((state: any) => state.flow.nodes);
  const edges = useSelector((state: any) => state.flow.edges);
  const dispatch = useDispatch();

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => dispatch(updateNodes(changes)),
    [dispatch]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => dispatch(updateEdges(changes)),
    [dispatch]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => dispatch(addEdgeAction(connection)),
    [dispatch]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}

export default function ReduxExample() {
  return (
    <Provider store={store}>
      <ReduxFlow />
    </Provider>
  );
}
```

**學習重點**:
- Redux 狀態管理整合
- Redux Toolkit 使用
- 狀態變更處理
- 全域狀態管理

## 特殊功能範例

### 1. A11y - 無障礙功能

**位置**: `src/examples/A11y/`

**功能**: 展示無障礙功能的實作。

**實作細節**:
```typescript
import { useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type Node,
  type Edge,
} from '@xyflow/react';

const initialNodes: Node[] = [
  {
    id: '1',
    position: { x: 100, y: 100 },
    data: { label: 'Node 1' },
    ariaLabel: 'Node 1 - Input node with connections',
  },
  {
    id: '2',
    position: { x: 300, y: 100 },
    data: { label: 'Node 2' },
    ariaLabel: 'Node 2 - Processing node',
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    ariaLabel: 'Connection from Node 1 to Node 2',
  },
];

export default function A11y() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodesFocusable={true}
        edgesFocusable={true}
        disableKeyboardA11y={false}
        ariaLabel="Interactive flow diagram"
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}
```

**學習重點**:
- 無障礙屬性設定
- 鍵盤導航支援
- 螢幕閱讀器支援
- ARIA 標籤使用

### 2. Hidden - 隱藏節點功能

**位置**: `src/examples/Hidden/`

**功能**: 展示節點和邊線的隱藏功能。

**實作細節**:
```typescript
import { useState, useCallback } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
} from '@xyflow/react';

const initialNodes = [
  { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
  { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } },
  { id: '3', position: { x: 500, y: 100 }, data: { label: 'Node 3' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

export default function Hidden() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  );

  const toggleNodeVisibility = useCallback((nodeId: string) => {
    setNodes((nodes) =>
      nodes.map((node) =>
        node.id === nodeId ? { ...node, hidden: !node.hidden } : node
      )
    );
  }, [setNodes]);

  const toggleEdgeVisibility = useCallback((edgeId: string) => {
    setEdges((edges) =>
      edges.map((edge) =>
        edge.id === edgeId ? { ...edge, hidden: !edge.hidden } : edge
      )
    );
  }, [setEdges]);

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
      
      <div className="visibility-controls">
        <h3>Toggle Visibility</h3>
        <div>
          <button onClick={() => toggleNodeVisibility('1')}>
            Toggle Node 1
          </button>
          <button onClick={() => toggleNodeVisibility('2')}>
            Toggle Node 2
          </button>
          <button onClick={() => toggleNodeVisibility('3')}>
            Toggle Node 3
          </button>
        </div>
        <div>
          <button onClick={() => toggleEdgeVisibility('e1-2')}>
            Toggle Edge 1-2
          </button>
          <button onClick={() => toggleEdgeVisibility('e2-3')}>
            Toggle Edge 2-3
          </button>
        </div>
      </div>
    </div>
  );
}
```

**學習重點**:
- 節點隱藏功能
- 邊線隱藏功能
- 動態顯示控制
- 可見性狀態管理

## 測試架構

### Cypress 測試結構

```
cypress/
├── components/              # 組件測試
│   ├── hooks/              # Hook 測試
│   │   ├── useConnection.cy.ts
│   │   ├── useKeyPress.cy.ts
│   │   └── useReactFlow.cy.ts
│   ├── reactflow/          # ReactFlow 組件測試
│   │   ├── ReactFlow.cy.ts
│   │   ├── Controls.cy.ts
│   │   └── Background.cy.ts
│   └── utils/              # 工具函數測試
├── e2e/                    # E2E 測試
│   ├── basic-flow.cy.ts
│   ├── drag-and-drop.cy.ts
│   └── custom-nodes.cy.ts
└── support/                # 測試支援檔案
    ├── commands.ts
    └── component.ts
```

### 測試範例

```typescript
// cypress/e2e/basic-flow.cy.ts
describe('Basic Flow', () => {
  beforeEach(() => {
    cy.visit('/basic');
  });

  it('should render nodes and edges', () => {
    cy.get('[data-testid="rf__node-1"]').should('be.visible');
    cy.get('[data-testid="rf__node-2"]').should('be.visible');
    cy.get('[data-testid="rf__edge-e1-2"]').should('be.visible');
  });

  it('should allow node dragging', () => {
    cy.get('[data-testid="rf__node-1"]')
      .trigger('mousedown', { button: 0 })
      .trigger('mousemove', { clientX: 200, clientY: 200 })
      .trigger('mouseup');
    
    cy.get('[data-testid="rf__node-1"]')
      .should('have.css', 'transform')
      .and('include', 'translate(200px, 200px)');
  });

  it('should connect nodes', () => {
    cy.get('[data-testid="rf__handle-1-source"]')
      .trigger('mousedown', { button: 0 })
      .trigger('mousemove', { clientX: 400, clientY: 100 })
      .trigger('mouseup');
    
    cy.get('[data-testid^="rf__edge-"]').should('have.length', 2);
  });
});
```

## 總結

React Flow 範例專案展示了完整的流程圖庫功能：

### 核心特性
- **57 個完整範例**，涵蓋所有主要功能
- **模組化架構**，易於學習和擴展
- **完整的 TypeScript 支援**
- **豐富的測試覆蓋**

### 主要功能類別
- 基礎功能（4個範例）
- 自訂元件（8個範例）
- 互動功能（12個範例）
- Hook 系統（12個範例）
- 佈局樣式（6個範例）
- 進階功能（8個範例）
- 狀態管理（6個範例）
- 特殊功能（5個範例）

### 技術亮點
- 現代 React 開發模式
- 完整的 Hook 系統
- 豐富的自訂能力
- 優秀的性能表現
- 無障礙功能支援

這些範例為開發者提供了全面的學習資源，也為 Angular 版本的開發提供了完整的功能參考。