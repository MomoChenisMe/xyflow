import { Routes } from '@angular/router';
import { BasicExampleComponent } from './components/examples/basic-example/basic-example.component';
import { A11yExampleComponent } from './components/examples/a11y-example/a11y-example.component';
import { AddNodeOnEdgeDropComponent } from './components/examples/add-node-on-edge-drop/add-node-on-edge-drop.component';
import { BackgroundsExampleComponent } from './components/examples/backgrounds-example/backgrounds-example.component';
import { BrokenNodesExampleComponent } from './components/examples/broken-nodes-example/broken-nodes-example.component';
import { ColorModeExampleComponent } from './components/examples/color-mode-example/color-mode-example.component';
import { CancelConnectionExampleComponent } from './components/examples/cancel-connection-example/cancel-connection-example.component';
import { ClickDistanceExampleComponent } from './components/examples/click-distance-example/click-distance-example.component';
import { ControlledUncontrolledExampleComponent } from './components/examples/controlled-uncontrolled-example/controlled-uncontrolled-example.component';
import { ControlledViewportExampleComponent } from './components/examples/controlled-viewport-example/controlled-viewport-example.component';
import { CustomConnectionLineExampleComponent } from './components/examples/custom-connection-line-example/custom-connection-line-example.component';
import { CustomMinimapNodeExampleComponent } from './components/examples/custom-minimap-node-example/custom-minimap-node-example.component';
import { CustomNodeExampleComponent } from './components/examples/custom-node-example/custom-node-example.component';
import { DefaultNodesExampleComponent } from './components/examples/default-nodes-example/default-nodes-example.component';
import { DefaultNodeOverwriteExampleComponent } from './components/examples/default-node-overwrite-example/default-node-overwrite-example.component';
import { DefaultEdgeOverwriteExampleComponent } from './components/examples/default-edge-overwrite-example/default-edge-overwrite-example.component';
import { DevToolsExampleComponent } from './components/examples/devtools-example/devtools-example.component';
import { DragHandleExampleComponent } from './components/examples/drag-handle-example/drag-handle-example.component';
import { DragNDropExampleComponent } from './components/examples/drag-n-drop-example/drag-n-drop-example.component';
import { EasyConnectExampleComponent } from './components/examples/easy-connect-example/easy-connect-example.component';
import { EdgeRendererExampleComponent } from './components/examples/edge-renderer-example/edge-renderer-example.component';
import { EdgeRoutingExampleComponent } from './components/examples/edge-routing-example/edge-routing-example.component';
import { EdgesExample } from './components/examples/edges-example/edges-example';
import { EdgeTypesComponent } from './components/examples/edge-types/edge-types';

export interface IRoute {
  name: string;
  path: string;
  component: any;
}

export const routeList: IRoute[] = [
  {
    name: 'A11y',
    path: 'a11y',
    component: A11yExampleComponent,
  },
  {
    name: 'Add Node On Edge Drop',
    path: 'add-node-on-edge-drop',
    component: AddNodeOnEdgeDropComponent,
  },
  {
    name: 'Backgrounds',
    path: 'backgrounds',
    component: BackgroundsExampleComponent,
  },
  {
    name: 'Basic',
    path: 'basic',
    component: BasicExampleComponent,
  },
  {
    name: 'Broken Nodes',
    path: 'broken-nodes',
    component: BrokenNodesExampleComponent,
  },
  {
    name: 'Cancel Connection',
    path: 'cancel-connection',
    component: CancelConnectionExampleComponent,
  },
  {
    name: 'Click Distance',
    path: 'click-distance',
    component: ClickDistanceExampleComponent,
  },
  {
    name: 'Color Mode',
    path: 'color-mode',
    component: ColorModeExampleComponent,
  },
  {
    name: 'Controlled Uncontrolled',
    path: 'controlled-uncontrolled',
    component: ControlledUncontrolledExampleComponent,
  },
  {
    name: 'Controlled Viewport',
    path: 'controlled-viewport',
    component: ControlledViewportExampleComponent,
  },
  {
    name: 'Custom Connection Line',
    path: 'custom-connection-line',
    component: CustomConnectionLineExampleComponent,
  },
  {
    name: 'Custom Minimap Node',
    path: 'custom-minimap-node',
    component: CustomMinimapNodeExampleComponent,
  },
  {
    name: 'Custom Node',
    path: 'custom-node',
    component: CustomNodeExampleComponent,
  },
  {
    name: 'Default Nodes',
    path: 'default-nodes',
    component: DefaultNodesExampleComponent,
  },
  {
    name: 'Default Node Overwrite',
    path: 'default-node-overwrite',
    component: DefaultNodeOverwriteExampleComponent,
  },
  {
    name: 'Default Edge Overwrite',
    path: 'default-edge-overwrite',
    component: DefaultEdgeOverwriteExampleComponent,
  },
  {
    name: 'DevTools',
    path: 'devtools',
    component: DevToolsExampleComponent,
  },
  {
    name: 'Drag Handle',
    path: 'drag-handle',
    component: DragHandleExampleComponent,
  },
  {
    name: 'Drag and Drop',
    path: 'drag-n-drop',
    component: DragNDropExampleComponent,
  },
  {
    name: 'Easy Connect',
    path: 'easy-connect',
    component: EasyConnectExampleComponent,
  },
  {
    name: 'Edge Renderer',
    path: 'edge-renderer',
    component: EdgeRendererExampleComponent,
  },
  {
    name: 'Edge Routing',
    path: 'edge-routing',
    component: EdgeRoutingExampleComponent,
  },
  {
    name: 'Edges',
    path: 'edges',
    component: EdgesExample,
  },
  {
    name: 'Edge Types',
    path: 'edge-types',
    component: EdgeTypesComponent,
  },
];

export const routes: Routes = [
  { path: '', redirectTo: '/basic', pathMatch: 'full' },
  { path: 'a11y', component: A11yExampleComponent },
  { path: 'add-node-on-edge-drop', component: AddNodeOnEdgeDropComponent },
  { path: 'backgrounds', component: BackgroundsExampleComponent },
  { path: 'basic', component: BasicExampleComponent },
  { path: 'broken-nodes', component: BrokenNodesExampleComponent },
  { path: 'cancel-connection', component: CancelConnectionExampleComponent },
  { path: 'click-distance', component: ClickDistanceExampleComponent },
  { path: 'color-mode', component: ColorModeExampleComponent },
  { path: 'controlled-uncontrolled', component: ControlledUncontrolledExampleComponent },
  { path: 'controlled-viewport', component: ControlledViewportExampleComponent },
  { path: 'custom-connection-line', component: CustomConnectionLineExampleComponent },
  { path: 'custom-minimap-node', component: CustomMinimapNodeExampleComponent },
  { path: 'custom-node', component: CustomNodeExampleComponent },
  { path: 'default-nodes', component: DefaultNodesExampleComponent },
  { path: 'default-node-overwrite', component: DefaultNodeOverwriteExampleComponent },
  { path: 'default-edge-overwrite', component: DefaultEdgeOverwriteExampleComponent },
  { path: 'devtools', component: DevToolsExampleComponent },
  { path: 'drag-handle', component: DragHandleExampleComponent },
  { path: 'drag-n-drop', component: DragNDropExampleComponent },
  { path: 'easy-connect', component: EasyConnectExampleComponent },
  { path: 'edge-renderer', component: EdgeRendererExampleComponent },
  { path: 'edge-routing', component: EdgeRoutingExampleComponent },
  { path: 'edges', component: EdgesExample },
  { path: 'edge-types', component: EdgeTypesComponent },
];
