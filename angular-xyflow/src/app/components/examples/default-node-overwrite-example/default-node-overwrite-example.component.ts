import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AngularXYFlowComponent,
  BackgroundComponent,
  AngularNode,
  BackgroundVariant,
  NodeTypes,
} from '../../angular-xyflow';
import { CustomNodeComponent } from './custom-node.component';

@Component({
  selector: 'app-default-node-overwrite-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
    CustomNodeComponent, // 必須包含，因為動態載入也需要在 imports 中聲明
  ],
  template: `
    <angular-xyflow
      [defaultNodes]="initialNodes"
      [nodeTypes]="nodeTypes"
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
export class DefaultNodeOverwriteExampleComponent {
  // 背景變體枚舉
  backgroundVariant = BackgroundVariant;

  // nodeTypes 配置 - 覆蓋 default 類型，與 React Flow 完全一致
  nodeTypes: NodeTypes = {
    default: CustomNodeComponent,
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
      type: 'unregistered',
      position: { x: 100, y: 100 },
      className: 'light',
    },
  ];
}
