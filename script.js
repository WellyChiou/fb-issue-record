// 記帳系統主要功能
class ExpenseTracker {
    // 格式化數字，添加千分位分隔符（整數顯示）
    formatNumber(number) {
        return Math.round(number).toLocaleString('zh-TW');
    }

    // 授權使用者清單
    authorizedUsers = [
        'your-email@gmail.com',  // 替換為您的Email
        'family-member1@gmail.com',  // 家庭成員1
        'family-member2@gmail.com',  // 家庭成員2
        // 可以添加更多授權使用者
    ];

    constructor() {
        this.records = [];
        this.editingId = null;
        this.currentPage = 1;
        this.recordsPerPage = 20;
        this.currentUser = null;
        this.isFirebaseReady = false;
        
        // 定義分類結構
        this.categoryStructure = {
            '食': ['外食', '食材', '飲料', '零食', '其他'],
            '衣': ['服飾', '鞋子', '配件', '美容', '其他'],
            '住': ['房貸', '租金', '水電瓦斯', '居家用品', '家具家電', '裝潢修繕', '網路費', '通訊', '其他'],
            '行': ['交通費', '油費', '停車費', '大眾運輸', '交通工具保養', '其他'],
            '育': ['學費', '書籍', '進修', '文具', '其他'],
            '樂': ['娛樂', '旅遊', '運動', '社交', '其他'],
            '醫療': ['診療', '藥品', '健檢', '醫療用品', '其他'],
            '其他支出': ['投資', '教會奉獻', '保險', '稅務', '其他'],
            '薪資': ['本薪', '獎金', '兼職', '其他'],
            '投資': ['股票', '基金', '債券', '加密貨幣', '其他'],
            '動產': ['存款', '股票', '基金', '債券', '加密貨幣', '其他'],
            '不動產': ['房屋', '土地', '店面', '停車位', '其他']
        };
        
        
        this.init();
    }

    // Firebase 初始化
    async initFirebase() {
        try {
            // 等待 Firebase 載入
            await this.waitForFirebase();
            
            // 使用 Promise 等待認證狀態
            const authState = await this.waitForAuthStateWithPromise();
            
            if (authState) {
                console.log('檢測到現有登入狀態:', authState.uid);
                
                // 檢查使用者啟用狀態
                const userStatus = await this.checkUserStatus(authState);
                if (!userStatus.isActive) {
                    console.log('使用者尚未啟用:', authState.email);
                    this.showInactiveUserMessage(authState);
                    return;
                }
                
                this.currentUser = authState;
                this.isFirebaseReady = true;
                
                // 記錄/更新使用者基本資料
                this.updateUserProfile(authState);
                
                // 載入記錄
                this.loadRecordsFromFirebase();
            } else {
                console.log('未檢測到登入狀態，導向登入頁面');
                window.location.href = 'expenses_login.html';
            }
            
            // 監聽認證狀態變化
            window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
                if (user) {
                    console.log('認證狀態變化 - 已登入:', user.uid);
                    
                    // 檢查使用者啟用狀態
                    this.checkUserStatus(user).then(userStatus => {
                        if (!userStatus.isActive) {
                            console.log('使用者尚未啟用:', user.email);
                            this.showInactiveUserMessage(user);
                            return;
                        }
                        
                        this.currentUser = user;
                        this.isFirebaseReady = true;
                        
                        // 記錄/更新使用者基本資料
                        this.updateUserProfile(user);
                        
                        // 載入記錄
                        this.loadRecordsFromFirebase();
                    });
                } else {
                    console.log('認證狀態變化 - 已登出，導向登入頁面');
                    window.location.href = 'expenses_login.html';
                }
            });
        } catch (error) {
            console.error('Firebase 初始化失敗:', error);
            // 如果 Firebase 失敗，導向登入頁面
            window.location.href = 'expenses_login.html';
        }
    }

    // 使用 Promise 等待認證狀態
    waitForAuthStateWithPromise() {
        return new Promise((resolve) => {
            const unsubscribe = window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
                unsubscribe(); // 取消監聽
                resolve(user);
            });
        });
    }

    // 更新使用者基本資料
    async updateUserProfile(user) {
        try {
            const userRef = window.firebaseDoc(window.firebaseDb, 'users', user.uid);
            await window.firebaseSetDoc(userRef, {
                uid: user.uid,
                email: user.email ?? null,
                displayName: user.displayName ?? null,
                photoURL: user.photoURL ?? null,
                providerId: user.providerData?.[0]?.providerId ?? null,
                lastLoginAt: window.firebaseServerTimestamp(),
                isActive: false,  // 預設不啟用
                createdAt: window.firebaseServerTimestamp(),
                status: 'pending'  // pending, active, suspended
            }, { merge: true });
            
            console.log('使用者資料已更新:', user.uid);
        } catch (error) {
            console.error('更新使用者資料失敗:', error);
        }
    }

    // 顯示未啟用使用者訊息
    showInactiveUserMessage(user) {
        // 隱藏所有輸入表單
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="inactive-user-container">
                    <div class="inactive-user-card">
                        <div class="inactive-user-icon">⏳</div>
                        <h2>使用者尚未啟用</h2>
                        <p>親愛的 <strong>${user.displayName || user.email}</strong>，</p>
                        <p>您的帳號目前尚未啟用，請聯繫管理員進行啟用。</p>
                        <div class="user-info">
                            <p><strong>Email:</strong> ${user.email}</p>
                            <p><strong>狀態:</strong> 等待啟用</p>
                        </div>
                        <div class="action-buttons">
                            <button onclick="window.firebaseAuth.signOut(); window.location.href='expenses_login.html';" class="logout-btn">
                                登出
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    // 等待 Firebase 載入
    waitForFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseAuth && window.firebaseDb) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }

    // 從 Firebase 載入記錄
    async loadRecordsFromFirebase() {
        try {
            const recordsRef = window.firebaseCollection(window.firebaseDb, 'records');
            const q = window.firebaseQuery(
                recordsRef,
                window.firebaseWhere('userId', '==', this.currentUser.uid),
                window.firebaseOrderBy('date', 'desc')
            );
            
            const querySnapshot = await window.firebaseGetDocs(q);
            this.records = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                this.records.push({
                    id: doc.id,
                    ...data,
                    // 轉換 Firestore timestamp 為字串
                    date: data.date ? data.date.toDate().toISOString().split('T')[0] : data.date
                });
            });
            
            console.log('從 Firebase 載入記錄:', this.records.length, '筆');
            this.updateDisplay();
        } catch (error) {
            console.error('載入 Firebase 記錄失敗:', error);
            // 如果載入失敗，導向登入頁面
            window.location.href = 'expenses_login.html';
        }
    }

    init() {
        // 設定今天的日期為預設值
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        
        // 初始化 Firebase
        this.initFirebase();
        
        // 綁定事件
        this.bindEvents();
        
        // 初始化圖表
        this.initCharts();
        
        // 更新顯示
        this.updateDisplay();
        
        // 初始化時就更新圖表資料
        this.updateCharts();
    }

    bindEvents() {
        // 表單提交
        document.getElementById('recordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addRecord();
        });

        // 類型選擇改變時更新大項目選項
        document.getElementById('type').addEventListener('change', () => {
            this.updateMainCategoryOptions();
        });

        // 大項目選擇改變時更新小項目選項
        document.getElementById('mainCategory').addEventListener('change', () => {
            this.updateSubCategoryOptions();
        });

        // 圖表篩選器
        document.getElementById('chartFilterType').addEventListener('change', () => {
            this.updateCharts();
        });
        
        document.getElementById('chartFilterYear').addEventListener('change', () => {
            this.updateCharts();
        });
        
        document.getElementById('chartFilterMonth').addEventListener('change', () => {
            this.updateCharts();
        });
        
        // 彈窗外部點擊關閉
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('chartsModal');
            if (event.target === modal) {
                this.hideChartsModal();
            }
        });
        
        // 分頁按鈕事件
        document.getElementById('prevPage').addEventListener('click', () => {
            if (this.currentPage > 1) {
                this.currentPage--;
                this.applyTableFilter(false);
            }
        });
        
        document.getElementById('nextPage').addEventListener('click', () => {
            const filteredRecords = this.getCurrentFilteredRecords();
            const totalPages = Math.ceil(filteredRecords.length / this.recordsPerPage);
            if (this.currentPage < totalPages) {
                this.currentPage++;
                this.applyTableFilter(false);
            }
        });
        
        // 每頁顯示數量選擇事件
        document.getElementById('pageSize').addEventListener('change', (e) => {
            this.recordsPerPage = parseInt(e.target.value);
            this.currentPage = 1; // 重置到第一頁
            this.applyTableFilter(true);
        });
        
        // 初始化圖表年份選項
        this.updateChartYearOptions();
    }

    updateMainCategoryOptions() {
        const type = document.getElementById('type').value;
        const mainCategorySelect = document.getElementById('mainCategory');
        const options = mainCategorySelect.querySelectorAll('option');
        
        // 重置大項目選擇
        mainCategorySelect.value = '';
        document.getElementById('subCategory').innerHTML = '<option value="">請先選擇類別</option>';
        
        // 顯示/隱藏選項
        options.forEach(option => {
            if (option.value === '') {
                option.style.display = 'block';
            } else {
                const optionType = option.getAttribute('data-type');
                option.style.display = (!type || optionType === type) ? 'block' : 'none';
            }
        });
    }

    updateSubCategoryOptions() {
        const mainCategory = document.getElementById('mainCategory').value;
        const subCategorySelect = document.getElementById('subCategory');
        
        // 清空小項目選項
        subCategorySelect.innerHTML = '<option value="">請選擇細項</option>';
        
        if (mainCategory && this.categoryStructure[mainCategory]) {
            this.categoryStructure[mainCategory].forEach(subCategory => {
                const option = document.createElement('option');
                option.value = subCategory;
                option.textContent = subCategory;
                subCategorySelect.appendChild(option);
            });
        }
    }

    updateChartYearOptions() {
        const chartYearSelect = document.getElementById('chartFilterYear');
        const currentYear = new Date().getFullYear();
        
        // 清空年份選項
        chartYearSelect.innerHTML = '<option value="">所有年份</option>';
        
        // 添加過去5年到未來2年的選項
        for (let year = currentYear - 5; year <= currentYear + 2; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            chartYearSelect.appendChild(option);
        }
        
        console.log('圖表年份選項已更新，共', chartYearSelect.options.length, '個選項');
    }

    async addRecord() {
        const formData = {
            type: document.getElementById('type').value,
            member: document.getElementById('member').value,
            mainCategory: document.getElementById('mainCategory').value,
            subCategory: document.getElementById('subCategory').value,
            amount: parseFloat(document.getElementById('amount').value),
            description: document.getElementById('description').value,
            date: document.getElementById('date').value
        };

        try {
            if (this.editingId) {
                // 編輯模式
                await this.updateRecordInFirebase(this.editingId, formData);
                this.editingId = null;
                document.querySelector('#recordForm button').textContent = '新增記錄';
            } else {
                // 新增模式
                await this.addRecordToFirebase(formData);
            }

            this.clearForm();
            this.updateDisplay();
            this.updateCharts();
        } catch (error) {
            console.error('儲存記錄失敗:', error);
            alert('儲存失敗，請重試');
        }
    }

    // 新增記錄到 Firebase
    async addRecordToFirebase(formData) {
        const recordsRef = window.firebaseCollection(window.firebaseDb, 'records');
        const docRef = await window.firebaseAddDoc(recordsRef, {
            userId: this.currentUser.uid,
            ...formData,
            createdAt: window.firebaseServerTimestamp(),
            updatedAt: window.firebaseServerTimestamp()
        });
        
        // 添加到本地陣列
        this.records.push({
            id: docRef.id,
            ...formData
        });
        
        console.log('記錄已新增到 Firebase:', docRef.id);
    }

    // 更新 Firebase 記錄
    async updateRecordInFirebase(recordId, formData) {
        const recordRef = window.firebaseDoc(window.firebaseDb, 'records', recordId);
        await window.firebaseUpdateDoc(recordRef, {
            ...formData,
            updatedAt: window.firebaseServerTimestamp()
        });
        
        // 更新本地陣列
        const index = this.records.findIndex(record => record.id === recordId);
        if (index !== -1) {
            this.records[index] = { ...formData, id: recordId };
        }
        
        console.log('記錄已更新到 Firebase:', recordId);
    }

    clearForm() {
        // 清空所有表單欄位
        document.getElementById('member').value = '';
        document.getElementById('type').value = '';
        document.getElementById('mainCategory').value = '';
        document.getElementById('subCategory').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('date').value = '';
        document.getElementById('description').value = '';
        
        // 重置編輯狀態
        this.editingId = null;
        
        // 更新按鈕文字
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.textContent = '新增記錄';
        
        // 清空小項目選項
        const subCategorySelect = document.getElementById('subCategory');
        subCategorySelect.innerHTML = '<option value="">請先選擇類別</option>';
    }

    resetForm() {
        // 清空所有表單欄位
        document.getElementById('member').value = '';
        document.getElementById('type').value = '';
        document.getElementById('mainCategory').value = '';
        document.getElementById('subCategory').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('date').value = '';
        document.getElementById('description').value = '';
        
        // 重置編輯狀態
        this.editingId = null;
        
        // 更新按鈕文字
        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.textContent = '新增記錄';
        
        // 清空小項目選項
        const subCategorySelect = document.getElementById('subCategory');
        subCategorySelect.innerHTML = '<option value="">請先選擇類別</option>';
        
        // 顯示確認訊息
        alert('表單已清空');
    }

    editRecord(id) {
        const record = this.records.find(r => r.id === id);
        if (record) {
            document.getElementById('type').value = record.type;
            document.getElementById('member').value = record.member;
            document.getElementById('mainCategory').value = record.mainCategory;
            document.getElementById('amount').value = record.amount;
            document.getElementById('description').value = record.description;
            document.getElementById('date').value = record.date;
            
            // 更新大項目選項
            this.updateMainCategoryOptions();
            document.getElementById('mainCategory').value = record.mainCategory;
            
            // 更新小項目選項
            this.updateSubCategoryOptions();
            document.getElementById('subCategory').value = record.subCategory;
            
            this.editingId = id;
            document.querySelector('#recordForm button').textContent = '更新記錄';
            
            // 滾動到表單
            document.querySelector('.add-record').scrollIntoView({ behavior: 'smooth' });
        }
    }

    async deleteRecord(id) {
        if (confirm('確定要刪除這筆記錄嗎？')) {
            try {
                await this.deleteRecordFromFirebase(id);
                this.updateDisplay();
                this.updateCharts();
            } catch (error) {
                console.error('刪除記錄失敗:', error);
                alert('刪除失敗，請重試');
            }
        }
    }

    // 從 Firebase 刪除記錄
    async deleteRecordFromFirebase(recordId) {
        const recordRef = window.firebaseDoc(window.firebaseDb, 'records', recordId);
        await window.firebaseDeleteDoc(recordRef);
        
        // 從本地陣列移除
        this.records = this.records.filter(record => record.id !== recordId);
        
        console.log('記錄已從 Firebase 刪除:', recordId);
    }

    resetForm() {
        document.getElementById('recordForm').reset();
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
    }

    saveRecords() {
        localStorage.setItem('expenseRecords', JSON.stringify(this.records));
    }

    updateDisplay() {
        this.displayRecords(this.records);
        this.updateSummary(this.records);
    }

    displayRecords(records) {
        const recordsList = document.getElementById('recordsList');
        
        if (records.length === 0) {
            recordsList.innerHTML = '<div class="empty-state" style="padding: 40px; text-align: center; color: #999;">暫無記錄</div>';
            this.updatePagination(0);
            return;
        }

        // 計算分頁
        const totalPages = Math.ceil(records.length / this.recordsPerPage);
        const startIndex = (this.currentPage - 1) * this.recordsPerPage;
        const endIndex = startIndex + this.recordsPerPage;
        const pageRecords = records.slice(startIndex, endIndex);

        // 獲取所有可能的篩選選項（使用所有記錄，不是篩選後的記錄）
        const allMembers = [...new Set(this.records.map(r => r.member))];
        const allTypes = [...new Set(this.records.map(r => r.type))];
        const allMainCategories = [...new Set(this.records.map(r => r.mainCategory))];
        const allSubCategories = [...new Set(this.records.map(r => r.subCategory))];
        const allYears = [...new Set(this.records.map(r => r.date.split('-')[0]))].sort((a, b) => b - a);
        const allMonths = [...new Set(this.records.map(r => r.date.split('-')[1]))].sort((a, b) => a - b);

        // 生成表格HTML
        const tableHTML = `
            <table class="records-table">
                <thead>
                    <tr>
                        <th>
                            日期
                            <div class="date-filter-container">
                                <select id="tableFilterYear" onchange="expenseTracker.applyTableFilter(true)">
                                    <option value="">全部年份</option>
                                    ${allYears.map(year => `<option value="${year}">${year}</option>`).join('')}
                                </select>
                                <select id="tableFilterMonth" onchange="expenseTracker.applyTableFilter(true)">
                                    <option value="">全部月份</option>
                                    ${allMonths.map(month => `<option value="${month}">${month}月</option>`).join('')}
                                </select>
                            </div>
                        </th>
                        <th>
                            家庭成員
                            <select class="filter-dropdown" id="tableFilterMember" onchange="expenseTracker.applyTableFilter(true)">
                                <option value="">全部成員</option>
                                ${allMembers.map(member => `<option value="${member}">${member}</option>`).join('')}
                            </select>
                        </th>
                        <th>
                            類型
                            <select class="filter-dropdown" id="tableFilterType" onchange="expenseTracker.applyTableFilter(true)">
                                <option value="">全部類型</option>
                                ${allTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                            </select>
                        </th>
                        <th>
                            類別
                            <select class="filter-dropdown" id="tableFilterMainCategory" onchange="expenseTracker.applyTableFilter(true)">
                                <option value="">全部類別</option>
                                ${allMainCategories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                            </select>
                        </th>
                        <th>
                            細項
                            <select class="filter-dropdown" id="tableFilterSubCategory" onchange="expenseTracker.applyTableFilter(true)">
                                <option value="">全部細項</option>
                                ${allSubCategories.map(sub => `<option value="${sub}">${sub}</option>`).join('')}
                            </select>
                        </th>
                        <th>金額</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageRecords
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map(record => {
                            const amountClass = record.type === '收入' ? 'amount-income' : 
                                               record.type === '支出' ? 'amount-expense' : 'amount-asset';
                            const amountPrefix = record.type === '收入' ? '+' : 
                                                record.type === '資產' ? '+' : '-';
                            
                            return `
                                <tr>
                                    <td>${record.date}</td>
                                    <td>${record.member}</td>
                                    <td>${record.type}</td>
                                    <td>${record.mainCategory}</td>
                                    <td>${record.subCategory}</td>
                                    <td class="${amountClass}">${amountPrefix}$${this.formatNumber(record.amount)}</td>
                                    <td>
                                        <div class="action-buttons">
                                            <button class="action-btn edit-btn" onclick="expenseTracker.editRecord(${record.id})" title="編輯"></button>
                                            <button class="action-btn delete-btn" onclick="expenseTracker.deleteRecord(${record.id})" title="刪除"></button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                </tbody>
            </table>
        `;
        
        recordsList.innerHTML = tableHTML;
        this.updatePagination(records.length);
    }

    getCurrentFilteredRecords() {
        // 獲取表格篩選器的值
        const yearFilter = document.getElementById('tableFilterYear')?.value || '';
        const monthFilter = document.getElementById('tableFilterMonth')?.value || '';
        const memberFilter = document.getElementById('tableFilterMember')?.value || '';
        const typeFilter = document.getElementById('tableFilterType')?.value || '';
        const mainCategoryFilter = document.getElementById('tableFilterMainCategory')?.value || '';
        const subCategoryFilter = document.getElementById('tableFilterSubCategory')?.value || '';

        // 篩選記錄
        return this.records.filter(record => {
            const recordYear = record.date.split('-')[0];
            const recordMonth = record.date.split('-')[1];
            
            return (!yearFilter || recordYear === yearFilter) &&
                   (!monthFilter || recordMonth === monthFilter) &&
                   (!memberFilter || record.member === memberFilter) &&
                   (!typeFilter || record.type === typeFilter) &&
                   (!mainCategoryFilter || record.mainCategory === mainCategoryFilter) &&
                   (!subCategoryFilter || record.subCategory === subCategoryFilter);
        });
    }

    applyTableFilter(resetPage = true) {
        const filteredRecords = this.getCurrentFilteredRecords();

        // 只有在需要時才重置到第一頁
        if (resetPage) {
            this.currentPage = 1;
        }
        this.displayRecords(filteredRecords);
        this.updateSummary(filteredRecords);
    }

    updatePagination(totalRecords) {
        const totalPages = Math.ceil(totalRecords / this.recordsPerPage);
        const pageInfo = document.getElementById('pageInfo');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        // 更新頁面信息
        if (totalRecords === 0) {
            pageInfo.textContent = '暫無記錄';
        } else {
            const startRecord = (this.currentPage - 1) * this.recordsPerPage + 1;
            const endRecord = Math.min(this.currentPage * this.recordsPerPage, totalRecords);
            pageInfo.textContent = `第 ${this.currentPage} 頁，共 ${totalPages} 頁 (顯示 ${startRecord}-${endRecord} / ${totalRecords} 筆)`;
        }
        
        // 更新按鈕狀態
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= totalPages;
        
        // 如果當前頁超過總頁數，重置到第一頁
        if (this.currentPage > totalPages && totalPages > 0) {
            this.currentPage = 1;
            this.displayRecords(this.getFilteredRecords());
        }
    }

    updateSummary(records) {
        // 計算總收入、總支出和現有資產
        const totalIncome = records.filter(r => r.type === '收入').reduce((sum, record) => sum + record.amount, 0);
        const totalExpense = records.filter(r => r.type === '支出').reduce((sum, record) => sum + record.amount, 0);
        const totalAssets = records.filter(r => r.type === '資產').reduce((sum, record) => sum + record.amount, 0);
        const totalNetWorth = totalIncome - totalExpense + totalAssets;

        document.getElementById('totalIncome').textContent = `$${this.formatNumber(totalIncome)}`;
        document.getElementById('totalExpense').textContent = `$${this.formatNumber(totalExpense)}`;
        document.getElementById('totalAssets').textContent = `$${this.formatNumber(totalAssets)}`;
        document.getElementById('totalNetWorth').textContent = `$${this.formatNumber(totalNetWorth)}`;
    }

    initCharts() {
        // 支出類別圓餅圖
        this.expenseCategoryChart = new Chart(document.getElementById('expenseCategoryChart'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#4BC0C0',
                        '#9966FF',
                        '#FF9F40',
                        '#FF6384',
                        '#C9CBCF',
                        '#4BC0C0',
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#9966FF',
                        '#FF9F40',
                        '#C9CBCF',
                        '#4BC0C0',
                        '#FF6384',
                        '#36A2EB',
                        '#FFCE56',
                        '#9966FF'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${expenseTracker.formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // 支出成員圓餅圖
        this.expenseMemberChart = new Chart(document.getElementById('expenseMemberChart'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#667eea',
                        '#764ba2',
                        '#f093fb',
                        '#f5576c'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${expenseTracker.formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // 收入類別圓餅圖
        this.incomeCategoryChart = new Chart(document.getElementById('incomeCategoryChart'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#27ae60',
                        '#2ecc71',
                        '#16a085',
                        '#1abc9c',
                        '#27ae60',
                        '#2ecc71',
                        '#16a085',
                        '#1abc9c',
                        '#27ae60',
                        '#2ecc71'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${expenseTracker.formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // 收入成員圓餅圖
        this.incomeMemberChart = new Chart(document.getElementById('incomeMemberChart'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#27ae60',
                        '#2ecc71',
                        '#16a085',
                        '#1abc9c'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${expenseTracker.formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // 資產類別圓餅圖
        this.assetCategoryChart = new Chart(document.getElementById('assetCategoryChart'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#f39c12',
                        '#e67e22',
                        '#d35400',
                        '#e74c3c',
                        '#c0392b',
                        '#f39c12',
                        '#e67e22',
                        '#d35400',
                        '#e74c3c',
                        '#c0392b'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${expenseTracker.formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // 資產成員圓餅圖
        this.assetMemberChart = new Chart(document.getElementById('assetMemberChart'), {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: [
                        '#f39c12',
                        '#e67e22',
                        '#d35400',
                        '#c0392b'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: $${expenseTracker.formatNumber(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    updateCharts() {
        const chartTypeFilter = document.getElementById('chartFilterType').value;
        const chartYearFilter = document.getElementById('chartFilterYear').value;
        const chartMonthFilter = document.getElementById('chartFilterMonth').value;
        
        // 根據圖表篩選器過濾記錄
        const filteredRecords = this.records.filter(record => {
            const recordDate = new Date(record.date);
            const recordYear = recordDate.getFullYear().toString();
            const recordMonth = String(recordDate.getMonth() + 1).padStart(2, '0');
            
            return (!chartTypeFilter || record.type === chartTypeFilter) &&
                   (!chartYearFilter || recordYear === chartYearFilter) &&
                   (!chartMonthFilter || recordMonth === chartMonthFilter);
        });
        
        // 控制圖表顯示/隱藏
        this.toggleChartSections(chartTypeFilter);
        
        // 分別處理收入、支出和資產的數據
        const incomeRecords = filteredRecords.filter(r => r.type === '收入');
        const expenseRecords = filteredRecords.filter(r => r.type === '支出');
        const assetRecords = filteredRecords.filter(r => r.type === '資產');
        
        // 更新支出類別圖表
        const expenseCategoryData = this.getCategoryData(expenseRecords);
        this.expenseCategoryChart.data.labels = expenseCategoryData.labels;
        this.expenseCategoryChart.data.datasets[0].data = expenseCategoryData.data;
        
        // 如果沒有支出資料，顯示提示
        if (expenseCategoryData.labels.length === 0) {
            const filterText = this.getFilterText(chartTypeFilter, chartYearFilter, chartMonthFilter);
            this.expenseCategoryChart.data.labels = [`${filterText}暫無支出資料`];
            this.expenseCategoryChart.data.datasets[0].data = [1];
            this.expenseCategoryChart.data.datasets[0].backgroundColor = ['#e0e0e0'];
        } else {
            // 恢復原始顏色
            this.expenseCategoryChart.data.datasets[0].backgroundColor = [
                '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56', '#9966FF', '#FF9F40', '#C9CBCF', '#4BC0C0', '#FF6384', '#36A2EB', '#FFCE56', '#9966FF'
            ];
        }
        
        this.expenseCategoryChart.update();

        // 更新支出成員圖表
        const expenseMemberData = this.getMemberData(expenseRecords);
        this.expenseMemberChart.data.labels = expenseMemberData.labels;
        this.expenseMemberChart.data.datasets[0].data = expenseMemberData.data;
        
        // 如果沒有支出資料，顯示提示
        if (expenseMemberData.labels.length === 0) {
            const filterText = this.getFilterText(chartTypeFilter, chartYearFilter, chartMonthFilter);
            this.expenseMemberChart.data.labels = [`${filterText}暫無支出資料`];
            this.expenseMemberChart.data.datasets[0].data = [1];
            this.expenseMemberChart.data.datasets[0].backgroundColor = ['#e0e0e0'];
        } else {
            // 恢復原始顏色
            this.expenseMemberChart.data.datasets[0].backgroundColor = [
                '#667eea', '#764ba2', '#f093fb', '#f5576c'
            ];
        }
        
        this.expenseMemberChart.update();

        // 更新收入類別圖表
        const incomeCategoryData = this.getCategoryData(incomeRecords);
        this.incomeCategoryChart.data.labels = incomeCategoryData.labels;
        this.incomeCategoryChart.data.datasets[0].data = incomeCategoryData.data;
        
        // 如果沒有收入資料，顯示提示
        if (incomeCategoryData.labels.length === 0) {
            const filterText = this.getFilterText(chartTypeFilter, chartYearFilter, chartMonthFilter);
            this.incomeCategoryChart.data.labels = [`${filterText}暫無收入資料`];
            this.incomeCategoryChart.data.datasets[0].data = [1];
            this.incomeCategoryChart.data.datasets[0].backgroundColor = ['#e0e0e0'];
        } else {
            // 恢復原始顏色
            this.incomeCategoryChart.data.datasets[0].backgroundColor = [
                '#27ae60', '#2ecc71', '#16a085', '#1abc9c', '#27ae60', '#2ecc71', '#16a085', '#1abc9c', '#27ae60', '#2ecc71'
            ];
        }
        
        this.incomeCategoryChart.update();

        // 更新收入成員圖表
        const incomeMemberData = this.getMemberData(incomeRecords);
        this.incomeMemberChart.data.labels = incomeMemberData.labels;
        this.incomeMemberChart.data.datasets[0].data = incomeMemberData.data;
        
        // 如果沒有收入資料，顯示提示
        if (incomeMemberData.labels.length === 0) {
            const filterText = this.getFilterText(chartTypeFilter, chartYearFilter, chartMonthFilter);
            this.incomeMemberChart.data.labels = [`${filterText}暫無收入資料`];
            this.incomeMemberChart.data.datasets[0].data = [1];
            this.incomeMemberChart.data.datasets[0].backgroundColor = ['#e0e0e0'];
        } else {
            // 恢復原始顏色
            this.incomeMemberChart.data.datasets[0].backgroundColor = [
                '#27ae60', '#2ecc71', '#16a085', '#1abc9c'
            ];
        }
        
        this.incomeMemberChart.update();

        // 更新資產類別圖表
        const assetCategoryData = this.getCategoryData(assetRecords);
        this.assetCategoryChart.data.labels = assetCategoryData.labels;
        this.assetCategoryChart.data.datasets[0].data = assetCategoryData.data;
        
        // 如果沒有資產資料，顯示提示
        if (assetCategoryData.labels.length === 0) {
            const filterText = this.getFilterText(chartTypeFilter, chartYearFilter, chartMonthFilter);
            this.assetCategoryChart.data.labels = [`${filterText}暫無資產資料`];
            this.assetCategoryChart.data.datasets[0].data = [1];
            this.assetCategoryChart.data.datasets[0].backgroundColor = ['#e0e0e0'];
        } else {
            // 恢復原始顏色
            this.assetCategoryChart.data.datasets[0].backgroundColor = [
                '#f39c12', '#e67e22', '#d35400', '#e74c3c', '#c0392b', '#f39c12', '#e67e22', '#d35400', '#e74c3c', '#c0392b'
            ];
        }
        
        this.assetCategoryChart.update();

        // 更新資產成員圖表
        const assetMemberData = this.getMemberData(assetRecords);
        this.assetMemberChart.data.labels = assetMemberData.labels;
        this.assetMemberChart.data.datasets[0].data = assetMemberData.data;
        
        // 如果沒有資產資料，顯示提示
        if (assetMemberData.labels.length === 0) {
            const filterText = this.getFilterText(chartTypeFilter, chartYearFilter, chartMonthFilter);
            this.assetMemberChart.data.labels = [`${filterText}暫無資產資料`];
            this.assetMemberChart.data.datasets[0].data = [1];
            this.assetMemberChart.data.datasets[0].backgroundColor = ['#e0e0e0'];
        } else {
            // 恢復原始顏色
            this.assetMemberChart.data.datasets[0].backgroundColor = [
                '#f39c12', '#e67e22', '#d35400', '#c0392b'
            ];
        }
        
        this.assetMemberChart.update();
    }

    toggleChartSections(typeFilter) {
        // 控制支出統計區域
        const expenseTitle = document.querySelector('.expense-section-title');
        const expenseSection = document.querySelector('.expense-section');
        if (expenseTitle && expenseSection) {
            const showExpense = !typeFilter || typeFilter === '支出';
            expenseTitle.style.display = showExpense ? 'block' : 'none';
            expenseSection.style.display = showExpense ? 'flex' : 'none';
        }
        
        // 控制收入統計區域
        const incomeTitle = document.querySelector('.income-section-title');
        const incomeSection = document.querySelector('.income-section');
        if (incomeTitle && incomeSection) {
            const showIncome = !typeFilter || typeFilter === '收入';
            incomeTitle.style.display = showIncome ? 'block' : 'none';
            incomeSection.style.display = showIncome ? 'flex' : 'none';
        }
        
        // 控制資產統計區域
        const assetTitle = document.querySelector('.asset-section-title');
        const assetSection = document.querySelector('.asset-section');
        if (assetTitle && assetSection) {
            const showAsset = !typeFilter || typeFilter === '資產';
            assetTitle.style.display = showAsset ? 'block' : 'none';
            assetSection.style.display = showAsset ? 'flex' : 'none';
        }
    }

    // 圖表彈窗功能
    showChartsModal() {
        const modal = document.getElementById('chartsModal');
        modal.style.display = 'block';
        this.updateCharts();
    }

    hideChartsModal() {
        const modal = document.getElementById('chartsModal');
        modal.style.display = 'none';
    }


    getFilterText(typeFilter, yearFilter, monthFilter) {
        let text = '';
        if (typeFilter) text += `${typeFilter} `;
        if (yearFilter) text += `${yearFilter}年 `;
        if (monthFilter) {
            const monthNames = ['', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            text += `${monthNames[parseInt(monthFilter)]} `;
        }
        return text;
    }

    getCategoryData(records) {
        const categoryMap = {};
        records.forEach(record => {
            const categoryKey = `${record.mainCategory} - ${record.subCategory}`;
            categoryMap[categoryKey] = (categoryMap[categoryKey] || 0) + record.amount;
        });

        return {
            labels: Object.keys(categoryMap),
            data: Object.values(categoryMap)
        };
    }

    getMemberData(records) {
        const memberMap = {};
        records.forEach(record => {
            memberMap[record.member] = (memberMap[record.member] || 0) + record.amount;
        });

        return {
            labels: Object.keys(memberMap),
            data: Object.values(memberMap)
        };
    }
}

// 初始化記帳系統
let expenseTracker;
document.addEventListener('DOMContentLoaded', () => {
    expenseTracker = new ExpenseTracker();
});
