# Firebase 規則部署說明

## 新增的 Firebase 規則

為了支援每日匯率記錄功能，需要更新 Firebase Firestore 規則。

### 新增的規則

```javascript
// 允許已認證用戶讀寫每日匯率記錄
match /dailyExchangeRates/{dateId} {
  allow read, write: if request.auth != null;
}
```

### 部署步驟

1. **安裝 Firebase CLI**（如果尚未安裝）：
   ```bash
   npm install -g firebase-tools
   ```

2. **登入 Firebase**：
   ```bash
   firebase login
   ```

3. **初始化專案**（如果尚未初始化）：
   ```bash
   firebase init firestore
   ```

4. **部署規則**：
   ```bash
   firebase deploy --only firestore:rules
   ```

5. **部署索引**（可選，提升查詢效能）：
   ```bash
   firebase deploy --only firestore:indexes
   ```

### 規則說明

- **`records`**：收入/支出記錄，所有已認證用戶可讀寫
- **`assets`**：資產記錄，所有已認證用戶可讀寫
- **`exchangeRates`**：當前匯率，所有已認證用戶可讀寫
- **`dailyExchangeRates`**：每日匯率記錄，所有已認證用戶可讀寫
- **`users`**：用戶資料，只能讀寫自己的資料
- **`userSettings`**：用戶設定，只能讀寫自己的設定

### 安全考量

目前的規則允許所有已認證用戶讀寫所有記錄。如果需要更嚴格的權限控制，可以考慮：

1. **用戶隔離**：每個用戶只能讀寫自己的記錄
2. **角色權限**：根據用戶角色設定不同權限
3. **時間限制**：限制只能修改最近幾天的記錄

### 索引優化

新增的索引可以提升以下查詢的效能：
- 按日期排序的記錄查詢
- 按成員篩選的記錄查詢
- 按類型篩選的記錄查詢
- 按順序排序的資產查詢
- 按日期排序的匯率查詢
