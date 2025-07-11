// Firebase Realtime Database 服務模組

class DatabaseService {
  constructor() {
    // 初始化狀態
    this.initialized = false;
    
    try {
      // 初始化 Firebase
      const firebase = window.initFirebase ? window.initFirebase() : window.firebase;
      if (!firebase) {
        console.error('Firebase 未初始化，請確保 firebase-config.js 已正確載入');
        return;
      }
      
      // 獲取資料庫實例
      this.database = firebase.database();
      if (!this.database) {
        console.error('無法獲取 Firebase Database 實例');
        return;
      }
      
      // 定義資料節點路徑
      this.refs = {
        comments: this.database.ref('comments'),
        activityComments: this.database.ref('activityComments'),
        userProfiles: this.database.ref('userProfiles'),
        inviteCodes: this.database.ref('inviteCodes'),
        lastViewTimes: this.database.ref('lastViewTimes'),
        confirmationItems: this.database.ref('confirmationItems'),
        packingItems: this.database.ref('packingItems'),
        foodItems: this.database.ref('foodItems'),
        activities: this.database.ref('activities')
      };
      
      // 標記初始化成功
      this.initialized = true;
      console.log('DatabaseService 初始化成功');
    } catch (error) {
      console.error('DatabaseService 初始化失敗:', error);
    }
  }
  
  // 檢查服務是否已初始化
  isInitialized() {
    return this.initialized;
  }

  // ===== 全域留言相關方法 =====
  
  // 獲取所有留言
  async getComments() {
    try {
      const snapshot = await this.refs.comments.once('value');
      return snapshot.val() || [];
    } catch (error) {
      console.error('獲取留言失敗:', error);
      return [];
    }
  }

  // 監聽留言變化
  onCommentsChange(callback) {
    this.refs.comments.on('value', (snapshot) => {
      const comments = snapshot.val() || [];
      callback(comments);
    });
  }

  // 保存留言
  async saveComments(comments) {
    try {
      await this.refs.comments.set(comments);
      return true;
    } catch (error) {
      console.error('保存留言失敗:', error);
      return false;
    }
  }

  // 添加新留言
  async addComment(comment) {
    try {
      // 獲取當前留言列表
      const comments = await this.getComments();
      // 將新留言添加到列表開頭
      comments.unshift(comment);
      // 保存更新後的留言列表
      await this.saveComments(comments);
      return true;
    } catch (error) {
      console.error('添加留言失敗:', error);
      return false;
    }
  }

  // 添加回復
  async addReply(commentId, reply) {
    try {
      // 獲取當前留言列表
      const comments = await this.getComments();
      // 查找要回復的留言
      const findAndAddReply = (commentsList, id) => {
        for (let comment of commentsList) {
          if (comment.id === id) {
            // 確保 replies 屬性存在
            if (!comment.replies) comment.replies = [];
            // 添加回復
            comment.replies.push(reply);
            return true;
          }
          // 遞迴搜尋回復中的留言
          if (comment.replies && comment.replies.length > 0) {
            if (findAndAddReply(comment.replies, id)) return true;
          }
        }
        return false;
      };

      // 嘗試添加回復
      if (findAndAddReply(comments, commentId)) {
        // 保存更新後的留言列表
        await this.saveComments(comments);
        return true;
      } else {
        console.error('找不到要回復的留言');
        return false;
      }
    } catch (error) {
      console.error('添加回復失敗:', error);
      return false;
    }
  }

  // ===== 活動留言相關方法 =====
  
  // 獲取特定活動的留言
  async getActivityComments(activityId) {
    try {
      const snapshot = await this.refs.activityComments.child(activityId).once('value');
      return snapshot.val() || [];
    } catch (error) {
      console.error(`獲取活動 ${activityId} 的留言失敗:`, error);
      return [];
    }
  }

  // 獲取所有活動留言
  async getAllActivityComments() {
    try {
      const snapshot = await this.refs.activityComments.once('value');
      return snapshot.val() || {};
    } catch (error) {
      console.error('獲取所有活動留言失敗:', error);
      return {};
    }
  }

  // 監聽活動留言變化
  onActivityCommentsChange(activityId, callback) {
    this.refs.activityComments.child(activityId).on('value', (snapshot) => {
      const comments = snapshot.val() || [];
      callback(comments);
    });
  }

  // 監聽所有活動留言變化
  onAllActivityCommentsChange(callback) {
    this.refs.activityComments.on('value', (snapshot) => {
      const allComments = snapshot.val() || {};
      callback(allComments);
    });
  }

  // 保存活動留言
  async saveActivityComments(activityId, comments) {
    try {
      await this.refs.activityComments.child(activityId).set(comments);
      return true;
    } catch (error) {
      console.error(`保存活動 ${activityId} 的留言失敗:`, error);
      return false;
    }
  }

  // 添加活動留言
  async addActivityComment(activityId, comment) {
    try {
      // 獲取當前活動留言列表
      const comments = await this.getActivityComments(activityId);
      // 將新留言添加到列表
      comments.push(comment);
      // 保存更新後的留言列表
      await this.saveActivityComments(activityId, comments);
      return true;
    } catch (error) {
      console.error(`添加活動 ${activityId} 的留言失敗:`, error);
      return false;
    }
  }

  // 添加活動留言回復
  async addActivityReply(activityId, commentId, reply) {
    try {
      // 獲取當前活動留言列表
      const comments = await this.getActivityComments(activityId);
      // 查找要回復的留言
      const findAndAddReply = (commentsList, id) => {
        for (let comment of commentsList) {
          if (comment.id === id) {
            // 確保 replies 屬性存在
            if (!comment.replies) comment.replies = [];
            // 添加回復
            comment.replies.push(reply);
            return true;
          }
          // 遞迴搜尋回復中的留言
          if (comment.replies && comment.replies.length > 0) {
            if (findAndAddReply(comment.replies, id)) return true;
          }
        }
        return false;
      };

      // 嘗試添加回復
      if (findAndAddReply(comments, commentId)) {
        // 保存更新後的留言列表
        await this.saveActivityComments(activityId, comments);
        return true;
      } else {
        console.error('找不到要回復的留言');
        return false;
      }
    } catch (error) {
      console.error(`添加活動 ${activityId} 的回復失敗:`, error);
      return false;
    }
  }

  // ===== 用戶相關方法 =====
  
  // 獲取所有用戶資料
  async getUserProfiles() {
    try {
      const snapshot = await this.refs.userProfiles.once('value');
      return snapshot.val() || [];
    } catch (error) {
      console.error('獲取用戶資料失敗:', error);
      return [];
    }
  }

  // 保存用戶資料
  async saveUserProfiles(profiles) {
    try {
      await this.refs.userProfiles.set(profiles);
      return true;
    } catch (error) {
      console.error('保存用戶資料失敗:', error);
      return false;
    }
  }

  // 添加用戶資料
  async addUserProfile(profile) {
    try {
      // 獲取當前用戶列表
      const profiles = await this.getUserProfiles();
      // 檢查用戶是否已存在
      if (!profiles.find(p => p.name === profile.name)) {
        // 添加新用戶
        profiles.push(profile);
        // 保存更新後的用戶列表
        await this.saveUserProfiles(profiles);
      }
      return true;
    } catch (error) {
      console.error('添加用戶資料失敗:', error);
      return false;
    }
  }

  // ===== 最後查看時間相關方法 =====
  
  // 獲取最後查看時間
  async getLastViewTimes() {
    try {
      const snapshot = await this.refs.lastViewTimes.once('value');
      return snapshot.val() || {};
    } catch (error) {
      console.error('獲取最後查看時間失敗:', error);
      return {};
    }
  }

  // 獲取特定活動的最後查看時間
  async getLastViewTime(userId, activityId) {
    try {
      const snapshot = await this.refs.lastViewTimes.child(userId).child(activityId).once('value');
      return snapshot.val() || new Date(0).toISOString();
    } catch (error) {
      console.error(`獲取用戶 ${userId} 對活動 ${activityId} 的最後查看時間失敗:`, error);
      return new Date(0).toISOString();
    }
  }

  // 更新最後查看時間
  async updateLastViewTime(userId, activityId, timestamp) {
    try {
      const timeToSet = timestamp || new Date().toISOString();
      await this.refs.lastViewTimes.child(userId).child(activityId).set(timeToSet);
      return true;
    } catch (error) {
      console.error(`更新用戶 ${userId} 對活動 ${activityId} 的最後查看時間失敗:`, error);
      return false;
    }
  }
  
  // 獲取特定待確認事項的最後查看時間
  async getConfirmationItemLastViewTime(userId, itemId) {
    try {
      // 如果 confirmationItemViewTimes 引用不存在，創建它
      if (!this.refs.confirmationItemViewTimes) {
        this.refs.confirmationItemViewTimes = this.database.ref('confirmationItemViewTimes');
      }
      
      const snapshot = await this.refs.confirmationItemViewTimes.child(userId).child(itemId).once('value');
      return snapshot.val() || new Date(0).toISOString();
    } catch (error) {
      console.error(`獲取用戶 ${userId} 對待確認事項 ${itemId} 的最後查看時間失敗:`, error);
      return new Date(0).toISOString();
    }
  }

  // 更新待確認事項最後查看時間
  async updateConfirmationItemLastViewTime(userId, itemId) {
    try {
      // 如果 confirmationItemViewTimes 引用不存在，創建它
      if (!this.refs.confirmationItemViewTimes) {
        this.refs.confirmationItemViewTimes = this.database.ref('confirmationItemViewTimes');
      }
      
      const now = new Date().toISOString();
      await this.refs.confirmationItemViewTimes.child(userId).child(itemId).set(now);
      return true;
    } catch (error) {
      console.error(`更新用戶 ${userId} 對待確認事項 ${itemId} 的最後查看時間失敗:`, error);
      return false;
    }
  }

  // ===== 邀請碼相關方法 =====
  
  // 驗證邀請碼
  async verifyInviteCode(code) {
    // 檢查是否為硬編碼的特殊邀請碼
    const hardcodedCode = '0808..';
    if (code === hardcodedCode) {
      console.log('使用硬編碼邀請碼驗證成功');
      return true;
    }
    
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法驗證邀請碼');
      return false;
    }
    
    try {
      // 檢查 refs 和 inviteCodes 是否存在
      if (!this.refs || !this.refs.inviteCodes) {
        console.error('inviteCodes 引用不存在');
        return false;
      }
      
      // 檢查 code 是否為有效字串
      if (!code || typeof code !== 'string') {
        console.error('邀請碼格式無效:', code);
        return false;
      }
      
      // 檢查 code 是否包含 Firebase 路徑中不允許的特殊字元
      if (code.includes('.') || code.includes('#') || 
          code.includes('$') || code.includes('[') || code.includes(']')) {
        console.warn('邀請碼包含特殊字元，無法在 Firebase 中驗證:', code);
        return false;
      }
      
      const snapshot = await this.refs.inviteCodes.child(code).once('value');
      return snapshot.exists();
    } catch (error) {
      console.error('驗證邀請碼失敗:', error);
      return false;
    }
  }

  // 初始化邀請碼（僅在首次設置時使用）
  async initializeInviteCodes(codes) {
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法初始化邀請碼');
      return false;
    }
    
    try {
      // 檢查 refs 和 inviteCodes 是否存在
      if (!this.refs || !this.refs.inviteCodes) {
        console.error('inviteCodes 引用不存在');
        return false;
      }
      
      // 檢查邀請碼是否已存在
      const snapshot = await this.refs.inviteCodes.once('value');
      if (!snapshot.exists()) {
        // 如果不存在，則初始化邀請碼
        const codeObj = {};
        const invalidCodes = [];
        const hardcodedCode = '0808..';
        
        codes.forEach(code => {
          // 跳過硬編碼的特殊邀請碼，因為它包含特殊字元
          if (code === hardcodedCode) {
            console.log('跳過硬編碼邀請碼，它將在客戶端驗證');
            return;
          }
          
          // 檢查 code 是否為有效字串
          if (code && typeof code === 'string' && !code.includes('.') && !code.includes('#') && 
              !code.includes('$') && !code.includes('[') && !code.includes(']')) {
            codeObj[code] = true;
          } else {
            invalidCodes.push(code);
            console.warn('跳過無效的邀請碼:', code);
          }
        });
        
        // 如果有無效的邀請碼，記錄它們
        if (invalidCodes.length > 0) {
          console.warn(`跳過 ${invalidCodes.length} 個無效的邀請碼:`, invalidCodes);
        }
        
        // 確保至少有一個有效的邀請碼
        if (Object.keys(codeObj).length > 0) {
          await this.refs.inviteCodes.set(codeObj);
          console.log('成功初始化邀請碼:', Object.keys(codeObj));
        } else {
          // 如果沒有有效的邀請碼，但有硬編碼的特殊邀請碼，仍然返回成功
          if (codes.includes(hardcodedCode)) {
            console.log('僅使用硬編碼邀請碼，不需要在 Firebase 中初始化');
            return true;
          }
          console.error('沒有有效的邀請碼可初始化');
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error('初始化邀請碼失敗:', error);
      return false;
    }
  }
}

// 創建資料庫服務實例並暴露到全域
const dbService = new DatabaseService();

// 將資料庫服務暴露到全域
window.dbService = dbService;

// 為了相容性，添加一些別名方法
dbService.listenToComments = dbService.onCommentsChange;
dbService.listenToActivityComments = dbService.onActivityCommentsChange;
dbService.listenToAllActivityComments = dbService.onAllActivityCommentsChange;
dbService.listenToUserProfiles = function(callback) {
  this.refs.userProfiles.on('value', (snapshot) => {
    const profiles = snapshot.val() || [];
    callback(profiles);
  });
};
dbService.saveUserProfile = dbService.addUserProfile;
// 添加獲取單個用戶資料的方法
dbService.getUserProfile = async function(userName) {
  try {
    const profiles = await this.getUserProfiles();
    return profiles.find(profile => profile.name === userName) || null;
  } catch (error) {
    console.error('獲取單個用戶資料失敗:', error);
    return null;
  }
};

// ===== 待確認事項相關方法 =====

// 獲取待確認事項
dbService.getConfirmationItems = async function() {
  try {
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法獲取待確認事項');
      return null;
    }
    
    // 檢查 refs 和 confirmationItems 是否存在
    if (!this.refs || !this.refs.confirmationItems) {
      console.error('confirmationItems 引用不存在');
      return null;
    }
    
    const snapshot = await this.refs.confirmationItems.once('value');
    return snapshot.val() || [];
  } catch (error) {
    console.error('從 Firebase 獲取待確認事項失敗:', error);
    return null;
  }
};

// 獲取待確認事項討論
dbService.getConfirmationItemComments = async function(itemId) {
  try {
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法獲取待確認事項討論');
      return null;
    }
    
    // 檢查 refs 是否存在
    if (!this.refs) {
      console.error('refs 不存在');
      return null;
    }
    
    // 如果 confirmationItemComments 引用不存在，創建它
    if (!this.refs.confirmationItemComments) {
      this.refs.confirmationItemComments = this.database.ref('confirmationItemComments');
    }
    
    const snapshot = await this.refs.confirmationItemComments.child(itemId).once('value');
    return snapshot.val() || [];
  } catch (error) {
    console.error(`獲取待確認事項 ${itemId} 的討論失敗:`, error);
    return [];
  }
};

// 保存待確認事項討論
dbService.saveConfirmationItemComments = async function(itemId, comments) {
  try {
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法保存待確認事項討論');
      return false;
    }
    
    // 檢查 refs 是否存在
    if (!this.refs) {
      console.error('refs 不存在');
      return false;
    }
    
    // 如果 confirmationItemComments 引用不存在，創建它
    if (!this.refs.confirmationItemComments) {
      this.refs.confirmationItemComments = this.database.ref('confirmationItemComments');
    }
    
    await this.refs.confirmationItemComments.child(itemId).set(comments);
    return true;
  } catch (error) {
    console.error(`保存待確認事項 ${itemId} 的討論失敗:`, error);
    return false;
  }
};

// 監聽待確認事項討論變化
dbService.listenToConfirmationItemComments = function(itemId, callback) {
  // 檢查服務是否已初始化
  if (!this.initialized) {
    console.warn('DatabaseService 未初始化，無法監聽待確認事項討論變化');
    return;
  }
  
  // 檢查 refs 是否存在
  if (!this.refs) {
    console.error('refs 不存在');
    return;
  }
  
  // 如果 confirmationItemComments 引用不存在，創建它
  if (!this.refs.confirmationItemComments) {
    this.refs.confirmationItemComments = this.database.ref('confirmationItemComments');
  }
  
  this.refs.confirmationItemComments.child(itemId).on('value', (snapshot) => {
    const comments = snapshot.val() || [];
    callback(comments);
  });
};

// 監聽所有待確認事項討論變化
dbService.listenToAllConfirmationItemComments = function(callback) {
  // 檢查服務是否已初始化
  if (!this.initialized) {
    console.warn('DatabaseService 未初始化，無法監聽所有待確認事項討論變化');
    return;
  }
  
  // 檢查 refs 是否存在
  if (!this.refs) {
    console.error('refs 不存在');
    return;
  }
  
  // 如果 confirmationItemComments 引用不存在，創建它
  if (!this.refs.confirmationItemComments) {
    this.refs.confirmationItemComments = this.database.ref('confirmationItemComments');
  }
  
  this.refs.confirmationItemComments.on('value', (snapshot) => {
    const allComments = snapshot.val() || {};
    callback(allComments);
  });
};

// 保存待確認事項
dbService.saveConfirmationItems = async function(items) {
  try {
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法保存待確認事項');
      return false;
    }
    
    // 檢查 refs 和 confirmationItems 是否存在
    if (!this.refs || !this.refs.confirmationItems) {
      console.error('confirmationItems 引用不存在');
      return false;
    }
    
    // 處理 null 值和 undefined 值，Firebase 不接受這些值
    const processedItems = items.map(item => {
      const processedItem = {...item};
      // 將 null 值或 undefined 值轉換為空字串
      if (processedItem.confirmedAt === null || processedItem.confirmedAt === undefined) {
        processedItem.confirmedAt = '';
      }
      if (processedItem.confirmedBy === null || processedItem.confirmedBy === undefined) {
        processedItem.confirmedBy = '';
      }
      // 確保所有屬性都不是 undefined，Firebase 不接受 undefined 值
      Object.keys(processedItem).forEach(key => {
        if (processedItem[key] === undefined) {
          processedItem[key] = '';
        }
      });
      return processedItem;
    });
    
    await this.refs.confirmationItems.set(processedItems);
    return true;
  } catch (error) {
    console.error('儲存待確認事項到 Firebase 失敗:', error);
    return false;
  }
};

// 監聽待確認事項變化
dbService.onConfirmationItemsChange = function(callback) {
  // 檢查服務是否已初始化
  if (!this.initialized) {
    console.warn('DatabaseService 未初始化，無法監聽待確認事項變化');
    return;
  }
  
  // 檢查 refs 和 confirmationItems 是否存在
  if (!this.refs || !this.refs.confirmationItems) {
    console.error('confirmationItems 引用不存在');
    return;
  }
  
  this.refs.confirmationItems.on('value', (snapshot) => {
    const items = snapshot.val() || [];
    callback(items);
  });
};

// 為了相容性，添加別名方法
dbService.listenToConfirmationItems = dbService.onConfirmationItemsChange;

// ===== 打包清單相關方法 =====

// 獲取用戶的打包清單
dbService.getUserPackingItems = async function(userId) {
  try {
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法獲取打包清單');
      return null;
    }
    
    // 檢查 refs 和 packingItems 是否存在
    if (!this.refs || !this.refs.packingItems) {
      console.error('packingItems 引用不存在');
      return null;
    }
    
    const snapshot = await this.refs.packingItems.child(userId).once('value');
    return snapshot.val() || [];
  } catch (error) {
    console.error(`從 Firebase 獲取用戶 ${userId} 的打包清單失敗:`, error);
    return null;
  }
};

// 保存用戶的打包清單
dbService.saveUserPackingItems = async function(userId, items) {
  try {
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法保存打包清單');
      return false;
    }
    
    // 檢查 refs 和 packingItems 是否存在
    if (!this.refs || !this.refs.packingItems) {
      console.error('packingItems 引用不存在');
      return false;
    }
    
    // 處理數據，確保沒有 undefined 值
    const processedItems = items.map(item => {
      const processedItem = {...item};
      // 確保所有屬性都不是 undefined，Firebase 不接受 undefined 值
      Object.keys(processedItem).forEach(key => {
        if (processedItem[key] === undefined) {
          processedItem[key] = '';
        }
      });
      return processedItem;
    });
    
    await this.refs.packingItems.child(userId).set(processedItems);
    console.log(`成功保存用戶 ${userId} 的打包清單到 Firebase`);
    return true;
  } catch (error) {
    console.error(`保存用戶 ${userId} 的打包清單到 Firebase 失敗:`, error);
    return false;
  }
};

// 監聽用戶打包清單變化
dbService.onUserPackingItemsChange = function(userId, callback) {
  // 檢查服務是否已初始化
  if (!this.initialized) {
    console.warn('DatabaseService 未初始化，無法監聽打包清單變化');
    return;
  }
  
  // 檢查 refs 和 packingItems 是否存在
  if (!this.refs || !this.refs.packingItems) {
    console.error('packingItems 引用不存在');
    return;
  }
  
  this.refs.packingItems.child(userId).on('value', (snapshot) => {
    const items = snapshot.val() || [];
    callback(items);
  });
};

// 添加打包清單項目
dbService.addPackingItem = async function(userId, item) {
  try {
    // 獲取當前打包清單
    const items = await this.getUserPackingItems(userId);
    if (items === null) {
      console.error('無法獲取當前打包清單');
      return false;
    }
    
    // 添加新項目
    items.push(item);
    
    // 保存更新後的清單
    return await this.saveUserPackingItems(userId, items);
  } catch (error) {
    console.error(`添加打包清單項目失敗:`, error);
    return false;
  }
};

// 更新打包清單項目狀態
dbService.updatePackingItemStatus = async function(userId, itemId, checked) {
  try {
    // 獲取當前打包清單
    const items = await this.getUserPackingItems(userId);
    if (items === null) {
      console.error('無法獲取當前打包清單');
      return false;
    }
    
    // 查找並更新項目
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      items[itemIndex].checked = checked;
      
      // 保存更新後的清單
      return await this.saveUserPackingItems(userId, items);
    } else {
      console.error(`找不到 ID 為 ${itemId} 的打包清單項目`);
      return false;
    }
  } catch (error) {
    console.error(`更新打包清單項目狀態失敗:`, error);
    return false;
  }
};

// 刪除打包清單項目
dbService.deletePackingItem = async function(userId, itemId) {
  try {
    // 獲取當前打包清單
    const items = await this.getUserPackingItems(userId);
    if (items === null) {
      console.error('無法獲取當前打包清單');
      return false;
    }
    
    // 過濾掉要刪除的項目
    const updatedItems = items.filter(item => item.id !== itemId);
    
    // 保存更新後的清單
    return await this.saveUserPackingItems(userId, updatedItems);
  } catch (error) {
    console.error(`刪除打包清單項目失敗:`, error);
    return false;
  }
};

// 重置用戶打包清單為預設項目
dbService.resetUserPackingList = async function(userId, defaultItems) {
  try {
    return await this.saveUserPackingItems(userId, defaultItems);
  } catch (error) {
    console.error(`重置用戶 ${userId} 的打包清單失敗:`, error);
    return false;
  }
};

// 為了相容性，添加別名方法
dbService.listenToUserPackingItems = dbService.onUserPackingItemsChange;

// ===== 美食管理相關方法 =====

// 獲取所有美食項目
dbService.getFoodItems = async function() {
  try {
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法獲取美食項目');
      return null;
    }
    
    // 檢查 refs 和 foodItems 是否存在
    if (!this.refs || !this.refs.foodItems) {
      console.error('foodItems 引用不存在');
      return null;
    }
    
    const snapshot = await this.refs.foodItems.once('value');
    return snapshot.val() || [];
  } catch (error) {
    console.error('從 Firebase 獲取美食項目失敗:', error);
    return null;
  }
};

// 保存美食項目列表
dbService.saveFoodItems = async function(items) {
  try {
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法保存美食項目');
      return false;
    }
    
    // 檢查 refs 和 foodItems 是否存在
    if (!this.refs || !this.refs.foodItems) {
      console.error('foodItems 引用不存在');
      return false;
    }
    
    // 處理數據，確保沒有 undefined 值
    const processedItems = items.map(item => {
      const processedItem = {...item};
      // 確保所有屬性都不是 undefined，Firebase 不接受 undefined 值
      Object.keys(processedItem).forEach(key => {
        if (processedItem[key] === undefined) {
          processedItem[key] = '';
        }
      });
      return processedItem;
    });
    
    await this.refs.foodItems.set(processedItems);
    console.log('成功保存美食項目到 Firebase');
    return true;
  } catch (error) {
    console.error('保存美食項目到 Firebase 失敗:', error);
    return false;
  }
};

// 監聽美食項目變化
dbService.onFoodItemsChange = function(callback) {
  // 檢查服務是否已初始化
  if (!this.initialized) {
    console.warn('DatabaseService 未初始化，無法監聽美食項目變化');
    return;
  }
  
  // 檢查 refs 和 foodItems 是否存在
  if (!this.refs || !this.refs.foodItems) {
    console.error('foodItems 引用不存在');
    return;
  }
  
  this.refs.foodItems.on('value', (snapshot) => {
    const items = snapshot.val() || [];
    callback(items);
  });
};

// 添加美食項目
dbService.addFoodItem = async function(item) {
  try {
    // 獲取當前美食列表
    const items = await this.getFoodItems();
    if (items === null) {
      console.error('無法獲取當前美食列表');
      return false;
    }
    
    // 添加新項目
    items.push(item);
    
    // 保存更新後的列表
    return await this.saveFoodItems(items);
  } catch (error) {
    console.error('添加美食項目失敗:', error);
    return false;
  }
};

// 更新美食項目
dbService.updateFoodItem = async function(itemId, updatedItem) {
  try {
    // 獲取當前美食列表
    const items = await this.getFoodItems();
    if (items === null) {
      console.error('無法獲取當前美食列表');
      return false;
    }
    
    // 查找並更新項目
    const itemIndex = items.findIndex(item => item.id === itemId);
    if (itemIndex !== -1) {
      items[itemIndex] = { ...items[itemIndex], ...updatedItem };
      
      // 保存更新後的列表
      return await this.saveFoodItems(items);
    } else {
      console.error(`找不到 ID 為 ${itemId} 的美食項目`);
      return false;
    }
  } catch (error) {
    console.error('更新美食項目失敗:', error);
    return false;
  }
};

// 刪除美食項目
dbService.deleteFoodItem = async function(itemId) {
  try {
    // 獲取當前美食列表
    const items = await this.getFoodItems();
    if (items === null) {
      console.error('無法獲取當前美食列表');
      return false;
    }
    
    // 過濾掉要刪除的項目
    const updatedItems = items.filter(item => item.id !== itemId);
    
    // 保存更新後的列表
    return await this.saveFoodItems(updatedItems);
  } catch (error) {
    console.error('刪除美食項目失敗:', error);
    return false;
  }
};

// 為了相容性，添加別名方法
dbService.listenToFoodItems = dbService.onFoodItemsChange;

// ===== 行程管理相關方法 =====

// 獲取所有行程資料
dbService.getActivities = async function() {
  try {
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法獲取行程資料');
      return null;
    }
    
    // 檢查 refs 和 activities 是否存在
    if (!this.refs || !this.refs.activities) {
      console.error('activities 引用不存在');
      return null;
    }
    
    const snapshot = await this.refs.activities.once('value');
    return snapshot.val() || {};
  } catch (error) {
    console.error('從 Firebase 獲取行程資料失敗:', error);
    return null;
  }
};

// 保存行程資料
dbService.saveActivities = async function(activities) {
  try {
    // 檢查服務是否已初始化
    if (!this.initialized) {
      console.warn('DatabaseService 未初始化，無法保存行程資料');
      return false;
    }
    
    // 檢查 refs 和 activities 是否存在
    if (!this.refs || !this.refs.activities) {
      console.error('activities 引用不存在');
      return false;
    }
    
    // 處理數據，確保沒有 undefined 值
    const processedActivities = {};
    Object.keys(activities).forEach(dayKey => {
      processedActivities[dayKey] = activities[dayKey].map(activity => {
        const processedActivity = {...activity};
        // 確保所有屬性都不是 undefined，Firebase 不接受 undefined 值
        Object.keys(processedActivity).forEach(key => {
          if (processedActivity[key] === undefined) {
            processedActivity[key] = '';
          }
        });
        return processedActivity;
      });
    });
    
    await this.refs.activities.set(processedActivities);
    console.log('成功保存行程資料到 Firebase');
    return true;
  } catch (error) {
    console.error('保存行程資料到 Firebase 失敗:', error);
    return false;
  }
};

// 監聽行程資料變化
dbService.onActivitiesChange = function(callback) {
  // 檢查服務是否已初始化
  if (!this.initialized) {
    console.warn('DatabaseService 未初始化，無法監聽行程資料變化');
    return;
  }
  
  // 檢查 refs 和 activities 是否存在
  if (!this.refs || !this.refs.activities) {
    console.error('activities 引用不存在');
    return;
  }
  
  this.refs.activities.on('value', (snapshot) => {
    const activities = snapshot.val() || {};
    callback(activities);
  });
};

// 獲取特定天數的行程
dbService.getDayActivities = async function(dayNumber) {
  try {
    const allActivities = await this.getActivities();
    if (allActivities === null) {
      return null;
    }
    return allActivities[`day${dayNumber}`] || [];
  } catch (error) {
    console.error(`獲取第${dayNumber}天行程失敗:`, error);
    return null;
  }
};

// 保存特定天數的行程
dbService.saveDayActivities = async function(dayNumber, activities) {
  try {
    const allActivities = await this.getActivities() || {};
    allActivities[`day${dayNumber}`] = activities;
    return await this.saveActivities(allActivities);
  } catch (error) {
    console.error(`保存第${dayNumber}天行程失敗:`, error);
    return false;
  }
};

// 添加行程
dbService.addActivity = async function(dayNumber, activity) {
  try {
    const dayActivities = await this.getDayActivities(dayNumber) || [];
    dayActivities.push(activity);
    return await this.saveDayActivities(dayNumber, dayActivities);
  } catch (error) {
    console.error(`添加第${dayNumber}天行程失敗:`, error);
    return false;
  }
};

// 更新行程
dbService.updateActivity = async function(dayNumber, activityId, updatedActivity) {
  try {
    const dayActivities = await this.getDayActivities(dayNumber);
    if (dayActivities === null) {
      console.error('無法獲取當前行程列表');
      return false;
    }
    
    const activityIndex = dayActivities.findIndex(activity => activity.id === activityId);
    if (activityIndex !== -1) {
      dayActivities[activityIndex] = { ...dayActivities[activityIndex], ...updatedActivity };
      return await this.saveDayActivities(dayNumber, dayActivities);
    } else {
      console.error(`找不到 ID 為 ${activityId} 的行程`);
      return false;
    }
  } catch (error) {
    console.error(`更新第${dayNumber}天行程失敗:`, error);
    return false;
  }
};

// 刪除行程
dbService.deleteActivity = async function(dayNumber, activityId) {
  try {
    const dayActivities = await this.getDayActivities(dayNumber);
    if (dayActivities === null) {
      console.error('無法獲取當前行程列表');
      return false;
    }
    
    const updatedActivities = dayActivities.filter(activity => activity.id !== activityId);
    return await this.saveDayActivities(dayNumber, updatedActivities);
  } catch (error) {
    console.error(`刪除第${dayNumber}天行程失敗:`, error);
    return false;
  }
};

// 為了相容性，添加別名方法
dbService.listenToActivities = dbService.onActivitiesChange;