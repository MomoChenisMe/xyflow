import { 
  Component, 
  input,
  output,
  computed,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Node } from '../../../types/node';
import { NodeWrapperComponent } from '../../components/NodeWrapper/node-wrapper.component';

/**
 * NodeRenderer 組件
 * 對應 React Flow 的 NodeRenderer 組件
 * 負責渲染和管理所有節點
 */
@Component({
  selector: 'angular-node-renderer',
  standalone: true,
  imports: [CommonModule, NodeWrapperComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div 
      class="xy-flow__nodes"
      style="transform-origin: 0 0; position: absolute; width: 100%; height: 100%;"
    >
      @for (node of visibleNodes(); track node.id; let index = $index) {
        <angular-node-wrapper
          [node]="node"
          [index]="index"
          [viewport]="viewport()"
          [multiSelectionKeyCode]="multiSelectionKeyCode()"
          [isDraggable]="getNodeDraggable(node)"
          [isSelectable]="getNodeSelectable(node)"
          [isConnectable]="getNodeConnectable(node)"
          (onNodeClick)="handleNodeClick($event)"
          (onNodeDragStart)="handleNodeDragStart($event)"
          (onNodeDrag)="handleNodeDrag($event)"
          (onNodeDragStop)="handleNodeDragStop($event)"
          (onNodePositionChange)="handleNodePositionChange($event)"
          (onConnectionStart)="onConnectionStart.emit($event)"
          (onConnectionEnd)="onConnectionEnd.emit($event)"
        />
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class NodeRendererComponent {
  // === 輸入屬性 ===
  
  public nodes = input.required<Node[]>();
  public viewport = input.required<{ x: number; y: number; zoom: number }>();
  public multiSelectionKeyCode = input<string>('Meta');
  public onlyRenderVisibleElements = input<boolean>(false);
  public nodesDraggable = input<boolean>(true);
  public nodesSelectable = input<boolean>(true);
  public nodesConnectable = input<boolean>(true);
  
  // === 事件輸出 ===
  
  public onNodesChange = output<Node[]>();
  public onNodeClick = output<{ event: MouseEvent; node: Node }>();
  public onNodeDragStart = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onNodeDrag = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onNodeDragStop = output<{ event: MouseEvent; node: Node; nodes: Node[] }>();
  public onConnect = output<{ source: string; target: string; sourceHandle?: string; targetHandle?: string }>();
  public onConnectionStart = output<{ nodeId: string; handleType: string; position: { x: number; y: number } }>();
  public onConnectionEnd = output<{ nodeId: string | null; handleType: string | null }>();
  public onNodePositionChange = output<{ node: Node; position: { x: number; y: number } }>();
  
  // === 計算屬性 ===
  
  // 只渲染可見的節點（優化性能）
  public visibleNodes = computed(() => {
    const allNodes = this.nodes();
    
    if (!this.onlyRenderVisibleElements()) {
      return allNodes;
    }
    
    const viewport = this.viewport();
    const viewportBounds = {
      x: -viewport.x / viewport.zoom,
      y: -viewport.y / viewport.zoom,
      width: window.innerWidth / viewport.zoom,
      height: window.innerHeight / viewport.zoom
    };
    
    return allNodes.filter((node: Node) => {
      const nodeWidth = node.width || 150;
      const nodeHeight = node.height || 36;
      
      // 檢查節點是否在視口內
      return !(
        node.position.x + nodeWidth < viewportBounds.x ||
        node.position.y + nodeHeight < viewportBounds.y ||
        node.position.x > viewportBounds.x + viewportBounds.width ||
        node.position.y > viewportBounds.y + viewportBounds.height
      );
    });
  });
  
  // === 節點屬性獲取 ===
  
  getNodeDraggable(node: Node): boolean {
    return node.draggable !== undefined ? node.draggable : this.nodesDraggable();
  }
  
  getNodeSelectable(node: Node): boolean {
    return node.selectable !== undefined ? node.selectable : this.nodesSelectable();
  }
  
  getNodeConnectable(node: Node): boolean {
    return node.connectable !== undefined ? node.connectable : this.nodesConnectable();
  }
  
  // === 事件處理 ===
  
  protected handleNodeClick(event: { event: MouseEvent; node: Node }) {
    const nodes = this.nodes();
    const multiSelection = event.event.metaKey || event.event.ctrlKey;
    
    let updatedNodes;
    if (!multiSelection) {
      // 單選模式 - 清除其他選擇
      updatedNodes = nodes.map((n: Node) => ({
        ...n,
        selected: n.id === event.node.id
      }));
    } else {
      // 多選模式 - 切換選擇狀態
      updatedNodes = nodes.map((n: Node) => 
        n.id === event.node.id 
          ? { ...n, selected: !n.selected }
          : n
      );
    }
    
    this.onNodesChange.emit(updatedNodes);
    this.onNodeClick.emit(event);
  }
  
  protected handleNodeDragStart(event: { event: MouseEvent; node: Node; index: number }) {
    const nodes = this.nodes();
    const selectedNodes = nodes.filter((n: Node) => n.selected);
    
    // 如果拖拽的節點未被選中，先選中它
    if (!event.node.selected) {
      const updatedNodes = nodes.map((n: Node) => ({
        ...n,
        selected: n.id === event.node.id
      }));
      this.onNodesChange.emit(updatedNodes);
      this.onNodeDragStart.emit({ 
        event: event.event, 
        node: event.node, 
        nodes: [event.node] 
      });
    } else {
      // 拖拽所有選中的節點
      this.onNodeDragStart.emit({ 
        event: event.event, 
        node: event.node, 
        nodes: selectedNodes.includes(event.node) ? selectedNodes : [event.node]
      });
    }
  }
  
  protected handleNodeDrag(event: { event: MouseEvent; node: Node; delta: { x: number; y: number } }) {
    const nodes = this.nodes();
    const selectedNodes = nodes.filter((n: Node) => n.selected);
    const nodesToDrag = selectedNodes.includes(event.node) ? selectedNodes : [event.node];
    
    // 更新所有被拖拽節點的位置
    const updatedNodes = nodes.map((n: Node) => {
      if (nodesToDrag.some(dragNode => dragNode.id === n.id)) {
        return {
          ...n,
          position: {
            x: n.position.x + event.delta.x,
            y: n.position.y + event.delta.y
          }
        };
      }
      return n;
    });
    
    // 發送更新的節點（這會觸發 Basic 組件的 onNodesChange）
    this.onNodesChange.emit(updatedNodes);
    
    // 也發送 drag 事件
    this.onNodeDrag.emit({ 
      event: event.event, 
      node: event.node, 
      nodes: nodesToDrag
    });
  }
  
  protected handleNodeDragStop(event: { event: MouseEvent; node: Node }) {
    const nodes = this.nodes();
    const selectedNodes = nodes.filter((n: Node) => n.selected);
    const nodesToDrag = selectedNodes.includes(event.node) ? selectedNodes : [event.node];
    
    this.onNodeDragStop.emit({ 
      event: event.event, 
      node: event.node, 
      nodes: nodesToDrag 
    });
  }
  
  protected handleNodePositionChange(event: { node: Node; position: { x: number; y: number } }) {
    console.log('📍 NodeRenderer handleNodePositionChange called:', {
      nodeId: event.node.id,
      oldPosition: event.node.position,
      newPosition: event.position
    });
    
    const nodes = this.nodes();
    const updatedNodes = nodes.map((n: Node) => 
      n.id === event.node.id 
        ? { ...n, position: event.position }
        : n
    );
    
    console.log('📤 NodeRenderer emitting onNodesChange with updated positions');
    this.onNodesChange.emit(updatedNodes);
    
    console.log('📤 NodeRenderer emitting onNodePositionChange');
    this.onNodePositionChange.emit(event);
  }
}