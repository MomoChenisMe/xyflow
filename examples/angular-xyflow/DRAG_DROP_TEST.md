# Angular XYFlow 拖拉功能測試指南

## 建置測試

1. **檢查建置是否成功**
   ```bash
   cd examples/angular-xyflow
   npm run build
   ```
   - 應該看到成功訊息：`Application bundle generation complete`
   - 可能會有 bundle size 警告，這是正常的

## 功能測試

1. **啟動開發服務器**
   ```bash
   pnpm dev
   ```

2. **手動測試**
   - 訪問 http://localhost:4200/examples/basic
   - 打開瀏覽器的開發者工具（F12）
   - 切換到 Console 標籤

3. **測試單節點拖拉**
   - 點擊任意節點（例如 "Node 1"）
   - 按住滑鼠左鍵並拖動
   - 觀察 Console 中的日誌：
     - 應該看到 `NodeWrapper handleMouseDown triggered`
     - 應該看到 `🔥 NodeWrapper [nodeId] - Drag delta:` 訊息
     - 應該看到 `🔥 onNodesChange called with` 訊息
     - 應該看到 `Node [nodeId] position changed from` 訊息

4. **自動化測試**
   ```bash
   npx playwright test tests/drag-drop-verification.spec.ts --headed
   ```

5. **預期結果**
   - 節點應該跟隨滑鼠移動
   - Console 應該顯示位置更新的日誌
   - 釋放滑鼠後，節點應該停留在新位置

## 調試訊息說明

- `NodeWrapper handleMouseDown triggered` - 滑鼠按下事件被偵測到
- `🔥 NodeWrapper [nodeId] - Drag delta:` - 拖拉移動量計算完成
- `🔥 onNodesChange called with` - NodeRenderer 發送了位置更新
- `Node [nodeId] position changed from` - Basic 組件接收到位置變化
- `🔄 NodeWrapper [nodeId] - Position updated` - NodeWrapper 偵測到位置更新

## 如果拖拉不工作

1. **檢查 Console 錯誤**
   - 查看是否有任何 JavaScript 錯誤

2. **檢查事件流程**
   - 確認 `handleMouseDown` 有被觸發
   - 確認 `isDraggable` 為 true
   - 確認有看到 drag delta 訊息

3. **檢查位置更新**
   - 確認 `onNodesChange` 有被調用
   - 確認節點位置值有變化

## 已修復的問題

1. **移除重複的位置更新** - NodeRenderer 和 Basic 組件都在更新位置，造成節點移動兩倍距離
2. **添加變更檢測** - 確保 Angular 的 OnPush 策略下 UI 能正確更新
3. **修正事件綁定** - 移除模板中重複的 `[nodes]` 綁定