import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  signal,
  computed
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserSelectionRect, UserSelectionState } from './user-selection.types';

/**
 * Mock store service for user selection
 */
class MockUserSelectionStoreService {
  private state = signal<UserSelectionState>({
    userSelectionActive: false,
    userSelectionRect: null,
  });

  getState() {
    return this.state();
  }

  setState(updates: Partial<UserSelectionState>) {
    this.state.update(current => ({ ...current, ...updates }));
  }

  // 計算是否顯示選擇框
  getSelectionState = computed(() => {
    const state = this.getState();
    return {
      userSelectionActive: state.userSelectionActive,
      userSelectionRect: state.userSelectionRect,
      isActive: state.userSelectionActive && !!state.userSelectionRect,
    };
  });

  // 初始化測試數據
  initTestData() {
    // 模擬用戶開始拖拽選擇
    setTimeout(() => {
      this.setState({
        userSelectionActive: true,
        userSelectionRect: {
          x: 100,
          y: 100,
          width: 200,
          height: 150,
        },
      });
    }, 1000);

    // 模擬選擇結束
    setTimeout(() => {
      this.setState({
        userSelectionActive: false,
        userSelectionRect: null,
      });
    }, 3000);
  }
}

/**
 * UserSelection - Angular equivalent of React UserSelection component
 * 
 * 用戶選擇組件 - 顯示用戶拖拽選擇的矩形框
 * 當用戶在畫布上拖拽選擇多個節點時，會顯示選擇矩形
 * 
 * 主要功能：
 * - 顯示拖拽選擇矩形
 * - 根據選擇狀態動態顯示/隱藏
 * - 實時更新矩形的位置和大小
 * - 提供視覺反饋給用戶
 * 
 * @example
 * ```typescript
 * @Component({
 *   template: `
 *     <xy-angular-flow [nodes]="nodes" [edges]="edges">
 *       <xy-user-selection></xy-user-selection>
 *     </xy-angular-flow>
 *   `
 * })
 * export class FlowComponent {
 *   nodes = [...];
 *   edges = [...];
 * }
 * ```
 * 
 * @remarks 這個組件會自動根據 flow 的狀態顯示選擇矩形，
 * 通常不需要手動控制其顯示/隱藏
 */
@Component({
  selector: 'xy-user-selection',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isActive()) {
      <div
        [class]="selectionClasses"
        [style]="selectionStyles()"
        [attr.data-testid]="'rf__user-selection'">
      </div>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }
    
    .react-flow__selection {
      position: absolute;
      background: rgba(0, 89, 220, 0.08);
      border: 1px solid rgba(0, 89, 220, 0.8);
      border-radius: 2px;
      z-index: 100;
    }
    
    .react-flow__selection.react-flow__container {
      pointer-events: none;
    }
  `]
})
export class UserSelectionComponent implements OnInit {
  private store = new MockUserSelectionStoreService();

  // CSS 類名
  readonly selectionClasses = 'react-flow__selection react-flow__container';

  // 計算屬性
  private selectionState = computed(() => this.store.getSelectionState());
  
  isActive = computed(() => this.selectionState().isActive);
  
  userSelectionRect = computed(() => this.selectionState().userSelectionRect);

  // 選擇框樣式
  selectionStyles = computed(() => {
    const rect = this.userSelectionRect();
    
    if (!rect) {
      return {};
    }

    return {
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      transform: `translate(${rect.x}px, ${rect.y}px)`,
    };
  });

  ngOnInit() {
    this.store.initTestData();
  }
}