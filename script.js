// 流派資料和組合資料
let schoolsData = [];
let genreData = [];

// 當前選擇的流派
let selectedSchools = [];

// 初始化函數
async function init() {
    try {
        // 載入流派資料
        const schoolsResponse = await fetch('schools.json');
        if (!schoolsResponse.ok) throw new Error('無法讀取流派資訊');
        schoolsData = await schoolsResponse.json();
        
        // 載入組合資料
        const genreResponse = await fetch('genre.json');
        if (!genreResponse.ok) throw new Error('無法讀取流派組合資訊');
        genreData = await genreResponse.json();
        
        // 初始化介面
        renderSchoolSelection();
        setupEventListeners();
        
        // 預設選擇所有流派
        selectedSchools = schoolsData.map(school => school.id);
        updateSelection();
        
    } catch (error) {
        console.error('載入資料時發生錯誤:', error);
        document.getElementById('errorMessage').style.display = 'flex';
    }
}

// 渲染流派選擇介面
function renderSchoolSelection() {
    const container = document.getElementById('schoolsContainer');
    container.innerHTML = '';
    
    schoolsData.forEach(school => {
        const schoolElement = document.createElement('div');
        schoolElement.className = 'school-item active';
        schoolElement.style.color = school.color;
        schoolElement.innerHTML = `
            <div class="school-icon">${school.icon}</div>
            <div class="school-name">${school.id}</div>
        `;
        
        schoolElement.addEventListener('click', () => {
            toggleSchoolSelection(school.id);
        });
        
        container.appendChild(schoolElement);
    });
}

// 設置事件監聽器
function setupEventListeners() {
    // 全選按鈕
    document.getElementById('selectAllBtn').addEventListener('click', () => {
        selectedSchools = schoolsData.map(school => school.id);
        updateSelection();
    });
    
    // 清除按鈕
    document.getElementById('clearAllBtn').addEventListener('click', () => {
        selectedSchools = [];
        updateSelection();
    });
    
    // 隨機選擇8個流派
    document.getElementById('selectDefaultBtn').addEventListener('click', () => {
        // 打亂陣列並取前8個
        const shuffled = [...schoolsData].sort(() => 0.5 - Math.random());
        selectedSchools = shuffled.slice(0, 8).map(school => school.id);
        updateSelection();
    });
}

// 切換流派選擇狀態
function toggleSchoolSelection(schoolId) {
    const index = selectedSchools.indexOf(schoolId);
    
    if (index === -1) {
        // 如果流派未被選擇，則加入
        selectedSchools.push(schoolId);
    } else {
        // 如果流派已被選擇，則移除
        selectedSchools.splice(index, 1);
    }
    
    updateSelection();
}

// 更新選擇狀態和推薦
function updateSelection() {
    // 更新選擇數量
    document.getElementById('selectedCount').textContent = selectedSchools.length;
    
    // 更新流派圖標狀態
    const schoolItems = document.querySelectorAll('.school-item');
    schoolItems.forEach(item => {
        const schoolName = item.querySelector('.school-name').textContent;
        if (selectedSchools.includes(schoolName)) {
            item.classList.add('active');
            item.classList.remove('inactive');
        } else {
            item.classList.remove('active');
            item.classList.add('inactive');
        }
    });
    
    // 計算並顯示推薦
    calculateAndDisplayRecommendations();
}

// 根據流派ID獲取流派資訊
function getSchoolInfo(schoolId) {
    return schoolsData.find(school => school.id === schoolId);
}

// 計算並顯示推薦
function calculateAndDisplayRecommendations() {
    const container = document.getElementById('recommendationList');
    
    if (selectedSchools.length === 0) {
        container.innerHTML = `
            <div class="recommendation-item" style="border-left-color: #8b949e; text-align: center;">
                <div class="recommendation-title">
                    <i class="fas fa-info-circle"></i>
                    <span>請選擇至少一個流派</span>
                </div>
                <p style="margin-top: 10px; color: #8b949e;">點擊左側流派圖標開始選擇</p>
            </div>
        `;
        return;
    }
    
    // 計算每個主流派的分數
    const recommendations = [];
    
    selectedSchools.forEach(mainSchoolId => {
        const mainSchool = getSchoolInfo(mainSchoolId);
        if (!mainSchool) return;
        
        let totalScore = 0;
        
        // 計算分數總和
        selectedSchools.forEach(schoolId => {
            if (mainSchool.score && mainSchool.score.hasOwnProperty(schoolId)) {
                totalScore += mainSchool.score[schoolId];
            }
        });
        
        // 找出搭配組合
        const combinations = genreData && genreData.length > 0 
            ? genreData
                .filter(combo => combo.mainGenre === mainSchoolId && selectedSchools.includes(combo.subGenre))
                .map(combo => combo.subGenre)
            : [];
        
        // 找出被克制的流派（分數最低的兩個，排除自己）
        let weakness = [];
        if (mainSchool.score) {
            weakness = Object.entries(mainSchool.score)
                .filter(([schoolId, score]) => 
                    schoolId !== mainSchoolId && 
                    selectedSchools.includes(schoolId) && 
                    score < 0
                )
                .sort((a, b) => a[1] - b[1]) // 按分數升序排列（分數越低越被克制）
                .slice(0, 2) // 取前兩個
                .map(([schoolId]) => schoolId);
        }
        
        recommendations.push({
            id: mainSchoolId,
            color: mainSchool.color || '#58a6ff',
            icon: mainSchool.icon || '❓',
            score: totalScore,
            combinations: combinations,
            weakness: weakness
        });
    });
    
    // 按分數從高到低排序
    recommendations.sort((a, b) => b.score - a.score);
    
    // 顯示推薦
    displayRecommendations(recommendations);
}

// 顯示推薦列表
function displayRecommendations(recommendations) {
    const container = document.getElementById('recommendationList');
    
    if (recommendations.length === 0) {
        container.innerHTML = '<div class="recommendation-item" style="border-left-color: #8b949e;">無推薦結果</div>';
        return;
    }
    
    container.innerHTML = recommendations.map(rec => {
        // 生成搭配流派的HTML
        let combinationsHTML = '';
        if (rec.combinations.length > 0) {
            combinationsHTML = rec.combinations.map(combo => {
                const schoolInfo = getSchoolInfo(combo);
                return `<span class="combination-item" style="color: ${schoolInfo?.color || '#58a6ff'}">
                    <span class="school-icon-small">${schoolInfo?.icon || '❓'}</span>
                    ${combo}
                </span>`;
            }).join('');
        } else {
            combinationsHTML = '<span style="color: #8b949e;">無推薦組合</span>';
        }
        
        // 生成被克制流派的HTML
        let weaknessHTML = '';
        if (rec.weakness.length > 0) {
            weaknessHTML = rec.weakness.map(weak => {
                const schoolInfo = getSchoolInfo(weak);
                return `<span class="weakness-item" style="color: ${schoolInfo?.color || '#f85149'}">
                    <span class="school-icon-small">${schoolInfo?.icon || '❓'}</span>
                    ${weak}
                </span>`;
            }).join('');
        } else {
            weaknessHTML = '<span style="color: #8b949e;">無明顯克制</span>';
        }
        
        return `
            <div class="recommendation-item" style="border-left-color: ${rec.color}">
                <div class="recommendation-header">
                    <div class="recommendation-title">
                        <span>${rec.icon}</span>
                        <span>${rec.id}</span>
                    </div>
                    <div class="score">${rec.score}分</div>
                </div>
                <div class="combinations">
                    <strong><i class="fas fa-users"></i> 搭配流派:</strong> 
                    <div class="combinations-list">${combinationsHTML}</div>
                </div>
                <div class="weakness">
                    <strong><i class="fas fa-skull-crossbones"></i> 被克制流派:</strong> 
                    <div class="weakness-list">${weaknessHTML}</div>
                </div>
            </div>
        `;
    }).join('');
}

// 頁面載入完成後初始化
document.addEventListener('DOMContentLoaded', init);