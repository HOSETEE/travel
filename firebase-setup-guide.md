# Firebase Realtime Database 整合及串接設定說明

本文檔將指導您如何將旅行手冊應用與 Firebase Realtime Database 整合，以實現雲端資料儲存和多裝置同步功能。

## 目錄

1. [Firebase 專案設置](#1-firebase-專案設置)
2. [取得 Firebase 配置資訊](#2-取得-firebase-配置資訊)
3. [更新配置文件](#3-更新配置文件)
4. [資料庫規則設置](#4-資料庫規則設置)
5. [初始化資料](#5-初始化資料)
6. [常見問題與解決方案](#6-常見問題與解決方案)

## 1. Firebase 專案設置

### 1.1 創建 Firebase 專案

1. 前往 [Firebase 控制台](https://console.firebase.google.com/)
2. 點擊「新增專案」
3. 輸入專案名稱（例如：「travel-handbook」）
4. 選擇是否啟用 Google Analytics（可選）
5. 接受條款並點擊「建立專案」

### 1.2 啟用 Realtime Database

1. 在 Firebase 控制台左側選單中，點擊「Realtime Database」
2. 點擊「建立資料庫」
3. 選擇資料庫位置（建議選擇離您最近的區域，例如亞洲的話可選「asia-east1」）
4. 在安全規則設置中，選擇「以測試模式啟動」（稍後我們會修改安全規則）
5. 點擊「啟用」

## 2. 取得 Firebase 配置資訊

1. 在 Firebase 控制台左側選單中，點擊「專案設置」（齒輪圖示）
2. 在「一般」標籤下，捲動至「您的應用程式」區段
3. 點擊「</>」圖示（網頁應用程式）
4. 輸入應用程式暱稱（例如：「travel-handbook-web」）
5. 點擊「註冊應用程式」
6. 您將看到一段包含 Firebase 配置資訊的程式碼，如下所示：

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  databaseURL: "YOUR_DATABASE_URL",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

7. 複製這段配置資訊，我們將在下一步驟中使用

## 3. 更新配置文件

1. 打開專案中的 `js/firebase-config.js` 文件
2. 將您剛才複製的 Firebase 配置資訊貼上，替換現有的預設值

```javascript
// Firebase 配置文件

// Firebase 配置信息
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",            // 替換為您的 API Key
  authDomain: "YOUR_AUTH_DOMAIN",    // 替換為您的 Auth Domain
  databaseURL: "YOUR_DATABASE_URL",  // 替換為您的 Database URL
  projectId: "YOUR_PROJECT_ID",      // 替換為您的 Project ID
  storageBucket: "YOUR_STORAGE_BUCKET", // 替換為您的 Storage Bucket
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // 替換為您的 Messaging Sender ID
  appId: "YOUR_APP_ID"              // 替換為您的 App ID
};

// 初始化 Firebase
function initFirebase() {
  // 檢查 Firebase 是否已經初始化
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return firebase;
}

export { initFirebase, firebaseConfig };
```

## 4. 資料庫規則設置

為了保護您的資料，您需要設置適當的資料庫安全規則。

1. 在 Firebase 控制台中，點擊「Realtime Database」
2. 點擊「規則」標籤
3. 將以下規則複製並貼上：

```json
{
  "rules": {
    ".read": true,
    ".write": true,
    "comments": {
      ".read": true,
      ".write": true
    },
    "activityComments": {
      ".read": true,
      ".write": true
    },
    "userProfiles": {
      ".read": true,
      ".write": true
    },
    "lastViewTimes": {
      ".read": true,
      ".write": true
    },
    "inviteCodes": {
      ".read": true,
      ".write": false
    }
  }
}
```

> **注意**：這些規則允許任何人讀取和寫入您的資料庫（除了邀請碼只能讀取不能寫入）。在實際生產環境中，您應該設置更嚴格的規則，例如基於用戶身份驗證的規則。

4. 點擊「發布」保存規則

## 5. 初始化資料

首次使用 Firebase 時，您需要初始化一些基本資料。

### 5.1 設置邀請碼

1. 在 Firebase 控制台中，點擊「Realtime Database」
2. 點擊「資料」標籤
3. 點擊「+」按鈕添加新節點
4. 輸入節點名稱：`inviteCodes`
5. 點擊「+」按鈕添加子節點
6. 輸入邀請碼作為鍵（例如：`0808..`），值設為 `true`
7. 點擊「新增」

### 5.2 初始化用戶資料（可選）

如果您想預設一些用戶資料，可以按照以下步驟操作：

1. 在 Firebase 控制台中，點擊「Realtime Database」
2. 點擊「資料」標籤
3. 點擊「+」按鈕添加新節點
4. 輸入節點名稱：`userProfiles`
5. 點擊「+」按鈕添加子節點
6. 輸入索引值（例如：`0`）
7. 設置值為 JSON 格式：

```json
{
  "name": "小雷",
  "joinDate": "2024-01-01"
}
```

8. 重複步驟 5-7 添加更多用戶

## 6. 常見問題與解決方案

### 6.1 無法連接到 Firebase

**問題**：應用無法連接到 Firebase 資料庫。

**解決方案**：
- 確認您的網絡連接正常
- 檢查 `firebase-config.js` 中的配置資訊是否正確
- 確認 Firebase 專案中的 Realtime Database 已啟用
- 檢查瀏覽器控制台是否有錯誤訊息

### 6.2 資料無法同步

**問題**：資料無法正確同步到 Firebase。

**解決方案**：
- 檢查資料庫規則是否允許寫入操作
- 確認您的程式碼中使用了正確的資料結構
- 檢查 Firebase 控制台中的使用量，確保未超出免費方案限制

### 6.3 資料結構問題

**問題**：Firebase 中的資料結構與應用預期不符。

**解決方案**：
- 使用 Firebase 控制台手動調整資料結構
- 在應用中添加資料遷移邏輯，將舊格式資料轉換為新格式

---

如有任何問題或需要進一步協助，請聯繫系統管理員。