import { Component, inject, viewChild, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AngularFlowComponent } from '../../angular-flow/angular-flow.component';
import { BackgroundComponent } from '../../angular-flow/background/background.component';
import { MinimapComponent } from '../../angular-flow/minimap/minimap.component';
import { AngularNode, AngularEdge, AngularFlowInstance } from '../../angular-flow/types';
import { Connection, addEdge } from '@xyflow/system';
import { CountdownService } from './countdown.service';
import { TimerComponent } from './timer.component';

const CANCEL_AFTER = 5; // 秒數

@Component({
  selector: 'app-cancel-connection-example',
  standalone: true,
  imports: [
    CommonModule,
    AngularFlowComponent,
    BackgroundComponent,
    MinimapComponent,
    TimerComponent
  ],
  providers: [CountdownService],
  template: `
    <app-timer 
      [duration]="CANCEL_AFTER"
      [show]="countdownService.counting()"
      [remaining]="countdownService.remaining()"
    />
    <angular-flow
      #angularFlow
      [defaultNodes]="initialNodes()"
      [defaultEdges]="initialEdges()"
      [maxZoom]="2"
      [fitView]="true"
      (onNodesChange)="onNodesChange($event)"
      (onEdgesChange)="onEdgesChange($event)"
      (onConnectStart)="onConnectStart()"
      (onConnectEnd)="onConnectEnd()"
      (onConnect)="onConnect($event)"
    >
      <angular-flow-background />
      <angular-flow-minimap />
    </angular-flow>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }

    angular-flow {
      width: 100%;
      height: 100%;
    }
  `]
})
export class CancelConnectionExampleComponent {
  // 視圖子元素引用
  readonly angularFlow = viewChild.required(AngularFlowComponent);
  
  // 依賴注入
  protected countdownService = inject(CountdownService);

  // 常數
  protected readonly CANCEL_AFTER = CANCEL_AFTER;
  
  // 獲取流程實例
  private get _flow(): AngularFlowInstance<AngularNode, AngularEdge> {
    return this.angularFlow().getFlow();
  }

  // 狀態管理信號 - 模擬 React 的 useNodesState 和 useEdgesState
  private _nodes = signal<AngularNode[]>([
    {
      id: '1',
      type: 'input',
      data: { label: 'Node 1' } as Record<string, unknown>,
      position: { x: 250, y: 5 },
    },
    {
      id: '2',
      data: { label: 'Node 2' } as Record<string, unknown>,
      position: { x: 100, y: 100 },
    },
    {
      id: '3',
      data: { label: 'Node 3' } as Record<string, unknown>,
      position: { x: 400, y: 100 },
    },
    {
      id: '4',
      data: { label: 'Node 4' } as Record<string, unknown>,
      position: { x: 400, y: 200 },
    },
  ]);

  private _edges = signal<AngularEdge[]>([
    { id: 'e1-2', source: '1', target: '2', animated: true },
    { id: 'e1-3', source: '1', target: '3' },
  ]);

  // 公開的只讀信號
  readonly initialNodes = this._nodes.asReadonly();
  readonly initialEdges = this._edges.asReadonly();


  // 節點變化事件處理 - 對應 React 的 onNodesChange
  onNodesChange(nodes: AngularNode[]): void {
    this._nodes.set([...nodes]);
  }

  // 邊變化事件處理 - 對應 React 的 onEdgesChange
  onEdgesChange(edges: AngularEdge[]): void {
    this._edges.set([...edges]);
  }

  // 連接開始事件處理 - 對應 React 的 onConnectStart
  onConnectStart(): void {
    // 開始 5 秒倒數計時，倒數結束時取消連接
    this.countdownService.start(CANCEL_AFTER, () => {
      // 取消連接 - 對應 React 的 cancelConnection()
      this.angularFlow().cancelConnection();
    });
  }

  // 連接結束事件處理 - 對應 React 的 onConnectEnd
  onConnectEnd(): void {
    // 停止倒數計時
    this.countdownService.stop();
  }

  // 連接建立事件處理 - 對應 React 的 onConnect
  onConnect(connection: Connection): void {
    // 停止倒數計時
    this.countdownService.stop();
    
    // 使用系統的 addEdge 函數添加邊 - 對應 React 的 setEdges((eds) => addEdge(params, eds))
    this._flow.setEdges((edges) => addEdge(connection, edges));
  }

  // ESC 鍵取消連接功能 - 對應 React Flow 的內建功能
  @HostListener('document:keydown', ['$event'])
  onDocumentKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // 檢查是否正在倒數計時（表示連接正在進行）
      if (this.countdownService.counting()) {
        event.preventDefault();
        event.stopPropagation();
        // 取消連接
        this.angularFlow().cancelConnection();
        // 停止倒數計時
        this.countdownService.stop();
      }
    }
  }
}