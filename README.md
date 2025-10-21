# 多系統整合平台

![Version](https://img.shields.io/badge/version-2.1-blue)
![Status](https://img.shields.io/badge/status-active-success)

一個整合多個系統的平台，包含 QA 工作記錄追蹤系統和家庭記帳系統，使用 Firebase 作為後端資料庫，支援 Google 帳號登入。

## 🏗️ 系統架構

### 📦 包含系統
1. **QA Tracker** - 工作記錄與問題追蹤系統
2. **家庭記帳系統** - 個人與家庭財務管理系統
3. **統一登入入口** - 系統選擇與認證管理

### 🔧 技術架構
- **前端**: HTML5 + Tailwind CSS + Vanilla JavaScript
- **後端**: Firebase (Authentication + Firestore)
- **部署**: 靜態檔案，支援任何網頁伺服器

## ✨ 主要功能

### 🎯 QA Tracker 系統

#### 📝 Issue 管理
- ✅ 新增、編輯、刪除 Issue 記錄
- ✅ 追蹤 Issue 狀態（執行中、執行中止、完成）
- ✅ 記錄測試日期、預計交付日期、完成日期
- ✅ 標記 Bug、Test Plan、驗證失敗等資訊
- ✅ 支援多種類型（BUG、改善、優化、模組、QA）

### 🔍 搜尋與篩選
- ✅ 關鍵字搜尋（功能、備註、Issue 編號）
- ✅ 依狀態篩選
- ✅ 依類型篩選
- ✅ 依 Test Plan 篩選
- ✅ 依發現 BUG 篩選

### 📊 資料匯出
- ✅ 匯出 Excel 格式
- ✅ 自動依季度分頁（Q1-Q4）
- ✅ 產生每月和季度摘要報告
- ✅ 包含統計數據（優化項目、測試報告、驗證單等）

### 🔗 GitLab 整合
- ✅ 查詢 GitLab Issues
- ✅ 批次匯入 Issues 到系統
- ✅ 自動填入預設值
- ✅ 防止重複匯入

### 💰 家庭記帳系統

#### 📊 財務管理
- ✅ 收支記錄與分類管理
- ✅ 多成員記帳支援
- ✅ 圖表分析與統計
- ✅ 資產管理與追蹤
- ✅ 月度/年度報表

#### 🎨 介面特色
- ✅ 現代化的漸層設計
- ✅ 響應式排版（手機、平板、桌面）
- ✅ 流暢的動畫效果
- ✅ 直觀的操作流程
- ✅ 清晰的視覺回饋

## 🚀 開始使用

### 前置需求
1. Google 帳號（用於登入）
2. 現代化的瀏覽器（Chrome、Firefox、Safari、Edge）
3. 網路連線

### 部署步驟

#### 1. Firebase 設定
```
1. 前往 Firebase Console (https://console.firebase.google.com/)
2. 建立新專案或使用現有專案
3. 啟用 Authentication > Google 登入
4. 啟用 Firestore Database
5. 複製 Firebase Config 到程式碼中
```

#### 2. Firestore 安全規則
在 Firebase Console 設定以下安全規則：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // records 集合：僅登入使用者可讀寫自己建立的資料
    match /records/{recordId} {
      allow read: if request.auth != null 
                  && resource.data.created_by_uid == request.auth.uid;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null 
                            && resource.data.created_by_uid == request.auth.uid;
    }
    
    // users 集合：僅可讀寫自己的資料
    match /users/{userId} {
      allow read, write: if request.auth != null 
                         && request.auth.uid == userId;
    }
    
    // config 集合：所有登入使用者可讀
    match /config/{configId} {
      allow read: if request.auth != null;
      allow write: if false; // 僅管理員可修改
    }
  }
}
```

#### 3. GitLab Token 設定（選用）
如需使用 GitLab 整合功能：

```
1. 在 GitLab 產生 Personal Access Token
2. 在 Firestore 建立文件：config/gitlab
3. 新增欄位：token: "your-gitlab-token"
```

#### 4. 上傳檔案
```
1. 將 tracker.html 和 login.html 上傳到網頁伺服器
2. 或使用 Firebase Hosting 部署：
   - npm install -g firebase-tools
   - firebase init hosting
   - firebase deploy
```

## 📖 使用說明

### 登入
1. 開啟 `index.html`（統一登入入口）
2. 選擇要使用的系統（QA Tracker 或家庭記帳）
3. 點擊「使用 Google 登入」
4. 選擇您的 Google 帳號

### 新增 Issue
1. 點擊「新增 Issue」按鈕
2. 填寫 Issue Number（必填）
3. 選擇狀態、類型等資訊
4. 填寫其他相關欄位
5. 點擊「儲存」

### 搜尋與篩選
1. 在篩選區域輸入條件
2. 點擊「搜尋」按鈕
3. 使用「清空」按鈕重置篩選

### 編輯 Issue
1. 在列表中找到要編輯的 Issue
2. 點擊「✏️」編輯按鈕
3. 修改資料後點擊「儲存」

### 匯出 Excel
1. 設定好篩選條件（可選）
2. 點擊「匯出 Excel」按鈕
3. 檔案會自動下載為 `records.xlsx`

### 匯入 GitLab Issues
1. 點擊「GitLab Issues」按鈕
2. 輸入 Assignee 和 Project 路徑
3. 點擊「查詢 Issues」
4. 勾選要匯入的 Issues
5. 點擊「匯入選取」

## 🎯 欄位說明

### 基本資訊
- **Issue Number**: GitLab Issue 編號（必填）
- **狀態**: 執行中、執行中止、完成
- **類型**: BUG、改善、優化、模組、QA
- **功能**: 功能描述

### 日期欄位
- **開始測試日期**: Issue 開始測試的日期
- **預計交付日期**: 預計完成的日期（預設為本週五）
- **完成日期**: 實際完成的日期

### 測試相關
- **Test Plan**: 是否有測試計畫
- **測試案例**: 測試案例數量
- **檔案數量**: 相關檔案數量

### Bug 追蹤
- **發現 BUG**: 是否發現 Bug
- **可優化項目**: Bug 包含的優化項目數（僅在發現 BUG=是 時填寫）
- **驗證失敗**: 驗證是否失敗

### 其他
- **Memo**: 備註說明

## 🎨 色彩說明

### 狀態標籤
- 🟢 **執行中**: 綠色
- ⚪ **執行中止**: 灰色
- 🟠 **完成**: 橘色

### 類型標籤
- 🔴 **BUG**: 紅色
- 🔵 **改善/優化**: 藍色
- ⚪ **模組/QA**: 灰色

### 特殊標記
- 🟣 **Test Plan**: 紫色背景
- 🟡 **發現 BUG**: 黃色背景
- 🔴 **驗證失敗**: 紅色背景

## 🔧 技術架構

### 前端技術
- **HTML5**: 語意化標籤
- **Tailwind CSS**: Utility-first CSS 框架
- **Vanilla JavaScript**: 無框架依賴
- **Google Fonts**: Inter + Noto Sans TC

### 後端服務
- **Firebase Authentication**: Google OAuth 登入
- **Firestore Database**: NoSQL 雲端資料庫
- **Firebase Hosting**: 靜態網站託管（選用）

### 第三方套件
- **SheetJS (XLSX)**: Excel 匯出功能
- **Font Awesome**: 圖示庫
- **Heroicons**: SVG 圖示

## 📊 資料結構

### Records Collection
```javascript
{
  id: "auto-generated",
  issue_number: 1234,
  status: 1, // 0=執行中止, 1=執行中, 2=完成
  category: 1, // 1=BUG, 2=改善, 3=優化, 4=模組, 5=QA
  feature: "功能描述",
  memo: "備註",
  test_plan: "0", // "0"=否, "1"=是
  bug_found: 0, // 0=否, 1=是
  verify_failed: 0, // 0=否, 1=是
  optimization_points: 0,
  test_cases: 0,
  file_count: 0,
  test_start_date: Timestamp,
  eta_date: Timestamp,
  completed_at: Timestamp,
  issue_link: "https://gitlab.example.com/...",
  created_by_uid: "user-uid",
  created_at: Timestamp,
  updated_by_uid: "user-uid",
  updated_at: Timestamp
}
```

## 🐛 已知問題

目前無已知問題。如發現問題，請記錄並回報。

## 🔜 未來規劃

- [ ] 深色模式支援
- [ ] 自訂欄位
- [ ] 更多圖表統計
- [ ] 匯出 PDF 報告
- [ ] Email 通知
- [ ] 更多 GitLab 功能整合

## 📄 授權

此專案僅供內部使用。

## 👤 維護者

Welly Chiu

---

**最後更新**: 2025/10/15  
**版本**: 2.0

