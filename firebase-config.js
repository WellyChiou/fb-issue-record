// Firebase 配置管理
// 統一的 Firebase 專案配置

const FIREBASE_CONFIGS = {
    qa: {
        apiKey: "AIzaSyCuTlQfSUTlgig_NF7bKV448v35UEuB0aA",
        authDomain: "fb-issue-record.firebaseapp.com",
        projectId: "fb-issue-record",
        storageBucket: "fb-issue-record.firebasestorage.app",
        messagingSenderId: "892738349977",
        appId: "1:892738349977:web:004b30f804e2937692c108"
    },
    expenses: {
        apiKey: "AIzaSyDfHs1XXsCXGMSVF3NFJUtFMcslTzTd-EU",
        authDomain: "expenses-91280.firebaseapp.com",
        projectId: "expenses-91280",
        storageBucket: "expenses-91280.firebasestorage.app",
        messagingSenderId: "777956465315",
        appId: "1:777956465315:web:04f85f2b22f2468eb2fd16",
        measurementId: "G-1LE7YTKHGT"
    }
};

// 系統資訊
const SYSTEM_INFO = {
    qa: {
        name: "QA Tracker",
        description: "工作記錄與問題追蹤系統",
        features: ["任務管理", "問題追蹤", "進度分析"],
        redirectUrl: "tracker.html"
    },
    expenses: {
        name: "家庭記帳系統",
        description: "個人與家庭財務管理系統",
        features: ["收支記錄", "多成員管理", "財務分析"],
        redirectUrl: "expenses.html"
    }
};

// 匯出配置（如果使用模組系統）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FIREBASE_CONFIGS, SYSTEM_INFO };
}
