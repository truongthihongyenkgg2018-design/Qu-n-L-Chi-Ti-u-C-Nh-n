// Data Management
const DB_VERSION = '1.2';
if (localStorage.getItem('db_version') !== DB_VERSION) {
    localStorage.clear();
    localStorage.setItem('db_version', DB_VERSION);
}

const DEFAULT_CATEGORIES = [
    { id: 1, name: 'Lương', type: 'Thu' },
    { id: 2, name: 'Thưởng', type: 'Thu' },
    { id: 3, name: 'Ăn uống', type: 'Chi' },
    { id: 4, name: 'Mua sắm', type: 'Chi' },
    { id: 5, name: 'Di chuyển', type: 'Chi' },
    { id: 6, name: 'Giải trí', type: 'Chi' }
];

// State
let state = {
    user: JSON.parse(localStorage.getItem('user')) || null,
    categories: [],
    transactions: [],
    currentView: 'dashboard'
};

// Utils
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const saveState = () => {
    localStorage.setItem('user', JSON.stringify(state.user));
    if (state.user) {
        localStorage.setItem(`user_${state.user.username}_categories`, JSON.stringify(state.categories));
        localStorage.setItem(`user_${state.user.username}_transactions`, JSON.stringify(state.transactions));
    }
};

const renderTransactionTable = (transactions, title = 'Lịch sử giao dịch') => {
    let historyHtml = transactions
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(t => {
            const cat = state.categories.find(c => c.id == t.categoryId);
            return `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString('vi-VN')}</td>
                    <td>${cat ? cat.name : 'Unknown'}</td>
                    <td><span class="tag tag-${t.type.toLowerCase()}">${t.type}</span></td>
                    <td style="font-weight: bold; color: ${t.type === 'Thu' ? '#2E7D32' : '#C62828'}">${formatCurrency(t.amount)}</td>
                    <td>${t.note}</td>
                    <td class="action-btns">
                        <button class="btn-icon-sm delete-btn" onclick="deleteTransaction(${t.id})"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }).join('');

    return `
        <div class="card">
            <h3 style="margin-bottom: 1.5rem;">${title}</h3>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Ngày</th>
                            <th>Danh mục</th>
                            <th>Loại</th>
                            <th>Số tiền</th>
                            <th>Ghi chú</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${historyHtml || '<tr><td colspan="6" style="text-align:center">Chưa có dữ liệu</td></tr>'}
                    </tbody>
                </table>
            </div>
        </div>
    `;
};

// DOM Elements
const authContainer = document.getElementById('auth-container');
const mainContainer = document.getElementById('main-container');
const viewContent = document.getElementById('view-content');
const viewTitle = document.getElementById('view-title');
const navItems = document.querySelectorAll('.nav-item');
const userDisplayName = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');

// View Methods
const renderDashboard = () => {
    viewTitle.innerText = 'Tổng quan tài chính';
    
    const tongThu = state.transactions.filter(t => t.type === 'Thu').reduce((acc, t) => acc + t.amount, 0);
    const tongChi = state.transactions.filter(t => t.type === 'Chi').reduce((acc, t) => acc + t.amount, 0);
    const soDu = tongThu - tongChi;

    viewContent.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card income">
                <div class="stat-icon"><i class="fas fa-arrow-up"></i></div>
                <div class="stat-details">
                    <span>Tổng Thu Nhập</span>
                    <h2>${formatCurrency(tongThu)}</h2>
                </div>
            </div>
            <div class="stat-card expense">
                <div class="stat-icon"><i class="fas fa-arrow-down"></i></div>
                <div class="stat-details">
                    <span>Tổng Chi Tiêu</span>
                    <h2>${formatCurrency(tongChi)}</h2>
                </div>
            </div>
            <div class="stat-card balance">
                <div class="stat-icon"><i class="fas fa-wallet"></i></div>
                <div class="stat-details">
                    <span>Số Dư Hiện Tại</span>
                    <h2>${formatCurrency(soDu)}</h2>
                </div>
            </div>
        </div>

        ${renderTransactionTable(state.transactions)}
    `;
};

const renderCategories = () => {
    viewTitle.innerText = 'Quản lý danh mục';
    let catHtml = state.categories.map(c => `
        <tr>
            <td>${c.name}</td>
            <td><span class="tag tag-${c.type.toLowerCase()}">${c.type}</span></td>
            <td class="action-btns">
                <button class="btn-icon-sm delete-btn" onclick="deleteCategory(${c.id})"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');

    viewContent.innerHTML = `
        <div class="card" style="margin-bottom: 2rem;">
            <h3>Thêm danh mục mới</h3>
            <form id="cat-form" style="display: flex; gap: 1rem; margin-top: 1rem; align-items: flex-end;">
                <div class="input-group" style="margin-bottom:0; flex: 2;">
                    <label>Tên danh mục</label>
                    <input type="text" id="cat-name" required placeholder="Tên danh mục">
                </div>
                <div class="input-group" style="margin-bottom:0; flex: 1;">
                    <label>Loại</label>
                    <select id="cat-type" style="width: 100%; padding: 0.8rem; border-radius: 12px; border: 2px solid var(--border); outline:none;">
                        <option value="Thu">Thu</option>
                        <option value="Chi">Chi</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary" style="width: auto; padding: 0.8rem 2rem;">Thêm</button>
            </form>
        </div>
        <div class="card">
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Tên danh mục</th>
                            <th>Loại</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>${catHtml}</tbody>
                </table>
            </div>
        </div>
    `;

    document.getElementById('cat-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('cat-name').value;
        const type = document.getElementById('cat-type').value;
        const newCat = { id: Date.now(), name, type };
        state.categories.push(newCat);
        saveState();
        renderCategories();
    });
};

const renderTransactionForm = (type) => {
    const isIncome = type === 'Thu';
    viewTitle.innerText = isIncome ? 'Thêm thu nhập' : 'Thêm chi tiêu';
    
    const filteredCats = state.categories.filter(c => c.type === type);
    const catOptions = filteredCats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');

    viewContent.innerHTML = `
        <div class="card" style="max-width: 600px; margin: 0 auto;">
            <form id="tx-form">
                <div class="input-group">
                    <label>Số tiền (VND)</label>
                    <input type="number" id="tx-amount" required placeholder="0">
                </div>
                <div class="input-group">
                    <label>Danh mục</label>
                    <select id="tx-category" required style="width: 100%; padding: 0.8rem; border-radius: 12px; border: 2px solid var(--border); outline:none;">
                        ${catOptions}
                    </select>
                </div>
                <div class="input-group">
                    <label>Ngày</label>
                    <input type="date" id="tx-date" required value="${new Date().toISOString().split('T')[0]}">
                </div>
                <div class="input-group">
                    <label>Ghi chú</label>
                    <input type="text" id="tx-note" placeholder="Nhập ghi chú...">
                </div>
                <button type="submit" class="btn-primary">Lưu giao dịch</button>
            </form>
        </div>
    `;

    document.getElementById('tx-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('tx-amount').value);
        const categoryId = parseInt(document.getElementById('tx-category').value);
        const date = document.getElementById('tx-date').value;
        const note = document.getElementById('tx-note').value;

        const newTx = { id: Date.now(), amount, date, categoryId, note, type };
        state.transactions.push(newTx);
        saveState();
        switchView('dashboard');
    });
};

const deleteTransaction = (id) => {
    if(confirm('Bạn có chắc muốn xóa giao dịch này?')) {
        state.transactions = state.transactions.filter(t => t.id !== id);
        saveState();
        renderDashboard();
    }
};

const deleteCategory = (id) => {
    if(confirm('Bạn có chắc muốn xóa danh mục này? Cảnh báo: Các giao dịch liên quan sẽ không hiển thị tên danh mục.')) {
        state.categories = state.categories.filter(c => c.id !== id);
        saveState();
        renderCategories();
    }
};

const switchView = (view) => {
    state.currentView = view;
    navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    switch(view) {
        case 'dashboard': renderDashboard(); break;
        case 'categories': renderCategories(); break;
        case 'income': renderTransactionForm('Thu'); break;
        case 'expenses': renderTransactionForm('Chi'); break;
        case 'reports': renderReports(); break;
    }
};

const renderReports = () => {
    viewTitle.innerText = 'Báo cáo phân tích';
    
    const tongThu = state.transactions.filter(t => t.type === 'Thu').reduce((acc, t) => acc + t.amount, 0);
    const tongChi = state.transactions.filter(t => t.type === 'Chi').reduce((acc, t) => acc + t.amount, 0);
    const tietKiem = tongThu - tongChi;

    // Aggregate expenses by category
    const expenseData = state.transactions.filter(t => t.type === 'Chi');
    const categoryTotals = {};
    expenseData.forEach(t => {
        categoryTotals[t.categoryId] = (categoryTotals[t.categoryId] || 0) + t.amount;
    });

    const distHtml = Object.keys(categoryTotals).map(catId => {
        const cat = state.categories.find(c => c.id == catId);
        const amount = categoryTotals[catId];
        const percentage = tongChi > 0 ? Math.round((amount / tongChi) * 100) : 0;
        return `
            <div class="dist-item">
                <div class="dist-info">
                    <span>${cat ? cat.name : 'Khác'}</span>
                    <span>${formatCurrency(amount)} (${percentage}%)</span>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    }).join('');

    viewContent.innerHTML = `
        <p style="color: var(--text-muted); margin-bottom: 2rem;">Xem tóm tắt tình hình tài chính của bạn.</p>
        
        <div class="report-grid">
            <div class="report-card income">
                <span>Tổng thu</span>
                <h2>${formatCurrency(tongThu)}</h2>
            </div>
            <div class="report-card expense">
                <span>Tổng chi</span>
                <h2>${formatCurrency(tongChi)}</h2>
            </div>
            <div class="report-card savings">
                <span>Tiết kiệm</span>
                <h2>${formatCurrency(tietKiem)}</h2>
            </div>
        </div>

        <div class="card" style="margin-bottom: 2rem;">
            <h3 style="margin-bottom: 2rem;">Phân bổ chi tiêu theo danh mục</h3>
            <div class="category-distribution">
                ${distHtml || '<p>Chưa có dữ liệu chi tiêu</p>'}
            </div>
        </div>

        ${renderTransactionTable(state.transactions, 'Lịch sử thu và chi')}
    `;
};

// Auth Logic
const showAuth = (isRegister = false) => {
    authContainer.classList.remove('hidden');
    mainContainer.classList.add('hidden');
    
    document.getElementById('auth-title').innerText = isRegister ? 'Đăng ký tài khoản' : 'Chào mừng trở lại!';
    document.getElementById('auth-subtitle').innerText = isRegister ? 'Vui lòng điền thông tin bên dưới' : 'Vui lòng đăng nhập để tiếp tục';
    document.getElementById('auth-btn').innerText = isRegister ? 'Đăng ký' : 'Đăng nhập';
    document.getElementById('auth-toggle-text').innerHTML = isRegister 
        ? 'Đã có tài khoản? <a href="#" id="auth-toggle">Đăng nhập ngay</a>'
        : 'Chưa có tài khoản? <a href="#" id="auth-toggle">Đăng ký ngay</a>';
    
    document.getElementById('auth-toggle').onclick = (e) => {
        e.preventDefault();
        showAuth(!isRegister);
    };
};

const handleAuth = (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const isRegister = document.getElementById('auth-btn').innerText === 'Đăng ký';
    
    if (isRegister) {
        localStorage.setItem(`user_${username}`, JSON.stringify({ username }));
        alert('Đăng ký thành công! Hãy đăng nhập.');
        showAuth(false);
    } else {
        const user = localStorage.getItem(`user_${username}`);
        if (user || username === 'admin') { // Mock admin login
            state.user = { username };
            
            // Critical: Reset state data before initApp loads new user data
            state.transactions = [];
            state.categories = [];
            
            // Persist ONLY the user session first
            localStorage.setItem('user', JSON.stringify(state.user));
            
            initApp();
        } else {
            alert('Tên đăng nhập không đúng!');
        }
    }
};

// Init
const initApp = () => {
    if (!state.user) {
        showAuth();
        document.getElementById('auth-form').onsubmit = handleAuth;
    } else {
        const username = state.user.username;
        // Load user-specific data
        state.categories = JSON.parse(localStorage.getItem(`user_${username}_categories`)) || DEFAULT_CATEGORIES;
        state.transactions = JSON.parse(localStorage.getItem(`user_${username}_transactions`)) || [];
        
        // Mock data for admin ONLY if empty
        if (username === 'admin' && state.transactions.length === 0) {
            state.transactions = [
                { id: 1, amount: 100000000, date: '2026-03-01', categoryId: 1, note: 'Lương tháng 3', type: 'Thu' },
                { id: 2, amount: 2000000, date: '2026-03-05', categoryId: 3, note: 'Chi tiêu ăn uống', type: 'Chi' }
            ];
            saveState();
        }

        authContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        userDisplayName.innerText = username;
        switchView('dashboard');
    }
};

// Event Listeners
navItems.forEach(item => {
    item.onclick = (e) => {
        e.preventDefault();
        switchView(item.dataset.view);
    };
});

logoutBtn.onclick = () => {
    state.user = null;
    state.transactions = [];
    state.categories = [];
    localStorage.removeItem('user'); // Specifically clear session
    initApp();
};

document.getElementById('header-date').innerText = `Hôm nay, ${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' })}`;

initApp();
