# WAD Mbitek AI 開發規範

## 程式撰寫實踐 (CODING_PRACTICES)

### 支援等級指導原則 (SUPPORT_LEVEL)

#### 專家等級支援 (SUPPORT_EXPERT)

- 優先選擇優雅、易維護的解決方案，避免冗長的程式碼。假設開發者理解程式語言慣用法和設計模式。
- 強調建議程式碼中潛在的效能影響和優化機會。
- 在更廣泛的架構脈絡中框架解決方案，並在適當時建議設計替代方案。
- 註解專注於「為什麼」而非「什麼」，假設程式碼透過良好命名的函式和變數具備可讀性。
- 主動處理邊緣情況、競態條件和安全性考量，無需提示。
- 除錯時，提供針對性的診斷方法，而非廣泛式解決方案。
- 建議全面的測試策略，而非僅是範例測試，包括模擬、測試組織和涵蓋率的考慮。

### 文件撰寫指導原則 (DOCUMENTATION)

#### TYPEDOC 文件規範

- 所有公開 API 使用 JSDoc 風格註解，搭配 TypeScript 特定標註。
- 變數註解使用 // 格式。
- **註解一律使用繁體中文撰寫**。
- 配置自訂主題以符合 {{project_branding}}，確保文件一致性。
- 使用 @module 和 @category 標籤分組相關功能，改善組織結構。
- 為 {{critical_functions}} 記錄邊緣情況和錯誤處理。
- 將文件生成和發布整合至 CI/CD 流程，保持文件時效性。
- 為複雜介面和抽象類別提供使用範例。

## 程式碼品質標準 (CODE_QUALITY_STANDARDS) - 基於 ESLint 配置

**匯入組織規範 (Import Organization) - 基於 simple-import-sort：**

根據專案 ESLint 配置，使用 `simple-import-sort` 插件來自動排序 import 語句：

1. **Angular 核心模組** - `^@angular\\/`
2. **RxJS** - `^rxjs$`
3. **PrimeNG 和外部程式庫** - `^primeng$`, `^@?\\\\w`
4. **Node 內建模組** - `^\\\\u0000`
5. **專案內部 import** - `^@`, `^`
6. **相對路徑 import** - `^\\\\./`

**正確的 import 順序範例：**
```typescript
// 1. Angular 核心
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// 2. RxJS
import { Observable, map, tap } from 'rxjs';

// 3. PrimeNG 和外部程式庫
import { ButtonModule } from 'primeng/button';
import { lodash } from 'lodash';

// 4. 專案內部 import
import { UserService } from '@/services/user.service';
import { ApiResponse } from '@/types/api';

// 5. 相對路徑 import
import { ChildComponent } from './child/child.component';
```

**類別結構與成員排序 (Class Structure and Member Ordering) - 基於 @typescript-eslint/member-ordering：**

根據 ESLint 配置，嚴格按照以下順序組織類別成員：

1. **簽名 (Index Signature)**
   - `signature`, `call-signature`

2. **欄位 (Fields) - 按可見性排序**
   - Private: `#private-static-field` → `private-static-field` → `private-instance-field`
   - Protected: `protected-static-field` → `protected-instance-field`
   - Public: `public-static-field` → `public-instance-field`
   - Abstract: `static-field` → `instance-field` → `abstract-field`

3. **靜態初始化 (Static Initialization)**
   - `static-initialization`

4. **建構子 (Constructors)**
   - `private-constructor` → `protected-constructor` → `public-constructor`

5. **存取器 (Accessors)**
   - 按可見性排序: private → protected → public

6. **Getter 方法**
   - 按可見性排序: private → protected → public

7. **Setter 方法**
   - 按可見性排序: private → protected → public

8. **方法 (Methods)**
   - 按可見性排序: private → protected → public

**範例類別結構：**
```typescript
@Component({...})
export class ExampleComponent implements OnInit {
  // 1. Private static fields
  private static readonly DEFAULT_CONFIG = {};
  
  // 2. Private instance fields
  private _data = signal<Data[]>([]);
  
  // 3. Protected fields
  protected __baseUrl = 'https://api.example.com';
  
  // 4. Public fields
  public readonly title = input.required<string>();
  
  // 5. Constructor
  constructor() {
    effect(() => this._updateData());
  }
  
  // 6. Private getters
  private get _processedData() {
    return this._data().filter(item => item.isActive);
  }
  
  // 7. Public getters
  get displayData() {
    return this._processedData;
  }
  
  // 8. Private methods
  private _updateData(): void {
    // implementation
  }
  
  // 9. Public methods
  ngOnInit(): void {
    // implementation
  }
}
```

**命名慣例 (Naming Conventions) - 基於 @typescript-eslint/naming-convention：**

根據 ESLint 配置的命名慣例：

**基本命名規則：**
- **預設識別符**: `camelCase`
- **變數**: `camelCase` 或 `UPPER_CASE`
- **參數**: `camelCase` (允許前綴底線)
- **Import**: `camelCase` 或 `PascalCase`
- **屬性**: `camelCase`, `snake_case`, `PascalCase`
- **物件字面屬性**: `camelCase`, `snake_case`, `PascalCase`

**特殊命名規則：**
- **列舉成員**: `PascalCase`
- **型別類 (typeLike)**: `PascalCase` (類別、介面、列舉等)

**可見性修飾符規則：**
- **Private 屬性**: `camelCase`, `snake_case` + **必須**前綴底線 `_`
- **Private readonly 屬性**: `UPPER_CASE` + **禁止**底線
- **Protected 屬性**: `camelCase`, `snake_case` + **必須**前綴 `__`
- **Private 方法**: `camelCase` + **必須**前綴底線 `_`
- **Private memberLike**: `camelCase` + **必須**前綴底線 `_`

**Angular 特定規則 (基於 @angular-eslint)：**
- **元件選擇器**: `kebab-case` + `app-` 前綴
- **指令選擇器**: `camelCase` + `app` 前綴

**命名範例：**
```typescript
// ✅ 正確的命名
export class UserProfileComponent {
  // Private readonly - UPPER_CASE, 無底線
  private readonly DEFAULT_SETTINGS = {};
  
  // Private 屬性 - camelCase + 前綴底線
  private _userData = signal<User | null>(null);
  
  // Protected 屬性 - camelCase + 前綴雙底線
  protected __baseConfig = {};
  
  // Public 屬性 - camelCase
  public readonly userName = input<string>();
  
  // Private 方法 - camelCase + 前綴底線
  private _processUserData(): void {}
  
  // Public 方法 - camelCase
  public updateProfile(): void {}
}

// 列舉成員 - PascalCase
enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest'
}

// 介面 - PascalCase
interface UserData {
  id: number;
  user_name: string; // snake_case 允許
}
```

**程式碼語法與風格 (Code Syntax and Style)：**

**TypeScript 檔案 (.ts)：**
- **必須使用分號**: 語句結尾一律使用分號 (`semi: ["error", "always"]`)
- **空的生命週期方法**: 允許保留空的 `ngOnInit` 等方法 (`@angular-eslint/no-empty-lifecycle-method: off`)
- **Prettier 整合**: 自動格式化和程式碼風格一致性

**HTML 模板 (.html)：**
- **Angular 模板推薦**: 遵循 `@angular-eslint/template/recommended`
- **無障礙性**: 強制遵循 `@angular-eslint/template/accessibility`
- **Prettier 格式化**: 使用 Angular 解析器 (`parser: "angular"`)
- **例外**: Inline 模板不使用 Prettier (`excludedFiles: ["*inline-template-*.component.html"]`)

**程式碼風格範例：**
```typescript
// ✅ 正確：使用分號
@Component({
  selector: 'app-user-profile', // kebab-case
  templateUrl: './user-profile.component.html'
})
export class UserProfileComponent implements OnInit {
  // ✅ 允許空的生命週期方法
  ngOnInit(): void {
    // 未來實作
  }
  
  // ✅ 語句結尾使用分號
  private _loadData(): void {
    console.log('Loading data...');
  }
}
```

```html
<!-- HTML 模板自動遵循 Prettier 和無障礙性規則 -->
<div class="user-profile">
  <h1 [attr.aria-label]="title()">
    {{ title() }}
  </h1>
  
  @if (isLoading()) {
    <div role="status" aria-label="載入中">
      載入中...
    </div>
  }
</div>
```

**錯誤預防 (Error Prevention) - 基於 ESLint 規則：**

**TypeScript 嚴格模式：**
- 使用 `@typescript-eslint/recommended` 確保型別安全
- 遵循命名慣例防止命名衝突
- 強制成員排序提高可讀性

**Angular 特定錯誤預防：**
- **元件選擇器驗證**: 確保使用正確的 `app-` 前綴和 `kebab-case`
- **指令選擇器驗證**: 確保使用 `app` 前綴和 `camelCase`
- **模板內輔處理**: 使用 `process-inline-templates` 處理內聯模板
- **無障礙性檢查**: 強制遵循 `template/accessibility` 規則

**程式碼品質保證：**
- **Prettier 整合**: 自動格式化防止格式錯誤
- **Import 排序**: 使用 `simple-import-sort` 保持一致性
- **分號強制**: 防止 ASI (自動分號插入) 問題

**防禦性程式設計範例：**
```typescript
@Component({
  selector: 'app-user-service', // ✅ 正確的前綴和格式
  templateUrl: './user-service.component.html'
})
export class UserServiceComponent {
  // ✅ 正確的命名和排序
  private readonly DEFAULT_TIMEOUT = 5000; // UPPER_CASE 常數
  private _userData = signal<User | null>(null); // camelCase + 底線
  protected __baseUrl = 'https://api.example.com'; // camelCase + 雙底線
  
  public readonly userId = input.required<string>();
  
  constructor() {
    // ✅ 正確的 effect 使用
    effect(() => {
      const id = this.userId();
      if (id) {
        this._loadUserData(id);
      }
    });
  }
  
  // ✅ Private 方法使用底線前綴
  private _loadUserData(id: string): void {
    // 實作錯誤處理
  }
  
  // ✅ 允許空的生命週期方法
  ngOnInit(): void {
    // 未來實作
  }
}
```

## 前端開發 (FRONTEND)

### 技術版本資訊 (TECHNOLOGY_VERSIONS)

**框架與程式庫版本：**
- **Angular**: 20.0.0
- **PrimeNG**: 20.0.0 (UI 元件庫)
- **@primeng/themes**: 20.0.0 (主題系統)
- **TailwindCSS**: 3.4.17 (樣式框架)
- **tailwindcss-primeui**: 0.3.4 (PrimeNG 整合)
- **TypeScript**: 5.8.2
- **Node.js**: >=18.19 <24 (引擎需求)

**輔助程式庫：**
- **PrimeIcons**: 7.0.0 (圖示庫)
- **Material Symbols**: 0.31.1 (Google 圖示)
- **RxJS**: 7.8.1 (響應式程式設計)
- **ngx-translate**: 15.0.0 (國際化)

### Angular 20 現代模板語法 (ANGULAR_20_TEMPLATE_SYNTAX)

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
} @else {
  <div class="grade-f">Needs improvement</div>
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
@for (user of users; track user.id; let i = $index, let isFirst = $first) {
  <div>Item {{ i }}: {{ user.name }}</div>
}
```

**@switch / @case / @default** - 取代 ngSwitch
```typescript
// 基本 switch 語法
@switch (userRole) {
  @case ('admin') {
    <app-admin-dashboard />
  }
  @case ('user') {
    <app-user-profile />
  }
  @default {
    <app-guest-view />
  }
}
```

**@let** - 模板變數聲明
```typescript
// 基本用法
@let userName = user.firstName + ' ' + user.lastName;
@let asyncData = data$ | async;

// 表達式簡化
@let complexData = service.getData().value;
<div>{{ complexData }}</div>

// 循環中使用
@for (item of items; track item.id) {
  @let itemTotal = item.price * item.quantity;
  <div>{{ item.name }}: {{ itemTotal | currency }}</div>
}
```

**@defer** - 延遲加載
```typescript
// 基本用法
@defer {
  <heavy-component />
} @placeholder {
  <div>Loading...</div>
}

// 觸發條件
@defer (on viewport) {
  <large-chart [data]="chartData" />
} @placeholder {
  <div>Chart placeholder</div>
} @loading {
  <div>Loading...</div>
} @error {
  <div>Failed to load</div>
}
```

**模板語法最佳實踐：**

- 優先使用新的 @if, @for, @switch 語法，避免 *ngIf, *ngFor, *ngSwitch
- @for 中的 track 表達式是必需的，用於性能優化
- 使用 @empty 處理空集合狀態
- 利用 @let 簡化複雜表達式和避免重複計算
- 使用 @defer 實現代碼分割和性能優化

#### @let - 模板變數宣告的進階使用

**作用域規則：**
```typescript
@let topLevel = value;

<div>
  @let insideDiv = value;
</div>

{{topLevel}} <!-- ✅ 有效 -->
{{insideDiv}} <!-- ✅ 有效 -->

@if (condition) {
  {{topLevel + insideDiv}} <!-- ✅ 有效 -->
  
  @let nested = value;
  
  @if (condition) {
    {{topLevel + insideDiv + nested}} <!-- ✅ 有效 -->
  }
}

<div *ngIf="condition">
  {{topLevel + insideDiv}} <!-- ✅ 有效 -->
  
  @let nestedNgIf = value;
  
  <div *ngIf="condition">
     {{topLevel + insideDiv + nestedNgIf}} <!-- ✅ 有效 -->
  </div>
</div>

{{nested}} <!-- ❌ 錯誤：不會從 @if 中提升 -->
{{nestedNgIf}} <!-- ❌ 錯誤：不會從 *ngIf 中提升 -->
```

**@let 變數的特點：**
- 作用域限定在當前視圖及其子視圖
- 不會被提升（non-hoisted）
- 支援各種資料類型和複雜表達式
- 可與 async 管道結合使用
- 自動保持值的更新

### Angular 20 Signal API 最佳實踐指南

**官方文檔參考資源：**
- 核心文檔：https://angular.dev/guide/signals
- RxJS 互操作性：https://angular.dev/ecosystem/rxjs-interop
- linkedSignal 文檔：https://angular.dev/guide/signals/linked-signal
- Resource API 文檔：https://angular.dev/guide/signals/resource

**Angular 20 已穩定的 Signal API：**
- `signal`, `computed`, `effect`（核心信號功能）
- `linkedSignal`（依賴狀態管理）
- `toSignal`, `toObservable`（RxJS 互操作性）
- `input`, `output`, `model`（元件間通訊）
- `viewChild`, `viewChildren`, `contentChild`, `contentChildren`（DOM 查詢 API）
- `afterRenderEffect`（渲染生命週期管理）

#### 核心 Signal 功能

**signal() - 可寫信號 (Writable Signal)**
信號是一個響應式容器，用於包裝值並在值發生變化時自動通知所有相關的消費者。

```typescript
// 基本使用
const count = signal(0);
const user = signal<User | null>(null);

// 讀取、設定、更新
console.log(count()); // 0
count.set(5);
count.update(value => value + 1);

// 自訂相等性檢查
const data = signal(initialData, { equal: (a, b) => a.id === b.id });
```

**computed() - 計算信號 (Computed Signal)**
唯讀信號，從其他信號派生值。具備惰性求值 (lazy evaluation) 和記憶化 (memoization) 特性，僅在依賴項變化時重新計算。

**重要限制：computed() 只能用於純函數式的狀態派生**
- 只能讀取信號數據並返回計算結果
- **禁止副作用**：不能修改 DOM、呼叫 API、修改其他狀態或輸出日誌
- **禁止非同步操作**：不能使用 async/await 或 Promise
- **必須是純函數**：相同輸入必須產生相同輸出

```typescript
// ✅ 正確用法
const firstName = signal('John');
const fullName = computed(() => `${firstName()} ${lastName()}`);
const activeUsers = computed(() => users().filter(user => user.isActive));

// ❌ 錯誤：有副作用
const invalid = computed(() => {
  console.log('log'); // ❌ 不允許
  return data.processed;
});

// ❌ 錯誤：異步操作
const asyncInvalid = computed(async () => {
  return await fetch('/api'); // ❌ 不支援
});
```

**effect() - 副作用處理 (Side Effects)**
當信號值發生變化時自動執行的操作，用於處理副作用如 DOM 操作、API 呼叫或狀態同步。

**⚠️ 關鍵限制：effect() 只能在 Angular 注入上下文（Injection Context）中調用**

這是 Angular 20 的強制要求，違反此規則會拋出 `NG0203: inject() must be called from an injection context` 錯誤。

**✅ 正確的調用位置：**
- **建構子中調用**（推薦做法）
- **Class field initializer**（作為類別屬性初始化）
- **生命週期鉤子中使用 injector 參數**（特殊情況）

**❌ 禁止的調用位置：**
- 生命週期鉤子中直接調用（如 `ngOnInit`, `ngAfterViewInit` 等）
- 事件處理器中調用
- 異步回調函數中調用
- 任何非注入上下文的方法中調用

```typescript
@Component({})
class MyComponent {
  private injector = inject(Injector);
  
  // ✅ 正確：constructor 中調用（推薦做法）
  constructor() {
    effect(() => console.log('User changed'));
  }
  
  // ✅ 正確：field initializer
  private myEffect = effect(() => console.log('Field effect'));
  
  // ✅ 正確：生命週期中使用 injector 參數
  ngOnInit() {
    effect(() => console.log('In ngOnInit'), { injector: this.injector });
  }
  
  // ❌ 錯誤：生命週期中直接調用 effect
  ngAfterViewInit() {
    effect(() => {
      // 這會拋出 NG0203 錯誤！
      console.log('This will fail!');
    });
  }
  
  // ❌ 錯誤：在事件處理器中調用
  onButtonClick() {
    effect(() => {
      // 這會拋出 NG0203 錯誤！
      console.log('This will fail!');
    });
  }
  
  // ❌ 錯誤：在異步回調中調用
  async loadData() {
    const data = await fetch('/api/data');
    effect(() => {
      // 這會拋出 NG0203 錯誤！
      console.log('This will fail!');
    });
  }
}

// ✅ 清理函數的正確使用
effect((onCleanup) => {
  const timer = setTimeout(() => {}, 1000);
  onCleanup(() => clearTimeout(timer));
});
```

#### 進階 Signal 功能

**linkedSignal() - 依賴狀態信號**
創建一個與其他狀態內在關聯的信號。

```typescript
// 基本用法
const options = signal(['A', 'B', 'C']);
const selected = linkedSignal(() => options()[0]);

// 進階用法 - 智慧選擇
const selectedOption = linkedSignal({
  source: shippingOptions,
  computation: (newOptions, previous) => {
    if (previous && newOptions.find(opt => opt.id === previous.value.id)) {
      return previous.value;
    }
    return newOptions[0];
  }
});
```

**untracked() - 不追踪讀取**
在不建立依賴關係的情況下讀取信號。

```typescript
const counter = signal(0);
const lastLogged = signal(0);

effect(() => {
  const current = counter(); // 建立依賴
  const last = untracked(() => lastLogged()); // 不建立依賴
  
  if (current !== last) {
    console.log(`Counter: ${current}`);
    lastLogged.set(current);
  }
  // 只在 counter 變化時觸發
});
```

#### RxJS 互操作

**toSignal() - Observable 轉 Signal**
將 Observable 轉換為 Signal。

```typescript
// 基本用法
const counter$ = interval(1000);
const counter = toSignal(counter$, { initialValue: 0 });

// 處理 undefined
const data$ = this.http.get<Data>('/api/data');
const data = toSignal(data$); // Signal<Data | undefined>

// 服務中使用
@Injectable({ providedIn: 'root' })
export class UserService {
  private user$ = new BehaviorSubject<User | null>(null);
  user = toSignal(this.user$, { initialValue: null });
  
  login(user: User) {
    this.user$.next(user);
  }
}
```

**toObservable() - Signal 轉 Observable**
將 Signal 轉換為 Observable。

```typescript
// 基本轉換
const count = signal(0);
const count$ = toObservable(count);

// 與 RxJS 結合
const searchQuery = signal('');
const searchResults$ = toObservable(searchQuery).pipe(
  debounceTime(300),
  switchMap(query => this.searchService.search(query))
);

// 在模板中使用
@Component({
  template: `<div *ngFor="let result of searchResults$ | async">{{ result.title }}</div>`
})
export class SearchComponent {
  searchQuery = signal('');
  searchResults$ = toObservable(this.searchQuery).pipe(
    debounceTime(300),
    switchMap(query => this.api.search(query))
  );
}
```

#### Signal-Based Component APIs

**input() - 信號輸入**
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

**model() - 雙向綁定**
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

**output() - 信號輸出**
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

#### 查詢 APIs

**viewChild() / viewChildren()**
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

**contentChild() / contentChildren()**
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

#### Signal 最佳實踐

**信號相等性語意**

```typescript
// 信號只有在語意上發生變化時才會觸發效果
const counter = signal(0);
const isEven = computed(() => counter() % 2 === 0);
effect(() => console.log(isEven() ? 'even!' : 'odd!'));

// 即使 counter 多次更新，effect 只在 isEven 的值真正改變時執行
counter.set(2); // 輸出 "even!"
counter.set(4); // 不輸出，因為仍然是 even
counter.set(6); // 不輸出，因為仍然是 even  
counter.set(7); // 輸出 "odd!"
```

**自訂相等性函數**

```typescript
import _ from 'lodash';

const data = signal(['test'], {equal: _.isEqual});

// 即使是不同的陣列實例，深度相等性函數會認為值相等，
// 信號不會觸發任何更新
data.set(['test']);
```

**1. 選擇正確的 Signal 類型**
```typescript
// signal: 本地狀態
private count = signal(0);

// computed: 派生值（純函數）
totalPrice = computed(() => this.price() * this.quantity());

// effect: 副作用（constructor 中）
constructor() {
  effect(() => console.log('Count changed:', this.count()));
}

// linkedSignal: 依賴狀態
selectedItem = linkedSignal(() => this.items()[0]);
```

**2. effect() 注入上下文規則**
```typescript
@Component({})
class MyComponent {
  private injector = inject(Injector);
  
  // ✅ 正確：constructor 中調用（推薦）
  constructor() {
    effect(() => { /* 副作用邏輯 */ });
  }
  
  // ✅ 正確：field initializer
  private myEffect = effect(() => { /* 副作用邏輯 */ });
  
  // ✅ 正確：生命週期中使用 injector
  ngOnInit() {
    effect(() => { /* 副作用邏輯 */ }, { injector: this.injector });
  }
  
  // ❌ 錯誤：生命週期中直接調用會拋出 NG0203 錯誤
  ngAfterViewInit() {
    effect(() => { /* 這會失敗！ */ }); // ❌ 缺少 injector 參數
  }
  
  // ❌ 錯誤：事件處理器中調用
  onClick() {
    effect(() => { /* 這會失敗！ */ }); // ❌ 非注入上下文
  }
}
```

**3. computed() 純函數規則**
```typescript
// ✅ 正確：純函數計算
const filteredItems = computed(() => this.items().filter(item => item.isActive));
const processedData = computed(() => this.data().processed);

// ❌ 錯誤：有副作用
const invalid = computed(() => {
  console.log('Computing...'); // ❌ 副作用
  return this.data().processed;
});

// ❌ 錯誤：非 Signal 方法
const invalid2 = computed(() => this._service.getData()); // ❌ 非 Signal

// ✅ 正確：副作用移至 effect
constructor() {
  effect(() => console.log('Data changed:', this.data()));
}
```

**4. 性能優化**
```typescript
// 避免大型物件
const userIds = signal<string[]>([]);
const usersById = signal<Map<string, User>>(new Map());

// 使用 untracked 避免不必要的依賴
effect(() => {
  const data = this.data();
  untracked(() => console.log('Updated at:', new Date()));
  processData(data);
});
```

**5. 組件中的 Signal 組織**
```typescript
@Component({})
export class TodoListComponent {
  // 輸入與輸出
  title = input.required<string>();
  todoAdded = output<Todo>();
  
  // 內部狀態
  private todos = signal<Todo[]>([]);
  private filter = signal<'all' | 'active' | 'completed'>('all');
  
  // 計算屬性
  filteredTodos = computed(() => {
    const allTodos = this.todos();
    const currentFilter = this.filter();
    switch (currentFilter) {
      case 'active': return allTodos.filter(t => !t.completed);
      case 'completed': return allTodos.filter(t => t.completed);
      default: return allTodos;
    }
  });
  
  activeTodoCount = computed(() => this.todos().filter(t => !t.completed).length);
  
  addTodo(title: string) {
    const newTodo: Todo = { id: Date.now(), title, completed: false };
    this.todos.update(todos => [...todos, newTodo]);
    this.todoAdded.emit(newTodo);
  }
}
```

**6. 錯誤處理**
```typescript
// 驗證
const email = signal('');
const emailError = computed(() => {
  const value = email();
  if (!value) return '電子郵件是必需的';
  if (!value.includes('@')) return '無效格式';
  return null;
});

// 異步錯誤處理
effect(async () => {
  try {
    const data = await fetchData(this.id());
    this.data.set(data);
  } catch (error) {
    this.error.set(error.message);
  }
});
```

**7. 類型推斷最佳實踐**
```typescript
// ✅ 推薦：使用隱式類型推斷
private _nodes = signal<NodeType[]>([]);
private _viewport = signal<Viewport>({ x: 0, y: 0, zoom: 1 });

// ❌ 避免：不必要的明確類型標註
private _nodes: WritableSignal<NodeType[]> = signal([]);
```

### Angular 20 渲染週期 API

Angular 20 穩定了新的渲染週期 API，提供精確的 DOM 操作時機控制，與傳統生命週期鉤子並行使用。

**渲染 API 概覽**

| API | 穩定版本 | 執行時機 | 適用場景 |
|-----|----------|----------|----------|
| `afterRenderEffect()` | Angular 20 | Signal 變化後的渲染完成時 | 響應式 DOM 操作 |
| `afterEveryRender()` | Angular 20 (重命名自 afterRender) | 每次渲染完成後 | 持續性 DOM 同步 |
| `afterNextRender()` | Angular 20 (穩定) | 下次渲染完成後（一次性） | 一次性 DOM 測量/初始化 |

**渲染 API 與生命週期鉤子的關係**

**執行順序圖（初始化）：**
```
constructor → Change Detection Cycle → Rendering → afterNextRender → afterEveryRender
                ↓
        ngOnChanges → ngOnInit → ngDoCheck → ngAfterContentInit → ngAfterViewInit → ngAfterContentChecked → ngAfterViewChecked
```

**執行順序圖（後續更新）：**
```
Change Detection Cycle → Rendering → afterEveryRender
        ↓
ngOnChanges → ngDoCheck → ngAfterContentChecked → ngAfterViewChecked
```

#### 渲染階段 (Phases)

Angular 20 的渲染 API 支援四個執行階段，按順序執行。階段通過物件屬性方式指定，而非 enum：

**階段執行順序**
1. **earlyRead** - 早期讀取：在後續寫入前讀取 DOM
2. **write** - 寫入：修改 DOM
3. **mixedReadWrite** - 混合讀寫：同時讀寫 DOM（避免使用）
4. **read** - 讀取：最終讀取階段

**階段使用指導原則**

- **earlyRead**: 在寫入前讀取 DOM，用於自定義佈局計算。永遠不要在此階段寫入 DOM
- **write**: 專門用於寫入 DOM。永遠不要在此階段讀取 DOM  
- **mixedReadWrite**: 同時讀寫 DOM。**避免使用**以防止性能降級
- **read**: 專門用於讀取 DOM。永遠不要在此階段寫入 DOM

#### afterRenderEffect() - 響應式渲染效果

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

#### afterEveryRender() - 每次渲染後執行

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

#### afterNextRender() - 下次渲染後執行

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

#### 渲染 API 最佳實踐

**1. 選擇合適的 API**

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

**2. 正確使用階段**

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

**3. 階段協調模式**

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

**4. SVG 測量專用模式**

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

**注入上下文要求**

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

**性能考量**

1. **避免 MixedReadWrite**: 可能導致顯著性能降級
2. **使用適當階段**: Read 和 Write 階段性能最佳
3. **階段值傳播**: afterRenderEffect 中的 signal 傳播提供自動優化
4. **瀏覽器專用**: 所有渲染 API 在 SSR 中不執行

### Resource API (實驗性)

Resource API 在 Angular 20 中仍為實驗性功能，用於處理異步數據的響應式管理。

**基本用法：**
```typescript
import { resource } from '@angular/core';

const userResource = resource({
  // 定義響應式計算 - 當任何讀取的信號改變時，params 值會重新計算
  params: () => ({id: userId()}),
  
  // 定義異步載入器 - 每當 params 值改變時，resource 會呼叫此函數
  loader: ({params}) => fetchUser(params),
});

// 基於 resource 載入器結果創建計算信號
const firstName = computed(() => userResource.value().firstName);
```

**支援取消請求：**
```typescript
const userResource = resource({
  params: () => ({id: userId()}),
  loader: ({request, abortSignal}): Promise<User> => {
    // fetch 在給定的 AbortSignal 指示請求已被中止時，
    // 會取消任何未完成的 HTTP 請求
    return fetch(`users/${request.id}`, {signal: abortSignal});
  },
});
```

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

### 注意事項

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
9. **模板字串字面值支援**：Angular 表達式支援模板字串字面值，如 `` `Hello ${name}` ``
10. **toObservable 的非同步特性**：`toObservable` 值是異步發出的，即使同步更新多次信號，Observable 也只會發出最終穩定的值。