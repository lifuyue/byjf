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

const apiMeta = document.querySelector('meta[name="pg-plus-api-base"]');
const loginMeta = document.querySelector('meta[name="pg-plus-login-base"]');
const API_BASE = (apiMeta?.getAttribute('content') || 'http://localhost:8000/api/v1').replace(/\/$/, '');
const PROGRAMS_API_BASE = `${API_BASE}/programs`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const ACCESS_TOKEN_KEY = 'pg_plus_access_token';
const REFRESH_TOKEN_KEY = 'pg_plus_refresh_token';
const urlParams = new URLSearchParams(window.location.search);
const isEmbedded = urlParams.has('embedded') || window.top !== window.self;
const TEACHER_DEV_PORT = '5175';
const LOGIN_BASE = resolveLoginBase(loginMeta, TEACHER_DEV_PORT, '../');
const LOGIN_PAGE_URL = `${LOGIN_BASE.replace(/\/$/, '')}/login.html?next=teacher`;
const USER_DATA_KEY = 'userData';
const USER_ROLE_KEY = 'userRole';
const IS_LOGGED_IN_KEY = 'isLoggedIn';
const USER_PROFILE_KEY = 'pg_plus_user_profile';
const COOKIE_OPTIONS = 'path=/; SameSite=Lax';

function resolveLoginBase(metaElement, devPort, defaultValue) {
    const devHint = metaElement?.dataset.dev?.trim();
    const fallback = (metaElement?.getAttribute('content') || defaultValue || '').trim() || '../web-student';
    if (devHint && window.location.port === devPort) {
        return devHint.replace(/\/$/, '');
    }
    return fallback.replace(/\/$/, '');
}

function setSharedCookie(key, value) {
    document.cookie = `${key}=${encodeURIComponent(value)}; ${COOKIE_OPTIONS}`;
}

function getSharedCookie(key) {
    const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : '';
}

function clearSharedCookie(key) {
    document.cookie = `${key}=; Max-Age=0; ${COOKIE_OPTIONS}`;
}

try {
    if (window.parent) {
        window.parent.postMessage({ type: 'pg-plus-frame-ready', source: 'teacher' }, '*');
    }
} catch (err) {
    console.warn('无法向父窗口发送初始化消息', err);
}

window.addEventListener('message', event => {
    const payload = event?.data || {};
    if (payload.type === 'pg-plus-auth-sync') {
        if (payload.access) {
            localStorage.setItem(ACCESS_TOKEN_KEY, payload.access);
            setSharedCookie(ACCESS_TOKEN_KEY, payload.access);
        }
        if (payload.refresh) {
            localStorage.setItem(REFRESH_TOKEN_KEY, payload.refresh);
            setSharedCookie(REFRESH_TOKEN_KEY, payload.refresh);
        }
        if (payload.profile) {
            const packed = JSON.stringify({
                username: payload.profile.username,
                nickname: payload.profile.username,
                role: payload.profile.role
            });
            localStorage.setItem(USER_DATA_KEY, packed);
            localStorage.setItem(USER_ROLE_KEY, payload.profile.role || 'teacher');
            localStorage.setItem(IS_LOGGED_IN_KEY, 'true');
            setSharedCookie(USER_DATA_KEY, packed);
            setSharedCookie(USER_ROLE_KEY, payload.profile.role || 'teacher');
            setSharedCookie(IS_LOGGED_IN_KEY, 'true');
            setSharedCookie(USER_PROFILE_KEY, JSON.stringify(payload.profile));
        }
    } else if (payload.type === 'pg-plus-auth-clear') {
        clearTeacherSession();
    }
});

function getAccessToken() {
    const stored = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (stored) {
        return stored;
    }
    const cookieToken = getSharedCookie(ACCESS_TOKEN_KEY);
    if (cookieToken) {
        localStorage.setItem(ACCESS_TOKEN_KEY, cookieToken);
        return cookieToken;
    }
    return '';
}

function getStoredUserData() {
    try {
        const raw = localStorage.getItem(USER_DATA_KEY) || getSharedCookie(USER_DATA_KEY) || '{}';
        const parsed = JSON.parse(raw);
        if (parsed && parsed.username) {
            if (!localStorage.getItem(USER_DATA_KEY)) {
                localStorage.setItem(USER_DATA_KEY, raw);
            }
            return parsed;
        }
    } catch {
        return {};
    }
    return {};
}

ensureStandaloneSession();

function ensureStandaloneSession() {
    if (isEmbedded) {
        return;
    }
    const token = getAccessToken();
    const stored = getStoredUserData();
    const role = stored.role || getSharedCookie(USER_ROLE_KEY);
    if (!token || role !== 'teacher') {
        clearTeacherSession();
        redirectToLogin();
    }
}

function redirectToLogin() {
    window.location.replace(LOGIN_PAGE_URL);
}

function clearTeacherSession() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(IS_LOGGED_IN_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    clearSharedCookie(ACCESS_TOKEN_KEY);
    clearSharedCookie(USER_DATA_KEY);
    clearSharedCookie(USER_ROLE_KEY);
    clearSharedCookie(IS_LOGGED_IN_KEY);
    clearSharedCookie(USER_PROFILE_KEY);
    clearSharedCookie(REFRESH_TOKEN_KEY);
}

function notifyAuthExpired(message) {
    const info = message || '登录状态已过期，请重新登录。';
    alert(info);
    if (isEmbedded && window.top) {
        window.top.postMessage({ type: 'pg-plus-auth-required', source: 'teacher' }, '*');
    } else {
        clearTeacherSession();
        redirectToLogin();
    }
}

async function apiRequest(path, options = {}) {
    const token = getAccessToken();
    if (!token) {
        notifyAuthExpired('请先通过统一入口完成登录。');
        throw new Error('未登录');
    }
    const url = `${PROGRAMS_API_BASE}${path}`;
    const payload = {
        ...options,
        headers: {
            ...JSON_HEADERS,
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    };
    const response = await fetch(url, payload);
    if (response.status === 401) {
        notifyAuthExpired();
        throw new Error('登录已过期');
    }
    if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        const message = detail.detail || detail.message || `请求失败（${response.status}）`;
        throw new Error(message);
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

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

// 本地占位数据
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

const REVIEW_STAGES = ['stage1', 'stage2', 'stage3'];

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
        reviewStage: 'completed',
        reviewTrail: [
            { stage: 'stage1', reviewer: '张老师', note: '资料完整', timestamp: '2024-04-15T10:00:00.000Z' },
            { stage: 'stage2', reviewer: '李老师', note: '符合政策', timestamp: '2024-04-16T09:00:00.000Z' },
            { stage: 'stage3', reviewer: '王老师', note: '通过终审', timestamp: '2024-04-18T09:00:00.000Z' }
        ],
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
        reviewStage: 'stage1',
        reviewTrail: [
            { stage: 'stage1', reviewer: '系统', note: '等待一审', timestamp: '2024-04-20T12:00:00.000Z' }
        ],
        reviewNotes: '',
        submittedVia: 'student',
        createdAt: '2024-04-20T12:00:00.000Z',
        updatedAt: '2024-04-20T12:00:00.000Z'
    }
];

const DEFAULT_STUDENT_APPROVALS = [
    {
        id: 'stu-approve-001',
        studentName: '张明',
        studentId: '2021012345',
        college: '计算机科学与技术学院',
        major: '计算机科学与技术',
        reviewStage: 'stage2',
        status: 'pending',
        reviewTrail: [
            { stage: 'stage1', reviewer: '学院初审', note: '资料齐全', timestamp: '2024-04-10T09:00:00.000Z' }
        ],
        reviewNotes: '待二审'
    },
    {
        id: 'stu-approve-002',
        studentName: '李四',
        studentId: '202101002',
        college: '计算机科学与技术学院',
        major: '计算机科学与技术',
        reviewStage: 'stage1',
        status: 'pending',
        reviewTrail: [],
        reviewNotes: '等待一审'
    },
    {
        id: 'stu-approved-003',
        studentName: '王五',
        studentId: '202001002',
        college: '软件学院',
        major: '软件工程',
        reviewStage: 'completed',
        status: 'approved',
        reviewTrail: [
            { stage: 'stage1', reviewer: '学院', note: '通过', timestamp: '2024-04-01T09:00:00.000Z' },
            { stage: 'stage2', reviewer: '学校', note: '通过', timestamp: '2024-04-03T09:00:00.000Z' },
            { stage: 'stage3', reviewer: '终审', note: '通过', timestamp: '2024-04-05T09:00:00.000Z' }
        ],
        reviewNotes: '终审通过'
    }
];

let teacherProjects = [];
let isTeacherLoggedIn = false;
let volunteerRecords = [];
let studentApprovalRecords = [];

function sanitizeProject(project = {}) {
    const normalized = { ...project };
    normalized.id = String(normalized.id || normalized.projectId || '');
    normalized.title = (normalized.title || '未命名项目').trim();
    normalized.description = (normalized.description || '暂无描述').trim();
    normalized.points = Number.isFinite(Number(normalized.points)) ? Math.max(0, Number(normalized.points)) : 0;
    normalized.slots = Math.max(1, Number(normalized.slots) || 1);
    const selectedRaw = normalized.selectedCount ?? normalized.selected_count ?? 0;
    normalized.selectedCount = Math.min(Math.max(0, Number(selectedRaw) || 0), normalized.slots);
    normalized.deadline = normalized.deadline || '';
    normalized.status = ['paused', 'archived'].includes(normalized.status) ? normalized.status : 'active';
    normalized.createdAt = normalized.created_at || normalized.createdAt || new Date().toISOString();
    normalized.updatedAt = normalized.updated_at || normalized.updatedAt || normalized.createdAt;
    return normalized;
}

async function loadTeacherProjects(options = {}) {
    try {
        const projects = await apiRequest('/projects/');
        teacherProjects = Array.isArray(projects) ? projects.map(sanitizeProject) : [];
        if (!options.skipRender && isTeacherLoggedIn) {
            renderTeacherProjects();
        }
        if (options.showHint) {
            showProjectFormHint('已同步最新项目数据', 'success');
        }
    } catch (error) {
        console.error('加载教师项目失败', error);
        if (!teacherProjects.length) {
            teacherProjects = DEFAULT_PROJECTS.map(project => sanitizeProject(project));
            if (isTeacherLoggedIn) {
                renderTeacherProjects();
            }
        }
        if (options.showHint) {
            showProjectFormHint(error.message || '同步失败，请稍后重试', 'error');
        }
    }
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

function renderStudentApprovals() {
    if (!earnedPointsList || !recommendedCompetitionsList) {
        return;
    }

    const history = studentApprovalRecords.filter(record => record.status !== 'pending');
    const pending = studentApprovalRecords.filter(record => record.status === 'pending');

    earnedPointsList.innerHTML = history.length
        ? history.map(record => createStudentApprovalCard(record, { showActions: false })).join('')
        : `<div class="item-card">暂无已审核学生</div>`;

    recommendedCompetitionsList.innerHTML = pending.length
        ? pending.map(record => createStudentApprovalCard(record, { showActions: true })).join('')
        : `<div class="item-card">暂无待审核学生</div>`;
}

function createStudentApprovalCard(record, options = { showActions: false }) {
    const statusClass = record.status === 'approved' ? 'approved' : record.status === 'rejected' ? 'rejected' : '';
    const stageDisplay = record.status === 'approved' ? '终审完成' : record.status === 'rejected' ? '已驳回' : `${getStageDisplay(record.reviewStage)}中`;
    return `
        <div class="item-card student-approval-card" data-student-approval-id="${record.id}">
            <div class="item-header">
                <div class="item-title">${record.studentName}<small>（${record.studentId}）</small></div>
                <span class="item-points status-pill ${statusClass}">${stageDisplay}</span>
            </div>
            <div class="item-desc">${record.college} · ${record.major}</div>
            <div class="review-progress">
                ${REVIEW_STAGES.map(stage => `<span class="progress-dot ${isStageCompleted(record, stage) ? 'active' : ''}"></span>`).join('')}
            </div>
            ${record.reviewNotes ? `<div class="item-desc">${record.reviewNotes}</div>` : ''}
            ${
                options.showActions
                    ? `
                        <div class="volunteer-actions">
                            <button class="volunteer-action-btn approve" data-action="student-advance">提交${getNextReviewLabel(record.reviewStage)}</button>
                            <button class="volunteer-action-btn reject" data-action="student-reject">驳回</button>
                        </div>
                    `
                    : ''
            }
        </div>
    `;
}

function sanitizeVolunteerRecord(record = {}) {
    const normalized = { ...record };
    normalized.id = String(normalized.id || '');
    normalized.studentName = (normalized.studentName || normalized.student_name || '未知学生').trim();
    normalized.studentAccount = (normalized.studentAccount || normalized.student_account || '').trim();
    normalized.activity = (normalized.activity || '未命名活动').trim();
    normalized.hours = Number.isFinite(Number(normalized.hours)) ? Math.max(0, Number(normalized.hours)) : 0;
    normalized.proof = (normalized.proof || '').trim();
    normalized.requireOcr = Boolean(normalized.requireOcr ?? normalized.require_ocr);
    const allowedStatus = ['pending', 'approved', 'rejected'];
    normalized.status = allowedStatus.includes(normalized.status) ? normalized.status : 'pending';
    const stageValue = normalized.reviewStage || normalized.review_stage || 'stage1';
    normalized.reviewStage = REVIEW_STAGES.includes(stageValue) || stageValue === 'completed' ? stageValue : 'stage1';
    normalized.reviewTrail = Array.isArray(normalized.reviewTrail || normalized.review_trail) ? (normalized.reviewTrail || normalized.review_trail) : [];
    normalized.reviewNotes = (normalized.reviewNotes || normalized.review_notes || '').trim();
    normalized.submittedVia = normalized.submittedVia || normalized.submitted_via || 'student';
    normalized.createdAt = normalized.createdAt || normalized.created_at || new Date().toISOString();
    normalized.updatedAt = normalized.updatedAt || normalized.updated_at || normalized.createdAt;
    return normalized;
}

async function loadVolunteerRecords(options = {}) {
    try {
        const records = await apiRequest('/volunteer-records/');
        volunteerRecords = Array.isArray(records) ? records.map(sanitizeVolunteerRecord) : [];
        if (!options.skipRender && isTeacherLoggedIn) {
            renderVolunteerRecords();
        }
        if (options.showHint) {
            showVolunteerFormHint('已同步最新志愿认证', 'success');
        }
    } catch (error) {
        console.error('加载志愿工时失败', error);
        if (!volunteerRecords.length) {
            volunteerRecords = DEFAULT_VOLUNTEER_RECORDS.map(record => sanitizeVolunteerRecord(record));
            if (isTeacherLoggedIn) {
                renderVolunteerRecords();
            }
        }
        if (options.showHint) {
            showVolunteerFormHint(error.message || '同步失败，请稍后重试', 'error');
        }
    }
}

function sanitizeStudentApproval(record = {}) {
    const normalized = { ...record };
    normalized.id = String(normalized.id || '');
    normalized.studentName = (normalized.studentName || normalized.student_name || '未知学生').trim();
    normalized.studentId = (normalized.studentId || normalized.student_id || '未填写').trim();
    normalized.college = (normalized.college || '未知学院').trim();
    normalized.major = (normalized.major || '未知专业').trim();
    const stageValue = normalized.reviewStage || normalized.review_stage || 'stage1';
    normalized.reviewStage = REVIEW_STAGES.includes(stageValue) || stageValue === 'completed' ? stageValue : 'stage1';
    normalized.status = normalized.status === 'approved' ? 'approved' : normalized.status === 'rejected' ? 'rejected' : 'pending';
    normalized.reviewTrail = Array.isArray(normalized.reviewTrail || normalized.review_trail) ? (normalized.reviewTrail || normalized.review_trail) : [];
    normalized.reviewNotes = (normalized.reviewNotes || normalized.review_notes || '').trim();
    return normalized;
}

async function loadStudentApprovals(options = {}) {
    try {
        const records = await apiRequest('/student-reviews/');
        studentApprovalRecords = Array.isArray(records) ? records.map(sanitizeStudentApproval) : [];
        if (!options.skipRender) {
            renderStudentApprovals();
        }
    } catch (error) {
        console.error('加载学生审核队列失败', error);
        if (!studentApprovalRecords.length) {
            studentApprovalRecords = DEFAULT_STUDENT_APPROVALS.map(record => sanitizeStudentApproval(record));
            renderStudentApprovals();
        }
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
    const stageDisplay = record.status === 'approved' ? '已完成' : record.status === 'rejected' ? '已驳回' : `${getStageDisplay(record.reviewStage)}中`;
    const stageProgress = record.status === 'approved' ? REVIEW_STAGES.length : record.status === 'rejected' ? 0 : Math.max(1, REVIEW_STAGES.indexOf(record.reviewStage) + 1);
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
                    ${stageDisplay}
                </span>
            </div>
            <div class="review-progress" data-progress="${stageProgress}">
                ${REVIEW_STAGES.map(stage => `<span class="progress-dot ${isStageCompleted(record, stage) ? 'active' : ''}"></span>`).join('')}
            </div>
            ${record.requireOcr ? `<div class="ocr-flag"><i class="fas fa-robot"></i>待 OCR 识别</div>` : ''}
            ${record.reviewNotes ? `<div class="volunteer-meta"><span><i class="fas fa-comment"></i>${record.reviewNotes}</span></div>` : ''}
            ${
                record.status === 'pending'
                    ? `
                        <div class="volunteer-actions">
                            <button class="volunteer-action-btn approve" data-action="advance">提交${getNextReviewLabel(record.reviewStage)}审核</button>
                            <button class="volunteer-action-btn reject" data-action="reject">驳回</button>
                        </div>
                    `
                    : ''
            }
        </div>
    `;
}

function getStageDisplay(stage) {
    if (stage === 'stage1') return '一审';
    if (stage === 'stage2') return '二审';
    if (stage === 'stage3') return '三审';
    return '终审';
}

function getNextReviewLabel(currentStage) {
    if (currentStage === 'stage1') return '二审';
    if (currentStage === 'stage2') return '三审';
    if (currentStage === 'stage3') return '终审';
    return '终审';
}

function isStageCompleted(record, stage) {
    if (record.status === 'approved') {
        return true;
    }
    const stageIndex = REVIEW_STAGES.indexOf(stage);
    if (stageIndex === -1) {
        return false;
    }
    if (record.reviewStage === 'completed') {
        return true;
    }
    const currentIndex = REVIEW_STAGES.indexOf(record.reviewStage);
    if (currentIndex === -1) {
        return false;
    }
    return currentIndex >= stageIndex;
}

function getCurrentReviewerName() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    return userData.nickname || userData.username || '教师';
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

async function handleVolunteerFormSubmit(event) {
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

    try {
        const created = await apiRequest('/volunteer-records/', {
            method: 'POST',
            body: JSON.stringify({
                student_name: studentName,
                student_account: studentAccount,
                activity,
                hours,
                proof,
                require_ocr: requireOcr,
                review_notes: notes,
                submitted_via: 'teacher'
            })
        });
        volunteerRecords.unshift(sanitizeVolunteerRecord(created));
        renderVolunteerRecords();
        volunteerForm.reset();
        showVolunteerFormHint('已记录志愿工时', 'success');
    } catch (error) {
        showVolunteerFormHint(error.message || '提交失败，请稍后重试', 'error');
    }
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
    if (action === 'advance') {
        advanceVolunteerRecord(recordId);
    } else if (action === 'reject') {
        rejectVolunteerRecord(recordId);
    }
}

async function advanceVolunteerRecord(recordId) {
    const record = volunteerRecords.find(item => item.id === recordId);
    if (!record) {
        return;
    }
    try {
        const updated = await apiRequest(`/volunteer-records/${recordId}/review/`, {
            method: 'POST',
            body: JSON.stringify({
                decision: 'advance',
                reviewer: getCurrentReviewerName(),
                note: `${getStageDisplay(record.reviewStage)}通过`
            })
        });
        volunteerRecords = volunteerRecords.map(item => (item.id === recordId ? sanitizeVolunteerRecord(updated) : item));
        renderVolunteerRecords();
    } catch (error) {
        showVolunteerFormHint(error.message || '提交下一阶段失败', 'error');
    }
}

async function rejectVolunteerRecord(recordId) {
    const record = volunteerRecords.find(item => item.id === recordId);
    if (!record) {
        return;
    }
    const reason = window.prompt('请输入驳回原因', record.reviewNotes || '');
    if (reason === null) {
        return;
    }
    try {
        const updated = await apiRequest(`/volunteer-records/${recordId}/review/`, {
            method: 'POST',
            body: JSON.stringify({
                decision: 'reject',
                reviewer: getCurrentReviewerName(),
                note: reason || '未提供原因'
            })
        });
        volunteerRecords = volunteerRecords.map(item => (item.id === recordId ? sanitizeVolunteerRecord(updated) : item));
        renderVolunteerRecords();
    } catch (error) {
        showVolunteerFormHint(error.message || '驳回失败，请稍后重试', 'error');
    }
}

async function handleStudentApprovalListClick(event) {
    const actionButton = event.target.closest('[data-action]');
    if (!actionButton) {
        return;
    }
    const card = actionButton.closest('.student-approval-card');
    if (!card) {
        return;
    }
    const recordId = card.getAttribute('data-student-approval-id');
    const action = actionButton.getAttribute('data-action');
    if (action === 'student-advance') {
        await advanceStudentApproval(recordId);
    } else if (action === 'student-reject') {
        await rejectStudentApproval(recordId);
    }
}

async function advanceStudentApproval(recordId) {
    const record = studentApprovalRecords.find(item => item.id === recordId);
    if (!record) {
        return;
    }
    try {
        const updated = await apiRequest(`/student-reviews/${recordId}/review/`, {
            method: 'POST',
            body: JSON.stringify({
                decision: 'advance',
                reviewer: getCurrentReviewerName(),
                note: `${getStageDisplay(record.reviewStage)}完成`
            })
        });
        studentApprovalRecords = studentApprovalRecords.map(item => (item.id === recordId ? sanitizeStudentApproval(updated) : item));
        renderStudentApprovals();
    } catch (error) {
        alert(error.message || '推进流程失败，请稍后重试');
    }
}

async function rejectStudentApproval(recordId) {
    const record = studentApprovalRecords.find(item => item.id === recordId);
    if (!record) {
        return;
    }
    const reason = window.prompt('请输入驳回原因', record.reviewNotes || '');
    if (reason === null) {
        return;
    }
    try {
        const updated = await apiRequest(`/student-reviews/${recordId}/review/`, {
            method: 'POST',
            body: JSON.stringify({
                decision: 'reject',
                reviewer: getCurrentReviewerName(),
                note: reason || '未提供原因'
            })
        });
        studentApprovalRecords = studentApprovalRecords.map(item => (item.id === recordId ? sanitizeStudentApproval(updated) : item));
        renderStudentApprovals();
    } catch (error) {
        alert(error.message || '驳回失败，请稍后重试');
    }
}

function refreshVolunteerRecordsManually() {
    loadVolunteerRecords({ showHint: true });
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

async function handleProjectFormSubmit(event) {
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

    try {
        const created = await apiRequest('/projects/', {
            method: 'POST',
            body: JSON.stringify({
                title,
                description,
                points,
                deadline: deadline || null,
                slots
            })
        });
        teacherProjects.unshift(sanitizeProject(created));
        renderTeacherProjects();
        projectForm.reset();
        showProjectFormHint('项目已发布，学生端可刷新查看', 'success');
    } catch (error) {
        showProjectFormHint(error.message || '发布失败，请稍后重试', 'error');
    }
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

async function toggleProjectStatus(projectId) {
    const project = teacherProjects.find(item => item.id === projectId);
    if (!project) {
        return;
    }
    const nextStatus = project.status === 'paused' ? 'active' : 'paused';
    try {
        const updated = await apiRequest(`/projects/${projectId}/`, {
            method: 'PATCH',
            body: JSON.stringify({ status: nextStatus })
        });
        teacherProjects = teacherProjects.map(item => (item.id === projectId ? sanitizeProject(updated) : item));
        renderTeacherProjects();
        showProjectFormHint(nextStatus === 'active' ? '项目已重新启用' : '项目已暂停', 'success');
    } catch (error) {
        showProjectFormHint(error.message || '操作失败，请稍后重试', 'error');
    }
}

async function deleteProject(projectId) {
    const project = teacherProjects.find(item => item.id === projectId);
    if (!project) {
        return;
    }
    const confirmed = window.confirm(`确定要删除「${project.title}」吗？该操作无法撤销。`);
    if (!confirmed) {
        return;
    }
    try {
        await apiRequest(`/projects/${projectId}/`, { method: 'DELETE' });
        teacherProjects = teacherProjects.filter(item => item.id !== projectId);
        renderTeacherProjects();
        showProjectFormHint('项目已删除', 'success');
    } catch (error) {
        showProjectFormHint(error.message || '删除失败，请稍后重试', 'error');
    }
}

function refreshProjectsManually() {
    loadTeacherProjects({ showHint: true });
}

// 检查登录状态
function checkLoginStatus() {
    const isLoggedIn = (localStorage.getItem(IS_LOGGED_IN_KEY) || getSharedCookie(IS_LOGGED_IN_KEY)) === 'true';
    const userData = getStoredUserData();

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

    renderStudentApprovals();

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
    window.location.href = LOGIN_PAGE_URL;
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
        clearTeacherSession();

        logoutModal.style.display = 'none';
        logoutModal.querySelector('.modal-icon').innerHTML = '<i class="fas fa-sign-out-alt"></i>';
        logoutModal.querySelector('.modal-title').textContent = '确认退出登录';
        logoutModal.querySelector('.modal-text').textContent = '您确定要退出当前账号吗？退出后需要重新登录才能访问系统功能。';
        logoutModal.querySelector('.modal-actions').style.display = 'flex';

        checkLoginStatus();
        redirectToLogin();
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
document.addEventListener('DOMContentLoaded', async function() {
    await Promise.all([
        loadTeacherProjects({ skipRender: true }),
        loadVolunteerRecords({ skipRender: true }),
        loadStudentApprovals()
    ]);
    checkLoginStatus();
    addCardClickListeners();

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
    if (recommendedCompetitionsList) {
        recommendedCompetitionsList.addEventListener('click', handleStudentApprovalListClick);
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
