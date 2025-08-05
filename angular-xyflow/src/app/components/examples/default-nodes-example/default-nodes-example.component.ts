import { Component, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularXYFlowComponent } from '../../angular-xyflow/angular-xyflow.component';
import { BackgroundComponent } from '../../angular-xyflow/background/background.component';
import { PanelComponent } from '../../angular-xyflow/panel/panel.component';
import {
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  AngularXYFlowInstance,
} from '../../angular-xyflow/types';

@Component({
  selector: 'app-default-nodes-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    PanelComponent,
  ],
  template: `
    <angular-xyflow
      #angularFlow
      [defaultNodes]="defaultNodes"
      [defaultEdges]="defaultEdges"
      [defaultEdgeOptions]="defaultEdgeOptions"
      [fitView]="true"
    >
      <angular-xyflow-background [variant]="backgroundVariant.Lines" />

      <angular-xyflow-panel position="top-right">
        <div class="angular-xyflow-panel">
          <button (click)="resetTransform()" class="flow-button">reset transform</button>
          <button (click)="updateNodePositions()" class="flow-button">change pos</button>
          <button (click)="updateEdgeColors()" class="flow-button">red edges</button>
          <button (click)="logToObject()" class="flow-button">toObject</button>
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
    `,
  ],
})
export class DefaultNodesExampleComponent {
  // 視圖子元素引用
  readonly angularFlow = viewChild.required(AngularXYFlowComponent);

  // 背景變體枚舉
  readonly backgroundVariant = BackgroundVariant;

  // 預設節點
  defaultNodes: AngularNode[] = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' },
      position: { x: 250, y: 5 },
      className: 'light',
    },
    {
      id: '2',
      data: { label: 'Node 2' },
      position: { x: 100, y: 100 },
      className: 'light',
    },
    {
      id: '3',
      type: 'output',
      data: { label: 'Node 3' },
      position: { x: 400, y: 100 },
      className: 'light',
    },
    {
      id: '4',
      data: { label: 'Node 4' },
      position: { x: 400, y: 200 },
      className: 'light',
    },
  ];

  // 預設邊
  defaultEdges: AngularEdge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e1-3', source: '1', target: '3' },
  ];

  // 預設邊選項
  defaultEdgeOptions = {
    animated: true,
  };

  // 獲取流程實例
  private get _flow(): AngularXYFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  // 重置視圖變換
  resetTransform(): void {
    this._flow.setViewport({ x: 0, y: 0, zoom: 1 });
  }

  // 更新節點位置
  updateNodePositions(): void {
    this._flow.setNodes((nodes: AngularNode[]) =>
      nodes.map((node) => ({
        ...node,
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
      }))
    );
  }

  // 更新邊的顏色
  updateEdgeColors(): void {
    this._flow.setEdges((edges: AngularEdge[]) =>
      edges.map((edge) => ({
        ...edge,
        style: {
          stroke: '#ff5050',
        },
      }))
    );
  }

  // 輸出到對象
  logToObject(): void {
    console.log(this._flow.toObject());
  }
}