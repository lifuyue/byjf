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
const viewMoreLink = document.getElementById('viewMoreLink');
const earnedPointsHeader = document.getElementById('earnedPointsHeader');

// 获取内容区域的DOM元素
const chartContainer = document.getElementById('chartContainer');
const progressDetails = document.getElementById('progressDetails');
const earnedPointsList = document.getElementById('earnedPointsList');
const recommendedCompetitionsList = document.getElementById('recommendedCompetitionsList');
const policyCard = document.getElementById('policyCard');
const rankingCard = document.getElementById('rankingCard');
const planCard = document.getElementById('planCard');
const competitionCard = document.getElementById('competitionCard');

// 用户数据 - 修改这里的数值来测试
let userPointsData = {
    earned: 133,      // 已获加分 - 修改这个值
    total: 150        // 目标加分 - 修改这个值
};

// 计算百分比
function calculatePercentage(earned, total) {
    if (total === 0) return 0;
    return Math.round((earned / total) * 100);
}

// 更新饼状图
function updatePieChart() {
    // 重新获取元素引用（因为可能被重新创建）
    const pieChart = document.getElementById('pieChart');
    const percentage = document.getElementById('percentage');
    const earnedPointsElement = document.getElementById('earnedPoints');
    const remainingPointsElement = document.getElementById('remainingPoints');
    const totalPointsElement = document.getElementById('totalPoints');

    if (!pieChart || !percentage) {
        console.log('饼状图元素未找到');
        return;
    }

    const percent = calculatePercentage(userPointsData.earned, userPointsData.total);
    const remainingPercent = 100 - percent;

    console.log('更新饼状图:', userPointsData, '百分比:', percent + '%');

    // 更新百分比显示
    percentage.textContent = `${percent}%`;

    // 更新饼状图背景
    pieChart.style.background = `conic-gradient(
        rgba(255, 255, 255, 0.8) 0% ${percent}%,
        rgba(255, 255, 255, 0.2) ${percent}% 100%
    )`;

    // 更新进度数值
    if (earnedPointsElement) earnedPointsElement.textContent = userPointsData.earned;
    if (remainingPointsElement) remainingPointsElement.textContent = userPointsData.total - userPointsData.earned;
    if (totalPointsElement) totalPointsElement.textContent = userPointsData.total;
}

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

    progressDetails.innerHTML = `
        <div class="login-prompt">
            <div class="login-prompt-text">请登录后再查看</div>
        </div>
    `;

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

    // 隐藏"查看更多"链接
    viewMoreLink.style.display = 'none';

    // 调整标题布局（去掉flex布局，让标题居中）
    earnedPointsHeader.style.display = 'block';

    // 禁用功能卡片
    [policyCard, rankingCard, planCard, competitionCard].forEach(card => {
        card.classList.add('disabled');
        card.href = 'javascript:void(0)';
    });
}

// 显示内容
function showContent() {
    // 恢复左侧面板内容
    chartContainer.innerHTML = `
        <div class="pie-chart" id="pieChart"></div>
        <div class="chart-info">
            <div class="percentage" id="percentage">0%</div>
            <div class="completed-text">已完成</div>
        </div>
    `;

    progressDetails.innerHTML = `
        <div class="progress-item">
            <div class="progress-value" id="earnedPoints">0</div>
            <div class="progress-label">已获加分</div>
        </div>
        <div class="progress-item">
            <div class="progress-value" id="remainingPoints">0</div>
            <div class="progress-label">剩余加分</div>
        </div>
        <div class="progress-item">
            <div class="progress-value" id="totalPoints">150</div>
            <div class="progress-label">目标加分</div>
        </div>
    `;

    // 立即更新饼状图
    setTimeout(() => {
        updatePieChart();
    }, 100);

    // 恢复右侧面板内容
    earnedPointsList.innerHTML = `
        <div class="item-card">
            <div class="item-header">
                <div class="item-title">全国大学生数学建模竞赛</div>
                <div class="item-points">+15分</div>
            </div>
            <div class="item-desc">国家级一等奖，2023年9月</div>
        </div>

        <div class="item-card">
            <div class="item-header">
                <div class="item-title">"挑战杯"全国大学生课外学术科技作品竞赛</div>
                <div class="item-points">+12分</div>
            </div>
            <div class="item-desc">省级二等奖，2023年6月</div>
        </div>

        <div class="item-card">
            <div class="item-header">
                <div class="item-title">ACM国际大学生程序设计竞赛</div>
                <div class="item-points">+10分</div>
            </div>
            <div class="item-desc">区域赛铜奖，2023年11月</div>
        </div>

        <div class="item-card">
            <div class="item-header">
                <div class="item-title">学术论文发表</div>
                <div class="item-points">+8分</div>
            </div>
            <div class="item-desc">核心期刊第一作者，2023年12月</div>
        </div>
    `;

    recommendedCompetitionsList.innerHTML = `
        <div class="item-card">
            <div class="item-header">
                <div class="item-title">全国大学生英语竞赛</div>
                <div class="item-points">最高+10分</div>
            </div>
            <div class="item-desc">报名截止：2024年3月15日</div>
        </div>

        <div class="item-card">
            <div class="item-header">
                <div class="item-title">"互联网+"大学生创新创业大赛</div>
                <div class="item-points">最高+15分</div>
            </div>
            <div class="item-desc">报名截止：2024年4月30日</div>
        </div>

        <div class="item-card">
            <div class="item-header">
                <div class="item-title">全国大学生机器人大赛</div>
                <div class="item-points">最高+12分</div>
            </div>
            <div class="item-desc">报名截止：2024年5月20日</div>
        </div>

        <div class="item-card">
            <div class="item-header">
                <div class="item-title">全国大学生电子设计竞赛</div>
                <div class="item-points">最高+15分</div>
            </div>
            <div class="item-desc">报名截止：2024年6月10日</div>
        </div>
    `;

    // 显示"查看更多"链接
    viewMoreLink.style.display = 'flex';

    // 恢复标题布局
    earnedPointsHeader.style.display = 'flex';

    // 启用功能卡片
    [policyCard, rankingCard, planCard, competitionCard].forEach(card => {
        card.classList.remove('disabled');
    });

    // 设置正确的链接
    policyCard.href = '学校保研政策.html';
    rankingCard.href = '专业排名.html';
    planCard.href = '我的保研计划.html';
    competitionCard.href = '新增竞赛成绩.html';
}

// 登录按钮点击事件 - 跳转到登录页面
loginBtn.addEventListener('click', function() {
    window.location.href = 'login.html';
});

// 功能卡片点击事件（未登录时）
function addCardClickListeners() {
    [policyCard, rankingCard, planCard, competitionCard].forEach(card => {
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

// 添加测试函数到全局作用域
window.testPieChart = function(earned, total) {
    userPointsData.earned = earned;
    userPointsData.total = total;
    updatePieChart();
    console.log(`测试数据：已获加分=${earned}, 总加分=${total}, 完成度=${calculatePercentage(earned, total)}%`);
};
