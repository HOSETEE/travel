// Google Sheets API 同步服務
// 這個檔案包含與 Google Sheets 整合的所有功能

class TravelSyncService {
    constructor() {
        this.isOnline = navigator.onLine;
        this.syncInterval = null;
        this.pendingChanges = [];
        this.lastSyncTime = localStorage.getItem('lastSyncTime') || new Date(0).toISOString();
        this.config = {
            syncIntervalMs: 30000, // 30秒同步一次
            retryAttempts: 3,
            retryDelayMs: 5000,
            // Google Apps Script 設定
            gasApiUrl: 'https://script.google.com/macros/s/AKfycbyRALsCw3JCm7xZ_WV3iQPM6Oob_0XtUpt4DGz-3ns22t0C25mXzkW3AKXdNb2wRLps/exec', // 請填入您的 Google Apps Script Web App URL
            gasApiKey: '', // 可選：API 金鑰
            enableWebhook: false, // 是否啟用 Webhook
            webhookUrl: '' // Webhook URL（用於即時通知）
        };
        
        this.initializeSync();
    }

    // 初始化同步服務
    initializeSync() {
        // 監聽網路狀態
        this.onlineHandler = () => {
            this.isOnline = true;
            this.showNotification('網路連線已恢復，正在同步資料...', 'success');
            this.syncPendingChanges();
        };
        
        this.offlineHandler = () => {
            this.isOnline = false;
            this.showNotification('網路連線中斷，將在恢復後自動同步', 'warning');
        };
        
        window.addEventListener('online', this.onlineHandler);
        window.addEventListener('offline', this.offlineHandler);

        // 設定 Webhook 監聽（如果啟用）
        if (this.config.enableWebhook) {
            this.setupWebhookListener();
        }
        
        // 啟動定期同步
        this.startSync();

        // 頁面關閉前同步
        window.addEventListener('beforeunload', () => {
            if (this.pendingChanges.length > 0) {
                this.syncToCloud();
            }
        });
    }
    
    // 啟動同步
    startSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
        }
        
        this.syncInterval = setInterval(() => {
            if (this.isOnline) {
                this.syncFromCloud();
            }
        }, this.config.syncIntervalMs);
    }
    
    // 停止同步
    stopSync() {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
        }
    }

    // 從雲端同步資料
    async syncFromCloud() {
        if (!this.isOnline || !this.config.gasApiUrl) {
            console.log('離線狀態或未設定 API URL，跳過雲端同步');
            return false;
        }
        
        try {
            console.log('正在從雲端同步資料...');
            
            const url = `${this.config.gasApiUrl}?action=getComments&lastSync=${encodeURIComponent(this.lastSyncTime)}`;
            
            const response = await fetch(url, {
                method: 'GET',
                // 減少自訂 headers 以避免 CORS 預檢
                // headers: {
                //     'Content-Type': 'application/json',
                //     ...(this.config.gasApiKey && { 'Authorization': `Bearer ${this.config.gasApiKey}` })
                // }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || '同步失敗');
            }
            
            if (result.comments && Object.keys(result.comments).length > 0) {
                this.mergeCloudData({ comments: result.comments });
                this.showNotification('成功同步新留言', 'success');
            }
            
            this.lastSyncTime = new Date().toISOString();
            localStorage.setItem('lastSyncTime', this.lastSyncTime);
            
            return true;
        } catch (error) {
            console.error('雲端同步失敗:', error);
            this.showNotification(`同步失敗: ${error.message}`, 'error');
            return false;
        }
    }

    // 上傳資料到雲端
    async syncToCloud() {
        if (this.pendingChanges.length === 0) return true;
        
        return await this.uploadToCloud(this.pendingChanges);
    }
    
    // 上傳資料到雲端
    async uploadToCloud(changes) {
        if (!this.isOnline || !this.config.gasApiUrl) {
            console.log('離線狀態或未設定 API URL，將資料加入待同步列表');
            return false;
        }
        
        try {
            console.log('正在上傳資料到雲端...', changes);
            
            const payload = {
                action: 'updateComments',
                changes: changes,
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch(this.config.gasApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || '上傳失敗');
            }
            
            // 清除已成功上傳的變更
            this.pendingChanges = [];
            localStorage.removeItem('pendingChanges');
            this.showNotification('資料已同步到雲端', 'success');
            
            console.log('資料上傳成功');
            return true;
        } catch (error) {
            console.error('上傳失敗:', error);
            this.showNotification(`上傳失敗: ${error.message}，資料已暫存本地`, 'warning');
            return false;
        }
    }

    // 添加留言到待同步列表
    addComment(activityId, comment) {
        const change = {
            type: 'add_comment',
            activityId: activityId,
            comment: comment,
            timestamp: new Date().toISOString(),
            userId: currentUser ? currentUser.name : 'anonymous'
        };

        this.pendingChanges.push(change);
        localStorage.setItem('pendingChanges', JSON.stringify(this.pendingChanges));

        // 立即嘗試同步
        if (this.isOnline) {
            this.syncToCloud();
        }
    }

    // 添加回復到待同步列表
    addReply(activityId, commentId, reply) {
        const change = {
            type: 'add_reply',
            activityId: activityId,
            commentId: commentId,
            reply: reply,
            timestamp: new Date().toISOString(),
            userId: currentUser ? currentUser.name : 'anonymous'
        };

        this.pendingChanges.push(change);
        localStorage.setItem('pendingChanges', JSON.stringify(this.pendingChanges));

        if (this.isOnline) {
            this.syncToCloud();
        }
    }

    // 合併雲端資料
    mergeCloudData(cloudComments) {
        // 載入本地資料
        const localComments = JSON.parse(localStorage.getItem('activityComments') || '{}');
        
        // 合併邏輯：雲端資料優先，但保留本地未同步的資料
        Object.keys(cloudComments).forEach(activityId => {
            if (!localComments[activityId]) {
                localComments[activityId] = [];
            }

            // 合併留言，避免重複
            cloudComments[activityId].forEach(cloudComment => {
                const existingComment = localComments[activityId].find(c => c.id === cloudComment.id);
                if (!existingComment) {
                    localComments[activityId].push(cloudComment);
                } else {
                    // 更新現有留言的回復
                    if (cloudComment.replies && cloudComment.replies.length > existingComment.replies.length) {
                        existingComment.replies = cloudComment.replies;
                    }
                }
            });

            // 按時間排序
            localComments[activityId].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        });

        // 儲存合併後的資料
        localStorage.setItem('activityComments', JSON.stringify(localComments));
        activityComments = localComments;

        // 更新 UI
        this.updateAllActivityComments();
        updateUnreadIndicators();
    }

    // 更新所有活動的留言顯示
    updateAllActivityComments() {
        // 找到所有已開啟的討論區並重新渲染
        document.querySelectorAll('.activity-discussion').forEach(discussionDiv => {
            if (discussionDiv.style.display !== 'none' && discussionDiv.innerHTML !== '') {
                const activityId = discussionDiv.id;
                renderActivityComments(activityId);
            }
        });
    }

    // 同步待處理的變更
    async syncPendingChanges() {
        const saved = localStorage.getItem('pendingChanges');
        if (saved) {
            this.pendingChanges = JSON.parse(saved);
            await this.syncToCloud();
        }
    }

    // 顯示通知
    showNotification(message, type = 'info') {
        if (typeof showNotification === 'function') {
            showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // 設定配置
    configure(config) {
        const oldConfig = { ...this.config };
        this.config = { ...this.config, ...config };
        
        // 如果 Webhook 設定改變，重新設定監聽器
        if (oldConfig.enableWebhook !== this.config.enableWebhook) {
            if (this.config.enableWebhook) {
                this.setupWebhookListener();
            } else {
                this.removeWebhookListener();
            }
        }
        
        // 重新啟動同步服務
        this.stopSync();
        this.startSync();
        
        console.log('同步服務配置已更新:', this.config);
    }
    
    // 設定配置（別名）
    setConfig(newConfig) {
        this.configure(newConfig);
    }

    // 手動觸發同步
    async manualSync() {
        this.showNotification('正在手動同步...', 'info');
        await this.syncToCloud();
        await this.syncFromCloud();
    }

    // 設定 Webhook 監聽器
    setupWebhookListener() {
        if (!this.config.enableWebhook || !this.config.webhookUrl) return;
        
        // 使用 Server-Sent Events 或 WebSocket 監聽即時更新
        // 這裡使用輪詢作為簡單實現
        this.webhookInterval = setInterval(async () => {
            await this.syncFromCloud();
        }, 10000); // 每10秒檢查一次
        
        console.log('Webhook 監聽器已啟動');
    }
    
    // 移除 Webhook 監聽器
    removeWebhookListener() {
        if (this.webhookInterval) {
            clearInterval(this.webhookInterval);
            this.webhookInterval = null;
            console.log('Webhook 監聽器已停止');
        }
    }
    
    // 初始化 Google Sheets
    async initializeGoogleSheets() {
        if (!this.config.gasApiUrl) {
            throw new Error('請先設定 Google Apps Script API URL');
        }
        
        try {
            const response = await fetch(this.config.gasApiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.gasApiKey && { 'Authorization': `Bearer ${this.config.gasApiKey}` })
                },
                body: JSON.stringify({ action: 'initializeSheet' })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            this.showNotification('Google Sheets 初始化成功', 'success');
            return true;
        } catch (error) {
            console.error('初始化失敗:', error);
            this.showNotification(`初始化失敗: ${error.message}`, 'error');
            return false;
        }
    }
    
    // 檢查服務狀態
    async checkServiceStatus() {
        if (!this.config.gasApiUrl) {
            return { status: 'not_configured', message: '未設定 API URL' };
        }
        
        try {
            const response = await fetch(`${this.config.gasApiUrl}?action=getStatus`);
            const result = await response.json();
            
            if (result.success) {
                return {
                    status: 'online',
                    message: '服務正常',
                    data: result
                };
            } else {
                return {
                    status: 'error',
                    message: result.message
                };
            }
        } catch (error) {
            return {
                status: 'offline',
                message: error.message
            };
        }
    }
    
    // 獲取同步狀態
    getSyncStatus() {
        return {
            isOnline: this.isOnline,
            isRunning: this.syncInterval !== null,
            lastSyncTime: this.lastSyncTime,
            pendingChanges: this.pendingChanges.length,
            config: this.config,
            webhookEnabled: this.config.enableWebhook && this.webhookInterval !== null
        };
    }
    
    // 停止服務
    destroy() {
        this.stopSync();
        this.removeWebhookListener();
        
        // 移除事件監聽器
        window.removeEventListener('online', this.onlineHandler);
        window.removeEventListener('offline', this.offlineHandler);
    }
}

// 全域同步服務實例
let syncService = null;

// 初始化同步服務
function initializeSyncService(config) {
    syncService = new TravelSyncService();
    if (config) {
        syncService.configure(config);
    }
    return syncService;
}

// 導出給其他檔案使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TravelSyncService, initializeSyncService };
}
