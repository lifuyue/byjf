// 管理员首页功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('管理员页面开始加载');
    
    // 初始化页面
    initAdminPage();
    
    // 设置退出登录功能
    setupLogoutFunctionality();
    
    // 加载实时数据
    loadRealTimeData();
});

// 初始化管理员页面
function initAdminPage() {
    console.log('初始化管理员页面');
    
    // 检查管理员登录状态（不自动跳转）
    checkAdminLoginStatus();
    
    // 更新通知徽章
    updateNotificationBadge();
    
    // 显示页面内容
    showPageContent();
}

// 检查管理员登录状态（修改后的版本，不自动跳转）
function checkAdminLoginStatus() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    console.log('登录状态检查:', isLoggedIn);
    
    if (!isLoggedIn) {
        console.log('未检测到登录状态，显示测试模式');
        // 不自动跳转，显示测试模式
        showTestMode();
        return false;
    }
    
    // 更新用户信息显示
    updateUserInfo();
    return true;
}

// 显示测试模式（当未登录时）
function showTestMode() {
    console.log('显示测试模式');
    // 可以在这里添加测试模式的UI提示
    // 但不阻止用户查看页面
}

// 显示页面内容
function showPageContent() {
    console.log('显示页面内容');
    // 确保所有内容都显示
    document.body.style.display = 'block';
}

// 更新用户信息显示
function updateUserInfo() {
    const userData = JSON.parse(localStorage.getItem('adminUserData') || '{}');
    console.log('用户数据:', userData);
    
    if (userData.nickname) {
        document.getElementById('userNickname').textContent = userData.nickname;
    }
    
    if (userData.account) {
        document.getElementById('userAccount').textContent = userData.account;
    }
    
    if (userData.avatar) {
        const avatarElement = document.querySelector('.admin-avatar');
        if (avatarElement) {
            avatarElement.textContent = userData.avatar;
        }
    }
}

// 更新通知徽章
function updateNotificationBadge() {
    const pendingCount = document.getElementById('pendingCount');
    const pendingApplications = document.getElementById('pendingApplications');
    
    if (pendingCount && pendingApplications) {
        // 模拟获取待审核数量
        const count = 12;
        pendingCount.textContent = count;
        pendingApplications.textContent = count;
    }
}

// 设置退出登录功能
function setupLogoutFunctionality() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const cancelLogout = document.getElementById('cancelLogout');
    const confirmLogout = document.getElementById('confirmLogout');
    
    if (!logoutBtn || !logoutModal) {
        console.log('退出登录元素未找到');
        return;
    }
    
    // 退出登录按钮点击事件
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        console.log('点击退出登录');
        logoutModal.style.display = 'flex';
    });
    
    // 取消退出
    if (cancelLogout) {
        cancelLogout.addEventListener('click', function() {
            logoutModal.style.display = 'none';
        });
    }
    
    // 确认退出
    if (confirmLogout) {
        confirmLogout.addEventListener('click', function() {
            console.log('确认退出登录');
            performLogout();
        });
    }
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === logoutModal) {
            logoutModal.style.display = 'none';
        }
    });
}

// 执行退出登录操作
function performLogout() {
    console.log('执行退出登录操作');
    
    // 清除登录状态
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUserData');
    
    // 显示退出成功消息
    showLogoutMessage();
}

// 显示退出成功消息
function showLogoutMessage() {
    const modalContent = document.querySelector('.modal-content');
    if (!modalContent) return;
    
    const originalContent = modalContent.innerHTML;
    
    modalContent.innerHTML = `
        <div class="modal-icon">
            <i class="fas fa-check-circle" style="color: #4CAF50;"></i>
        </div>
        <h3 class="modal-title">退出成功</h3>
        <p class="modal-text">您已成功退出管理员账号</p>
        <div class="modal-actions">
            <button class="modal-btn modal-btn-confirm" id="goToLogin">
                前往登录页面
            </button>
        </div>
    `;
    
    // 添加前往登录页面的点击事件
    document.getElementById('goToLogin').addEventListener('click', function() {
        console.log('跳转到登录页面');
        window.location.href = '../shared/login.html';
    });
    
    // 3秒后自动跳转
    setTimeout(function() {
        console.log('自动跳转到登录页面');
        window.location.href = '../shared/login.html';
    }, 3000);
}

// 加载实时数据
function loadRealTimeData() {
    console.log('加载实时数据');
    // 这里可以添加实际的数据加载逻辑
}

// 测试函数：模拟登录
window.simulateAdminLogin = function() {
    localStorage.setItem('adminLoggedIn', 'true');
    localStorage.setItem('adminUserData', JSON.stringify({
        nickname: '管理员',
        account: 'admin@system.edu.cn',
        avatar: '管'
    }));
    console.log('模拟管理员登录成功');
    location.reload();
}

// 测试函数：清除登录状态
window.clearAdminLogin = function() {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUserData');
    console.log('清除登录状态成功');
    location.reload();
}

console.log('管理员页面脚本加载完成');
console.log('测试命令: simulateAdminLogin() - 模拟登录');
console.log('测试命令: clearAdminLogin() - 清除登录状态');