// Google Apps Script 後端代碼
// 請將此代碼複製到 Google Apps Script 編輯器中
// 網址：https://script.google.com/

// 設定區域 - 請修改這些值
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID'; // 替換為您的 Google Sheets ID
const SHEET_NAME = 'TravelComments'; // 工作表名稱
const WEBHOOK_URL = ''; // 可選：用於即時通知的 Webhook URL

// 主要處理函數
function doGet(e) {
  const action = e.parameter.action;
  
  try {
    switch (action) {
      case 'getComments':
        return getComments(e.parameter.lastSync);
      case 'getStatus':
        return getStatus();
      default:
        return createResponse(false, '未知的操作');
    }
  } catch (error) {
    console.error('GET 請求錯誤:', error);
    return createResponse(false, error.toString());
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'updateComments':
        return updateComments(data.changes, data.timestamp);
      case 'initializeSheet':
        return initializeSheet();
      default:
        return createResponse(false, '未知的操作');
    }
  } catch (error) {
    console.error('POST 請求錯誤:', error);
    return createResponse(false, error.toString());
  }
}

// 獲取留言資料
function getComments(lastSyncTime) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      return createResponse(true, '沒有留言資料', { comments: {} });
    }
    
    const comments = {};
    const lastSync = lastSyncTime ? new Date(lastSyncTime) : new Date(0);
    
    // 跳過標題行
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const [timestamp, activityId, commentId, parentId, author, text, type] = row;
      
      // 只返回指定時間後的資料
      if (new Date(timestamp) <= lastSync) continue;
      
      if (!comments[activityId]) {
        comments[activityId] = [];
      }
      
      const commentData = {
        id: parseInt(commentId),
        author: author,
        text: text,
        timestamp: new Date(timestamp).toLocaleString('zh-TW'),
        replies: []
      };
      
      if (type === 'comment') {
        comments[activityId].push(commentData);
      } else if (type === 'reply') {
        // 找到父留言並添加回復
        const parentComment = findCommentInData(comments[activityId], parseInt(parentId));
        if (parentComment) {
          parentComment.replies.push(commentData);
        }
      }
    }
    
    return createResponse(true, '成功獲取留言', { comments: comments });
  } catch (error) {
    console.error('獲取留言錯誤:', error);
    return createResponse(false, error.toString());
  }
}

// 更新留言資料
function updateComments(changes, timestamp) {
  try {
    const sheet = getOrCreateSheet();
    
    changes.forEach(change => {
      const row = [
        new Date(change.timestamp),
        change.activityId,
        change.type === 'add_comment' ? change.comment.id : change.reply.id,
        change.type === 'add_reply' ? change.commentId : '',
        change.type === 'add_comment' ? change.comment.author : change.reply.author,
        change.type === 'add_comment' ? change.comment.text : change.reply.text,
        change.type === 'add_comment' ? 'comment' : 'reply'
      ];
      
      sheet.appendRow(row);
    });
    
    // 觸發 Webhook（如果設定）
    if (WEBHOOK_URL) {
      triggerWebhook(changes);
    }
    
    return createResponse(true, '成功更新留言');
  } catch (error) {
    console.error('更新留言錯誤:', error);
    return createResponse(false, error.toString());
  }
}

// 初始化工作表
function initializeSheet() {
  try {
    const sheet = getOrCreateSheet();
    
    // 檢查是否已有標題行
    if (sheet.getLastRow() === 0) {
      const headers = [
        '時間戳記',
        '活動ID',
        '留言ID',
        '父留言ID',
        '作者',
        '內容',
        '類型'
      ];
      sheet.appendRow(headers);
      
      // 設定標題行格式
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#f0f0f0');
    }
    
    return createResponse(true, '工作表初始化完成');
  } catch (error) {
    console.error('初始化錯誤:', error);
    return createResponse(false, error.toString());
  }
}

// 獲取服務狀態
function getStatus() {
  try {
    const sheet = getOrCreateSheet();
    const rowCount = sheet.getLastRow();
    
    return createResponse(true, '服務正常', {
      status: 'online',
      totalComments: Math.max(0, rowCount - 1), // 扣除標題行
      lastUpdate: new Date().toISOString()
    });
  } catch (error) {
    return createResponse(false, error.toString());
  }
}

// 輔助函數：獲取或創建工作表
function getOrCreateSheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }
  
  return sheet;
}

// 輔助函數：在資料中查找留言
function findCommentInData(comments, commentId) {
  for (let comment of comments) {
    if (comment.id === commentId) {
      return comment;
    }
    // 遞迴查找回復中的留言
    if (comment.replies) {
      const found = findCommentInData(comment.replies, commentId);
      if (found) return found;
    }
  }
  return null;
}

// 輔助函數：創建回應
function createResponse(success, message, data = null) {
  const response = {
    success: success,
    message: message,
    timestamp: new Date().toISOString()
  };
  
  if (data) {
    Object.assign(response, data);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

// 觸發 Webhook 通知
function triggerWebhook(changes) {
  if (!WEBHOOK_URL) return;
  
  try {
    const payload = {
      event: 'comments_updated',
      changes: changes,
      timestamp: new Date().toISOString()
    };
    
    UrlFetchApp.fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Webhook 錯誤:', error);
  }
}

// 測試函數
function testService() {
  console.log('測試初始化工作表...');
  const initResult = initializeSheet();
  console.log('初始化結果:', initResult.getContent());
  
  console.log('測試獲取狀態...');
  const statusResult = getStatus();
  console.log('狀態結果:', statusResult.getContent());
}

// 清理舊資料（可選）
function cleanupOldData(daysToKeep = 30) {
  try {
    const sheet = getOrCreateSheet();
    const data = sheet.getDataRange().getValues();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    // 從後往前刪除，避免行號變化
    for (let i = data.length - 1; i >= 1; i--) {
      const timestamp = new Date(data[i][0]);
      if (timestamp < cutoffDate) {
        sheet.deleteRow(i + 1);
      }
    }
    
    console.log('清理完成');
  } catch (error) {
    console.error('清理錯誤:', error);
  }
}