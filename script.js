// 流派策略分析器 - JavaScript邏輯
document.addEventListener('DOMContentLoaded', function() {
    // 全域變數
    let schoolsData = [];
    let schoolStates = [];
    
    // DOM元素
    const schoolsContainer = document.getElementById('schoolsContainer');
    const selectedCountElement = document.getElementById('selectedCount');
    const totalCountElement = document.getElementById('totalCount');
    const activeCountElement = document.getElementById('activeCount');
    const bestSchoolElement = document.getElementById('bestSchool');
    const bestScoreElement = document.getElementById('bestScore');
    const lastUpdateElement = document.getElementById('lastUpdate');
    const toggleAllButton = document.getElementById('toggleAll');
    const randomSelectButton = document.getElementById('randomSelect');
    const resetDefaultButton = document.getElementById('resetDefault');
    const recommendationListElement = document.getElementById('recommendationList');
    
    // 從外部JSON檔案載入流派資料
    async function loadSchoolsData() {
        try {
            // 顯示載入訊息
            schoolsContainer.innerHTML = '<div class="loading-message">正在載入流派資訊...</div>';
            
            const response = await fetch('schools.json');
            
            if (!response.ok) {
                throw new Error(`HTTP錯誤! 狀態碼: ${response.status}`);
            }
            
            schoolsData = await response.json();
            
            // 檢查資料格式
            if (!Array.isArray(schoolsData) || schoolsData.length === 0) {
                throw new Error('JSON資料格式錯誤或為空陣列');
            }
            
            // 顯示總流派數
            totalCountElement.textContent = schoolsData.length;
            
            // 初始化流派狀態 (預設全部開啟)
            schoolStates = Array(schoolsData.length).fill(true);
            
            // 啟用按鈕
            toggleAllButton.disabled = false;
            randomSelectButton.disabled = false;
            resetDefaultButton.disabled = false;
            
            // 初始化UI
            createSchoolItems();
            updateRecommendations();
            updateLastUpdateTime();
            
        } catch (error) {
            console.error('載入流派資料時發生錯誤:', error);
            displayErrorMessage('無法讀取流派資訊。請檢查schools.json檔案是否存在且格式正確。');
        }
    }
    
    // 顯示錯誤訊息
    function displayErrorMessage(message) {
        schoolsContainer.innerHTML = `<div class="error-message">${message}</div>`;
        recommendationListElement.innerHTML = `<div class="error-message">${message}</div>`;
        
        // 禁用按鈕
        toggleAllButton.disabled = true;
        randomSelectButton.disabled = true;
        resetDefaultButton.disabled = true;
        
        // 清除右側面板
        bestSchoolElement.textContent = '-';
        bestScoreElement.textContent = '0';
        lastUpdateElement.textContent = '-';
    }
    
    // 計算每個流派的分數
    function calculateScores() {
        if (schoolsData.length === 0) return [];
        
        const scores = [];
        const enabledSchools = schoolsData.filter((school, index) => schoolStates[index]);
        
        // 對每個流派計算分數
        schoolsData.forEach(school => {
            let score = 0;
            const advantageMatches = [];
            const disadvantageMatches = [];
            
            // 檢查已啟用的流派中，哪些是優勢搭配，哪些是劣勢遭遇
            enabledSchools.forEach(enabledSchool => {
                if (school.AdvantageousMatchingGenres && 
                    school.AdvantageousMatchingGenres.includes(enabledSchool.id)) {
                    score += 1;
                    advantageMatches.push(enabledSchool.id);
                }
                if (school.DisadvantageousEncounteredGenres && 
                    school.DisadvantageousEncounteredGenres.includes(enabledSchool.id)) {
                    score -= 1;
                    disadvantageMatches.push(enabledSchool.id);
                }
            });
            
            scores.push({
                id: school.id,
                score: score,
                color: school.color || '#5d4a2e',
                icon: school.icon || '?',
                advantageMatches: advantageMatches,
                disadvantageMatches: disadvantageMatches
            });
        });
        
        // 按分數排序 (由高到低)
        scores.sort((a, b) => b.score - a.score);
        
        return scores;
    }
    
    // 更新已選擇流派計數
    function updateSelectionCount() {
        if (schoolStates.length === 0) return;
        
        const activeCount = schoolStates.filter(state => state).length;
        selectedCountElement.textContent = activeCount;
        activeCountElement.textContent = activeCount;
    }
    
    // 創建流派項目
    function createSchoolItems() {
        if (schoolsData.length === 0) return;
        
        schoolsContainer.innerHTML = '';
        
        schoolsData.forEach((school, index) => {
            const schoolItem = document.createElement('div');
            schoolItem.className = `school-item ${schoolStates[index] ? 'active' : 'disabled'}`;
            schoolItem.dataset.id = school.id;
            schoolItem.dataset.index = index;
            
            const statusIcon = schoolStates[index] ? '✅' : '⭕';
            const statusText = schoolStates[index] ? '已開啟' : '已關閉';
            
            schoolItem.innerHTML = `
                <div class="school-icon" style="background-color: ${school.color || '#5d4a2e'}">
                    ${school.icon || '?'}
                </div>
                <div class="school-info">
                    <div class="school-name">${school.id}</div>
                    <div class="school-status ${schoolStates[index] ? 'active' : 'disabled'}">
                        <span class="school-status-icon">${statusIcon}</span> ${statusText}
                    </div>
                </div>
            `;
            
            // 點擊切換狀態
            schoolItem.addEventListener('click', () => {
                toggleSchool(index);
            });
            
            schoolsContainer.appendChild(schoolItem);
        });
        
        updateSelectionCount();
    }
    
    // 切換流派狀態
    function toggleSchool(index) {
        if (index >= 0 && index < schoolStates.length) {
            schoolStates[index] = !schoolStates[index];
            createSchoolItems();
            updateRecommendations();
            updateLastUpdateTime();
        }
    }
    
    // 更新推薦內容
    function updateRecommendations() {
        if (schoolsData.length === 0) return;
        
        const scores = calculateScores();
        
        // 更新最佳流派資訊
        if (scores.length > 0) {
            const bestSchool = scores[0];
            bestSchoolElement.textContent = bestSchool.id;
            bestScoreElement.textContent = bestSchool.score;
            
            // 設定分數顏色
            if (bestSchool.score > 0) {
                bestScoreElement.className = 'summary-value score-positive';
            } else if (bestSchool.score < 0) {
                bestScoreElement.className = 'summary-value score-negative';
            } else {
                bestScoreElement.className = 'summary-value';
            }
        }
        
        // 更新推薦列表
        if (scores.length > 0) {
            recommendationListElement.innerHTML = scores.map((school, index) => {
                const isTop = index === 0;
                const scoreClass = school.score > 0 ? 'score-positive' : (school.score < 0 ? 'score-negative' : '');
                
                return `
                    <div class="recommendation-item ${isTop ? 'top' : ''}">
                        <div class="recommendation-header">
                            <div class="recommendation-rank">${index + 1}</div>
                            <div class="recommendation-icon" style="background-color: ${school.color}">
                                ${school.icon}
                            </div>
                            <div class="recommendation-main">
                                <div class="recommendation-name">${school.id}</div>
                                <div class="recommendation-score ${scoreClass}">推薦分數: ${school.score > 0 ? '+' : ''}${school.score}</div>
                            </div>
                        </div>
                        <div class="recommendation-details">
                            <div class="detail-box">
                                <div class="detail-title advantage">搭配流派</div>
                                <div class="detail-list">
                                    ${school.advantageMatches.length > 0 
                                        ? school.advantageMatches.map(match => `<span class="detail-item">${match}</span>`).join('')
                                        : '<span class="detail-item empty">無搭配流派</span>'}
                                </div>
                            </div>
                            <div class="detail-box">
                                <div class="detail-title disadvantage">被克制的流派</div>
                                <div class="detail-list">
                                    ${school.disadvantageMatches.length > 0 
                                        ? school.disadvantageMatches.map(match => `<span class="detail-item">${match}</span>`).join('')
                                        : '<span class="detail-item empty">無克制流派</span>'}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        } else {
            recommendationListElement.innerHTML = `
                <div class="no-recommendation">
                    <div class="no-data-icon">📋</div>
                    <h3>尚未計算流派推薦</h3>
                    <p>請選擇左側的流派以開始分析</p>
                </div>
            `;
        }
    }
    
    // 更新最後更新時間
    function updateLastUpdateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-TW', { 
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        lastUpdateElement.textContent = timeString;
    }
    
    // 切換所有流派狀態
    toggleAllButton.addEventListener('click', function() {
        if (schoolStates.length === 0) return;
        
        const allActive = schoolStates.every(state => state);
        schoolStates = Array(schoolsData.length).fill(!allActive);
        toggleAllButton.textContent = allActive ? '全部開啟' : '全部關閉';
        toggleAllButton.title = allActive ? '全部開啟' : '全部關閉';
        createSchoolItems();
        updateRecommendations();
        updateLastUpdateTime();
    });
    
    // 隨機選擇流派
    randomSelectButton.addEventListener('click', function() {
        if (schoolsData.length === 0) return;
        
        // 隨機決定要選擇多少個流派 (3到8個之間)
        const minSelection = 3;
        const maxSelection = Math.min(8, schoolsData.length);
        const targetSelection = Math.floor(Math.random() * (maxSelection - minSelection + 1)) + minSelection;
        
        // 先全部關閉
        schoolStates = Array(schoolsData.length).fill(false);
        
        // 隨機選擇流派
        const randomIndices = [];
        while (randomIndices.length < targetSelection) {
            const randomIndex = Math.floor(Math.random() * schoolsData.length);
            if (!randomIndices.includes(randomIndex)) {
                randomIndices.push(randomIndex);
            }
        }
        
        // 開啟選中的流派
        randomIndices.forEach(index => {
            schoolStates[index] = true;
        });
        
        // 更新按鈕文字
        toggleAllButton.textContent = '全部關閉';
        toggleAllButton.title = '全部關閉';
        
        createSchoolItems();
        updateRecommendations();
        updateLastUpdateTime();
    });
    
    // 重置為預設 (全部開啟)
    resetDefaultButton.addEventListener('click', function() {
        if (schoolsData.length === 0) return;
        
        schoolStates = Array(schoolsData.length).fill(true);
        toggleAllButton.textContent = '全部關閉';
        toggleAllButton.title = '全部關閉';
        createSchoolItems();
        updateRecommendations();
        updateLastUpdateTime();
    });
    
    // 初始化：載入流派資料
    loadSchoolsData();
});