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

// 内容区域
const chartContainer = document.getElementById('chartContainer');
const progressDetails = document.getElementById('progressDetails');
const earnedPointsList = document.getElementById('earnedPointsList');
const recommendedCompetitionsList = document.getElementById('recommendedCompetitionsList');
const policyCard = document.getElementById('policyCard');
const rankingCard = document.getElementById('rankingCard');
const planCard = document.getElementById('planCard');
const competitionCard = document.getElementById('competitionCard');

// 教师发布项目 DOM
const teacherProjectsSection = document.getElementById('teacherProjectsSection');
const teacherProjectsList = document.getElementById('teacherProjectsList');
const refreshTeacherProjectsBtn = document.getElementById('refreshTeacherProjectsBtn');

// 用户进度数据
let userPointsData = {
    earned: 133,
    total: 150
};

// 教师项目共享配置
const PROJECT_COOKIE_KEY = 'pg_plus_projects';
const STUDENT_PROJECT_CACHE_KEY = 'studentTeacherProjectsCache';
const STUDENT_SELECTION_KEY = 'studentProjectSelections';
const PROJECT_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const DEFAULT_TEACHER_PROJECTS = [
    {
        id: 'proj-research-2024',
        title: '科研助理计划',
        description: '参与导师课题，完成阶段任务并通过验收后即可获得对应加分。',
        points: 12,
        deadline: '2024-06-30',
        slots: 15,
        selectedCount: 3,
        status: 'active',
        createdAt: '2024-04-15T08:00:00.000Z',
        updatedAt: '2024-04-20T08:00:00.000Z'
    },
    {
        id: 'proj-mentor-2024',
        title: '创新创业工作坊',
        description: '导师团队带领完成创新课题，提交结题报告即可申请加分。',
        points: 10,
        deadline: '2024-07-15',
        slots: 20,
        selectedCount: 5,
        status: 'active',
        createdAt: '2024-04-18T08:00:00.000Z',
        updatedAt: '2024-04-21T08:00:00.000Z'
    }
];

let teacherProjects = [];
let teacherProjectsSignature = '';
let studentProjectSelections = new Set();
let teacherProjectsWatcher = null;

// ------------------- 公共函数 -------------------
function calculatePercentage(earned, total) {
    if (total === 0) return 0;
    return Math.round((earned / total) * 100);
}

function updatePieChart() {
    const pieChart = document.getElementById('pieChart');
    const percentage = document.getElementById('percentage');
    const earnedPointsElement = document.getElementById('earnedPoints');
    const remainingPointsElement = document.getElementById('remainingPoints');
    const totalPointsElement = document.getElementById('totalPoints');

    if (!pieChart || !percentage) {
        return;
    }

    const percent = calculatePercentage(userPointsData.earned, userPointsData.total);

    percentage.textContent = `${percent}%`;
    pieChart.style.background = `conic-gradient(
        rgba(255, 255, 255, 0.8) 0% ${percent}%,
        rgba(255, 255, 255, 0.2) ${percent}% 100%
    )`;

    if (earnedPointsElement) earnedPointsElement.textContent = userPointsData.earned;
    if (remainingPointsElement) remainingPointsElement.textContent = userPointsData.total - userPointsData.earned;
    if (totalPointsElement) totalPointsElement.textContent = userPointsData.total;
}

// ------------------- 教师项目存储 -------------------
function getCookieValue(name) {
    const match = document.cookie.split('; ').find(row => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : '';
}

function readTeacherProjectsFromCookie() {
    try {
        const cookieValue = getCookieValue(PROJECT_COOKIE_KEY);
        if (!cookieValue) return [];
        const parsed = JSON.parse(cookieValue);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeTeacherProjectsCookie(projects) {
    try {
        const payload = encodeURIComponent(JSON.stringify(projects));
        document.cookie = `${PROJECT_COOKIE_KEY}=${payload}; path=/; max-age=${PROJECT_COOKIE_MAX_AGE}`;
    } catch (err) {
        console.warn('写入项目数据失败', err);
    }
}

function readTeacherProjectsCache() {
    try {
        const cache = JSON.parse(localStorage.getItem(STUDENT_PROJECT_CACHE_KEY) || '[]');
        return Array.isArray(cache) ? cache : [];
    } catch {
        return [];
    }
}

function updateTeacherProjectsCache(projects) {
    localStorage.setItem(STUDENT_PROJECT_CACHE_KEY, JSON.stringify(projects));
}

function sanitizeProject(project = {}) {
    const normalized = { ...project };
    normalized.id = typeof normalized.id === 'string' ? normalized.id : `proj-${Date.now()}`;
    normalized.title = (normalized.title || '未命名项目').trim();
    normalized.description = (normalized.description || '暂无描述').trim();
    normalized.points = Number.isFinite(Number(normalized.points)) ? Math.max(0, Number(normalized.points)) : 0;
    normalized.slots = Math.max(1, Number(normalized.slots) || 1);
    const selected = Number.isFinite(Number(normalized.selectedCount)) ? Number(normalized.selectedCount) : 0;
    normalized.selectedCount = Math.min(Math.max(selected, 0), normalized.slots);
    normalized.deadline = normalized.deadline || '';
    normalized.status = normalized.status === 'paused' ? 'paused' : 'active';
    normalized.createdAt = normalized.createdAt || new Date().toISOString();
    normalized.updatedAt = normalized.updatedAt || normalized.createdAt;
    return normalized;
}

function loadTeacherProjectsDataset() {
    const cookieProjects = readTeacherProjectsFromCookie();
    if (cookieProjects.length) {
        updateTeacherProjectsCache(cookieProjects);
        return cookieProjects;
    }

    const cachedProjects = readTeacherProjectsCache();
    if (cachedProjects.length) {
        return cachedProjects;
    }

    // 首次进入时写入默认示例，方便教师端和学生端同步
    updateTeacherProjectsCache(DEFAULT_TEACHER_PROJECTS);
    writeTeacherProjectsCookie(DEFAULT_TEACHER_PROJECTS);
    return DEFAULT_TEACHER_PROJECTS;
}

function initializeTeacherProjectsData() {
    teacherProjects = loadTeacherProjectsDataset().map(sanitizeProject);
    teacherProjectsSignature = JSON.stringify(teacherProjects);
    updateTeacherProjectsCache(teacherProjects);
}

function loadStudentSelections() {
    try {
        const saved = JSON.parse(localStorage.getItem(STUDENT_SELECTION_KEY) || '[]');
        return new Set(Array.isArray(saved) ? saved : []);
    } catch {
        return new Set();
    }
}

function saveStudentSelections() {
    localStorage.setItem(STUDENT_SELECTION_KEY, JSON.stringify(Array.from(studentProjectSelections)));
}

function persistTeacherProjects(projects) {
    teacherProjects = projects.map(sanitizeProject);
    teacherProjectsSignature = JSON.stringify(teacherProjects);
    updateTeacherProjectsCache(teacherProjects);
    writeTeacherProjectsCookie(teacherProjects);
}

function renderTeacherProjectsForStudent() {
    if (!teacherProjectsList) return;

    if (!teacherProjects.length) {
        teacherProjectsList.innerHTML = `
            <div class="empty-state">教师尚未发布可报名的项目，请稍后再试。</div>
        `;
        return;
    }

    teacherProjectsList.innerHTML = teacherProjects.map(project => {
        const isSelected = studentProjectSelections.has(project.id);
        const isPaused = project.status === 'paused';
        const isFull = project.selectedCount >= project.slots;
        const cardClasses = ['teacher-project-card'];
        if (isPaused) cardClasses.push('paused');
        if (isFull) cardClasses.push('full');

        const buttonClasses = ['project-select-btn', isSelected ? 'selected' : 'primary'];
        const buttonDisabled = !isSelected && (isPaused || isFull);

        return `
            <div class="${cardClasses.join(' ')}" data-project-id="${project.id}">
                <div class="card-top">
                    <h3>${project.title}</h3>
                    <span class="points-badge">+${project.points}分</span>
                </div>
                <p class="project-desc">${project.description}</p>
                <div class="project-meta">
                    <span><i class="fas fa-calendar-alt"></i> 截止：${project.deadline || '待定'}</span>
                    <span><i class="fas fa-users"></i> 已报名 ${project.selectedCount}/${project.slots}</span>
                    <span><i class="fas fa-hourglass-half"></i> 剩余 ${Math.max(project.slots - project.selectedCount, 0)} 名额</span>
                </div>
                <div class="project-footer">
                    <span class="project-status">
                        ${isSelected ? '已选择' : isPaused ? '暂停报名' : isFull ? '名额已满' : '可报名'}
                    </span>
                    <button class="${buttonClasses.join(' ')}" data-project-id="${project.id}" ${buttonDisabled ? 'disabled' : ''}>
                        ${isSelected ? '取消选择' : '我要报名'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function setTeacherProjectsSectionLoggedIn(isLoggedIn) {
    if (!teacherProjectsSection) return;
    teacherProjectsSection.classList.toggle('disabled', !isLoggedIn);
    if (refreshTeacherProjectsBtn) {
        refreshTeacherProjectsBtn.disabled = !isLoggedIn;
    }

    if (!isLoggedIn) {
        if (teacherProjectsList) {
            teacherProjectsList.innerHTML = `
                <div class="empty-state">登录后可查看并选择教师发布的项目</div>
            `;
        }
    } else {
        renderTeacherProjectsForStudent();
    }
}

function handleTeacherProjectClick(event) {
    const button = event.target.closest('.project-select-btn');
    if (!button) return;
    const projectId = button.getAttribute('data-project-id');
    if (!projectId) return;

    if (studentProjectSelections.has(projectId)) {
        cancelTeacherProjectSelection(projectId);
    } else {
        selectTeacherProject(projectId);
    }
}

function selectTeacherProject(projectId) {
    const project = teacherProjects.find(item => item.id === projectId);
    if (!project) {
        alert('该项目不存在或已被删除');
        return;
    }
    if (project.status === 'paused') {
        alert('该项目暂未开放报名，请联系教师。');
        return;
    }
    if (project.selectedCount >= project.slots) {
        alert('该项目名额已满，请选择其他项目。');
        return;
    }

    studentProjectSelections.add(projectId);
    project.selectedCount = Math.min(project.selectedCount + 1, project.slots);
    project.updatedAt = new Date().toISOString();
    saveStudentSelections();
    persistTeacherProjects(teacherProjects);
    renderTeacherProjectsForStudent();
    alert('报名成功！请等待教师审核。');
}

function cancelTeacherProjectSelection(projectId) {
    const project = teacherProjects.find(item => item.id === projectId);
    if (!project) {
        studentProjectSelections.delete(projectId);
        saveStudentSelections();
        renderTeacherProjectsForStudent();
        return;
    }

    studentProjectSelections.delete(projectId);
    project.selectedCount = Math.max(project.selectedCount - 1, 0);
    project.updatedAt = new Date().toISOString();
    saveStudentSelections();
    persistTeacherProjects(teacherProjects);
    renderTeacherProjectsForStudent();
    alert('已取消选择，可重新报名其他项目。');
}

function syncTeacherProjectsFromCookie(options = {}) {
    const cookieProjects = readTeacherProjectsFromCookie();
    if (!cookieProjects.length) {
        return;
    }

    const normalized = cookieProjects.map(sanitizeProject);
    const nextSignature = JSON.stringify(normalized);
    if (nextSignature === teacherProjectsSignature) {
        return;
    }

    teacherProjects = normalized;
    teacherProjectsSignature = nextSignature;
    updateTeacherProjectsCache(teacherProjects);
    if (!options.skipRender && teacherProjectsSection && !teacherProjectsSection.classList.contains('disabled')) {
        renderTeacherProjectsForStudent();
    }
}

function startTeacherProjectsWatcher() {
    if (teacherProjectsWatcher) return;
    teacherProjectsWatcher = setInterval(() => syncTeacherProjectsFromCookie(), 5000);
    window.addEventListener('focus', () => syncTeacherProjectsFromCookie());
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            syncTeacherProjectsFromCookie();
        }
    });
}

function refreshTeacherProjects() {
    syncTeacherProjectsFromCookie();
    if (refreshTeacherProjectsBtn) {
        refreshTeacherProjectsBtn.classList.add('active');
        setTimeout(() => refreshTeacherProjectsBtn.classList.remove('active'), 400);
    }
}

// ------------------- 登录状态 -------------------
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');

    if (isLoggedIn && userData.username) {
        loginBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        logoutBtn.style.display = 'flex';
        userNickname.textContent = userData.nickname || userData.username;
        userAccount.textContent = userData.username;
        userAvatar.textContent = (userData.nickname || userData.username).charAt(0);
        showContent();
    } else {
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
        logoutBtn.style.display = 'none';
        hideContent();
    }
}

function hideContent() {
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

    viewMoreLink.style.display = 'none';
    earnedPointsHeader.style.display = 'block';

    [policyCard, rankingCard, planCard, competitionCard].forEach(card => {
        card.classList.add('disabled');
        card.href = 'javascript:void(0)';
    });

    setTeacherProjectsSectionLoggedIn(false);
}

function showContent() {
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

    setTimeout(updatePieChart, 100);

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

    viewMoreLink.style.display = 'flex';
    earnedPointsHeader.style.display = 'flex';

    [policyCard, rankingCard, planCard, competitionCard].forEach(card => {
        card.classList.remove('disabled');
    });

    policyCard.href = '学校保研政策.html';
    rankingCard.href = '专业排名.html';
    planCard.href = '我的保研计划.html';
    competitionCard.href = '新增竞赛成绩.html';

    setTeacherProjectsSectionLoggedIn(true);
}

// ------------------- 事件绑定 -------------------
loginBtn.addEventListener('click', function() {
    window.location.href = 'login.html';
});

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

logoutBtn.addEventListener('click', function(e) {
    e.preventDefault();
    logoutModal.style.display = 'flex';
});

cancelLogout.addEventListener('click', function() {
    logoutModal.style.display = 'none';
});

confirmLogout.addEventListener('click', function() {
    logoutModal.querySelector('.modal-icon').innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    logoutModal.querySelector('.modal-title').textContent = '正在退出...';
    logoutModal.querySelector('.modal-text').textContent = '请稍候，正在安全退出您的账号';
    logoutModal.querySelector('.modal-actions').style.display = 'none';

    setTimeout(function() {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userData');

        logoutModal.style.display = 'none';
        logoutModal.querySelector('.modal-icon').innerHTML = '<i class="fas fa-sign-out-alt"></i>';
        logoutModal.querySelector('.modal-title').textContent = '确认退出登录';
        logoutModal.querySelector('.modal-text').textContent = '您确定要退出当前账号吗？退出后需要重新登录才能访问系统功能。';
        logoutModal.querySelector('.modal-actions').style.display = 'flex';

        checkLoginStatus();
        alert('已成功退出登录！');
    }, 1000);
});

window.addEventListener('click', function(e) {
    if (e.target === logoutModal) {
        logoutModal.style.display = 'none';
    }
});

// ------------------- 页面初始化 -------------------
document.addEventListener('DOMContentLoaded', function() {
    studentProjectSelections = loadStudentSelections();
    initializeTeacherProjectsData();
    checkLoginStatus();
    addCardClickListeners();
    startTeacherProjectsWatcher();
    syncTeacherProjectsFromCookie({ skipRender: true });

    if (teacherProjectsList) {
        teacherProjectsList.addEventListener('click', handleTeacherProjectClick);
    }
    if (refreshTeacherProjectsBtn) {
        refreshTeacherProjectsBtn.addEventListener('click', refreshTeacherProjects);
    }

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

    document.querySelectorAll('.item-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateX(5px)';
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateX(0)';
        });
    });
});

// 测试函数
window.testPieChart = function(earned, total) {
    userPointsData.earned = earned;
    userPointsData.total = total;
    updatePieChart();
    console.log(`测试数据：已获加分=${earned}, 总加分=${total}, 完成度=${calculatePercentage(earned, total)}%`);
};
