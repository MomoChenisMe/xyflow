/**
 * 路由配置 - 用於 header 組件中的範例選擇
 * 對應 React 版本的路由結構
 */

export interface RouteConfig {
  path: string;
  name: string;
  component?: any;
}

const routes: RouteConfig[] = [
  {
    path: '/examples/basic',
    name: 'Basic',
  },
  // 未來可以添加更多範例路由
  // {
  //   path: '/examples/custom-node',
  //   name: 'Custom Node',
  // },
  // {
  //   path: '/examples/dragndrop',
  //   name: 'Drag and Drop',
  // },
  // {
  //   path: '/examples/updatable-edge',
  //   name: 'Updatable Edge',
  // },
  // {
  //   path: '/examples/interaction',
  //   name: 'Interaction',
  // },
];

export default routes;