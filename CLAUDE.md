## CODING_PRACTICES

### Guidelines for SUPPORT_LEVEL

#### SUPPORT_EXPERT

- Favor elegant, maintainable solutions over verbose code. Assume understanding of language idioms and design patterns.
- Highlight potential performance implications and optimization opportunities in suggested code.
- Frame solutions within broader architectural contexts and suggest design alternatives when appropriate.
- Focus comments on 'why' not 'what' - assume code readability through well-named functions and variables.
- Proactively address edge cases, race conditions, and security considerations without being prompted.
- When debugging, provide targeted diagnostic approaches rather than shotgun solutions.
- Suggest comprehensive testing strategies rather than just example tests, including considerations for mocking, test organization, and coverage.

### Guidelines for DOCUMENTATION

#### TYPEDOC

- Use JSDoc-style comments with TypeScript-specific annotations for all public APIs.
- Use // for variable comments.
- Always use Traditional Chinese for comments.
- Configure custom themes to match {{project_branding}} for consistent documentation.
- Group related functionality using @module and @category tags for better organization.
- Document edge cases and error handling for {{critical_functions}}.
- Generate and publish documentation as part of the CI/CD pipeline to keep it current.
- Include usage examples for complex interfaces and abstract classes.

## FRONTEND

### Guidelines for ANGULAR

#### ANGULAR_CODING_STANDARDS

- Use standalone components, directives, and pipes instead of NgModules.
- Implement signals for state management instead of traditional RxJS-based approaches.
- Use the new inject function instead of constructor injection.
- Implement control flow with `@if`, `@for`, and @switch instead of `*ngIf`, `*ngFor`, etc.
- Leverage functional guards and resolvers instead of class-based ones.
- Use the new deferrable views for improved loading states.
- Implement OnPush change detection strategy for improved performance.
- Use TypeScript decorators with explicit visibility modifiers (public, private).
- Leverage Angular CLI for schematics and code generation.
- Implement proper lazy loading with loadComponent and loadChildren.

#### ANGULAR_20_SIGNAL_APIS

**官方文檔參考：**
- 主要文檔: https://angular.dev/guide/signals
- RxJS 互操作: https://angular.dev/ecosystem/rxjs-interop
- linkedSignal: https://angular.dev/guide/signals/linked-signal
- Resource API: https://angular.dev/guide/signals/resource

**Angular 20 穩定 Signal API：**
- signal, computed, effect（核心功能）
- linkedSignal（依賴狀態管理）
- toSignal, toObservable（RxJS 互操作）
- input, output, model（組件通信）
- viewChild, viewChildren, contentChild, contentChildren（查詢 API）
- afterRenderEffect（渲染生命週期）

---

## 核心 Signal 功能

### signal() - 可寫信號
信號是一個包裝值的容器，當值改變時會通知感興趣的消費者。

```typescript
// 創建可寫信號
const count = signal(0);
const user = signal<User | null>(null);

// 讀取信號值
console.log(count()); // 0

// 設置新值
count.set(5);

// 基於當前值更新
count.update(value => value + 1);

// 自定義相等性檢查
const data = signal(initialData, {
  equal: (a, b) => a.id === b.id
});
```

### computed() - 計算信號
只讀信號，從其他信號派生值。具有惰性求值和記憶化特性。

**重要限制：computed() 僅用於純函數式的狀態派生**
- 只能讀取信號並返回派生值
- 不能有副作用（不能修改 DOM、調用 API、修改其他狀態）
- 不能執行異步操作
- 必須是純函數

```typescript
const firstName = signal('John');
const lastName = signal('Doe');
const users = signal<User[]>([]);

// ✅ 正確：純函數派生
const fullName = computed(() => `${firstName()} ${lastName()}`);

// ✅ 正確：複雜計算
const activeUsers = computed(() => 
  users().filter(user => user.isActive)
);

// ✅ 正確：條件邏輯
const isValid = computed(() => {
  const user = currentUser();
  return user !== null && user.email.includes('@');
});

// ❌ 錯誤：有副作用
const invalidComputed = computed(() => {
  const data = someSignal();
  console.log(data); // 副作用：日誌輸出
  this.updateSomething(); // 副作用：修改狀態
  return data.processed;
});

// ❌ 錯誤：異步操作
const asyncComputed = computed(async () => {
  const id = userId();
  return await fetch(`/api/users/${id}`); // 異步操作不被支持
});

// 計算信號是只讀的
fullName.set('Jane'); // 錯誤！計算信號不能直接設置
```

### effect() - 副作用
當信號值改變時執行的操作。

**重要：effect() 必須在注入上下文中調用**
- 在 constructor 中調用（推薦）
- 作為 class field initializer
- 或使用 injector 選項

```typescript
const user = signal({ name: 'Alice', age: 30 });

@Component({})
class MyComponent {
  // 方法 1：在 constructor 中調用（推薦）
  constructor() {
    effect(() => {
      console.log(`User changed: ${user().name}`);
    });
  }
  
  // 方法 2：作為 field initializer
  private loggingEffect = effect(() => {
    console.log('Field initializer effect');
  });
  
  // 方法 3：在生命週期鉤子中使用需要 injector
  private injector = inject(Injector);
  
  ngOnInit() {
    // 錯誤：不能在生命週期鉤子中直接調用 effect()
    // effect(() => { ... }); // 會拋出 NG0203 錯誤
    
    // 正確：使用 injector 選項
    effect(() => {
      console.log('Effect in ngOnInit');
    }, { injector: this.injector });
  }
}

// 清理函數範例
effect((onCleanup) => {
  const timer = setTimeout(() => {
    console.log('Delayed effect');
  }, 1000);
  
  onCleanup(() => clearTimeout(timer));
});
```

---

## 進階 Signal 功能

### linkedSignal() - 依賴狀態信號
創建一個與其他狀態內在關聯的信號。

```typescript
// 基本用法 - 自動同步默認值
const options = signal(['A', 'B', 'C']);
const selected = linkedSignal(() => options()[0]);

// 進階用法 - 保持有效選擇
const shippingOptions = signal<ShippingOption[]>([]);

const selectedOption = linkedSignal({
  source: shippingOptions,
  computation: (newOptions, previous) => {
    // 如果之前的選擇仍然有效，保持它
    if (previous && newOptions.find(opt => opt.id === previous.value.id)) {
      return previous.value;
    }
    // 否則選擇第一個選項
    return newOptions[0];
  }
});

// 自定義相等性檢查
const filtered = linkedSignal({
  source: items,
  computation: (items) => items.filter(item => item.active),
  equal: (a, b) => a.length === b.length
});
```

### untracked() - 不追踪讀取
在不建立依賴關係的情況下讀取信號。

```typescript
const counter = signal(0);
const lastLogged = signal(0);

effect(() => {
  const current = counter();
  const last = untracked(() => lastLogged());
  
  if (current !== last) {
    console.log(`Counter: ${current}`);
    lastLogged.set(current);
  }
  // 只依賴 counter，不依賴 lastLogged
});
```

---

## RxJS 互操作

### toSignal() - Observable 轉 Signal
將 Observable 轉換為 Signal。

```typescript
// 基本轉換
const counter$ = interval(1000);
const counter = toSignal(counter$, { initialValue: 0 });

// 處理可能的 undefined
const data$ = this.http.get<Data>('/api/data');
const data = toSignal(data$); // Signal<Data | undefined>

// 要求同步值
const value$ = of(42);
const value = toSignal(value$, { requireSync: true }); // Signal<number>

// 在服務中使用
@Injectable({ providedIn: 'root' })
export class UserService {
  private user$ = new BehaviorSubject<User | null>(null);
  
  // 暴露為 Signal
  user = toSignal(this.user$, { initialValue: null });
  
  login(user: User) {
    this.user$.next(user);
  }
}
```

### toObservable() - Signal 轉 Observable
將 Signal 轉換為 Observable。

```typescript
// 基本轉換
const count = signal(0);
const count$ = toObservable(count);

// 與 RxJS 操作符結合
const searchQuery = signal('');
const searchResults$ = toObservable(searchQuery).pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(query => this.searchService.search(query))
);

// 在模板中使用
@Component({
  template: `
    <div *ngFor="let result of searchResults$ | async">
      {{ result.title }}
    </div>
  `
})
export class SearchComponent {
  searchQuery = signal('');
  searchResults$ = toObservable(this.searchQuery).pipe(
    // ... operators
  );
}
```

---

## Signal-Based Component APIs

### input() - 信號輸入
替代 @Input() 裝飾器的信號版本。

```typescript
@Component({
  selector: 'app-user-profile',
  template: `
    <h1>{{ fullName() }}</h1>
    <p>Age: {{ age() }}</p>
  `
})
export class UserProfileComponent {
  // 必需輸入
  firstName = input.required<string>();
  lastName = input.required<string>();
  
  // 可選輸入與默認值
  age = input(0);
  
  // 輸入轉換
  id = input<number, string>({
    transform: (value: string) => parseInt(value, 10)
  });
  
  // 輸入別名
  userId = input<string>('', { alias: 'user-id' });
  
  // 計算屬性
  fullName = computed(() => `${this.firstName()} ${this.lastName()}`);
}
```

### model() - 雙向綁定
支持雙向數據流的特殊輸入。

```typescript
@Component({
  selector: 'app-custom-input',
  template: `
    <input 
      [value]="value()" 
      (input)="value.set($event.target.value)"
    />
  `
})
export class CustomInputComponent {
  // 創建雙向綁定
  value = model<string>('');
  
  // 可選的 model
  checked = model<boolean>(false);
  
  // 必需的 model
  selectedId = model.required<number>();
}

// 父組件使用
@Component({
  template: `
    <app-custom-input [(value)]="userName" />
    <app-checkbox [(checked)]="isActive" />
  `
})
export class ParentComponent {
  userName = signal('');
  isActive = signal(false);
}
```

### output() - 信號輸出
替代 @Output() 裝飾器的信號版本。

```typescript
@Component({
  selector: 'app-task-item',
  template: `
    <button (click)="complete()">完成</button>
    <button (click)="remove()">刪除</button>
  `
})
export class TaskItemComponent {
  // 基本輸出
  taskCompleted = output<void>();
  
  // 帶數據的輸出
  taskRemoved = output<{ id: string; reason: string }>();
  
  // 輸出別名
  statusChanged = output<string>({ alias: 'status-change' });
  
  complete() {
    this.taskCompleted.emit();
  }
  
  remove() {
    this.taskRemoved.emit({
      id: this.taskId(),
      reason: 'User deleted'
    });
  }
}

// 程序化訂閱
constructor() {
  // 在注入上下文中訂閱輸出
  this.taskCompleted.subscribe(() => {
    console.log('Task completed');
  });
}
```

---

## 查詢 APIs

### viewChild() / viewChildren()
查詢組件模板中的元素。

```typescript
@Component({
  selector: 'app-form',
  template: `
    <input #nameInput />
    <app-custom-select #selector />
    
    <div class="item" *ngFor="let item of items">
      {{ item }}
    </div>
  `
})
export class FormComponent {
  // 查詢單個元素
  nameInput = viewChild<ElementRef>('nameInput');
  
  // 必需的查詢
  selector = viewChild.required(CustomSelectComponent);
  
  // 查詢多個元素
  items = viewChildren<ElementRef>('.item');
  
  // 使用 read 選項
  inputModel = viewChild('nameInput', { 
    read: NgModel 
  });
  
  constructor() {
    // 自動聚焦 - effect 必須在注入上下文中調用（constructor 或 field initializer）
    effect(() => {
      this.nameInput()?.nativeElement.focus();
    });
  }
}
```

### contentChild() / contentChildren()
查詢投影內容。

```typescript
@Component({
  selector: 'app-card',
  template: `
    <div class="header">
      <ng-content select="[card-header]"></ng-content>
    </div>
    <div class="body">
      <ng-content></ng-content>
    </div>
  `
})
export class CardComponent {
  // 查詢投影的內容
  header = contentChild<ElementRef>('[card-header]');
  
  // 查詢組件
  actions = contentChild(CardActionsComponent);
  
  // 查詢多個
  sections = contentChildren(CardSectionComponent);
  
  // 包含後代
  allButtons = contentChildren(ButtonComponent, { 
    descendants: true 
  });
  
  // 響應式處理
  sectionCount = computed(() => this.sections().length);
  
  constructor() {
    effect(() => {
      console.log(`Card has ${this.sectionCount()} sections`);
    });
  }
}
```

---

## 渲染生命週期

### afterRenderEffect()
在渲染完成後執行的 effect。

```typescript
@Component({
  selector: 'app-chart',
  template: `<canvas #chartCanvas></canvas>`
})
export class ChartComponent {
  chartCanvas = viewChild<ElementRef>('chartCanvas');
  data = input<ChartData>();
  
  constructor() {
    // 讀取階段 - 測量 DOM
    afterRenderEffect(() => {
      const canvas = this.chartCanvas()?.nativeElement;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        this.updateChartSize(rect.width, rect.height);
      }
    }, { phase: 'read' });
    
    // 寫入階段 - 更新 DOM
    afterRenderEffect(() => {
      const canvas = this.chartCanvas()?.nativeElement;
      const currentData = this.data();
      
      if (canvas && currentData) {
        this.renderChart(canvas, currentData);
      }
    }, { phase: 'write' });
    
    // 混合讀寫階段
    afterRenderEffect((onCleanup) => {
      const resizeObserver = new ResizeObserver(entries => {
        // 處理大小變化
      });
      
      const element = this.chartCanvas()?.nativeElement;
      if (element) {
        resizeObserver.observe(element);
      }
      
      onCleanup(() => resizeObserver.disconnect());
    }, { phase: 'mixedReadWrite' });
  }
}
```

---

## Resource API (實驗性)

用於處理異步數據的響應式 API。

```typescript
import { resource } from '@angular/core';

@Component({
  selector: 'app-user-detail',
  template: `
    @if (userResource.loading()) {
      <div>載入中...</div>
    }
    
    @if (userResource.error()) {
      <div>錯誤: {{ userResource.error() }}</div>
    }
    
    @if (userResource.value(); as user) {
      <h1>{{ user.name }}</h1>
      <p>{{ user.email }}</p>
    }
  `
})
export class UserDetailComponent {
  userId = input.required<string>();
  
  userResource = resource({
    request: this.userId,
    loader: async ({ request: userId }) => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('Failed to load user');
      }
      return response.json();
    }
  });
}
```

---

## Signal 最佳實踐

### 1. 選擇正確的 Signal 類型
```typescript
// 使用 signal 存儲本地狀態
private count = signal(0);

// 使用 computed 派生值（僅限純函數）
totalPrice = computed(() => this.price() * this.quantity());

// 使用 effect 處理副作用（在 constructor 中）
constructor() {
  effect(() => {
    console.log('Count changed:', this.count());
  });
}

// 使用 linkedSignal 處理依賴狀態
selectedItem = linkedSignal(() => this.items()[0]);
```

### 2. effect() 注入上下文規則
```typescript
@Component({})
class MyComponent {
  private injector = inject(Injector);
  
  // ✅ 正確：constructor 中調用
  constructor() {
    effect(() => {
      // 副作用邏輯
    });
  }
  
  // ✅ 正確：field initializer
  private myEffect = effect(() => {
    // 副作用邏輯
  });
  
  // ❌ 錯誤：生命週期鉤子中直接調用
  ngOnInit() {
    // effect(() => { ... }); // 拋出 NG0203 錯誤
  }
  
  // ✅ 正確：生命週期鉤子中使用 injector
  ngOnInit() {
    effect(() => {
      // 副作用邏輯
    }, { injector: this.injector });
  }
}
```

### 3. computed() 純函數規則
```typescript
// ✅ 正確：純函數計算
const filteredItems = computed(() => 
  this.items().filter(item => item.isActive)
);

// ❌ 錯誤：有副作用
const invalidComputed = computed(() => {
  const data = this.data();
  console.log('Computing...'); // 副作用
  this.logService.log(data); // 副作用
  return data.processed;
});

// ❌ 錯誤：調用非 Signal 方法
const flowInstance = computed(() => this._flowService.getFlowInstance()); // getFlowInstance() 不是 Signal
const currentUser = computed(() => this.userService.getCurrentUser()); // getCurrentUser() 不是 Signal

// ❌ 錯誤：計算中包含方法調用
const processedValue = computed(() => {
  const data = this.data();
  return this.processData(data); // processData() 不是純函數
});

// ✅ 正確：只讀取 Signal 並返回純函數計算
const processedData = computed(() => {
  const data = this.data();
  return data.processed; // 純屬性訪問
});

const transformedItems = computed(() => {
  const items = this.items();
  const filter = this.filter();
  // 只使用純函數和 Signal 值
  return items.filter(item => item.type === filter).map(item => ({
    ...item,
    displayName: item.name.toUpperCase()
  }));
});

// ✅ 正確：將副作用移至 effect
constructor() {
  effect(() => {
    const data = this.data();
    console.log('Data changed:', data); // 副作用在 effect 中
  });
}
```

### 4. 避免在 Signal 中存儲大型對象
```typescript
// 不好：整個列表作為一個信號
const users = signal<User[]>(largeuserList);

// 好：使用多個信號或 Map
const userIds = signal<string[]>([]);
const usersById = signal<Map<string, User>>(new Map());
```

### 5. 使用 untracked 避免不必要的依賴
```typescript
effect(() => {
  const data = this.data();
  // 日誌不應該觸發 effect 重新執行
  untracked(() => {
    console.log('Data updated at:', new Date());
  });
  processData(data);
});
```

### 6. 在組件中組織 Signals
```typescript
@Component({})
export class TodoListComponent {
  // 輸入信號
  title = input.required<string>();
  allowEdit = input(true);
  
  // 本地狀態
  private todos = signal<Todo[]>([]);
  private filter = signal<'all' | 'active' | 'completed'>('all');
  
  // 計算信號
  filteredTodos = computed(() => {
    const allTodos = this.todos();
    const currentFilter = this.filter();
    
    switch (currentFilter) {
      case 'active':
        return allTodos.filter(t => !t.completed);
      case 'completed':
        return allTodos.filter(t => t.completed);
      default:
        return allTodos;
    }
  });
  
  activeTodoCount = computed(() => 
    this.todos().filter(t => !t.completed).length
  );
  
  // 輸出信號
  todoAdded = output<Todo>();
  filterChanged = output<string>();
  
  // 方法
  addTodo(title: string) {
    const newTodo: Todo = { id: Date.now(), title, completed: false };
    this.todos.update(todos => [...todos, newTodo]);
    this.todoAdded.emit(newTodo);
  }
}
```

### 7. 錯誤處理模式
```typescript
// 使用計算信號進行驗證
const email = signal('');
const emailError = computed(() => {
  const value = email();
  if (!value) return '電子郵件是必需的';
  if (!value.includes('@')) return '無效的電子郵件格式';
  return null;
});

// 使用 effect 處理異步錯誤
effect(async () => {
  try {
    const data = await fetchData(this.id());
    this.data.set(data);
  } catch (error) {
    this.error.set(error.message);
  }
});
```

### 8. WritableSignal 類型推斷
```typescript
// ❌ 錯誤：不必要的明確類型宣告
private _nodes: WritableSignal<NodeType[]> = signal([]);
private _edges: WritableSignal<EdgeType[]> = signal([]);
private _viewport: WritableSignal<Viewport> = signal({ x: 0, y: 0, zoom: 1 });

// ✅ 正確：使用 signal() 的隱式類型推斷
private _nodes = signal<NodeType[]>([]);
private _edges = signal<EdgeType[]>([]);
private _viewport = signal<Viewport>({ x: 0, y: 0, zoom: 1 });

// signal() 函數本身就返回 WritableSignal，無需明確宣告類型
// 這樣代碼更簡潔，減少冗餘的類型標註
```

### 9. 性能優化
```typescript
// 使用細粒度的信號減少更新
interface UserProfile {
  personalInfo: signal<PersonalInfo>;
  preferences: signal<Preferences>;
  settings: signal<Settings>;
}

// 而不是
const userProfile = signal<UserProfile>(initialProfile);

// 使用 memo 模式避免重複計算
const expensiveComputation = computed(() => {
  const data = this.rawData();
  // 僅在 rawData 改變時重新計算
  return performExpensiveOperation(data);
});
```

---

## 遷移指南

### 從裝飾器遷移到 Signal APIs

```typescript
// 舊代碼
@Component({})
export class OldComponent implements OnInit {
  @Input() title: string = '';
  @Input() required id!: number;
  @Output() titleChange = new EventEmitter<string>();
  @ViewChild('input') inputEl!: ElementRef;
  
  ngOnInit() {
    console.log('Title:', this.title);
  }
}

// 新代碼
@Component({})
export class NewComponent {
  // 輸入
  title = input('');
  id = input.required<number>();
  
  // 雙向綁定
  titleModel = model('');
  
  // 輸出
  titleChange = output<string>();
  
  // 視圖查詢
  inputEl = viewChild<ElementRef>('input');
  
  constructor() {
    // 替代 ngOnInit
    effect(() => {
      console.log('Title:', this.title());
    });
  }
}
```

### 從 RxJS 遷移到 Signals

```typescript
// 舊代碼 - RxJS
export class SearchComponent {
  searchTerm$ = new Subject<string>();
  results$ = this.searchTerm$.pipe(
    debounceTime(300),
    switchMap(term => this.api.search(term))
  );
}

// 新代碼 - Signals + RxJS 互操作
export class SearchComponent {
  searchTerm = signal('');
  
  results = toSignal(
    toObservable(this.searchTerm).pipe(
      debounceTime(300),
      switchMap(term => this.api.search(term))
    ),
    { initialValue: [] }
  );
}
```

---

## Angular 20 渲染週期 API

Angular 20 穩定了新的渲染週期 API，提供精確的 DOM 操作時機控制，取代傳統的生命週期鉤子。

### 渲染 API 概覽

| API | 穩定版本 | 執行時機 | 適用場景 |
|-----|----------|----------|----------|
| `afterRenderEffect()` | Angular 20 | Signal 變化後的渲染完成時 | 響應式 DOM 操作 |
| `afterEveryRender()` | Angular 20 (重命名自 afterRender) | 每次渲染完成後 | 持續性 DOM 同步 |
| `afterNextRender()` | Angular 20 (穩定) | 下次渲染完成後（一次性） | 一次性 DOM 測量/初始化 |

### 渲染階段 (Phases)

Angular 20 的渲染 API 支援四個執行階段，按順序執行。階段通過物件屬性方式指定，而非 enum：

#### 階段執行順序
1. **earlyRead** - 早期讀取：在後續寫入前讀取 DOM
2. **write** - 寫入：修改 DOM
3. **mixedReadWrite** - 混合讀寫：同時讀寫 DOM（避免使用）
4. **read** - 讀取：最終讀取階段

#### 階段使用指導原則

- **earlyRead**: 在寫入前讀取 DOM，用於自定義佈局計算。永遠不要在此階段寫入 DOM
- **write**: 專門用於寫入 DOM。永遠不要在此階段讀取 DOM  
- **mixedReadWrite**: 同時讀寫 DOM。**避免使用**以防止性能降級
- **read**: 專門用於讀取 DOM。永遠不要在此階段寫入 DOM

### afterRenderEffect() - 響應式渲染效果

結合 Signal 和渲染完成的響應式 API，在 Angular 20 中穩定。

```typescript
import { afterRenderEffect } from '@angular/core';

@Component({})
export class MyComponent {
  data = signal<any>(null);
  
  constructor() {
    // 基本用法 - 響應 signal 變化
    // afterRenderEffect 會在 mixedReadWrite 階段執行
    afterRenderEffect(() => {
      const currentData = this.data();
      if (currentData) {
        // DOM 操作邏輯
        this.updateChart(currentData);
      }
    });
    
    // 帶清理函數的用法
    afterRenderEffect((onCleanup) => {
      const element = this.elementRef()?.nativeElement;
      if (element) {
        const handler = () => console.log('clicked');
        element.addEventListener('click', handler);
        
        onCleanup(() => {
          element.removeEventListener('click', handler);
        });
      }
    });
  }
}
```

**重要特性：**
- 值在各階段間以 signal 形式傳播，提供性能優化
- 如果前一階段的值未變化，後續階段可能不會執行
- 自動追蹤 signal 依賴，響應變化重新執行

### afterEveryRender() - 每次渲染後執行

前身為 `afterRender()`，在 Angular 20 中重命名並穩定。

```typescript
import { afterEveryRender } from '@angular/core';

@Component({})
export class MyComponent {
  constructor() {
    // 每次渲染後執行（使用物件屬性指定階段）
    afterEveryRender({
      earlyRead: () => {
        // 階段 1：早期讀取
        return this.getCurrentDimensions();
      },
      write: (dimensions) => {
        // 階段 2：基於讀取結果寫入
        this.applyLayout(dimensions);
        return this.getNewState();
      },
      read: (newState) => {
        // 階段 3：最終讀取和驗證
        const element = this.viewChild()?.nativeElement;
        if (element) {
          const bbox = element.getBBox(); // SVG 測量
          this.updateLayout(bbox);
        }
        this.validateLayout(newState);
      }
    });
    
    // 簡單用法（不指定階段，會在 mixedReadWrite 執行）
    afterEveryRender(() => {
      console.log('每次渲染完成');
      this.syncDOMState();
    });
  }
}
```

### afterNextRender() - 下次渲染後執行

一次性執行的渲染後回調，適合初始化和一次性測量。

```typescript
import { afterNextRender } from '@angular/core';

@Component({})
export class MyComponent {
  constructor() {
    // 基本一次性初始化（不指定階段）
    afterNextRender(() => {
      this.initializeThirdPartyLibrary();
    });
    
    // 使用階段進行 DOM 測量（推薦用於 SVG getBBox）
    afterNextRender({
      read: () => {
        const svgElement = this.svgRef()?.nativeElement;
        if (svgElement) {
          const bbox = svgElement.getBBox();
          this.initialMeasurements.set(bbox);
        }
      }
    });
    
    // 設置觀察者（在 write 階段）
    afterNextRender({
      write: () => {
        const target = this.targetElement()?.nativeElement;
        if (target) {
          const observer = new ResizeObserver(entries => {
            this.handleResize(entries);
          });
          observer.observe(target);
        }
      }
    });
  }
}
```

### 渲染 API 最佳實踐

#### 1. 選擇合適的 API

```typescript
// ✅ 響應式 DOM 更新 - 使用 afterRenderEffect
afterRenderEffect(() => {
  const data = this.chartData();
  this.updateChart(data);
});

// ✅ 持續同步 - 使用 afterEveryRender  
afterEveryRender({
  read: () => {
    this.syncScrollPosition();
  }
});

// ✅ 一次性初始化 - 使用 afterNextRender
afterNextRender(() => {
  this.setupEventListeners();
});
```

#### 2. 正確使用階段

```typescript
// ✅ DOM 測量使用 read 階段
afterNextRender({
  read: () => {
    const bbox = svgElement.getBBox();
    return bbox;
  }
});

// ✅ DOM 修改使用 write 階段
afterEveryRender({
  write: () => {
    element.style.transform = `translate(${x}px, ${y}px)`;
  }
});

// ❌ 避免在 afterRenderEffect 中混合讀寫
afterRenderEffect(() => {
  const width = element.offsetWidth; // 讀取
  element.style.height = `${width}px`; // 寫入 - 可能導致 layout thrashing
}); // afterRenderEffect 固定在 mixedReadWrite 階段
```

#### 3. 階段協調模式

```typescript
// ✅ 階段間協調的典型模式
constructor() {
  afterEveryRender({
    earlyRead: () => {
      // 階段 1: 早期讀取
      return element.getBoundingClientRect();
    },
    write: (rect) => {
      // 階段 2: 基於讀取結果寫入
      element.style.left = `${rect.width}px`;
      return rect.width;
    },
    read: (width) => {
      // 階段 3: 最終驗證
      console.log('應用的寬度:', width);
    }
  });
}
```

#### 4. SVG 測量專用模式

```typescript
// 🎯 SVG getBBox 最佳實踐
constructor() {
  afterNextRender({
    read: async () => {
      // 等待字體載入
      if ('fonts' in document) {
        await document.fonts.ready;
      }
      
      const svgText = this.textRef()?.nativeElement;
      if (svgText) {
        const bbox = svgText.getBBox();
        this.textMeasurements.set(bbox);
      }
    }
  });
}
```

### 注入上下文要求

所有渲染 API 都必須在注入上下文中調用：

```typescript
@Component({})
export class MyComponent {
  private injector = inject(Injector);
  
  constructor() {
    // ✅ 在 constructor 中調用（推薦）
    afterNextRender(() => {
      // 渲染後邏輯
    });
  }
  
  // ✅ 作為 field initializer
  private renderEffect = afterRenderEffect(() => {
    // 響應式渲染邏輯
  });
  
  ngOnInit() {
    // ❌ 生命週期鉤子中直接調用會失敗
    // afterNextRender(() => {}); // 拋出錯誤
    
    // ✅ 使用 injector 選項
    afterNextRender(() => {
      // 渲染後邏輯
    }, { injector: this.injector });
  }
}
```

### 性能考量

1. **避免 MixedReadWrite**: 可能導致顯著性能降級
2. **使用適當階段**: Read 和 Write 階段性能最佳
3. **階段值傳播**: afterRenderEffect 中的 signal 傳播提供自動優化
4. **瀏覽器專用**: 所有渲染 API 在 SSR 中不執行

---

## 注意事項

1. **Signal 在 Angular 20 中已穩定**，包括 effect、linkedSignal、toSignal 和 toObservable
2. **Resource API 仍是實驗性的**，可能在未來版本中有所變更
3. **effect() 必須在注入上下文中調用**：
   - 在 constructor 中調用（推薦）
   - 作為 class field initializer
   - 在生命週期鉤子中需使用 injector 選項
   - 違反此規則會拋出 NG0203 錯誤
4. **computed() 僅用於純函數式狀態派生**：
   - 不能有副作用（修改 DOM、調用 API、日誌輸出等）
   - 不能執行異步操作
   - 必須是純函數，只能讀取信號並返回派生值
5. **避免在 effect 中直接修改信號**，這可能導致無限循環
6. **Signal 更新是同步的**，但 effect 執行是異步的（在微任務中）
7. **使用 OnPush 變更檢測策略**以獲得最佳性能
8. **Signal 不能在組件外部創建**，除非在注入上下文中

#### ANGULAR_20_TEMPLATE_SYNTAX

**現代控制流語法 - 取代結構指令：**

**@if / @else-if / @else** - 取代 *ngIf
```typescript
// 基本條件渲染
@if (user.isLoggedIn) {
  <div>Welcome back!</div>
} @else {
  <div>Guest user</div>
}

// 多重條件
@if (score >= 90) {
  <div class="grade-a">Excellent!</div>
} @else if (score >= 80) {
  <div class="grade-b">Good!</div>
} @else if (score >= 70) {
  <div class="grade-c">Fair</div>
} @else {
  <div class="grade-f">Needs improvement</div>
}

// 配合 async pipe 使用
@if (user$ | async; as user) {
  @if (user.verified) {
    You are logged in and verified
  } @else {
    You are logged in, but need to verify your email
  }
} @else {
  You are logged out
}
```

**@for** - 取代 *ngFor
```typescript
// 基本循環（track 必需）
@for (item of items; track item.id) {
  <li>{{ item.name }}</li>
} @empty {
  <li>No items found</li>
}

// 使用索引和狀態變量
@for (user of users; track user.id; let i = $index, let isFirst = $first, let isLast = $last) {
  <div>
    Item {{ i }}: {{ user.name }}
    @if (isFirst) { <span>First!</span> }
    @if (isLast) { <span>Last!</span> }
  </div>
}

// 可用的隱式變量
// $index, $first, $last, $odd, $even, $count
@for (product of products; track product.id) {
  <div [class.odd]="$odd" [class.even]="$even">
    {{ $index + 1 }}. {{ product.name }}
  </div>
}
```

**@switch / @case / @default** - 取代 ngSwitch
```typescript
// 基本 switch 語法
@switch (userRole) {
  @case ('admin') {
    <app-admin-dashboard />
  }
  @case ('manager') {
    <app-manager-dashboard />
  }
  @case ('user') {
    <app-user-profile />
  }
  @default {
    <app-guest-view />
  }
}

// 數值比較
@switch (status) {
  @case (1) {
    <div class="status-pending">Pending</div>
  }
  @case (2) {
    <div class="status-approved">Approved</div>
  }
  @case (3) {
    <div class="status-rejected">Rejected</div>
  }
  @default {
    <div class="status-unknown">Unknown Status</div>
  }
}
```

**@let** - 模板變量聲明
```typescript
// 基本變量聲明
@let userName = user.firstName + ' ' + user.lastNames;
@let isAdult = user.age >= 18;
@let coordinates = {x: 50, y: 100};

// 複雜表達式簡化
@let complexData = someService.getData().property.nestedProperty.value;
<div>{{ complexData }}</div>

// 與 async pipe 結合
@let asyncData = data$ | async;
@if (asyncData) {
  <div>{{ asyncData.title }}</div>
}

// 類型窄化
@let txType = transaction().type;
@switch(txType) {
  @case('deposit') { <app-deposit [tx]="transaction()" /> }
  @case('withdrawal') { <app-withdrawal [tx]="transaction()" /> }
}

// 在循環中使用
@for (item of items; track item.id) {
  @let itemTotal = item.price * item.quantity;
  @let discountedPrice = itemTotal * (1 - item.discount);
  <div>
    {{ item.name }}: {{ discountedPrice | currency }}
  </div>
}
```

**@defer / @placeholder / @loading / @error** - 延遲加載
```typescript
// 基本延遲加載
@defer {
  <heavy-component />
} @placeholder {
  <div>Loading...</div>
}

// 完整的狀態管理
@defer (on viewport; prefetch on idle) {
  <large-chart [data]="chartData" />
} @placeholder (minimum 500ms) {
  <div class="chart-skeleton">Chart placeholder</div>
} @loading (minimum 1s; after 100ms) {
  <div class="loading-spinner">Loading chart...</div>
} @error {
  <div class="error-message">Failed to load chart</div>
}

// 觸發條件
@defer (on hover) {
  <tooltip-content />
} @placeholder {
  <span>Hover for details</span>
}

@defer (on interaction) {
  <modal-dialog />
}

@defer (on immediate) {
  <component />
}

@defer (on timer(2s)) {
  <delayed-content />
}
```

**模板語法最佳實踐：**

- 優先使用新的 @if, @for, @switch 語法，避免 *ngIf, *ngFor, *ngSwitch
- @for 中的 track 表達式是必需的，用於性能優化
- 使用 @empty 處理空集合狀態
- 利用 @let 簡化複雜表達式和避免重複計算
- 使用 @defer 實現代碼分割和性能優化
- 新語法無需導入，內建於模板引擎中
- 提供更好的類型安全和開發體驗
- 遷移可使用 Angular CLI 自動化工具

#### CODE_QUALITY_STANDARDS

**Import Organization:**

- Organize imports in the following order: Angular core, RxJS, PrimeNG and external libraries, project imports, relative imports.
- Use absolute imports for project modules and relative imports only for same-directory files.
- Group related imports together with clear separation between import groups.

**Class Structure and Member Ordering:**

- Follow strict member ordering: signatures → fields (private/protected/public) → constructors → accessors → getters → setters → methods.
- Within each category, order by visibility: private → protected → public.
- Place static members before instance members within each visibility group.
- Use consistent decorator positioning and explicit visibility modifiers.

**Naming Conventions:**

- Use camelCase for default identifiers, variables, parameters, methods, and properties.
- Use PascalCase for types, classes, interfaces, enums, and enum members.
- Use UPPER_CASE for constants and private readonly properties.
- Apply leading underscore (\_) for private members and double underscore (\_\_) for protected members.
- Use kebab-case for Angular component selectors with 'app-' prefix.
- Use camelCase for Angular directive selectors with 'app' prefix.

**Code Syntax and Style:**

- Always terminate statements with semicolons for consistency and clarity.
- Preserve empty lifecycle methods (e.g., ngOnInit) for future implementation.
- Maintain consistent code formatting using Prettier for HTML templates.
- Follow Angular template best practices including accessibility guidelines.

**Error Prevention:**

- Implement comprehensive error handling for all async operations and user interactions.
- Use TypeScript strict mode features and proper type annotations throughout.
- Validate inputs and handle edge cases explicitly rather than relying on default behaviors.
- Apply defensive programming principles for public APIs and data transformations.

## Project Overview

This repository contains two major projects:
1. **XYFlow Monorepo** - A pnpm workspace with Turbo build system containing React Flow, Svelte Flow, and the shared system library
2. **Angular XYFlow** - A standalone Angular implementation that ports React Flow functionality to Angular

---

## React Flow (XYFlow Monorepo)

### Overview
The xyflow monorepo manages multiple packages that create highly customizable node-based UI libraries for React and Svelte.

### Architecture

#### Core Packages
- **`packages/system`** - Shared core library (`@xyflow/system`) containing framework-agnostic utilities, types, and logic
- **`packages/react`** - React Flow v12 (`@xyflow/react`) - React implementation
- **`packages/svelte`** - Svelte Flow (`@xyflow/svelte`) - Svelte implementation

#### Supporting Structure
- **`examples/`** - Working examples for React, Svelte, and Astro integrations
- **`tests/playwright/`** - Cross-framework E2E tests using Playwright
- **`tooling/`** - Shared tooling configs (ESLint, Rollup, PostCSS, TypeScript)

#### Key Dependencies
- **State Management**: Zustand (React), Svelte stores (Svelte)
- **Interactions**: D3 (drag, zoom, selection) in system package
- **Build**: Rollup for libraries, Vite for examples
- **Styling**: PostCSS with nested syntax and auto-prefixing

### Common Commands

#### Development
```bash
# Install dependencies
pnpm install

# Start all examples in development mode
pnpm dev

# Start React examples only
pnpm dev:react

# Build all packages
pnpm build:all    # Everything including examples
pnpm build        # Just the packages

# Lint and typecheck packages
pnpm lint
pnpm typecheck
```

#### Testing
```bash
# Run React E2E tests
pnpm test:react      # React tests
pnpm test:react:ui   # React tests with UI
```

#### React Package Commands
```bash
# Work on React package
cd packages/react
pnpm dev        # Watch mode with CSS rebuild
pnpm build      # Production build
pnpm lint       # ESLint
pnpm typecheck  # TypeScript check
```

### Development Workflow

#### Making Changes
1. Use `pnpm dev` for parallel development across packages
2. Changes to `packages/system` automatically rebuild dependent packages
3. Examples auto-refresh when packages rebuild
4. CSS changes in packages trigger automatic rebuilds

#### Release Process
Uses [changesets](https://github.com/changesets/changesets):
1. Add changeset for each PR with user-facing changes: `npx changeset`
2. Merge PR to main
3. Changesets creates release PR with version bumps
4. Merge release PR to publish to npm

### Code Organization

#### System Package Structure
- **`utils/`** - Core utilities (graph operations, edge calculations, etc.)
- **`types/`** - Shared TypeScript types
- **`xy*/`** - Modular systems (XYDrag, XYPanZoom, XYHandle, XYResizer)

#### React Package Structure
- **`components/`** - React-specific components (Handle, NodeWrapper, etc.)
- **`container/`** - Main container components (ReactFlow, FlowRenderer, etc.)
- **`hooks/`** - React hooks for flow functionality
- **`additional-components/`** - Optional components (Controls, MiniMap, Background, etc.)

---

## Angular XYFlow

### Overview
Angular XYFlow (`angular-xyflow/`) is a standalone Angular project that converts React Flow concepts and functionality into Angular-native components, services, and patterns. This project provides a complete Angular implementation with Signal-based state management, standalone components, and modern Angular practices while maintaining feature parity with the React version.

### Architecture
- **Standalone Project**: Independent from the monorepo structure
- **Package Scope**: `@angular-xyflow/*`
- **State Management**: Angular Signals (Angular 20+)
- **Component Model**: Standalone components with new control flow syntax
- **Build System**: Angular CLI with Vite

### Common Commands

#### Development
```bash
# Navigate to Angular project
cd angular-xyflow

# Install dependencies
npm install

# Start development server
npm start           # Runs on http://localhost:4200
npm run dev         # Alternative development command

# Build for production
npm run build       # Production build with optimization
```

#### Testing
```bash
# Unit tests
npm test            # Run unit tests with Karma
npm run test:watch  # Run tests in watch mode

# E2E tests
npm run e2e         # Run Playwright E2E tests
npm run e2e:ui      # Run Playwright tests with UI mode
```

#### Code Quality
```bash
# Linting
npm run lint        # Run ESLint and Angular linting

# Type checking
npm run typecheck   # TypeScript type checking

# Format code
npm run format      # Format code with Prettier
npm run format:fix  # Auto-fix formatting issues
```

#### Angular-specific Commands
```bash
# Generate components
ng generate component components/my-component
ng g c components/my-component --standalone

# Generate services
ng generate service services/my-service
ng g s services/my-service

# Generate directives
ng generate directive directives/my-directive
ng g d directives/my-directive --standalone

# Analyze bundle size
npm run analyze     # Webpack bundle analyzer

# Update Angular dependencies
ng update           # Check for Angular updates
ng update @angular/core @angular/cli
```

### Code Organization

#### Component Structure
- **`src/app/components/angular-xyflow/`** - Core flow components
- **`src/app/components/examples/`** - Example implementations
- **`src/app/components/header/`** - Application header

#### Service Architecture
- **`angular-xyflow.service.ts`** - Main flow state management
- **`drag.service.ts`** - Node dragging functionality
- **`panzoom.service.ts`** - Viewport pan and zoom

#### Key Components
- **`angular-xyflow.component.ts`** - Main flow container
- **`viewport/`** - Viewport management
- **`node-wrapper/`** - Node rendering wrapper
- **`edge/`** - Edge components
- **`handle/`** - Connection handles
- **`minimap/`** - Minimap visualization
- **`controls/`** - Zoom and pan controls
- **`background/`** - Background patterns
- **`panel/`** - Overlay panels

---

## Important Notes

- **React Flow**: Part of a monorepo with shared system packages, uses pnpm workspaces
- **Angular XYFlow**: Standalone project with its own build and dependency management
- **No Cross-Dependencies**: Angular XYFlow does not depend on the monorepo packages
- **Feature Parity**: Both implementations aim to provide the same features with framework-appropriate patterns
- **Backward Compatibility**: React Flow v12 is a breaking change from v11, Angular XYFlow targets v12 features

## Response Language
Always response in #zh-tw