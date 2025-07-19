# Angular Flow - Angular v20 實現的 React Flow

Angular Flow 是 React Flow 的 Angular v20 實現，提供完整的節點編輯器功能，包含所有 React Flow 的核心功能，並使用最新的 Angular v20 特性。

## 🚀 特性

### 核心功能
- ✅ **完整的節點系統** - 支援所有節點類型（default, input, output）和自訂節點
- ✅ **完整的邊緣系統** - 支援所有邊緣類型（bezier, straight, step, smoothstep, simplebezier）
- ✅ **拖放支援** - 節點拖曳、畫布平移、連線建立
- ✅ **縮放功能** - 滾輪縮放、雙擊縮放、觸控縮放
- ✅ **選取功能** - 單選、多選、框選
- ✅ **附加組件** - Background, Controls, MiniMap, NodeToolbar, NodeResizer

### Angular v20 特性
- 🎯 **Signals API** - 使用 Angular Signals 進行狀態管理
- 🎯 **Standalone Components** - 所有組件都是獨立組件
- 🎯 **新控制流程** - 使用 @if, @for, @switch 語法
- 🎯 **Signal Inputs/Outputs** - 使用 input() 和 output() 函數
- 🎯 **OnPush 變更檢測** - 優化性能

### 進階功能
- 🔥 **性能優化** - 虛擬化渲染、批次更新、視口優化
- ♿ **無障礙支援** - 完整的鍵盤導航、螢幕閱讀器支援、ARIA 標籤
- 🎨 **主題支援** - 自訂樣式、高對比模式、色盲模式
- 📱 **響應式設計** - 支援觸控操作、手機和平板適配

## 📦 安裝

```bash
# 克隆專案
git clone https://github.com/xyflow/xyflow.git
cd xyflow/examples/angular-xyflow

# 安裝依賴
pnpm install

# 啟動開發伺服器
pnpm dev
```

## 🔧 使用方法

### 基本使用

```typescript
import { Component } from '@angular/core';
import { AngularFlow } from './components/angular-flow/angular-flow';
import { Node, Edge } from './types';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [AngularFlow],
  template: `
    <angular-flow
      [nodes]="nodes"
      [edges]="edges"
      [fitView]="true"
      (onNodesChange)="handleNodesChange($event)"
      (onEdgesChange)="handleEdgesChange($event)"
    />
  `
})
export class ExampleComponent {
  nodes: Node[] = [
    { id: '1', position: { x: 100, y: 100 }, data: { label: 'Node 1' } },
    { id: '2', position: { x: 300, y: 100 }, data: { label: 'Node 2' } }
  ];
  
  edges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' }
  ];
  
  handleNodesChange(changes: NodeChange[]) {
    // 處理節點變更
  }
  
  handleEdgesChange(changes: EdgeChange[]) {
    // 處理邊緣變更
  }
}
```

### 自訂節點

```typescript
import { Component } from '@angular/core';
import { NodeComponent } from './components/nodes/node-wrapper/node-wrapper';

@Component({
  selector: 'custom-node',
  standalone: true,
  template: `
    <div class="custom-node">
      <handle type="target" position="left" />
      <div>{{ data.label }}</div>
      <handle type="source" position="right" />
    </div>
  `
})
export class CustomNodeComponent implements NodeComponent {
  data: any;
  selected: boolean = false;
  node!: Node;
}

// 註冊自訂節點
const nodeTypes = {
  custom: CustomNodeComponent
};
```

### 使用附加組件

```typescript
@Component({
  template: `
    <angular-flow [nodes]="nodes" [edges]="edges">
      <controls />
      <minimap />
      <background variant="dots" />
      <node-toolbar />
      <node-resizer />
    </angular-flow>
  `
})
export class ExampleComponent {
  // ...
}
```

## 📚 範例

專案包含多個範例展示不同功能：

### 基礎範例
- **BasicExample** - 基本的節點和邊緣操作
- **EmptyExample** - 空白畫布開始
- **CustomNodeExample** - 自訂節點實現

### 進階範例
- **DragDropExample** - 拖放節點到畫布
- **ValidationExample** - 節點和連線驗證
- **LayoutExample** - 自動佈局演算法
- **PerformanceExample** - 性能優化和無障礙功能

## 核心概念

### 節點 (Nodes)

節點是流程圖的基本組成單位，每個節點都有唯一的 ID 和位置。

```typescript
interface Node {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  style?: Record<string, any>;
  className?: string;
  // ... 其他屬性
}
```

### 邊緣 (Edges)

邊緣連接兩個節點，定義了流程的方向。

```typescript
interface Edge {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  style?: Record<string, any>;
  // ... 其他屬性
}
```

## 基本用法

### 1. 導入組件

```typescript
import { Component, signal } from '@angular/core';
import { AngularFlow } from './components/angular-flow/angular-flow';
import { Node, Edge } from './types';

@Component({
  selector: 'app-demo',
  imports: [AngularFlow],
  template: `
    <angular-flow
      [nodes]="nodes()"
      [edges]="edges()"
      [nodesDraggable]="true"
      [nodesConnectable]="true"
      [elementsSelectable]="true"
      (onNodeClick)="onNodeClick($event)"
      (onEdgeClick)="onEdgeClick($event)"
      (onConnect)="onConnect($event)"
      [style]="{ height: '600px' }"
    />
  `
})
export class DemoComponent {
  nodes = signal<Node[]>([
    {
      id: '1',
      type: 'input',
      position: { x: 100, y: 100 },
      data: { label: 'Input Node' }
    },
    {
      id: '2',
      type: 'default',
      position: { x: 300, y: 100 },
      data: { label: 'Default Node' }
    }
  ]);

  edges = signal<Edge[]>([
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      type: 'default'
    }
  ]);

  onNodeClick(event: { event: MouseEvent; node: Node }) {
    console.log('Node clicked:', event.node);
  }

  onEdgeClick(event: { event: MouseEvent; edge: Edge }) {
    console.log('Edge clicked:', event.edge);
  }

  onConnect(connection: Connection) {
    console.log('Connection made:', connection);
  }
}
```

### 2. 動態操作

```typescript
export class DemoComponent {
  // 添加節點
  addNode() {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 300 },
      data: { label: 'New Node' }
    };
    
    this.nodes.update(nodes => [...nodes, newNode]);
  }

  // 添加邊緣
  addEdge() {
    const newEdge: Edge = {
      id: `edge-${Date.now()}`,
      source: 'node1',
      target: 'node2',
      type: 'default'
    };
    
    this.edges.update(edges => [...edges, newEdge]);
  }

  // 更新節點
  updateNode(nodeId: string, updates: Partial<Node>) {
    this.nodes.update(nodes => 
      nodes.map(node => 
        node.id === nodeId ? { ...node, ...updates } : node
      )
    );
  }

  // 刪除節點
  deleteNode(nodeId: string) {
    this.nodes.update(nodes => nodes.filter(node => node.id !== nodeId));
    this.edges.update(edges => 
      edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
    );
  }
}
```

## 組件 API

### AngularFlow 組件

#### 輸入屬性 (Input Properties)

| 屬性 | 類型 | 預設值 | 描述 |
|------|------|--------|------|
| `nodes` | `Node[]` | `[]` | 節點陣列 |
| `edges` | `Edge[]` | `[]` | 邊緣陣列 |
| `defaultNodes` | `Node[]` | `[]` | 預設節點陣列 |
| `defaultEdges` | `Edge[]` | `[]` | 預設邊緣陣列 |
| `nodesDraggable` | `boolean` | `true` | 節點是否可拖拽 |
| `nodesConnectable` | `boolean` | `true` | 節點是否可連接 |
| `elementsSelectable` | `boolean` | `true` | 元素是否可選取 |
| `panOnDrag` | `boolean` | `true` | 是否可拖拽平移 |
| `zoomOnScroll` | `boolean` | `true` | 是否可滾輪縮放 |
| `zoomOnPinch` | `boolean` | `true` | 是否可手勢縮放 |
| `zoomOnDoubleClick` | `boolean` | `true` | 是否可雙擊縮放 |
| `minZoom` | `number` | `0.5` | 最小縮放比例 |
| `maxZoom` | `number` | `2` | 最大縮放比例 |
| `fitView` | `boolean` | `false` | 是否適應視圖 |
| `className` | `string` | `''` | 自訂 CSS 類名 |
| `style` | `Record<string, any>` | `{}` | 自訂樣式 |

#### 輸出事件 (Output Events)

| 事件 | 參數類型 | 描述 |
|------|----------|------|
| `onNodesChange` | `NodeChange[]` | 節點變更時觸發 |
| `onEdgesChange` | `EdgeChange[]` | 邊緣變更時觸發 |
| `onConnect` | `Connection` | 建立新連接時觸發 |
| `onInit` | `void` | 組件初始化時觸發 |
| `onViewportChange` | `Viewport` | 視圖變更時觸發 |
| `onNodeClick` | `{ event: MouseEvent; node: Node }` | 節點點擊時觸發 |
| `onNodeDoubleClick` | `{ event: MouseEvent; node: Node }` | 節點雙擊時觸發 |
| `onNodeDragStart` | `{ event: MouseEvent; node: Node }` | 節點拖拽開始時觸發 |
| `onNodeDrag` | `{ event: MouseEvent; node: Node }` | 節點拖拽時觸發 |
| `onNodeDragStop` | `{ event: MouseEvent; node: Node }` | 節點拖拽結束時觸發 |
| `onEdgeClick` | `{ event: MouseEvent; edge: Edge }` | 邊緣點擊時觸發 |
| `onEdgeDoubleClick` | `{ event: MouseEvent; edge: Edge }` | 邊緣雙擊時觸發 |
| `onPaneClick` | `MouseEvent` | 畫布點擊時觸發 |
| `onPaneContextMenu` | `MouseEvent` | 畫布右鍵時觸發 |

#### 公開方法 (Public Methods)

| 方法 | 參數 | 返回值 | 描述 |
|------|------|--------|------|
| `addNode` | `node: Node` | `void` | 添加節點 |
| `addEdge` | `edge: Edge` | `void` | 添加邊緣 |
| `deleteNode` | `nodeId: string` | `void` | 刪除節點 |
| `deleteEdge` | `edgeId: string` | `void` | 刪除邊緣 |
| `setViewport` | `viewport: Viewport` | `void` | 設定視圖 |
| `fitViewport` | - | `void` | 適應視圖 |
| `zoomIn` | - | `void` | 放大 |
| `zoomOut` | - | `void` | 縮小 |
| `zoomTo` | `zoom: number` | `void` | 縮放到指定比例 |
| `panTo` | `x: number, y: number` | `void` | 平移到指定位置 |
| `centerView` | - | `void` | 居中視圖 |
| `getNodes` | - | `Node[]` | 獲取所有節點 |
| `getEdges` | - | `Edge[]` | 獲取所有邊緣 |
| `getNode` | `nodeId: string` | `Node \| undefined` | 獲取指定節點 |
| `getEdge` | `edgeId: string` | `Edge \| undefined` | 獲取指定邊緣 |

## 節點類型

### 內建節點類型

1. **Input Node** (`type: 'input'`)
   - 只有輸出連接點
   - 適用於流程的起始點

2. **Output Node** (`type: 'output'`)
   - 只有輸入連接點
   - 適用於流程的結束點

3. **Default Node** (`type: 'default'`)
   - 同時有輸入和輸出連接點
   - 適用於一般的處理節點

4. **Group Node** (`type: 'group'`)
   - 可包含其他節點的群組節點
   - 適用於組織和分組

### 自訂節點

```typescript
// 自訂節點類型
interface CustomNode extends Node {
  type: 'custom';
  data: {
    title: string;
    description: string;
    value: number;
  };
}

// 在組件中使用
const customNode: CustomNode = {
  id: 'custom-1',
  type: 'custom',
  position: { x: 100, y: 100 },
  data: {
    title: 'Custom Node',
    description: 'This is a custom node',
    value: 42
  }
};
```

## 邊緣類型

### 內建邊緣類型

1. **Default Edge** (`type: 'default'`)
   - 貝茲曲線連接
   - 預設的連接類型

2. **Straight Edge** (`type: 'straight'`)
   - 直線連接
   - 適用於簡單的流程

3. **Step Edge** (`type: 'step'`)
   - 階梯式連接
   - 適用於有層次的流程

4. **Smooth Step Edge** (`type: 'smoothstep'`)
   - 平滑階梯式連接
   - 美觀的層次連接

5. **Simple Bezier Edge** (`type: 'simplebezier'`)
   - 簡單貝茲曲線
   - 輕量級的曲線連接

## 樣式自訂

### 節點樣式

```typescript
const styledNode: Node = {
  id: 'styled-node',
  type: 'default',
  position: { x: 100, y: 100 },
  data: { label: 'Styled Node' },
  style: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: '2px solid #ee5a5a',
    borderRadius: '10px',
    padding: '15px'
  },
  className: 'my-custom-node'
};
```

### 邊緣樣式

```typescript
const styledEdge: Edge = {
  id: 'styled-edge',
  source: 'node1',
  target: 'node2',
  type: 'default',
  label: 'Styled Edge',
  style: {
    stroke: '#ff6b6b',
    strokeWidth: 3
  },
  labelStyle: {
    fill: '#ff6b6b',
    fontSize: '14px',
    fontWeight: 'bold'
  }
};
```

### 全域樣式

```scss
// 自訂全域樣式
.angular-flow {
  background: #f5f5f5;
  
  .angular-flow__node {
    &.my-custom-node {
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      
      &:hover {
        transform: scale(1.05);
      }
    }
  }
  
  .angular-flow__edge {
    &.my-custom-edge {
      stroke-dasharray: 5, 5;
      animation: dash 1s linear infinite;
    }
  }
}

@keyframes dash {
  to {
    stroke-dashoffset: -10;
  }
}
```

## 事件處理

### 節點事件

```typescript
export class FlowComponent {
  onNodeClick(event: { event: MouseEvent; node: Node }) {
    console.log('Node clicked:', event.node);
    
    // 選中節點
    this.selectNode(event.node.id);
    
    // 阻止事件冒泡
    event.event.stopPropagation();
  }

  onNodeDoubleClick(event: { event: MouseEvent; node: Node }) {
    console.log('Node double clicked:', event.node);
    
    // 編輯節點
    this.editNode(event.node.id);
  }

  onNodeDragStart(event: { event: MouseEvent; node: Node }) {
    console.log('Node drag started:', event.node);
    
    // 開始拖拽時的邏輯
    this.dragStartPosition = event.node.position;
  }

  onNodeDragStop(event: { event: MouseEvent; node: Node }) {
    console.log('Node drag stopped:', event.node);
    
    // 結束拖拽時的邏輯
    this.saveDragPosition(event.node);
  }
}
```

### 邊緣事件

```typescript
export class FlowComponent {
  onEdgeClick(event: { event: MouseEvent; edge: Edge }) {
    console.log('Edge clicked:', event.edge);
    
    // 選中邊緣
    this.selectEdge(event.edge.id);
  }

  onEdgeDoubleClick(event: { event: MouseEvent; edge: Edge }) {
    console.log('Edge double clicked:', event.edge);
    
    // 編輯邊緣標籤
    this.editEdgeLabel(event.edge.id);
  }
}
```

### 連接事件

```typescript
export class FlowComponent {
  onConnect(connection: Connection) {
    console.log('Connection made:', connection);
    
    // 驗證連接
    if (this.isValidConnection(connection)) {
      // 創建新邊緣
      const newEdge: Edge = {
        id: `${connection.source}-${connection.target}`,
        source: connection.source,
        target: connection.target,
        type: 'default'
      };
      
      this.edges.update(edges => [...edges, newEdge]);
    }
  }

  private isValidConnection(connection: Connection): boolean {
    // 自訂連接驗證邏輯
    const sourceNode = this.getNode(connection.source);
    const targetNode = this.getNode(connection.target);
    
    return sourceNode && targetNode && sourceNode.id !== targetNode.id;
  }
}
```

## 進階功能

### 狀態管理

```typescript
// 使用 Angular Flow Store
import { inject } from '@angular/core';
import { AngularFlowStore } from './services/angular-flow-store';

export class FlowComponent {
  private store = inject(AngularFlowStore);

  // 訂閱狀態變化
  selectedNodes = this.store.selectedNodes;
  selectedEdges = this.store.selectedEdges;
  viewport = this.store.viewport;
  
  // 操作狀態
  selectNode(nodeId: string) {
    this.store.selectNode(nodeId);
  }
  
  unselectAll() {
    this.store.unselectAll();
  }
  
  setViewport(viewport: Viewport) {
    this.store.setViewport(viewport);
  }
}
```

### 鍵盤快捷鍵

```typescript
export class FlowComponent {
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    switch (event.key) {
      case 'Delete':
        this.deleteSelected();
        break;
      case 'Escape':
        this.unselectAll();
        break;
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          this.selectAll();
        }
        break;
    }
  }
  
  private deleteSelected() {
    this.store.selectedNodes().forEach(node => {
      this.store.deleteNode(node.id);
    });
    
    this.store.selectedEdges().forEach(edge => {
      this.store.deleteEdge(edge.id);
    });
  }
  
  private selectAll() {
    this.store.nodes().forEach(node => {
      this.store.selectNode(node.id);
    });
  }
}
```

## 最佳實踐

### 1. 性能優化

```typescript
// 使用 OnPush 變更偵測策略
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FlowComponent {
  // 使用 trackBy 函數優化 *ngFor
  trackByNodeId(index: number, node: Node): string {
    return node.id;
  }
  
  trackByEdgeId(index: number, edge: Edge): string {
    return edge.id;
  }
}
```

### 2. 記憶體管理

```typescript
export class FlowComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    
    // 清理 store
    this.store.reset();
  }
}
```

### 3. 類型安全

```typescript
// 定義強類型的節點和邊緣
interface MyNode extends Node {
  data: {
    title: string;
    value: number;
    isActive: boolean;
  };
}

interface MyEdge extends Edge {
  data: {
    weight: number;
    isVisible: boolean;
  };
}

// 使用泛型組件
export class FlowComponent {
  nodes = signal<MyNode[]>([]);
  edges = signal<MyEdge[]>([]);
}
```

## 故障排除

### 常見問題

1. **節點不顯示**
   - 檢查節點是否有有效的 `id` 和 `position`
   - 確保組件已正確導入 `AngularFlow`

2. **邊緣不渲染**
   - 驗證 `source` 和 `target` 節點是否存在
   - 檢查邊緣的 `id` 是否唯一

3. **拖拽不工作**
   - 確認 `nodesDraggable` 設為 `true`
   - 檢查是否有 CSS 覆蓋了 `pointer-events`

4. **性能問題**
   - 使用 `trackBy` 函數優化渲染
   - 考慮實作虛擬滾動

### 除錯技巧

```typescript
// 啟用除錯模式
export class FlowComponent {
  debugMode = true;
  
  onNodeClick(event: { event: MouseEvent; node: Node }) {
    if (this.debugMode) {
      console.log('Node clicked:', event.node);
      console.log('Store state:', this.store.nodes());
    }
  }
}
```

## 🎯 性能優化

### 虛擬化渲染
對於大量節點（>100），自動啟用虛擬化渲染：

```typescript
performanceManager.updateConfig({
  enableVirtualization: true,
  virtualizeThreshold: 100
});
```

### 批次更新
批次處理多個更新以提高性能：

```typescript
performanceManager.updateConfig({
  batchUpdates: true,
  batchInterval: 16 // ~60fps
});
```

## ♿ 無障礙功能

### 鍵盤導航
- **方向鍵** - 在節點間導航
- **Enter** - 選取節點
- **Delete** - 刪除選中的節點或邊緣
- **Ctrl+Z/Y** - 復原/重做

### 螢幕閱讀器
所有元素都有適當的 ARIA 標籤和角色：

```typescript
accessibilityManager.updateConfig({
  enableScreenReaderSupport: true,
  announceChanges: true,
  verbosityLevel: 'normal'
});
```

### 色盲模式
支援多種色盲模式：

```typescript
accessibilityManager.updateConfig({
  colorBlindMode: 'protanopia' // 或 'deuteranopia', 'tritanopia', 'achromatopsia'
});
```

## 📋 專案結構

```
angular-xyflow/
├── src/
│   ├── app/
│   │   ├── components/        # 核心組件
│   │   │   ├── angular-flow/  # 主組件
│   │   │   ├── nodes/         # 節點相關組件
│   │   │   ├── edges/         # 邊緣相關組件
│   │   │   ├── handle/        # 連接點組件
│   │   │   ├── background/    # 背景組件
│   │   │   ├── controls/      # 控制組件
│   │   │   ├── minimap/       # 小地圖組件
│   │   │   ├── node-toolbar/  # 節點工具列
│   │   │   └── node-resizer/  # 節點調整器
│   │   ├── services/          # 服務層
│   │   │   ├── angular-flow-store.ts    # 狀態管理
│   │   │   ├── performance-manager.ts   # 性能優化
│   │   │   └── accessibility-manager.ts # 無障礙支援
│   │   ├── types/             # 類型定義
│   │   ├── utils/             # 工具函數
│   │   └── examples/          # 範例組件
│   └── styles.scss            # 全域樣式
├── public/                    # 靜態資源
├── angular.json              # Angular 配置
├── package.json              # 專案依賴
└── README.md                 # 本文件
```

## 🤝 貢獻

歡迎貢獻！請遵循以下步驟：

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📝 授權

本專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 文件。

## 🙏 致謝

- [React Flow](https://reactflow.dev/) - 原始 React 實現
- [Angular 團隊](https://angular.io/) - Angular 框架
- 所有貢獻者和使用者

## 📞 聯絡

如有問題或建議，請：
- 開啟 [Issue](https://github.com/xyflow/xyflow/issues)
- 查看 [Discussions](https://github.com/xyflow/xyflow/discussions)
- 訪問 [官方網站](https://xyflow.com)

---

用 ❤️ 和 Angular v20 打造