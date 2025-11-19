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
const studentDashboard = document.getElementById('studentDashboard');
const teacherDashboard = null;
const adminDashboard = null;
const teacherAppFrame = null;
const adminAppFrame = null;
const roleBanner = document.getElementById('roleBanner');
const roleBadge = document.getElementById('roleBadge');
const roleBannerText = document.getElementById('roleBannerText');
const authModal = null;
const authForm = null;
const cancelAuth = null;
const loginUsernameInput = null;
const loginPasswordInput = null;
const loginHint = null;
const authFormHint = null;

const apiMeta = document.querySelector('meta[name="pg-plus-api-base"]');
const teacherHomeMeta = document.querySelector('meta[name="pg-plus-teacher-home"]');
const adminHomeMeta = document.querySelector('meta[name="pg-plus-admin-home"]');
const API_BASE = (apiMeta?.getAttribute('content') || 'http://localhost:8000/api/v1').replace(/\/$/, '');
const PROGRAMS_API_BASE = `${API_BASE}/programs`;
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const ACCESS_TOKEN_KEY = 'pg_plus_access_token';
const REFRESH_TOKEN_KEY = 'pg_plus_refresh_token';
const USER_PROFILE_KEY = 'pg_plus_user_profile';
const USER_DATA_KEY = 'userData';
const USER_ROLE_KEY = 'userRole';
const IS_LOGGED_IN_KEY = 'isLoggedIn';
const COOKIE_OPTIONS = 'path=/; SameSite=Lax';
const STUDENT_DEV_PORT = '5173';
const isStudentDevServer = typeof window !== 'undefined' && window.location?.port === STUDENT_DEV_PORT;

function resolveRoleHome(metaElement, defaultValue) {
    const baseValue = (metaElement?.getAttribute('content') || defaultValue || '').trim();
    if (isStudentDevServer) {
        const devOverride = (metaElement?.dataset.dev || '').trim();
        if (devOverride) {
            return devOverride;
        }
    }
    return baseValue;
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

const urlParams = new URLSearchParams(window.location.search);
const requestedView = urlParams.get('view');
if (requestedView) {
    window.history.replaceState({}, document.title, window.location.pathname);
}

let currentUserProfile = null;
let activeRole = null;
let teacherFrameLoaded = false;
let adminFrameLoaded = false;

function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || getSharedCookie(ACCESS_TOKEN_KEY) || '';
}

function buildAuthHeaders(extra = {}) {
    const token = getAccessToken();
    if (!token) {
        return { ...extra };
    }
    return {
        Authorization: `Bearer ${token}`,
        ...extra
    };
}

async function apiRequest(path, options = {}) {
    const url = `${PROGRAMS_API_BASE}${path}`;
    const payload = {
        ...options,
        headers: {
            ...JSON_HEADERS,
            ...(options.headers || {}),
            ...buildAuthHeaders()
        }
    };
    const response = await fetch(url, payload);
    if (response.status === 401) {
        handleUnauthorized();
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

// 教师发布项目 DOM
const teacherProjectsSection = document.getElementById('teacherProjectsSection');
const teacherProjectsList = document.getElementById('teacherProjectsList');
const refreshTeacherProjectsBtn = document.getElementById('refreshTeacherProjectsBtn');
const studentVolunteerSection = document.getElementById('studentVolunteerSection');
const studentVolunteerList = document.getElementById('studentVolunteerList');
const studentVolunteerForm = document.getElementById('studentVolunteerForm');
const studentVolunteerFormHint = document.getElementById('studentVolunteerFormHint');
const refreshStudentVolunteerBtn = document.getElementById('refreshStudentVolunteerBtn');
const studentVolunteerTitle = document.getElementById('studentVolunteerFormTitle');
const cancelVolunteerEditBtn = document.getElementById('cancelVolunteerEditBtn');

// 用户进度数据
let userPointsData = {
    earned: 133,
    total: 150
};

// 教师项目共享配置
const REVIEW_STAGES = ['stage1', 'stage2', 'stage3'];

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

let currentRoleHint = requestedView || '';
let hasInitializedStudentView = false;
const LOGIN_PAGE_URL = 'login.html';
const STUDENT_HOME_URL = 'index.html';
const TEACHER_HOME_URL = resolveRoleHome(teacherHomeMeta, '../web-teacher/index.html');
const ADMIN_HOME_URL = resolveRoleHome(adminHomeMeta, '../web-admin/index.html');

enforceStudentEntry();

function broadcastAuthState() {
    const access = getAccessToken();
    const refresh = localStorage.getItem(REFRESH_TOKEN_KEY) || '';
    const profile = getStoredProfile();
    const payload = { type: 'pg-plus-auth-sync', access, refresh, profile };
    if (teacherAppFrame?.contentWindow) {
        teacherAppFrame.contentWindow.postMessage(payload, '*');
    }
    if (adminAppFrame?.contentWindow) {
        adminAppFrame.contentWindow.postMessage(payload, '*');
    }
}

function broadcastAuthClear() {
    const payload = { type: 'pg-plus-auth-clear' };
    if (teacherAppFrame?.contentWindow) {
        teacherAppFrame.contentWindow.postMessage(payload, '*');
    }
    if (adminAppFrame?.contentWindow) {
        adminAppFrame.contentWindow.postMessage(payload, '*');
    }
}

function redirectToRoleHome(role) {
    if (role === 'teacher') {
        window.location.replace(TEACHER_HOME_URL);
    } else if (role === 'admin') {
        window.location.replace(ADMIN_HOME_URL);
    } else {
        window.location.replace(STUDENT_HOME_URL);
    }
}

function enforceStudentEntry() {
    const token = getAccessToken();
    const profile = getStoredProfile();
    if (!token || !profile || !profile.username) {
        window.location.replace(LOGIN_PAGE_URL);
        return;
    }
    if (profile.role && profile.role !== 'student') {
        redirectToRoleHome(profile.role);
    }
}

function persistSessionTokens(access, refresh, profile) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh || '');
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    currentUserProfile = profile;
    const normalizedRole = profile.role || 'student';
    const packedProfile = JSON.stringify({
        username: profile.username,
        nickname: profile.username,
        studentId: profile.student_id || '',
        role: profile.role
    });
    localStorage.setItem(IS_LOGGED_IN_KEY, 'true');
    localStorage.setItem(USER_ROLE_KEY, normalizedRole);
    localStorage.setItem(USER_DATA_KEY, packedProfile);
    setSharedCookie(ACCESS_TOKEN_KEY, access);
    setSharedCookie(REFRESH_TOKEN_KEY, refresh || '');
    setSharedCookie(USER_PROFILE_KEY, JSON.stringify(profile));
    setSharedCookie(USER_DATA_KEY, packedProfile);
    setSharedCookie(USER_ROLE_KEY, normalizedRole);
    setSharedCookie(IS_LOGGED_IN_KEY, 'true');
    broadcastAuthState();
}

function clearSession() {
    currentUserProfile = null;
    activeRole = null;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    localStorage.removeItem(IS_LOGGED_IN_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    clearSharedCookie(ACCESS_TOKEN_KEY);
    clearSharedCookie(REFRESH_TOKEN_KEY);
    clearSharedCookie(USER_PROFILE_KEY);
    clearSharedCookie(USER_DATA_KEY);
    clearSharedCookie(USER_ROLE_KEY);
    clearSharedCookie(IS_LOGGED_IN_KEY);
    broadcastAuthClear();
}

function handleUnauthorized() {
    clearSession();
    showLoggedOutState();
    if (authModal) {
        openAuthModal();
        if (authFormHint) {
            authFormHint.textContent = '登录状态已过期，请重新登录。';
        }
    }
    throw new Error('登录状态已过期，请重新登录');
}

function getStoredProfile() {
    if (currentUserProfile) {
        return currentUserProfile;
    }
    try {
        const raw = localStorage.getItem(USER_PROFILE_KEY) || getSharedCookie(USER_PROFILE_KEY) || '{}';
        const stored = JSON.parse(raw);
        currentUserProfile = stored && stored.username ? stored : null;
        return currentUserProfile;
    } catch {
        return null;
    }
}

async function performLogin(username, password) {
    const response = await fetch(`${API_BASE}/auth/login/`, {
        method: 'POST',
        headers: JSON_HEADERS,
        body: JSON.stringify({ username, password })
    });
    if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        const message = detail.detail || detail.message || '用户名或密码错误';
        throw new Error(message);
    }
    const data = await response.json();
    persistSessionTokens(data.access, data.refresh, data.user);
    return data.user;
}

async function fetchProfileFromServer() {
    const response = await fetch(`${API_BASE}/auth/me/`, {
        headers: {
            ...JSON_HEADERS,
            ...buildAuthHeaders()
        }
    });
    if (response.status === 401) {
        handleUnauthorized();
    }
    if (!response.ok) {
        throw new Error('获取用户信息失败');
    }
    const profile = await response.json();
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    currentUserProfile = profile;
    localStorage.setItem('userData', JSON.stringify({
        username: profile.username,
        nickname: profile.username,
        studentId: profile.student_id || '',
        role: profile.role
    }));
    localStorage.setItem('userRole', profile.role || 'student');
    localStorage.setItem('isLoggedIn', 'true');
    broadcastAuthState();
    return profile;
}

function openAuthModal() {
    window.location.replace('login.html');
}

function closeAuthModal() {
    currentRoleHint = '';
    if (authFormHint) {
        authFormHint.textContent = '';
    }
}

function showRoleWorkspace(role) {
    activeRole = role;
    if (role !== 'student') {
        redirectToRoleHome(role);
        return;
    }
    if (roleBanner) {
        roleBanner.classList.remove('hidden');
        if (roleBadge) {
            roleBadge.textContent = '当前身份：学生端';
        }
        if (roleBannerText) {
            roleBannerText.textContent = '您已登录学生端，系统已为您加载个人工作台。';
        }
    }
    if (studentDashboard) {
        studentDashboard.classList.remove('hidden');
    }
}

function showLoggedOutState() {
    loginBtn.style.display = 'block';
    userInfo.style.display = 'none';
    logoutBtn.style.display = 'none';
    roleBanner?.classList.add('hidden');
    if (studentDashboard) {
        studentDashboard.classList.remove('hidden');
    }
    hideContent();
    window.location.replace(LOGIN_PAGE_URL);
}

function updateHeaderProfile(profile) {
    if (!profile) {
        userNickname.textContent = '未登录';
        userAccount.textContent = '';
        userAvatar.textContent = '访';
        return;
    }
    loginBtn.style.display = 'none';
    userInfo.style.display = 'flex';
    logoutBtn.style.display = 'flex';
    const displayName = profile.username || '用户';
    userNickname.textContent = displayName;
    userAccount.textContent = profile.username || '';
    userAvatar.textContent = displayName.charAt(0).toUpperCase();
}

async function activateStudentExperience() {
    try {
        await Promise.all([
            loadStudentSelectionsFromApi(),
            loadTeacherProjectsData({ skipRender: true }),
            loadVolunteerRecordsData({ skipRender: true })
        ]);
    } catch (error) {
        console.warn(error);
    }
    hasInitializedStudentView = true;
    showContent();
    renderTeacherProjectsForStudent();
    renderStudentVolunteerRecords();
}

async function enterWorkspace(profile) {
    currentUserProfile = profile;
    updateHeaderProfile(profile);
    showRoleWorkspace(profile.role || 'student');
    if ((profile.role || 'student') === 'student') {
        await activateStudentExperience();
    } else {
        hideContent();
        setTeacherProjectsSectionLoggedIn(false);
        setVolunteerSectionLoggedIn(false);
    }
}

async function bootstrapSession() {
    const token = getAccessToken();
    if (!token) {
        showLoggedOutState();
        return;
    }
    try {
        const profile = await fetchProfileFromServer();
        await enterWorkspace(profile);
    } catch (error) {
        console.warn(error);
        clearSession();
        showLoggedOutState();
    }
}

async function handleAuthSubmit(event) {
    event.preventDefault();
    if (authFormHint) {
        authFormHint.textContent = '';
    }
    const username = loginUsernameInput?.value.trim() || '';
    const password = loginPasswordInput?.value.trim() || '';
    if (!username || !password) {
        if (authFormHint) {
            authFormHint.textContent = '请输入用户名和密码';
        }
        return;
    }
    try {
        const profile = await performLogin(username, password);
        closeAuthModal();
        if (loginUsernameInput) loginUsernameInput.value = '';
        if (loginPasswordInput) loginPasswordInput.value = '';
        await enterWorkspace(profile);
    } catch (error) {
        if (authFormHint) {
            authFormHint.textContent = error.message || '登录失败，请稍后再试';
        }
    }
}
let teacherProjects = [];
let studentProjectSelections = new Map();
let volunteerRecords = [];
let volunteerEditTargetId = null;

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

// ------------------- 教师项目 & 志愿工时 API -------------------
function sanitizeProject(project = {}) {
    const normalized = { ...project };
    normalized.id = String(normalized.id || '');
    normalized.title = (normalized.title || '未命名项目').trim();
    normalized.description = (normalized.description || '暂无描述').trim();
    normalized.points = Number.isFinite(Number(normalized.points)) ? Math.max(0, Number(normalized.points)) : 0;
    normalized.slots = Math.max(1, Number(normalized.slots) || 1);
    const selected = normalized.selectedCount ?? normalized.selected_count ?? 0;
    normalized.selectedCount = Math.min(Math.max(Number(selected) || 0, 0), normalized.slots);
    normalized.deadline = normalized.deadline || '';
    normalized.status = normalized.status === 'paused' ? 'paused' : 'active';
    normalized.createdAt = normalized.created_at || normalized.createdAt || new Date().toISOString();
    normalized.updatedAt = normalized.updated_at || normalized.updatedAt || normalized.createdAt;
    return normalized;
}

function sanitizeSelection(selection = {}) {
    const normalized = { ...selection };
    normalized.id = String(normalized.id || '');
    normalized.projectId = normalized.project || normalized.project_id || '';
    normalized.studentAccount = normalized.studentAccount || normalized.student_account || '';
    return normalized;
}

function sanitizeVolunteerRecord(record = {}) {
    const normalized = { ...record };
    normalized.id = String(normalized.id || '');
    normalized.studentName = (normalized.studentName || '未知学生').trim();
    normalized.studentAccount = (normalized.studentAccount || normalized.student_account || '').trim();
    normalized.activity = (normalized.activity || '未命名活动').trim();
    normalized.hours = Number.isFinite(Number(normalized.hours)) ? Math.max(0, Number(normalized.hours)) : 0;
    normalized.proof = (normalized.proof || '').trim();
    normalized.requireOcr = Boolean(normalized.requireOcr ?? normalized.require_ocr);
    const allowed = ['pending', 'approved', 'rejected'];
    normalized.status = allowed.includes(normalized.status) ? normalized.status : 'pending';
    const stageValue = normalized.reviewStage || normalized.review_stage || 'stage1';
    normalized.reviewStage = REVIEW_STAGES.includes(stageValue) || stageValue === 'completed' ? stageValue : 'stage1';
    normalized.reviewTrail = Array.isArray(normalized.reviewTrail || normalized.review_trail) ? (normalized.reviewTrail || normalized.review_trail) : [];
    normalized.reviewNotes = (normalized.reviewNotes || normalized.review_notes || '').trim();
    normalized.submittedVia = normalized.submittedVia || normalized.submitted_via || 'student';
    normalized.createdAt = normalized.createdAt || normalized.created_at || new Date().toISOString();
    normalized.updatedAt = normalized.updatedAt || normalized.updated_at || normalized.createdAt;
    return normalized;
}

async function loadTeacherProjectsData(options = {}) {
    try {
        const projects = await apiRequest('/projects/');
        teacherProjects = Array.isArray(projects) ? projects.map(sanitizeProject) : [];
        if (!options.skipRender && teacherProjectsSection && !teacherProjectsSection.classList.contains('disabled')) {
            renderTeacherProjectsForStudent();
        }
    } catch (error) {
        console.error('获取教师项目失败', error);
        if (!teacherProjects.length) {
            teacherProjects = DEFAULT_TEACHER_PROJECTS.map(sanitizeProject);
            if (!options.skipRender && teacherProjectsList) {
                renderTeacherProjectsForStudent();
            }
        }
    }
}

async function loadStudentSelectionsFromApi() {
    const profile = getCurrentStudentProfile();
    const account = profile.username || '';
    if (!account) {
        studentProjectSelections = new Map();
        return;
    }
    try {
        const query = encodeURIComponent(account);
        const selections = await apiRequest(`/selections/?student_account=${query}`);
        studentProjectSelections = new Map(
            (Array.isArray(selections) ? selections : []).map(item => {
                const normalized = sanitizeSelection(item);
                return [normalized.projectId, normalized];
            })
        );
    } catch (error) {
        console.error('同步项目选择失败', error);
        if (!studentProjectSelections.size) {
            studentProjectSelections = new Map();
        }
    }
}

async function loadVolunteerRecordsData(options = {}) {
    const profile = getCurrentStudentProfile();
    const account = profile.username || '';
    if (!account) {
        volunteerRecords = [];
        if (!options.skipRender) {
            renderStudentVolunteerRecords();
        }
        return;
    }
    try {
        const query = encodeURIComponent(account);
        const records = await apiRequest(`/volunteer-records/?student_account=${query}`);
        volunteerRecords = Array.isArray(records) ? records.map(sanitizeVolunteerRecord) : [];
        if (!options.skipRender && studentVolunteerSection && !studentVolunteerSection.classList.contains('disabled')) {
            renderStudentVolunteerRecords();
        }
    } catch (error) {
        console.error('获取志愿工时失败', error);
        if (!volunteerRecords.length) {
            volunteerRecords = DEFAULT_VOLUNTEER_RECORDS.map(sanitizeVolunteerRecord);
            if (!options.skipRender && studentVolunteerSection && !studentVolunteerSection.classList.contains('disabled')) {
                renderStudentVolunteerRecords();
            }
        }
    }
}

function getCurrentStudentProfile() {
    if (currentUserProfile) {
        return currentUserProfile;
    }
    try {
        const raw = localStorage.getItem(USER_DATA_KEY) || getSharedCookie(USER_DATA_KEY) || '{}';
        const cached = JSON.parse(raw);
        return cached || {};
    } catch {
        return {};
    }
}

function renderStudentVolunteerRecords() {
    if (!studentVolunteerList) {
        return;
    }
    const profile = getCurrentStudentProfile();
    const account = profile.username || '';
    if (!account) {
        studentVolunteerList.innerHTML = `<div class="volunteer-card">登录后可查看志愿工时记录</div>`;
        return;
    }

    const records = volunteerRecords.filter(record => record.studentAccount === account);
    if (!records.length) {
        studentVolunteerList.innerHTML = `<div class="volunteer-card">暂时没有您的志愿工时记录，欢迎提交认证。</div>`;
        return;
    }

    studentVolunteerList.innerHTML = records
        .map(record => createStudentVolunteerCard(record, account))
        .join('');
}

function createStudentVolunteerCard(record, currentAccount) {
    const statusClass = record.status === 'approved' ? 'approved' : record.status === 'rejected' ? 'rejected' : '';
    const statusText =
        record.status === 'approved'
            ? '终审通过'
            : record.status === 'rejected'
            ? '已驳回'
            : `${getStageDisplay(record.reviewStage)}中`;
    return `
        <div class="volunteer-card">
            <div class="card-header">
                <div>
                    <div class="meta">
                        <span><i class="fas fa-book"></i>${record.activity}</span>
                        <span><i class="fas fa-clock"></i>${record.hours} 小时</span>
                        ${record.proof ? `<span><i class="fas fa-paperclip"></i>${record.proof}</span>` : ''}
                    </div>
                </div>
                <span class="status-pill ${statusClass}">
                    ${statusText}
                </span>
            </div>
            <div class="student-progress">
                ${REVIEW_STAGES.map(stage => `<span class="progress-dot ${isStudentStageCompleted(record, stage) ? 'active' : ''}"></span>`).join('')}
            </div>
            ${record.requireOcr ? `<div class="ocr-flag"><i class="fas fa-robot"></i>等待 OCR 辅助识别</div>` : ''}
            ${record.reviewNotes ? `<div class="meta"><span><i class="fas fa-comment"></i>${record.reviewNotes}</span></div>` : ''}
            <div class="hours-badge">提交来源：${record.submittedVia === 'teacher' ? '教师录入' : '学生提交'}</div>
            ${renderStudentVolunteerActions(record, currentAccount)}
        </div>
    `;
}

function renderStudentVolunteerActions(record, currentAccount) {
    const canEdit =
        record.submittedVia === 'student' &&
        record.studentAccount === currentAccount &&
        record.status === 'pending';
    if (!canEdit) {
        return '';
    }
    return `
        <div class="volunteer-actions">
            <button class="project-select-btn primary" data-action="edit-volunteer" data-record-id="${record.id}">
                <i class="fas fa-edit"></i> 编辑
            </button>
            <button class="project-select-btn selected" data-action="delete-volunteer" data-record-id="${record.id}">
                <i class="fas fa-trash"></i> 删除
            </button>
        </div>
    `;
}

function setVolunteerSectionLoggedIn(isLoggedIn) {
    if (!studentVolunteerSection) {
        return;
    }
    studentVolunteerSection.classList.toggle('disabled', !isLoggedIn);
    if (!isLoggedIn) {
        if (studentVolunteerList) {
            studentVolunteerList.innerHTML = `<div class="volunteer-card">登录后可提交志愿工时</div>`;
        }
        showStudentVolunteerFormHint('请先登录再提交认证');
    } else {
        showStudentVolunteerFormHint('');
        renderStudentVolunteerRecords();
    }
}

function showStudentVolunteerFormHint(message = '', type = 'info') {
    if (!studentVolunteerFormHint) {
        return;
    }
    studentVolunteerFormHint.textContent = message;
    studentVolunteerFormHint.classList.remove('success', 'error');
    if (type === 'success') {
        studentVolunteerFormHint.classList.add('success');
    } else if (type === 'error') {
        studentVolunteerFormHint.classList.add('error');
    }
}

async function handleStudentVolunteerSubmit(event) {
    event.preventDefault();
    const profile = getCurrentStudentProfile();
    const account = profile.username || '';
    if (!account) {
        showStudentVolunteerFormHint('请登录后再提交志愿工时', 'error');
        return;
    }

    const formData = new FormData(studentVolunteerForm);
    const activity = (formData.get('studentVolunteerActivity') || '').trim();
    const hours = Number(formData.get('studentVolunteerHours'));
    const proof = (formData.get('studentVolunteerProof') || '').trim();
    const notes = (formData.get('studentVolunteerNotes') || '').trim();
    const requireOcr = Boolean(formData.get('studentVolunteerRequireOcr'));

    if (!activity || !hours) {
        showStudentVolunteerFormHint('请填写活动名称和工时数', 'error');
        return;
    }

    try {
        if (volunteerEditTargetId) {
            await apiRequest(`/volunteer-records/${volunteerEditTargetId}/`, {
                method: 'PATCH',
                body: JSON.stringify({
                    activity,
                    hours,
                    proof,
                    require_ocr: requireOcr,
                    review_notes: notes
                })
            });
            showStudentVolunteerFormHint('已保存修改，等待重新审核', 'success');
        } else {
            await apiRequest('/volunteer-records/', {
                method: 'POST',
                body: JSON.stringify({
                    student_name: profile.nickname || profile.username || '学生',
                    student_account: account,
                    activity,
                    hours,
                    proof,
                    require_ocr: requireOcr,
                    review_notes: notes,
                    submitted_via: 'student'
                })
            });
            showStudentVolunteerFormHint('已提交，老师审核后将同步状态', 'success');
        }
        await loadVolunteerRecordsData();
        resetVolunteerFormState();
    } catch (error) {
        showStudentVolunteerFormHint(error.message || '提交失败，请稍后重试', 'error');
    }
}

function getStageDisplay(stage) {
    if (stage === 'stage1') return '一审';
    if (stage === 'stage2') return '二审';
    if (stage === 'stage3') return '三审';
    return '终审';
}

function isStudentStageCompleted(record, stage) {
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

function handleVolunteerCardActions(event) {
    const button = event.target.closest('[data-action]');
    if (!button) {
        return;
    }
    const recordId = button.getAttribute('data-record-id');
    if (!recordId) {
        return;
    }
    const action = button.getAttribute('data-action');
    if (action === 'edit-volunteer') {
        enterVolunteerEditMode(recordId);
    } else if (action === 'delete-volunteer') {
        deleteVolunteerRecord(recordId);
    }
}

function enterVolunteerEditMode(recordId) {
    if (!studentVolunteerForm) {
        return;
    }
    const profile = getCurrentStudentProfile();
    const account = profile.username || '';
    const target = volunteerRecords.find(record => record.id === recordId && record.studentAccount === account);
    if (!target || target.status !== 'pending' || target.submittedVia !== 'student') {
        return;
    }
    volunteerEditTargetId = recordId;
    studentVolunteerForm.studentVolunteerActivity.value = target.activity;
    studentVolunteerForm.studentVolunteerHours.value = target.hours;
    studentVolunteerForm.studentVolunteerProof.value = target.proof || '';
    studentVolunteerForm.studentVolunteerNotes.value = target.reviewNotes || '';
    studentVolunteerForm.studentVolunteerRequireOcr.checked = Boolean(target.requireOcr);
    updateVolunteerFormTitle('编辑志愿工时');
    cancelVolunteerEditBtn?.classList.remove('hidden');
    showStudentVolunteerFormHint('编辑后提交将重新进入一审');
}

async function deleteVolunteerRecord(recordId) {
    const profile = getCurrentStudentProfile();
    const account = profile.username || '';
    const index = volunteerRecords.findIndex(record => record.id === recordId && record.studentAccount === account);
    if (index === -1) {
        return;
    }
    const target = volunteerRecords[index];
    if (target.status !== 'pending' || target.submittedVia !== 'student') {
        return;
    }
    if (!window.confirm('确定要删除该志愿工时记录吗？')) {
        return;
    }
    try {
        await apiRequest(`/volunteer-records/${recordId}/`, { method: 'DELETE' });
        await loadVolunteerRecordsData();
        if (volunteerEditTargetId === recordId) {
            resetVolunteerFormState();
        }
        showStudentVolunteerFormHint('已删除该记录');
    } catch (error) {
        showStudentVolunteerFormHint(error.message || '删除失败，请稍后重试', 'error');
    }
}

function resetVolunteerFormState() {
    volunteerEditTargetId = null;
    if (studentVolunteerForm) {
        studentVolunteerForm.reset();
    }
    updateVolunteerFormTitle('提交志愿工时');
    cancelVolunteerEditBtn?.classList.add('hidden');
}

function updateVolunteerFormTitle(text) {
    if (studentVolunteerTitle) {
        studentVolunteerTitle.textContent = text;
    }
}

function refreshStudentVolunteerRecords() {
    loadVolunteerRecordsData();
    showStudentVolunteerFormHint('已同步最新状态');
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

async function handleTeacherProjectClick(event) {
    const button = event.target.closest('.project-select-btn');
    if (!button) return;
    const projectId = button.getAttribute('data-project-id');
    if (!projectId) return;

    if (studentProjectSelections.has(projectId)) {
        await cancelTeacherProjectSelection(projectId);
    } else {
        await selectTeacherProject(projectId);
    }
}

async function selectTeacherProject(projectId) {
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
    const profile = getCurrentStudentProfile();
    if (!profile.username) {
        alert('请先登录账号');
        return;
    }
    try {
        const created = await apiRequest('/selections/', {
            method: 'POST',
            body: JSON.stringify({
                project: projectId,
                student_name: profile.nickname || profile.username,
                student_account: profile.username,
                student_id: profile.studentId || ''
            })
        });
        const normalized = sanitizeSelection(created);
        studentProjectSelections.set(projectId, normalized);
        await loadTeacherProjectsData({ skipRender: true });
        renderTeacherProjectsForStudent();
        alert('报名成功！请等待教师审核。');
    } catch (error) {
        alert(error.message || '报名失败，请稍后再试');
    }
}

async function cancelTeacherProjectSelection(projectId) {
    const project = teacherProjects.find(item => item.id === projectId);
    const selection = studentProjectSelections.get(projectId);
    if (!selection) {
        return;
    }
    try {
        await apiRequest(`/selections/${selection.id}/`, { method: 'DELETE' });
        studentProjectSelections.delete(projectId);
        await loadTeacherProjectsData({ skipRender: true });
        renderTeacherProjectsForStudent();
        alert('已取消选择，可重新报名其他项目。');
    } catch (error) {
        alert(error.message || '取消失败，请稍后再试');
    }
}

async function refreshTeacherProjects() {
    await Promise.all([loadTeacherProjectsData({ skipRender: true }), loadStudentSelectionsFromApi()]);
    renderTeacherProjectsForStudent();
}

// ------------------- 登录状态 -------------------
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

    studentProjectSelections = new Map();
    teacherProjects = [];
    volunteerRecords = [];

    [policyCard, rankingCard, planCard, competitionCard].forEach(card => {
        card.classList.add('disabled');
        card.href = 'javascript:void(0)';
    });

    setTeacherProjectsSectionLoggedIn(false);
    setVolunteerSectionLoggedIn(false);
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
    setVolunteerSectionLoggedIn(true);
}

// ------------------- 事件绑定 -------------------
loginBtn.addEventListener('click', function() {
    openAuthModal();
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
        clearSession();
        logoutModal.style.display = 'none';
        logoutModal.querySelector('.modal-icon').innerHTML = '<i class="fas fa-sign-out-alt"></i>';
        logoutModal.querySelector('.modal-title').textContent = '确认退出登录';
        logoutModal.querySelector('.modal-text').textContent = '您确定要退出当前账号吗？退出后需要重新登录才能访问系统功能。';
        logoutModal.querySelector('.modal-actions').style.display = 'flex';
        showLoggedOutState();
    }, 600);
});

window.addEventListener('click', function(e) {
    if (e.target === logoutModal) {
        logoutModal.style.display = 'none';
    }
    if (e.target === authModal) {
        closeAuthModal();
    }
});

cancelAuth?.addEventListener('click', function() {
    closeAuthModal();
});

if (authForm) {
    authForm.addEventListener('submit', handleAuthSubmit);
}

window.addEventListener('message', function(event) {
    const payload = event?.data || {};
    if (payload.type === 'pg-plus-auth-required') {
        currentRoleHint = payload.source || '';
        clearSession();
        showLoggedOutState();
        openAuthModal();
    } else if (payload.type === 'pg-plus-frame-ready') {
        if (payload.source === 'teacher') {
            teacherFrameLoaded = true;
        }
        if (payload.source === 'admin') {
            adminFrameLoaded = true;
        }
        if (getAccessToken()) {
            broadcastAuthState();
        }
    }
});

// ------------------- 页面初始化 -------------------
document.addEventListener('DOMContentLoaded', function() {
    addCardClickListeners();

    if (teacherProjectsList) {
        teacherProjectsList.addEventListener('click', handleTeacherProjectClick);
    }
    if (refreshTeacherProjectsBtn) {
        refreshTeacherProjectsBtn.addEventListener('click', refreshTeacherProjects);
    }
    if (studentVolunteerForm) {
        studentVolunteerForm.addEventListener('submit', handleStudentVolunteerSubmit);
    }
    if (studentVolunteerList) {
        studentVolunteerList.addEventListener('click', handleVolunteerCardActions);
    }
    if (refreshStudentVolunteerBtn) {
        refreshStudentVolunteerBtn.addEventListener('click', refreshStudentVolunteerRecords);
    }
    if (cancelVolunteerEditBtn) {
        cancelVolunteerEditBtn.addEventListener('click', function() {
            resetVolunteerFormState();
            showStudentVolunteerFormHint('已取消编辑');
        });
    }

    teacherAppFrame?.addEventListener('load', function() {
        teacherFrameLoaded = true;
        if (getAccessToken()) {
            broadcastAuthState();
        }
    });

    adminAppFrame?.addEventListener('load', function() {
        adminFrameLoaded = true;
        if (getAccessToken()) {
            broadcastAuthState();
        }
    });

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

    if (requestedView && !getAccessToken()) {
        currentRoleHint = requestedView;
        openAuthModal();
    }
    bootstrapSession();
});

// 测试函数
window.testPieChart = function(earned, total) {
    userPointsData.earned = earned;
    userPointsData.total = total;
    updatePieChart();
    console.log(`测试数据：已获加分=${earned}, 总加分=${total}, 完成度=${calculatePercentage(earned, total)}%`);
};
