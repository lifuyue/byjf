// 管理员首页功能
document.addEventListener('DOMContentLoaded', function() {
    if (typeof checkAdminPermission === 'function' && !checkAdminPermission()) {
        return;
    }
    initAdminPage();
    setupLogoutFunctionality();
    loadRealTimeData();
});

// 初始化管理员页面
function initAdminPage() {
    updateUserInfo();
    updateNotificationBadge();
    showPageContent();
}

function showPageContent() {
    document.body.style.display = 'block';
}

// 更新用户信息显示
function updateUserInfo() {
    let userData = {};
    if (typeof getStoredUserData === 'function') {
        userData = getStoredUserData();
    } else {
        try {
            userData = JSON.parse(localStorage.getItem('adminUserData') || '{}');
        } catch {
            userData = {};
        }
    }
    
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
    if (typeof clearAdminSession === 'function') {
        clearAdminSession();
    }
    window.location.replace(window.ADMIN_LOGIN_PAGE || '../web-student/login.html?next=admin');
}

// 加载实时数据
function loadRealTimeData() {
    console.log('加载实时数据');
    // 这里可以添加实际的数据加载逻辑
}

console.log('管理员页面脚本加载完成');
