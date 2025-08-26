import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AngularXYFlowComponent,
  AngularNode,
  AngularEdge,
  MinimapComponent,
  ControlsComponent,
  BackgroundComponent,
  BackgroundVariant,
} from '../../angular-xyflow';
import { Position, Connection, addEdge } from '@xyflow/system';
import { getElements } from './utils';

@Component({
  selector: 'app-edge-types',
  templateUrl: './edge-types.html',
  styleUrl: './edge-types.scss',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    MinimapComponent,
    ControlsComponent,
    BackgroundComponent,
  ],
})
export class EdgeTypesComponent {
  // 初始化節點和邊
  private initialElements = getElements();
  
  // Signal-based 狀態
  nodes = signal<AngularNode[]>(this.initialElements.nodes);
  edges = signal<AngularEdge[]>(this.initialElements.edges);
  
  // 配置
  minZoom = 0.2;
  backgroundVariant = BackgroundVariant.Dots;

  // 初始化處理
  onInit(event: { nodes: AngularNode[]; edges: AngularEdge[]; viewport: any }) {
    // 在 Angular XYFlow 中，fitView 通常通過設置 fitView 屬性來自動執行
    console.log('Nodes:', event.nodes);
  }

  // 節點變更處理
  onNodesChange(changes: any) {
    // 處理節點變更（如拖曳、選擇等）
    const currentNodes = this.nodes();
    const updatedNodes = changes.reduce((acc: AngularNode[], change: any) => {
      if (change.type === 'position' && change.position) {
        const node = currentNodes.find(n => n.id === change.id);
        if (node) {
          return acc.map(n => 
            n.id === change.id 
              ? { ...n, position: change.position }
              : n
          );
        }
      } else if (change.type === 'remove') {
        return acc.filter(n => n.id !== change.id);
      } else if (change.type === 'select') {
        return acc.map(n =>
          n.id === change.id
            ? { ...n, selected: change.selected }
            : n
        );
      }
      return acc;
    }, [...currentNodes]);
    
    this.nodes.set(updatedNodes);
  }

  // 邊變更處理
  onEdgesChange(changes: any) {
    const currentEdges = this.edges();
    const updatedEdges = changes.reduce((acc: AngularEdge[], change: any) => {
      if (change.type === 'remove') {
        return acc.filter(e => e.id !== change.id);
      } else if (change.type === 'select') {
        return acc.map(e =>
          e.id === change.id
            ? { ...e, selected: change.selected }
            : e
        );
      }
      return acc;
    }, [...currentEdges]);
    
    this.edges.set(updatedEdges);
  }

  // 連接處理
  onConnect(connection: Connection | AngularEdge) {
    this.edges.update(edges => addEdge(connection as Connection, edges));
  }
}