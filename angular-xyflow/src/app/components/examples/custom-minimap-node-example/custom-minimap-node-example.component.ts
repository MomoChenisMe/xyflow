// Angular 核心模組
import {
  Component,
  signal,
  viewChild,
  ChangeDetectionStrategy,
  inject,
  ViewEncapsulation,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';

// XyFlow 系統模組
import { Connection, addEdge } from '@xyflow/system';

// 專案內部模組
import {
  AngularXYFlowComponent,
  BackgroundComponent,
  ControlsComponent,
  PanelComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  AngularXYFlowInstance,
} from '../../angular-xyflow';

// 自定義 Minimap 組件
import { Component as MinimapBase } from '@angular/core';
import { MinimapComponent } from '../../angular-xyflow/minimap/minimap.component';

// 自定義的 Minimap 組件，將節點渲染為圓形
@Component({
  selector: 'app-custom-minimap',
  standalone: true,
  imports: [CommonModule, PanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <angular-xyflow-panel 
      [position]="position()"
      [style]="computedStyle()"
      [className]="'xy-flow__minimap ' + (className() || '')"
      [attr.data-testid]="'af__minimap'"
    >
      <svg:svg 
        #svg
        [attr.width]="elementWidth()"
        [attr.height]="elementHeight()"
        [attr.viewBox]="viewBox()"
        class="xy-flow__minimap-svg"
        role="img"
        [attr.aria-labelledby]="labelledBy"
        (click)="onSvgClick($event)"
      >
        @if (ariaLabel()) {
          <svg:title [id]="labelledBy">{{ ariaLabel() }}</svg:title>
        }
        
        <!-- 自定義節點渲染：使用圓形 -->
        @for (node of visibleNodes(); track node.id) {
          <svg:circle
            [attr.cx]="getNodeCenter(node).x"
            [attr.cy]="getNodeCenter(node).y"
            [attr.r]="getNodeRadius(node)"
            [attr.fill]="'#ffcc00'"
            [attr.stroke]="getNodeStrokeColor(node)"
            [attr.stroke-width]="nodeStrokeWidth()"
            [class]="'xy-flow__minimap-node custom-circle-node ' + (shouldShowSelected(node) ? 'selected' : '') + ' ' + (nodeClassName() || '')"
            [attr.shape-rendering]="shapeRendering"
            (click)="onSvgNodeClick($event, node.id)"
          />
        }
        
        <!-- 視口遮罩 -->
        <svg:path
          class="xy-flow__minimap-mask"
          [attr.d]="maskPath()"
          [attr.fill-rule]="'evenodd'"
          [style.pointer-events]="'none'"
        />
      </svg:svg>
    </angular-xyflow-panel>
  `,
  styles: [`
    .xy-flow__minimap {
      background: var(
        --xy-minimap-background-color-props,
        var(--xy-minimap-background-color, var(--xy-minimap-background-color-default))
      );
      border: 1px solid #ddd;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    
    .xy-flow.dark .xy-flow__minimap {
      border-color: #555;
    }
    
    .xy-flow__minimap-svg {
      display: block;
    }
    
    .xy-flow__minimap-mask {
      fill: var(
        --xy-minimap-mask-background-color-props,
        var(--xy-minimap-mask-background-color, var(--xy-minimap-mask-background-color-default))
      );
      stroke: var(
        --xy-minimap-mask-stroke-color-props,
        var(--xy-minimap-mask-stroke-color, var(--xy-minimap-mask-stroke-color-default))
      );
      stroke-width: var(
        --xy-minimap-mask-stroke-width-props,
        var(--xy-minimap-mask-stroke-width, var(--xy-minimap-mask-stroke-width-default))
      );
    }
    
    .xy-flow__minimap-node.custom-circle-node {
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .xy-flow__minimap-node.custom-circle-node:hover {
      stroke: #ff8800;
      stroke-width: 2;
    }
    
    .xy-flow__minimap-node.custom-circle-node.selected {
      fill: #ff0072;
      stroke: #ff0072;
    }
  `]
})
export class CustomMinimapComponent extends MinimapComponent {
  // 計算節點中心位置
  getNodeCenter(node: any) {
    const pos = this.getNodeVisualPosition(node);
    const width = node.width || 150;
    const height = node.height || 40;
    return {
      x: pos.x + width / 2,
      y: pos.y + height / 2
    };
  }
  
  // 計算節點半徑（基於節點的寬度和高度）
  getNodeRadius(node: any) {
    const width = node.width || 150;
    const height = node.height || 40;
    return Math.max(width, height) / 2;
  }
}

@Component({
  selector: 'app-custom-minimap-node-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    ControlsComponent,
    PanelComponent,
    CustomMinimapComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <angular-xyflow
      #angularFlow
      [defaultNodes]="nodes()"
      [defaultEdges]="edges()"
      [minZoom]="0.2"
      [maxZoom]="4"
      className="angular-xyflow-custom-minimap-node-example"
      (onNodesChange)="onNodesChange($event)"
      (onConnect)="onConnect($event)"
      (onNodeClick)="onNodeClick($event)"
      (onNodeDragStop)="onNodeDragStop($event)"
    >
      <angular-xyflow-background [variant]="backgroundVariant.Lines" />
      
      <angular-xyflow-controls />
      
      <!-- 使用自定義的 Minimap 組件 -->
      <app-custom-minimap [pannable]="true" [zoomable]="true" />
      
      <angular-xyflow-panel position="top-left">
        <div class="angular-xyflow-panel">
          <button (click)="addRandomNode()" class="flow-button">add node</button>
        </div>
      </angular-xyflow-panel>
    </angular-xyflow>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      angular-xyflow {
        width: 100%;
        height: 100%;
      }
      
      .angular-xyflow-panel {
        padding: 8px;
      }
      
      .flow-button {
        background: #f0f0f0;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px 16px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s ease;
      }
      
      .flow-button:hover {
        background: #e0e0e0;
        border-color: #ccc;
      }
      
      .flow-button:active {
        background: #d0d0d0;
      }
    `,
  ],
})
export class CustomMinimapNodeExampleComponent {
  // 視圖子元素引用
  readonly angularFlow = viewChild.required(AngularXYFlowComponent);

  // 背景變體枚舉
  readonly backgroundVariant = BackgroundVariant;

  // 節點和邊的信號
  readonly nodes = signal<AngularNode[]>([]);
  readonly edges = signal<AngularEdge[]>([]);

  // 節點 ID 計數器
  private nodeId = 1;

  // 獲取流程實例
  private get _flow(): AngularXYFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  // 節點變化回調
  onNodesChange(nodes: AngularNode[]): void {
    console.log('nodes change', nodes);
  }

  // 連接回調
  onConnect(connection: Connection): void {
    console.log('onConnect', connection);
    this._flow.setEdges((edges: AngularEdge[]) => addEdge(connection, edges));
  }

  // 節點點擊回調
  onNodeClick(data: { event: MouseEvent; node: AngularNode }): void {
    console.log('click', data.node);
  }

  // 節點拖動停止回調
  onNodeDragStop(data: {
    event: MouseEvent;
    node: AngularNode;
    nodes: AngularNode[];
  }): void {
    console.log('drag stop', data.node);
  }

  // 添加隨機節點
  addRandomNode(): void {
    const newNode: AngularNode = {
      id: this.nodeId.toString(),
      data: { label: `Node: ${this.nodeId}` },
      position: {
        x: Math.random() * window.innerWidth * 0.8,
        y: Math.random() * window.innerHeight * 0.8,
      },
    };
    
    // 更新節點列表
    this.nodes.update(currentNodes => [...currentNodes, newNode]);
    
    // 增加節點 ID 計數器
    this.nodeId++;
  }
}