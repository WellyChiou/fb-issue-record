# 快速開始指南 ⚡

## 📦 專案文件

```
gitlab_/
├── tracker.html            # 主頁面（QA Tracker）
├── login.html              # 登入頁面
├── README.md               # 完整使用說明
├── OPTIMIZATION_SUMMARY.md # 優化總結
├── BEFORE_AFTER.md         # 優化前後對比
└── QUICK_START.md          # 本文件
```

## 🚀 30 秒快速部署

### 1. Firebase 設定（5分鐘）

```bash
# 步驟 1: 前往 Firebase Console
https://console.firebase.google.com/

# 步驟 2: 建立專案
點擊「新增專案」→ 輸入專案名稱 → 完成

# 步驟 3: 啟用功能
Authentication → 登入方法 → 啟用 Google
Firestore Database → 建立資料庫 → 生產模式

# 步驟 4: 取得設定
專案設定 → 應用程式 → Web → 複製 firebaseConfig
```

### 2. 修改程式碼（2分鐘）

```javascript
// 在 tracker.html (第 36-43 行) 和 login.html (第 86-92 行)
// 替換為你的 Firebase Config

const firebaseConfig = {
  apiKey: "你的-API-KEY",
  authDomain: "你的-專案.firebaseapp.com",
  projectId: "你的-專案-ID",
  storageBucket: "你的-專案.firebasestorage.app",
  messagingSenderId: "你的-SENDER-ID",
  appId: "你的-APP-ID"
};
```

### 3. 設定安全規則（1分鐘）

```javascript
// Firestore Database → 規則 → 複製貼上

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /records/{recordId} {
      allow read, write: if request.auth != null 
                         && resource.data.created_by_uid == request.auth.uid;
      allow create: if request.auth != null;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
    match /config/{configId} {
      allow read: if request.auth != null;
    }
  }
}
```

### 4. 上傳並測試（2分鐘）

```bash
# 選項 A: 使用 Firebase Hosting
firebase init hosting
firebase deploy

# 選項 B: 上傳到任何網頁伺服器
上傳 tracker.html 和 login.html 到伺服器
```

## ✅ 完成！

現在您可以：
1. 開啟 `login.html`
2. 使用 Google 帳號登入
3. 開始使用 QA Tracker

---

## 🎯 常見問題

### Q: 為什麼登入後一片空白？
**A:** 檢查 Firebase Config 是否正確，並確認已啟用 Google 登入。

### Q: 無法讀取/寫入資料？
**A:** 檢查 Firestore 安全規則是否正確設定。

### Q: GitLab 功能無法使用？
**A:** 需要在 Firestore 建立 `config/gitlab` 文件並設定 `token` 欄位。

### Q: 如何限制可登入的使用者？
**A:** 在 Firestore 安全規則中加入 email 白名單檢查。

### Q: 如何備份資料？
**A:** 使用「匯出 Excel」功能，或在 Firebase Console 進行資料匯出。

---

## 📱 瀏覽器支援

| 瀏覽器 | 最低版本 | 建議版本 |
|--------|----------|----------|
| Chrome | 90+ | 最新版 |
| Firefox | 88+ | 最新版 |
| Safari | 14+ | 最新版 |
| Edge | 90+ | 最新版 |

---

## 🎨 自訂化

### 修改品牌顏色

```javascript
// tracker.html (第 23-35 行)
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: { 
          600: '#你的顏色', 
          700: '#你的顏色', 
          800: '#你的顏色' 
        }
      }
    }
  }
}
```

### 修改標題

```html
<!-- tracker.html (第 249 行) -->
<h1>你的系統名稱</h1>

<!-- login.html (第 78 行) -->
<h2>你的系統名稱</h2>
```

---

## 🔗 相關連結

- [Firebase 文件](https://firebase.google.com/docs)
- [Tailwind CSS 文件](https://tailwindcss.com/docs)
- [GitLab API 文件](https://docs.gitlab.com/ee/api/)

---

## 📞 需要幫助？

查看完整文件：
- 📖 [README.md](README.md) - 完整使用說明
- 📊 [OPTIMIZATION_SUMMARY.md](OPTIMIZATION_SUMMARY.md) - 優化細節
- 🎨 [BEFORE_AFTER.md](BEFORE_AFTER.md) - 優化對比

---

**祝您使用愉快！** 🎉

