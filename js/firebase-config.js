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
  // 檢查 Firebase 是否已經初始化
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return firebase;
}

// 將函數暴露到全域
window.initFirebase = initFirebase;
window.firebaseConfig = firebaseConfig;

// 立即初始化 Firebase
const firebaseInstance = initFirebase();
