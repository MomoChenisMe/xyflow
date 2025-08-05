import { DefaultNodeComponent } from './default-node.component';
import { InputNodeComponent } from './input-node.component';
import { OutputNodeComponent } from './output-node.component';
import { GroupNodeComponent } from './group-node.component';
import { NodeTypes } from '../types';

// 導出所有預設節點元件
export { DefaultNodeComponent } from './default-node.component';
export { InputNodeComponent } from './input-node.component';
export { OutputNodeComponent } from './output-node.component';
export { GroupNodeComponent } from './group-node.component';

// 內建節點類型對應表 - 與 React Flow 保持一致
export const builtinNodeTypes: NodeTypes = {
  default: DefaultNodeComponent,
  input: InputNodeComponent,
  output: OutputNodeComponent,
  group: GroupNodeComponent,
};