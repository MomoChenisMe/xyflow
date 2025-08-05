import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AngularXYFlowComponent,
  BackgroundComponent,
  AngularNode,
  BackgroundVariant,
  NodeTypes,
  builtinNodeTypes,
} from '../../angular-xyflow';
import { CustomNodeComponent } from './custom-node.component';
import { ColorSelectorNodeComponent } from './color-selector-node.component';

@Component({
  selector: 'app-default-node-overwrite-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularXYFlowComponent,
    BackgroundComponent,
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

  // 顏色狀態 - 供顏色選擇器使用
  private selectedColor = signal('#ff6b6b');

  // nodeTypes 配置 - 與 React Flow 類似
  nodeTypes: NodeTypes = {
    // 覆蓋內建的 default 類型
    default: CustomNodeComponent,
    // 新的自定義類型
    colorSelector: ColorSelectorNodeComponent,
    // 也可以使用內建類型
    input: builtinNodeTypes['input'],
    output: builtinNodeTypes['output'],
  };

  // 初始節點配置 - 展示不同的節點類型
  initialNodes: AngularNode[] = [
    {
      id: '1',
      data: { label: 'Custom Default Node' },
      position: { x: 250, y: 50 },
      type: 'default', // 使用自定義的 CustomNodeComponent
    },
    {
      id: '2',
      data: {
        color: this.selectedColor(),
        onChange: (event: Event) => {
          const target = event.target as HTMLInputElement;
          this.selectedColor.set(target.value);
          console.log('Color changed to:', target.value);
        }
      },
      position: { x: 100, y: 150 },
      type: 'colorSelector', // 使用顏色選擇器節點
    },
    {
      id: '3',
      data: { label: 'Input Node' },
      position: { x: 400, y: 50 },
      type: 'input', // 使用內建的 input 節點
    },
    {
      id: '4',
      data: { label: 'Output Node' },
      position: { x: 400, y: 200 },
      type: 'output', // 使用內建的 output 節點
    },
    {
      id: '5',
      data: { label: 'Unregistered Type' },
      position: { x: 250, y: 300 },
      type: 'unregistered', // 未註冊的類型，會回退到 default (CustomNodeComponent)
    },
  ];
}
