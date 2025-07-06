// Firebase 配置文件

// Firebase 配置信息
const firebaseConfig = {
  apiKey: "AIzaSyBxySh2TTR3X3UDDNfXx0aFC2HwAajmxUw",
  authDomain: "travel-handbook-ea379.firebaseapp.com",
  databaseURL: "https://travel-handbook-ea379-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "travel-handbook-ea379",
  storageBucket: "travel-handbook-ea379.firebasestorage.app",
  messagingSenderId: "1093875607752",
  appId: "1:1093875607752:web:dbef62fecaffce59ed1dfd"
};

// 初始化 Firebase
function initFirebase() {
  try {
    // 檢查 Firebase SDK 是否已載入
    if (typeof firebase === 'undefined') {
      console.error('Firebase SDK 未載入，請確保網路連接正常');
      return null;
    }
    
    // 檢查 Firebase 是否已經初始化
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    
    // 測試連接
    const database = firebase.database();
    if (!database) {
      throw new Error('無法獲取 Firebase Database 實例');
    }
    
    console.log('Firebase 初始化成功');
    return firebase;
  } catch (error) {
    console.error('Firebase 初始化失敗:', error);
    return null;
  }
}

// 嘗試初始化 Firebase，最多重試 3 次
function initFirebaseWithRetry(maxRetries = 3, delay = 1000) {
  let retries = 0;
  
  function attempt() {
    const firebase = initFirebase();
    if (firebase || retries >= maxRetries) {
      return firebase;
    }
    
    retries++;
    console.log(`Firebase 初始化失敗，${delay/1000}秒後重試 (${retries}/${maxRetries})...`);
    
    setTimeout(attempt, delay);
  }
  
  return attempt();
}

// 將函數暴露到全域
window.initFirebase = initFirebase;
window.firebaseConfig = firebaseConfig;

// 立即初始化 Firebase
const firebaseInstance = initFirebaseWithRetry();
