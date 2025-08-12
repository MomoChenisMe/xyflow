import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-drag-n-drop-sidebar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  template: `
    <aside class="dndflow__aside">
      <div class="dndflow__description">You can drag these nodes to the pane on the left.</div>
      <div 
        class="react-flow__node-input" 
        (dragstart)="onDragStart($event, 'input')" 
        draggable="true"
      >
        Input Node
      </div>
      <div
        class="react-flow__node-default"
        (dragstart)="onDragStart($event, 'default')"
        draggable="true"
      >
        Default Node
      </div>
      <div
        class="react-flow__node-output"
        (dragstart)="onDragStart($event, 'output')"
        draggable="true"
      >
        Output Node
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
    }

    .dndflow__aside {
      height: 100%;
      border-left: 1px solid #eee;
      padding: 15px 10px;
      font-size: 12px;
      background: #fcfcfc;
      box-sizing: border-box;
    }

    .dndflow__aside > * {
      margin-bottom: 10px;
    }

    .dndflow__description {
      margin-bottom: 10px;
      cursor: default;
    }

    /* 使用 React Flow 相同的類名，但提供自己的樣式實現 */
    .react-flow__node-input,
    .react-flow__node-default,
    .react-flow__node-output {
      padding: 10px;
      border-radius: 3px;
      width: 150px;
      font-size: 12px;
      color: #222;
      text-align: center;
      border: 1px solid #1a192b;
      background-color: #fff;
      cursor: grab;
      box-sizing: border-box;
    }

    .react-flow__node-input {
      border: 1px solid #1a192b;
    }

    .react-flow__node-default {
      border: 1px solid #b1b1b7;
    }

    .react-flow__node-output {
      border: 1px solid #b1b1b7;
    }

    .react-flow__node-input:hover,
    .react-flow__node-default:hover,
    .react-flow__node-output:hover {
      box-shadow: 0 1px 4px 1px rgba(0, 0, 0, 0.08);
    }

    @media screen and (max-width: 767px) {
      .dndflow__aside {
        border-left: none;
        border-top: 1px solid #eee;
      }
    }
  `]
})
export class DragNDropSidebarComponent {
  onDragStart(event: DragEvent, nodeType: string): void {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/reactflow', nodeType);
      event.dataTransfer.effectAllowed = 'move';
    }
  }
}