// 获取DOM元素
const loginBtn = document.getElementById('loginBtn');
const userInfo = document.getElementById('userInfo');
const userAvatar = document.getElementById('userAvatar');
const userNickname = document.getElementById('userNickname');
const userAccount = document.getElementById('userAccount');
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const cancelLogout = document.getElementById('cancelLogout');
const confirmLogout = document.getElementById('confirmLogout');

// 获取内容区域的DOM元素
const chartContainer = document.getElementById('chartContainer');
const progressDetails = document.getElementById('progressDetails');
const earnedPointsList = document.getElementById('earnedPointsList');
const recommendedCompetitionsList = document.getElementById('recommendedCompetitionsList');
const policyCard = document.getElementById('policyCard');
const rankingCard = document.getElementById('rankingCard');
const planCard = document.getElementById('planCard');
const competitionCard = document.getElementById('competitionCard');
const featureCards = [policyCard, rankingCard, planCard, competitionCard].filter(Boolean);

// 检查登录状态
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    if (isLoggedIn && userData.username) {
        // 已登录状态
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        logoutBtn.style.display = 'flex';
        userNickname.textContent = userData.nickname || userData.username;
        userAccount.textContent = userData.username;
        userAvatar.textContent = (userData.nickname || userData.username).charAt(0);

        // 显示内容
        showContent();
    } else {
        // 未登录状态
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
        logoutBtn.style.display = 'none';

        // 隐藏内容，显示登录提示
        hideContent();
    }
}

// 隐藏内容，显示登录提示
function hideContent() {
    // 左侧面板内容替换为登录提示
    chartContainer.innerHTML = `
        <div class="login-prompt">
            <i class="fas fa-user-lock"></i>
            <div class="login-prompt-text">请登录后再查看</div>
        </div>
    `;

    if (progressDetails) {
        progressDetails.innerHTML = `
            <div class="login-prompt">
                <div class="login-prompt-text">请登录后再查看</div>
            </div>
        `;
    }

    // 右侧面板内容替换为登录提示
    earnedPointsList.innerHTML = `
        <div class="login-prompt">
            <i class="fas fa-user-lock"></i>
            <div class="login-prompt-text">请登录后再查看</div>
        </div>
    `;

    recommendedCompetitionsList.innerHTML = `
        <div class="login-prompt">
            <i class="fas fa-user-lock"></i>
            <div class="login-prompt-text">请登录后再查看</div>
        </div>
    `;

    // 禁用功能卡片
    featureCards.forEach(card => {
        card.classList.add('disabled');
        card.href = 'javascript:void(0)';
    });
}

// 显示内容
function showContent() {
    // 假设你从后端或其他地方获取到这两个数据
    let reviewedCount = 72;    // 已审核人数
    let totalCount = 100;      // 总人数

    // 恢复左侧面板内容
    chartContainer.innerHTML = `
<div class="pie-chart"></div>
<div class="chart-info">
    <div class="percentage">${reviewedCount} / ${totalCount}</div>
    <div class="completed-text">已审核 / 总人数</div>
</div>
    `;



    // 恢复右侧面板内容
 earnedPointsList.innerHTML = `
    <div class="item-card">
<div class="item-header">
    <div class="item-title">张三</div>
</div>
    </div>
    <div class="item-card">
<div class="item-header">
    <div class="item-title">李四</div>
</div>
    </div>
    <div class="item-card">
<div class="item-header">
    <div class="item-title">王五</div>
</div>
    </div>
    <div class="item-card">
<div class="item-header">
    <div class="item-title">张7</div>
</div>
    </div>
`;

recommendedCompetitionsList.innerHTML = `
    <div class="item-card">
<div class="item-header">
    <div class="item-title">陈1</div>
</div>
    </div>
    <div class="item-card">
<div class="item-header">
    <div class="item-title">陈2</div>
</div>
    </div>
    <div class="item-card">
<div class="item-header">
    <div class="item-title">陈3</div>
</div>
    </div>
    <div class="item-card">
<div class="item-header">
    <div class="item-title">陈4</div>
</div>
    </div>
`;

    // 启用功能卡片
    featureCards.forEach(card => {
        card.classList.remove('disabled');
    });

    if (policyCard) {
        policyCard.href = '学校保研政策.html';
    }
    if (rankingCard) {
        rankingCard.href = '专业排名（教师端）.html';
    }
    if (planCard) {
        planCard.href = '审核中项目.html';
    }
    if (competitionCard) {
        competitionCard.href = '审核记录.html';
    }
}

// 登录按钮点击事件 - 跳转到登录页面
loginBtn.addEventListener('click', function() {
    window.location.href = 'login教师端.html';
});

// 功能卡片点击事件（未登录时）
function addCardClickListeners() {
    featureCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (this.classList.contains('disabled')) {
                e.preventDefault();
                alert('请登录后再查看');
            }
        });
    });
}

// 退出登录按钮点击事件
logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    logoutModal.style.display = 'flex';
});

// 取消退出
cancelLogout.addEventListener('click', function() {
    logoutModal.style.display = 'none';
});

// 确认退出
confirmLogout.addEventListener('click', function() {
    // 执行退出登录逻辑
    logoutModal.querySelector('.modal-icon').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    logoutModal.querySelector('.modal-title').textContent = '正在退出...';
    logoutModal.querySelector('.modal-text').textContent = '请稍候，正在安全退出您的账号';
    logoutModal.querySelector('.modal-actions').style.display = 'none';

    // 模拟网络请求延迟
    setTimeout(function() {
        // 清除登录状态
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');

        // 重置弹窗状态
        logoutModal.style.display = 'none';
        logoutModal.querySelector('.modal-icon').innerHTML = '<i class="fas fa-sign-out-alt"></i>';
        logoutModal.querySelector('.modal-title').textContent = '确认退出登录';
        logoutModal.querySelector('.modal-text').textContent = '您确定要退出当前账号吗？退出后需要重新登录才能访问系统功能。';
        logoutModal.querySelector('.modal-actions').style.display = 'flex';

        // 更新界面显示
        checkLoginStatus();

        // 显示退出成功提示
        alert('已成功退出登录！');
    }, 1000);
});

// 点击弹窗外部关闭弹窗
window.addEventListener('click', function(e) {
    if (e.target === logoutModal) {
        logoutModal.style.display = 'none';
    }
});

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
    addCardClickListeners();

    // 添加卡片悬停效果
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            if (!this.classList.contains('disabled')) {
                this.style.transform = 'translateY(-5px)';
            }
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // 添加项目卡片悬停效果
    document.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
});

// 登录表单处理
// 假设教师账号为 teacher 密码为 123456
    const TEACHER_USERNAME = "teacher";
    const TEACHER_PASSWORD = "123456";

    document.getElementById('loginForm').addEventListener('submit', function(e) {
e.preventDefault();
const username = document.getElementById('username').value.trim();
const password = document.getElementById('password').value.trim();

if (username === TEACHER_USERNAME && password === TEACHER_PASSWORD) {
    // 登录成功，保存状态到 localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userData', JSON.stringify({
        username: username,
        nickname: "张三" // 可自定义
    }));
    // 跳转到教师端页面
    window.location.href = "login教师端.html";
} else {
    // 登录失败
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('loginError').innerText = '用户名或密码错误';
}
    });
