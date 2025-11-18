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

// 教师项目相关 DOM
const teacherProjectsSection = document.getElementById('teacherProjectsSection');
const projectForm = document.getElementById('projectForm');
const projectFormHint = document.getElementById('projectFormHint');
const teacherProjectsList = document.getElementById('teacherProjectsList');
const refreshProjectsBtn = document.getElementById('refreshProjectsBtn');
const volunteerCertificationSection = document.getElementById('volunteerCertificationSection');
const volunteerForm = document.getElementById('volunteerForm');
const volunteerFormHint = document.getElementById('volunteerFormHint');
const volunteerPendingList = document.getElementById('volunteerPendingList');
const volunteerHistoryList = document.getElementById('volunteerHistoryList');
const refreshVolunteerBtn = document.getElementById('refreshVolunteerBtn');

// 教师项目存储
const PROJECT_COOKIE_KEY = 'pg_plus_projects';
const TEACHER_PROJECT_STORAGE_KEY = 'teacherProjects';
const PROJECT_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 天
const VOLUNTEER_COOKIE_KEY = 'pg_plus_volunteer_records';
const TEACHER_VOLUNTEER_STORAGE_KEY = 'teacherVolunteerRecords';
const VOLUNTEER_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;
const DEFAULT_PROJECTS = [
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

const DEFAULT_VOLUNTEER_RECORDS = [
    {
        id: 'vol-2024-001',
        studentName: '李华',
        studentAccount: 'lihua@example.com',
        activity: '社区图书整理',
        hours: 6,
        proof: '凭证 #A2024',
        requireOcr: false,
        status: 'approved',
        reviewNotes: '资料齐全，已计入学时',
        submittedVia: 'teacher',
        createdAt: '2024-04-15T09:00:00.000Z',
        updatedAt: '2024-04-18T09:00:00.000Z'
    },
    {
        id: 'vol-2024-002',
        studentName: '王敏',
        studentAccount: 'wangmin@example.com',
        activity: '敬老院陪伴',
        hours: 4,
        proof: '扫描件待识别',
        requireOcr: true,
        status: 'pending',
        reviewNotes: '',
        submittedVia: 'student',
        createdAt: '2024-04-20T12:00:00.000Z',
        updatedAt: '2024-04-20T12:00:00.000Z'
    }
];

let teacherProjects = [];
let projectsSignature = '';
let projectsSyncTimer = null;
let isTeacherLoggedIn = false;
let volunteerRecords = [];
let volunteerSignature = '';

// 工具函数
function generateProjectId() {
    return `proj-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getCookieValue(name) {
    const match = document.cookie.split('; ').find(row => row.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.split('=')[1]) : '';
}

function readProjectsCookie() {
    try {
        const cookieValue = getCookieValue(PROJECT_COOKIE_KEY);
        if (!cookieValue) {
            return [];
        }
        const parsed = JSON.parse(cookieValue);
        return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
        console.warn('解析教师项目 Cookie 失败', err);
        return [];
    }
}

function writeProjectsCookie(projects) {
    try {
        const payload = encodeURIComponent(JSON.stringify(projects));
        document.cookie = `${PROJECT_COOKIE_KEY}=${payload}; path=/; max-age=${PROJECT_COOKIE_MAX_AGE}`;
    } catch (err) {
        console.warn('写入教师项目 Cookie 失败', err);
    }
}

function readProjectsFromLocal() {
    try {
        const stored = JSON.parse(localStorage.getItem(TEACHER_PROJECT_STORAGE_KEY) || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function sanitizeProject(project = {}) {
    const normalized = { ...project };
    normalized.id = typeof normalized.id === 'string' ? normalized.id : generateProjectId();
    normalized.title = (normalized.title || '未命名项目').trim();
    normalized.description = (normalized.description || '暂无描述').trim();
    normalized.points = Number.isFinite(Number(normalized.points)) ? Math.max(0, Number(normalized.points)) : 0;
    normalized.slots = Math.max(1, Number(normalized.slots) || 1);
    const selected = Number.isFinite(Number(normalized.selectedCount)) ? Number(normalized.selectedCount) : 0;
    normalized.selectedCount = Math.min(Math.max(0, selected), normalized.slots);
    normalized.deadline = normalized.deadline || '';
    normalized.status = normalized.status === 'paused' ? 'paused' : 'active';
    normalized.createdAt = normalized.createdAt || new Date().toISOString();
    normalized.updatedAt = normalized.updatedAt || normalized.createdAt;
    return normalized;
}

function updateProjectsCaches() {
    projectsSignature = JSON.stringify(teacherProjects);
    localStorage.setItem(TEACHER_PROJECT_STORAGE_KEY, JSON.stringify(teacherProjects));
}

function persistTeacherProjects() {
    teacherProjects = teacherProjects.map(sanitizeProject);
    updateProjectsCaches();
    writeProjectsCookie(teacherProjects);
}

function initializeTeacherProjectsStore() {
    const cookieProjects = readProjectsCookie();
    if (cookieProjects.length) {
        teacherProjects = cookieProjects.map(sanitizeProject);
        updateProjectsCaches();
        return;
    }

    const storedProjects = readProjectsFromLocal();
    if (storedProjects.length) {
        teacherProjects = storedProjects.map(sanitizeProject);
        persistTeacherProjects();
        return;
    }

    teacherProjects = DEFAULT_PROJECTS.map(project => ({ ...project }));
    persistTeacherProjects();
}

function syncProjectsFromCookie(options = {}) {
    const cookieProjects = readProjectsCookie();
    if (!cookieProjects.length) {
        return;
    }

    const normalized = cookieProjects.map(sanitizeProject);
    const nextSignature = JSON.stringify(normalized);
    if (nextSignature === projectsSignature) {
        return;
    }

    teacherProjects = normalized;
    updateProjectsCaches();
    if (!options.skipRender && isTeacherLoggedIn) {
        renderTeacherProjects();
    }
}

function startProjectsWatcher() {
    if (projectsSyncTimer) {
        return;
    }
    const syncAll = () => {
        syncProjectsFromCookie();
        syncVolunteerRecordsFromCookie();
    };
    projectsSyncTimer = setInterval(syncAll, 5000);
    window.addEventListener('focus', () => syncAll());
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            syncAll();
        }
    });
}

function renderTeacherProjects() {
    if (!teacherProjectsList) {
        return;
    }

    if (!teacherProjects.length) {
        teacherProjectsList.innerHTML = `
            <div class="project-empty">
                暂无发布的项目，请使用上方表单创建一个新的加分项目。
            </div>
        `;
        return;
    }

    teacherProjectsList.innerHTML = teacherProjects.map(project => {
        const isPaused = project.status === 'paused';
        const slotsLeft = Math.max(project.slots - project.selectedCount, 0);
        return `
            <div class="teacher-project-card ${isPaused ? 'paused' : ''}" data-project-id="${project.id}">
                <div class="project-card-header">
                    <h3>${project.title}</h3>
                    <span class="points-badge">+${project.points}分</span>
                </div>
                <p class="project-description">${project.description}</p>
                <div class="project-meta">
                    <span><i class="fas fa-calendar-alt"></i> 截止：${project.deadline || '待定'}</span>
                    <span><i class="fas fa-users"></i> 报名：${project.selectedCount}/${project.slots}</span>
                    <span><i class="fas fa-inbox"></i> 剩余名额：${slotsLeft}</span>
                    <span class="status-pill ${isPaused ? 'paused' : ''}">
                        ${isPaused ? '暂停中' : '进行中'}
                    </span>
                </div>
                <div class="project-actions">
                    <button class="project-action-btn toggle" data-action="toggle">
                        ${isPaused ? '重新启用' : '暂停项目'}
                    </button>
                    <button class="project-action-btn delete" data-action="delete">删除</button>
                </div>
            </div>
        `;
    }).join('');
}

function generateVolunteerId() {
    return `vol-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function sanitizeVolunteerRecord(record = {}) {
    const normalized = { ...record };
    normalized.id = typeof normalized.id === 'string' ? normalized.id : generateVolunteerId();
    normalized.studentName = (normalized.studentName || '未知学生').trim();
    normalized.studentAccount = (normalized.studentAccount || '').trim();
    normalized.activity = (normalized.activity || '未命名活动').trim();
    normalized.hours = Number.isFinite(Number(normalized.hours)) ? Math.max(0, Number(normalized.hours)) : 0;
    normalized.proof = (normalized.proof || '').trim();
    normalized.requireOcr = Boolean(normalized.requireOcr);
    const allowedStatus = ['pending', 'approved', 'rejected'];
    normalized.status = allowedStatus.includes(normalized.status) ? normalized.status : 'pending';
    normalized.reviewNotes = (normalized.reviewNotes || '').trim();
    normalized.submittedVia = normalized.submittedVia === 'teacher' ? 'teacher' : 'student';
    normalized.createdAt = normalized.createdAt || new Date().toISOString();
    normalized.updatedAt = normalized.updatedAt || normalized.createdAt;
    return normalized;
}

function readVolunteerCookie() {
    try {
        const cookieValue = getCookieValue(VOLUNTEER_COOKIE_KEY);
        if (!cookieValue) {
            return [];
        }
        const parsed = JSON.parse(cookieValue);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.warn('解析志愿认证 Cookie 失败', error);
        return [];
    }
}

function writeVolunteerCookie(records) {
    try {
        const payload = encodeURIComponent(JSON.stringify(records));
        document.cookie = `${VOLUNTEER_COOKIE_KEY}=${payload}; path=/; max-age=${VOLUNTEER_COOKIE_MAX_AGE}`;
    } catch (error) {
        console.warn('写入志愿认证 Cookie 失败', error);
    }
}

function readVolunteerFromLocal() {
    try {
        const stored = JSON.parse(localStorage.getItem(TEACHER_VOLUNTEER_STORAGE_KEY) || '[]');
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function updateVolunteerCaches() {
    volunteerSignature = JSON.stringify(volunteerRecords);
    localStorage.setItem(TEACHER_VOLUNTEER_STORAGE_KEY, JSON.stringify(volunteerRecords));
}

function persistVolunteerRecords() {
    volunteerRecords = volunteerRecords.map(sanitizeVolunteerRecord);
    updateVolunteerCaches();
    writeVolunteerCookie(volunteerRecords);
}

function initializeVolunteerStore() {
    const cookieRecords = readVolunteerCookie();
    if (cookieRecords.length) {
        volunteerRecords = cookieRecords.map(sanitizeVolunteerRecord);
        updateVolunteerCaches();
        return;
    }

    const stored = readVolunteerFromLocal();
    if (stored.length) {
        volunteerRecords = stored.map(sanitizeVolunteerRecord);
        persistVolunteerRecords();
        return;
    }

    volunteerRecords = DEFAULT_VOLUNTEER_RECORDS.map(record => ({ ...record }));
    persistVolunteerRecords();
}

function syncVolunteerRecordsFromCookie(options = {}) {
    const cookieRecords = readVolunteerCookie();
    if (!cookieRecords.length) {
        return;
    }

    const normalized = cookieRecords.map(sanitizeVolunteerRecord);
    const nextSignature = JSON.stringify(normalized);
    if (nextSignature === volunteerSignature) {
        return;
    }

    volunteerRecords = normalized;
    updateVolunteerCaches();
    if (!options.skipRender && isTeacherLoggedIn) {
        renderVolunteerRecords();
    }
}

function renderVolunteerRecords() {
    if (!volunteerPendingList || !volunteerHistoryList) {
        return;
    }

    const pending = volunteerRecords.filter(record => record.status === 'pending');
    const history = volunteerRecords.filter(record => record.status !== 'pending');

    volunteerPendingList.innerHTML = pending.length
        ? pending.map(createVolunteerCardHtml).join('')
        : `<div class="volunteer-empty">暂无待审核记录</div>`;

    volunteerHistoryList.innerHTML = history.length
        ? history.map(createVolunteerCardHtml).join('')
        : `<div class="volunteer-empty">暂无历史记录</div>`;
}

function createVolunteerCardHtml(record) {
    const statusClass = record.status === 'approved' ? 'approved' : record.status === 'rejected' ? 'rejected' : '';
    return `
        <div class="volunteer-card" data-volunteer-id="${record.id}">
            <div class="card-header">
                <div>
                    <div class="student-name">${record.studentName}</div>
                    <div class="volunteer-meta">
                        <span><i class="fas fa-book"></i>${record.activity}</span>
                        <span><i class="fas fa-clock"></i>${record.hours} 小时</span>
                        ${record.proof ? `<span><i class="fas fa-link"></i>${record.proof}</span>` : ''}
                        ${record.studentAccount ? `<span><i class="fas fa-user"></i>${record.studentAccount}</span>` : ''}
                    </div>
                </div>
                <span class="status-pill ${statusClass}">
                    ${record.status === 'approved' ? '已通过' : record.status === 'rejected' ? '已驳回' : '待审核'}
                </span>
            </div>
            ${record.requireOcr ? `<div class="ocr-flag"><i class="fas fa-robot"></i>待 OCR 识别</div>` : ''}
            ${record.reviewNotes ? `<div class="volunteer-meta"><span><i class="fas fa-comment"></i>${record.reviewNotes}</span></div>` : ''}
            ${
                record.status === 'pending'
                    ? `
                        <div class="volunteer-actions">
                            <button class="volunteer-action-btn approve" data-action="approve">通过</button>
                            <button class="volunteer-action-btn reject" data-action="reject">驳回</button>
                        </div>
                    `
                    : ''
            }
        </div>
    `;
}

function setVolunteerFormDisabled(disabled) {
    if (!volunteerForm) {
        return;
    }
    volunteerForm.querySelectorAll('input, textarea, button').forEach(element => {
        element.disabled = disabled;
    });
}

function showVolunteerFormHint(message = '', type = 'info') {
    if (!volunteerFormHint) {
        return;
    }
    volunteerFormHint.textContent = message;
    volunteerFormHint.classList.remove('success', 'error');
    if (type === 'success') {
        volunteerFormHint.classList.add('success');
    } else if (type === 'error') {
        volunteerFormHint.classList.add('error');
    }
}

function updateVolunteerSectionAuthState(loggedIn) {
    if (!volunteerCertificationSection) {
        return;
    }
    volunteerCertificationSection.classList.toggle('disabled', !loggedIn);
    setVolunteerFormDisabled(!loggedIn);

    if (!loggedIn) {
        if (volunteerPendingList) {
            volunteerPendingList.innerHTML = `<div class="volunteer-empty">登录后可查看待审核记录</div>`;
        }
        if (volunteerHistoryList) {
            volunteerHistoryList.innerHTML = `<div class="volunteer-empty">登录后可查看历史记录</div>`;
        }
        showVolunteerFormHint('请先登录后再记录志愿工时');
    } else {
        showVolunteerFormHint('');
        renderVolunteerRecords();
    }
}

function handleVolunteerFormSubmit(event) {
    event.preventDefault();
    if (!isTeacherLoggedIn) {
        showVolunteerFormHint('请登录后再记录工时', 'error');
        return;
    }

    const formData = new FormData(volunteerForm);
    const studentName = (formData.get('volunteerStudentName') || '').trim();
    const studentAccount = (formData.get('volunteerStudentAccount') || '').trim();
    const activity = (formData.get('volunteerActivity') || '').trim();
    const hours = Number(formData.get('volunteerHours'));
    const proof = (formData.get('volunteerProof') || '').trim();
    const notes = (formData.get('volunteerNotes') || '').trim();
    const requireOcr = Boolean(formData.get('volunteerRequireOcr'));

    if (!studentName || !studentAccount || !activity || !hours) {
        showVolunteerFormHint('请完整填写学生及活动信息', 'error');
        return;
    }

    const newRecord = {
        id: generateVolunteerId(),
        studentName,
        studentAccount,
        activity,
        hours,
        proof,
        requireOcr,
        status: requireOcr ? 'pending' : 'approved',
        reviewNotes: notes || (requireOcr ? '等待 OCR 识别结果' : '教师直接录入'),
        submittedVia: 'teacher',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    volunteerRecords.unshift(newRecord);
    persistVolunteerRecords();
    renderVolunteerRecords();
    volunteerForm.reset();
    showVolunteerFormHint('已记录志愿工时', 'success');
}

function handleVolunteerListClick(event) {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) {
        return;
    }
    const card = actionButton.closest('.volunteer-card');
    if (!card) {
        return;
    }
    const recordId = card.getAttribute('data-volunteer-id');
    const action = actionButton.getAttribute('data-action');
    if (action === 'approve') {
        approveVolunteerRecord(recordId);
    } else if (action === 'reject') {
        rejectVolunteerRecord(recordId);
    }
}

function approveVolunteerRecord(recordId) {
    const record = volunteerRecords.find(item => item.id === recordId);
    if (!record) {
        return;
    }
    record.status = 'approved';
    record.reviewNotes = record.reviewNotes || '已通过';
    record.updatedAt = new Date().toISOString();
    persistVolunteerRecords();
    renderVolunteerRecords();
}

function rejectVolunteerRecord(recordId) {
    const record = volunteerRecords.find(item => item.id === recordId);
    if (!record) {
        return;
    }
    const reason = window.prompt('请输入驳回原因', record.reviewNotes || '');
    if (reason === null) {
        return;
    }
    record.status = 'rejected';
    record.reviewNotes = reason || '未提供原因';
    record.updatedAt = new Date().toISOString();
    persistVolunteerRecords();
    renderVolunteerRecords();
}

function refreshVolunteerRecordsManually() {
    syncVolunteerRecordsFromCookie();
    if (isTeacherLoggedIn) {
        showVolunteerFormHint('已同步志愿工时记录', 'success');
    }
}

function setProjectFormDisabled(disabled) {
    if (!projectForm) {
        return;
    }
    projectForm.querySelectorAll('input, textarea, button').forEach(element => {
        element.disabled = disabled;
    });
}

function showProjectFormHint(message = '', type = 'info') {
    if (!projectFormHint) {
        return;
    }
    projectFormHint.textContent = message;
    projectFormHint.classList.remove('success', 'error');
    if (type === 'success') {
        projectFormHint.classList.add('success');
    } else if (type === 'error') {
        projectFormHint.classList.add('error');
    }
}

function updateTeacherProjectsAuthState(loggedIn) {
    if (!teacherProjectsSection) {
        return;
    }
    teacherProjectsSection.classList.toggle('disabled', !loggedIn);
    setProjectFormDisabled(!loggedIn);

    if (!loggedIn) {
        if (teacherProjectsList) {
            teacherProjectsList.innerHTML = `
                <div class="project-empty">登录后可创建和管理加分项目</div>
            `;
        }
        showProjectFormHint('请先登录后再发布新项目');
    } else {
        showProjectFormHint('');
        renderTeacherProjects();
    }
}

function handleProjectFormSubmit(event) {
    event.preventDefault();
    if (!isTeacherLoggedIn) {
        showProjectFormHint('请先登录再发布项目', 'error');
        return;
    }

    const formData = new FormData(projectForm);
    const title = (formData.get('projectTitle') || '').trim();
    const description = (formData.get('projectDescription') || '').trim();
    const points = Number(formData.get('projectPoints'));
    const deadline = formData.get('projectDeadline') || '';
    const slots = Number(formData.get('projectSlots'));

    if (!title || !description || !deadline || !points || !slots) {
        showProjectFormHint('请完整填写项目信息', 'error');
        return;
    }

    const newProject = {
        id: generateProjectId(),
        title,
        description,
        points,
        deadline,
        slots,
        selectedCount: 0,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    teacherProjects.unshift(newProject);
    persistTeacherProjects();
    renderTeacherProjects();
    projectForm.reset();
    showProjectFormHint('项目已发布，学生端可刷新查看', 'success');
}

function handleProjectListClick(event) {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton || !teacherProjectsList) {
        return;
    }

    const card = actionButton.closest('.teacher-project-card');
    if (!card) {
        return;
    }

    const projectId = card.getAttribute('data-project-id');
    const action = actionButton.getAttribute('data-action');

    if (action === 'toggle') {
        toggleProjectStatus(projectId);
    } else if (action === 'delete') {
        deleteProject(projectId);
    }
}

function toggleProjectStatus(projectId) {
    const project = teacherProjects.find(item => item.id === projectId);
    if (!project) {
        return;
    }
    project.status = project.status === 'paused' ? 'active' : 'paused';
    project.updatedAt = new Date().toISOString();
    persistTeacherProjects();
    renderTeacherProjects();
}

function deleteProject(projectId) {
    const project = teacherProjects.find(item => item.id === projectId);
    if (!project) {
        return;
    }
    const confirmed = window.confirm(`确定要删除「${project.title}」吗？该操作无法撤销。`);
    if (!confirmed) {
        return;
    }
    teacherProjects = teacherProjects.filter(item => item.id !== projectId);
    persistTeacherProjects();
    renderTeacherProjects();
}

function refreshProjectsManually() {
    syncProjectsFromCookie();
    if (isTeacherLoggedIn) {
        showProjectFormHint('已同步最新项目数据', 'success');
    }
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
        isTeacherLoggedIn = true;

        // 显示内容
        showContent();
    } else {
        // 未登录状态
        loginBtn.style.display = 'block';
        userInfo.style.display = 'none';
        logoutBtn.style.display = 'none';
        isTeacherLoggedIn = false;

        // 隐藏内容，显示登录提示
        hideContent();
    }
}

// 隐藏内容，显示登录提示
function hideContent() {
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

    updateTeacherProjectsAuthState(false);
    updateVolunteerSectionAuthState(false);

    featureCards.forEach(card => {
        card.classList.add('disabled');
        card.href = 'javascript:void(0)';
    });
}

// 显示内容
function showContent() {
    const reviewedCount = 72;
    const totalCount = 100;

    chartContainer.innerHTML = `
        <div class="pie-chart"></div>
        <div class="chart-info">
            <div class="percentage">${reviewedCount} / ${totalCount}</div>
            <div class="completed-text">已审核 / 总人数</div>
        </div>
    `;

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

    updateTeacherProjectsAuthState(true);
    updateVolunteerSectionAuthState(true);
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

// 点击弹窗外部关闭弹窗
window.addEventListener('click', function(e) {
    if (e.target === logoutModal) {
        logoutModal.style.display = 'none';
    }
});

// 登陆表单
const TEACHER_USERNAME = "teacher";
const TEACHER_PASSWORD = "123456";

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username === TEACHER_USERNAME && password === TEACHER_PASSWORD) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify({
            username: username,
            nickname: "张三"
        }));
        window.location.href = "login教师端.html";
    } else {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginError').innerText = '用户名或密码错误';
    }
});

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeTeacherProjectsStore();
    initializeVolunteerStore();
    checkLoginStatus();
    addCardClickListeners();
    startProjectsWatcher();

    if (projectForm) {
        projectForm.addEventListener('submit', handleProjectFormSubmit);
    }
    if (teacherProjectsList) {
        teacherProjectsList.addEventListener('click', handleProjectListClick);
    }
    if (refreshProjectsBtn) {
        refreshProjectsBtn.addEventListener('click', refreshProjectsManually);
    }
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', handleVolunteerFormSubmit);
    }
    if (volunteerPendingList) {
        volunteerPendingList.addEventListener('click', handleVolunteerListClick);
    }
    if (volunteerHistoryList) {
        volunteerHistoryList.addEventListener('click', handleVolunteerListClick);
    }
    if (refreshVolunteerBtn) {
        refreshVolunteerBtn.addEventListener('click', refreshVolunteerRecordsManually);
    }
    syncVolunteerRecordsFromCookie({ skipRender: true });

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
