import { 
  Component, 
  signal, 
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * 簡化版 Angular Basic 範例
 * 基本的節點和邊線展示，不依賴複雜的組件
 */
@Component({
  selector: 'simple-basic-example',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="simple-flow-container">
      <h1>Angular XYFlow - Simple Basic Example</h1>
      <p>This is a simplified basic example showing basic functionality</p>
      
      <!-- 控制面板 -->
      <div class="control-panel">
        <button (click)="addNode()">Add Node</button>
        <button (click)="resetNodes()">Reset Nodes</button>
        <button (click)="logData()">Log Data</button>
      </div>
      
      <!-- 簡單的節點渲染區域 -->
      <div class="simple-flow" [style.position]="'relative'" 
           [style.width]="'100%'" [style.height]="'400px'"
           [style.border]="'1px solid #ddd'" [style.background]="'#f9f9f9'">
        
        <!-- 渲染節點 -->
        @for (node of nodes(); track node.id) {
          <div class="simple-node" 
               [style.position]="'absolute'"
               [style.left.px]="node.position.x"
               [style.top.px]="node.position.y"
               [style.background]="node.className === 'light' ? '#fff' : '#333'"
               [style.color]="node.className === 'light' ? '#333' : '#fff'"
               [style.border]="'1px solid #ddd'"
               [style.border-radius]="'4px'"
               [style.padding]="'8px 12px'"
               [style.cursor]="'pointer'"
               [class.selected]="node.selected"
               (click)="selectNode(node.id)"
               (mousedown)="startDrag(node.id, $event)">
            {{ node.data.label }}
          </div>
        }
        
        <!-- 簡單的邊線 SVG -->
        <svg [style.position]="'absolute'" [style.top]="'0'" [style.left]="'0'"
             [style.width]="'100%'" [style.height]="'100%'" [style.pointer-events]="'none'">
          @for (edge of edges(); track edge.id) {
            <line 
              [attr.x1]="getNodeCenter(edge.source).x"
              [attr.y1]="getNodeCenter(edge.source).y"
              [attr.x2]="getNodeCenter(edge.target).x"
              [attr.y2]="getNodeCenter(edge.target).y"
              [attr.stroke]="edge.animated ? '#007acc' : '#999'"
              [attr.stroke-width]="edge.animated ? '2' : '1'"
              [attr.stroke-dasharray]="edge.animated ? '5,5' : 'none'"
            />
          }
        </svg>
      </div>
      
      <!-- 數據顯示 -->
      <div class="data-display">
        <h3>Current State:</h3>
        <pre>{{ stateDisplay() }}</pre>
      </div>
    </div>
  `,
  styles: [`
    .simple-flow-container {
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif;
    }
    
    .control-panel {
      margin-bottom: 20px;
    }
    
    .control-panel button {
      margin-right: 10px;
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: #fff;
      border-radius: 4px;
      cursor: pointer;
    }
    
    .control-panel button:hover {
      background: #f0f0f0;
    }
    
    .simple-flow {
      overflow: hidden;
    }
    
    .simple-node {
      user-select: none;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      transition: box-shadow 0.2s;
    }
    
    .simple-node:hover {
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    }
    
    .simple-node.selected {
      box-shadow: 0 0 0 2px #007acc !important;
    }
    
    .data-display {
      margin-top: 20px;
      padding: 10px;
      background: #f5f5f5;
      border-radius: 4px;
    }
    
    .data-display pre {
      margin: 0;
      font-size: 12px;
      overflow: auto;
    }
    
    svg line {
      transition: stroke 0.2s;
    }
  `]
})
export class SimpleBasicExample {
  // 基本節點數據
  private initialNodes = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 50, y: 50 },
      className: 'light',
      selected: false
    },
    {
      id: '2',
      data: { label: 'Node 2' },
      position: { x: 200, y: 100 },
      className: 'light',
      selected: false
    },
    {
      id: '3',
      data: { label: 'Node 3' },
      position: { x: 350, y: 50 },
      className: 'light',
      selected: false
    }
  ];

  private initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3', animated: false }
  ];

  // 信號狀態
  public nodes = signal(this.initialNodes);
  public edges = signal(this.initialEdges);
  
  // 計算狀態
  public stateDisplay = computed(() => {
    return JSON.stringify({
      nodes: this.nodes().length,
      edges: this.edges().length,
      selected: this.nodes().filter(n => n.selected).length
    }, null, 2);
  });

  // 拖拽相關
  private isDragging = false;
  private dragNodeId: string | null = null;
  private dragOffset = { x: 0, y: 0 };

  constructor() {
    // 添加全局事件監聽器
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
  }

  // 節點操作
  public addNode() {
    const newNode = {
      id: `node-${Math.random().toString(36).substr(2, 9)}`,
      data: { label: `Node ${this.nodes().length + 1}` },
      position: { 
        x: Math.random() * 300 + 50, 
        y: Math.random() * 200 + 50 
      },
      className: 'light',
      selected: false
    };
    
    this.nodes.update(nodes => [...nodes, newNode]);
  }

  public resetNodes() {
    this.nodes.set([...this.initialNodes]);
    this.edges.set([...this.initialEdges]);
  }

  public logData() {
    console.log('Current Flow State:', {
      nodes: this.nodes(),
      edges: this.edges()
    });
  }

  public selectNode(nodeId: string) {
    if (this.isDragging) return;
    
    this.nodes.update(nodes => 
      nodes.map(node => ({
        ...node,
        selected: node.id === nodeId ? !node.selected : false
      }))
    );
  }

  // 拖拽功能
  public startDrag(nodeId: string, event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const node = this.nodes().find(n => n.id === nodeId);
    if (!node) return;
    
    this.isDragging = true;
    this.dragNodeId = nodeId;
    this.dragOffset = {
      x: event.clientX - node.position.x,
      y: event.clientY - node.position.y
    };
  }

  private handleMouseMove(event: MouseEvent) {
    if (!this.isDragging || !this.dragNodeId) return;
    
    const newX = event.clientX - this.dragOffset.x;
    const newY = event.clientY - this.dragOffset.y;
    
    this.nodes.update(nodes =>
      nodes.map(node => 
        node.id === this.dragNodeId 
          ? { ...node, position: { x: newX, y: newY } }
          : node
      )
    );
  }

  private handleMouseUp() {
    this.isDragging = false;
    this.dragNodeId = null;
  }

  // 輔助方法
  public getNodeCenter(nodeId: string) {
    const node = this.nodes().find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };
    
    return {
      x: node.position.x + 40, // 節點寬度的一半
      y: node.position.y + 20  // 節點高度的一半
    };
  }
}