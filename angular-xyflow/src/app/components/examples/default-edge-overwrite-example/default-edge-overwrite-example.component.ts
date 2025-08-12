import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AngularXYFlowComponent,
  BackgroundComponent,
  AngularNode,
  AngularEdge,
  BackgroundVariant,
  EdgeTypes,
} from '../../angular-xyflow';
import { CustomEdgeComponent } from './custom-edge.component';

@Component({
  selector: 'app-default-edge-overwrite-example',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    // CustomEdgeComponent 在 edgeTypes 中動態載入，不需要在 imports 中列出
  ],
  template: `
    <angular-xyflow
      [defaultNodes]="initialNodes"
      [defaultEdges]="initialEdges"
      [edgeTypes]="edgeTypes"
      [fitView]="true"
    >
      <angular-xyflow-background [variant]="backgroundVariant.Lines" />
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
export class DefaultEdgeOverwriteExampleComponent {
  // 背景變體枚舉
  backgroundVariant = BackgroundVariant;

  // edgeTypes 配置 - 覆蓋 default 類型，與 React Flow 完全一致
  edgeTypes: EdgeTypes = {
    default: CustomEdgeComponent,
  };

  // 初始節點配置 - 與 React 版本完全一致
  initialNodes: AngularNode[] = [
    {
      id: '1',
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
  ];

  // 初始邊配置 - 與 React 版本完全一致
  initialEdges: AngularEdge[] = [
    {
      id: 'e1-2',
      source: '1',
      target: '2',
      type: 'unregistered', // This will fallback to custom default
    },
  ];
}