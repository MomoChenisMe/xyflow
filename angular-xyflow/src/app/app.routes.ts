import { Routes } from '@angular/router';
import { BasicExampleComponent } from './components/examples/basic-example/basic-example.component';
import { A11yExampleComponent } from './components/examples/a11y-example/a11y-example.component';
import { AddNodeOnEdgeDropComponent } from './components/examples/add-node-on-edge-drop/add-node-on-edge-drop.component';
import { BackgroundsExampleComponent } from './components/examples/backgrounds-example/backgrounds-example.component';
import { BrokenNodesExampleComponent } from './components/examples/broken-nodes-example/broken-nodes-example.component';

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
];

export const routes: Routes = [
  { path: '', redirectTo: '/basic', pathMatch: 'full' },
  { path: 'a11y', component: A11yExampleComponent },
  { path: 'add-node-on-edge-drop', component: AddNodeOnEdgeDropComponent },
  { path: 'backgrounds', component: BackgroundsExampleComponent },
  { path: 'basic', component: BasicExampleComponent },
  { path: 'broken-nodes', component: BrokenNodesExampleComponent },
];
