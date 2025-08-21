import { Component, ChangeDetectionStrategy, OnInit, inject, signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AngularXYFlowComponent } from '../../angular-xyflow/container/angular-xyflow/angular-xyflow.component';
import { BackgroundComponent } from '../../angular-xyflow/additional-components/background/background.component';
import {
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  EdgeTypes,
  Connection,
  NodeChange,
  EdgeChange,
} from '../../angular-xyflow/types';
import { FloatingEdgeComponent } from './floating-edge.component';
import { FloatingConnectionLineComponent } from './floating-connection-line.component';
import { createElements } from './floating-edges.utils';
import { addEdge } from '@xyflow/system';
import { applyNodeChanges, applyEdgeChanges } from '../../angular-xyflow/utils/changes';
import { ConnectionLineTemplateDirective } from '../../angular-xyflow/directives/connection-line-template.directive';
import { Position, getBezierPath } from '@xyflow/system';
import { getEdgeParams } from './floating-edges.utils';

@Component({
  selector: 'app-floating-edges',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    ConnectionLineTemplateDirective,
  ],
  schemas: [NO_ERRORS_SCHEMA],
  template: `
    <div class="floating-edges-container">
      <angular-xyflow
        [nodes]="nodes()"
        [edges]="edges()"
        [edgeTypes]="edgeTypes"
        (onNodesChange)="onNodesChange($event)"
        (onEdgesChange)="onEdgesChange($event)"
        (onConnect)="onConnect($event)"
        (onInit)="onInit()"
        [fitView]="true"
      >
        <angular-xyflow-background />
        
        <!-- 自定義連接線模板 -->
        <ng-template
          angularXyFlowConnectionLine
          let-fromX="fromX"
          let-fromY="fromY"
          let-toX="toX"
          let-toY="toY"
          let-fromPosition="fromPosition"
          let-toPosition="toPosition"
          let-fromNode="fromNode"
        >
          <svg:g>
            <svg:path 
              fill="none" 
              stroke="#222" 
              stroke-width="1.5" 
              class="animated" 
              [attr.d]="getConnectionPath(fromNode, toX, toY, fromPosition, toPosition)"
            />
            <svg:circle 
              [attr.cx]="toX" 
              [attr.cy]="toY" 
              fill="#fff" 
              r="3" 
              stroke="#222" 
              stroke-width="1.5"
            />
          </svg:g>
        </ng-template>
      </angular-xyflow>
    </div>
  `,
  styles: [`
    .floating-edges-container {
      flex-direction: column;
      display: flex;
      height: 100%;
    }

    :host ::ng-deep .react-flow__handle,
    :host ::ng-deep .xy-flow__handle {
      opacity: 0;
    }

    .animated {
      stroke-dasharray: 5;
      animation: dashdraw 0.5s linear infinite;
    }
    
    @keyframes dashdraw {
      0% {
        stroke-dashoffset: 10;
      }
      100% {
        stroke-dashoffset: 0;
      }
    }
  `]
})
export class FloatingEdgesComponent implements OnInit {
  backgroundVariant = BackgroundVariant;
  
  // 使用 signal 管理狀態
  nodes = signal<AngularNode[]>([]);
  edges = signal<AngularEdge[]>([]);
  
  // 自定義邊線類型
  edgeTypes: EdgeTypes = {
    floating: FloatingEdgeComponent as any,
  };

  ngOnInit() {
    // 創建元素
    const { nodes, edges } = typeof window !== 'undefined' ? createElements() : { nodes: [], edges: [] };
    this.nodes.set(nodes);
    this.edges.set(edges);
  }

  onInit() {
    // 當AngularXYFlow初始化時執行，fitView會由[fitView]="true"自動處理
  }

  onNodesChange(changes: NodeChange[]) {
    this.nodes.update((nds) => applyNodeChanges(changes, nds));
  }

  onEdgesChange(changes: EdgeChange[]) {
    this.edges.update((eds) => applyEdgeChanges(changes, eds));
  }

  onConnect(connection: Connection) {
    // 處理連接事件
    this.edges.update((eds) => addEdge(connection, eds));
  }

  // 計算連接線路徑 - 與React版本的FloatingConnectionLine一致
  getConnectionPath(fromNode: AngularNode | null, toX: number, toY: number, fromPosition: Position, toPosition: Position): string {
    if (!fromNode) {
      return '';
    }

    // 為from節點添加絕對位置信息
    const fromNodeWithAbsolute = {
      ...fromNode,
      positionAbsolute: (fromNode as any).positionAbsolute || fromNode.position
    } as any;

    // 創建虛擬目標節點 - 與React版本完全一樣
    const targetNode: AngularNode = {
      id: 'connection-target',
      type: 'default',
      data: {},
      measured: {
        width: 1,
        height: 1,
      },
      position: { x: toX, y: toY },
      positionAbsolute: { x: toX, y: toY }, // 添加絕對位置
    } as any;

    // 使用getEdgeParams計算浮動連接點
    const { sx, sy } = getEdgeParams(fromNodeWithAbsolute, targetNode);

    // 生成貝茲曲線路徑
    const [path] = getBezierPath({
      sourceX: sx,
      sourceY: sy,
      sourcePosition: fromPosition,
      targetPosition: toPosition,
      targetX: toX,
      targetY: toY,
    });

    return path;
  }
}