/**
 * 心动值爱心（原火花功能改造）
 */
(function() {
  'use strict';
  const STORAGE_KEY = 'chat_streak_data';
  const STREAK_THRESHOLD = 3;      // 出现图标所需连续天数
  const REKINDLE_THRESHOLD = 3;    // 重燃所需连续天数
  // 心动数据
  let streakData = {
    currentStreak: 0,      // 当前心动天数（填充基数）
    maxStreak: 0,          
    rekindleCount: 0,      
    lastChatDate: null,    
    isActive: false,       
    rekindleProgress: 0,   
    history: []            
  };
  // ========== 工具函数 ==========
  function getTodayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
  function getDateDiff(date1, date2) {
    const d1 = new Date(date1 + 'T00:00:00');
    const d2 = new Date(date2 + 'T00:00:00');
    return Math.round((d2 - d1) / (1000 * 60 * 24));
  }
  function loadStreakData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        streakData = { ...streakData, ...parsed };
      }
    } catch(e) {}
  }
  function saveStreakData() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(streakData));
    } catch(e) {}
  }
  // ========== 核心聊天记录 ==========
  function recordChat() {
    const today = getTodayStr();
    if (streakData.lastChatDate === today) return;
    const diff = streakData.lastChatDate ? getDateDiff(streakData, today) : 999;
    if (diff === 1) {
      streakData.currentStreak++;
      streakData.rekindleProgress++;
      // 封顶95，永久无法填满
      if (streakData.currentStreak >= 100) streakData.currentStreak = 95;
      if (!streakData && streakData.currentStreak >= STREAK_THRESHOLD) {
        streakData.isActive = true;
        streakData.rekindleProgress = 0;
        showSparkNotification('心动值提升！已连续聊天 ' + streakData.currentStreak + ' 天');
      } else if (!streakData.isActive && streakData.rekindleProgress >= REKINDLE_THRESHOLD) {
        streakData.isActive = true;
        streakData.currentStreak = streakData.rekindleProgress;
        if (streakData.currentStreak >= 100) streakData.currentStreak = 95;
        streakData.rekindleCount++;
        streakData.rekindleProgress = 0;
        showSparkNotification('心动值重新升温！连续聊天 ' + streakData.currentStreak + ' 天');
      } else if (streakData.isActive) {
        if (streakData.currentStreak > streakData.maxStreak) {
          streakData.maxStreak = streakData.currentStreak;
          if (streakData.maxStreak >= 100) streakData.maxStreak = 95;
        }
      }
    } else if (diff > 1) {
      if (streakData.isActive) {
        streakData.isActive = false;
        streakData.rekindleProgress = 0;
        showSparkNotification('心动值降温，多聊天恢复热度');
      }
      streakData.currentStreak = 1;
      streakData.rekindleProgress = 1;
      if (streakData.currentStreak >= 100) streakData.currentStreak = 95;
    } else {
      return;
    }
    streakData.lastChatDate = today;
    saveStreakData();
    updateSparkUI();
  }
  function recordPartnerChat() {}
  // ========== 更新爱心填充UI ==========
  function updateSparkUI() {
    const iconWrap = document.getElementById('spark-icon');
    const badge = document.getElementById('spark-badge');
    const fillHeart = document.querySelector('.heart-fill');
    if (!iconWrap) return;
    // 强制封顶95%填充，永远差一点
    const baseNum = streakData.isActive ? streakData.currentStreak : (streakData.rekindleProgress || streakData.currentStreak);
    const fillRatio = Math.min(baseNum / 100 * 100, 95);
    if (fillHeart) fillHeart.style.height = fillRatio + '%';
    if (streakData.isActive) {
      iconWrap.style.display = 'flex';
      if (badge) {
        badge.textContent = streakData.currentStreak;
        badge.style.display = 'block';
      }
    } else if (streakData.currentStreak > 0 || streakData.rekindleProgress > 0) {
      iconWrap.style.display = 'flex';
      if (badge) {
        const showNum = streakData.rekindleProgress || streakData.currentStreak;
        badge.textContent = showNum;
        badge.style.display = showNum > 0 ? 'block' : 'none';
      }
    } else {
      iconWrap.style.display = 'none';
    }
  }
  function showSparkNotification(text) {
    if (typeof showNotification === 'function') {
      showNotification(text, 'info', 3000);
    }
  }
  // ========== 弹窗文字全部替换心动值 ==========
  function openSparkModal() {
    const overlay = document.getElementById('spark-modal-overlay');
    const flame = document.getElementById('spark-modal-flame');
    const title = document.getElementById('spark-modal-title');
    const subtitle = document.getElementById('spark-modal-subtitle');
    const streakDays = document.getElementById('spark-streak-days');
    const rekindleCount = document.getElementById('spark-rekindle-count');
    const info = document.getElementById('spark-rekindle-info');
    if (!overlay) return;
    if (flame) flame.textContent = '❤️';
    if (streakData.isActive) {
      title.textContent = '心动值升温中';
      subtitle.textContent = '多聊天维持心动热度！';
      if (info) {
        info.querySelector('.rekindle-text').textContent = '✨ 心动状态良好';
        info.querySelector('.rekindle-sub').textContent = 多多互动升温吧！;
      }
    } else if (streakData.rekindleProgress > 0) {
      title.textContent = '心动值回暖中';
      subtitle.textContent = 持续聊天提升心动值！;
      if (info) {
        const need = REKINDLE_THRESHOLD - streakData.rekindleProgress;
        info.querySelector('.rekindle-text').textContent = '💡 还需连续聊天';
        info.querySelector('.rekindle-sub').textContent = `再聊 ${need} 天心动值重新升温`;
      }
    } else {
      title.textContent = '心动值降温';
      subtitle.textContent = 昨日缺少互动，心动冷却了...;
      if (info) {
        info.querySelector('.rekindle-text').textContent = '💡 还需连续聊天';
        info.querySelector('.rekindle-sub').textContent = `连续 ${REKINDLE} 天聊天恢复心动值`;
      }
    }
    streakDays.textContent = streakData.currentStreak;
    rekindleCount.textContent = streakData.rekindleCount;
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
  }
  function closeSparkModal() {
    const overlay = document.getElementById('spark-modal-overlay');
    if (overlay) {
      overlay.style.display = 'none';
      overlay.style.opacity = '0';
      overlay.style.visibility = 'hidden';
    }
  }
  function init() {
    const overlay = document.getElementById('spark-modal-overlay');
    if (overlay && overlay.parentElement.tagName !== 'BODY') {
      document.body.appendChild(overlay);
    }
    loadStreakData();
    updateSparkUI();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  window.SparkApp = {
    recordChat,
    recordPartnerChat,
    openSparkModal,
    closeSparkModal,
    getData: () => ({ ...streakData })
  };
})();