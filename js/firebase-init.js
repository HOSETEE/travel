// Firebase 初始化和資料遷移腳本

// 使用全域變數
const firebase = window.firebase;

// 從 localStorage 遷移資料到 Firebase
async function migrateDataToFirebase() {
  try {
    // 檢查 dbService 是否已初始化
    if (!window.dbService || !window.dbService.isInitialized || !window.dbService.isInitialized()) {
      console.warn('DatabaseService 未初始化，無法遷移資料');
      return false;
    }
    
    console.log('開始資料遷移...');
    
    // 遷移全域留言
    const localComments = JSON.parse(localStorage.getItem('comments') || '[]');
    if (localComments.length > 0) {
      console.log(`遷移 ${localComments.length} 條全域留言...`);
      await dbService.saveComments(localComments);
    }
    
    // 遷移活動留言
    const localActivityComments = JSON.parse(localStorage.getItem('activityComments') || '{}');
    if (Object.keys(localActivityComments).length > 0) {
      console.log(`遷移 ${Object.keys(localActivityComments).length} 個活動的留言...`);
      for (const activityId in localActivityComments) {
        await dbService.saveActivityComments(activityId, localActivityComments[activityId]);
      }
    }
    
    // 遷移用戶資料
    const localUserProfiles = JSON.parse(localStorage.getItem('userProfiles') || '[]');
    if (localUserProfiles.length > 0) {
      console.log(`遷移 ${localUserProfiles.length} 個用戶資料...`);
      await dbService.saveUserProfiles(localUserProfiles);
    }
    
    // 初始化邀請碼
    await dbService.initializeInviteCodes(['0808..']);
    
    console.log('資料遷移完成！');
    
    // 標記遷移已完成
    localStorage.setItem('dataMigrated', 'true');
    
    return true;
  } catch (error) {
    console.error('資料遷移失敗:', error);
    return false;
  }
}

// 檢查是否需要遷移資料
async function checkAndMigrateData() {
  // 檢查 dbService 是否已初始化
  const dbServiceReady = window.dbService && window.dbService.isInitialized && window.dbService.isInitialized();
  
  // 檢查是否已經遷移過
  const migrated = localStorage.getItem('dataMigrated') === 'true';
  
  // 如果 Firebase 未初始化，直接返回
  if (!dbServiceReady) {
    console.warn('DatabaseService 未初始化，跳過資料遷移檢查');
    return false;
  }
  
  if (!migrated) {
    // 顯示遷移提示
    const confirmed = confirm('檢測到本地資料尚未遷移到雲端。是否立即遷移資料？\n\n注意：遷移後您的留言和設定將保存在雲端，可在多裝置間同步。');
    
    if (confirmed) {
      // 顯示遷移中提示
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        text-align: center;
        font-size: 16px;
      `;
      notification.innerHTML = `
        <div>資料遷移中，請稍候...</div>
        <div style="margin-top: 10px; font-size: 12px;">請勿關閉或重新整理頁面</div>
      `;
      document.body.appendChild(notification);
      
      // 執行遷移
      const success = await migrateDataToFirebase();
      
      // 移除提示
      document.body.removeChild(notification);
      
      if (success) {
        alert('資料遷移成功！您的資料現在已保存在雲端，可在多裝置間同步。');
      } else {
        alert('資料遷移失敗，請稍後再試。您可以繼續使用本地儲存模式。');
      }
    }
  }
  
  return migrated;
}

// 將函數暴露到全域
window.checkAndMigrateData = checkAndMigrateData;
window.migrateDataToFirebase = migrateDataToFirebase;