const apiMeta = document.querySelector('meta[name="pg-plus-api-base"]');
const teacherHomeMeta = document.querySelector('meta[name="pg-plus-teacher-home"]');
const adminHomeMeta = document.querySelector('meta[name="pg-plus-admin-home"]');
const API_BASE = (apiMeta?.getAttribute('content') || 'http://localhost:8000/api/v1').replace(/\/$/, '');
const JSON_HEADERS = { 'Content-Type': 'application/json' };
const ACCESS_TOKEN_KEY = 'pg_plus_access_token';
const REFRESH_TOKEN_KEY = 'pg_plus_refresh_token';
const USER_PROFILE_KEY = 'pg_plus_user_profile';
const USER_DATA_KEY = 'userData';
const USER_ROLE_KEY = 'userRole';
const IS_LOGGED_IN_KEY = 'isLoggedIn';
const STUDENT_DEV_PORT = '5173';
const isStudentDevServer = typeof window !== 'undefined' && window.location?.port === STUDENT_DEV_PORT;
const COOKIE_OPTIONS = 'path=/; SameSite=Lax';

function resolveRoleRoute(metaElement, defaultValue) {
    const baseValue = (metaElement?.getAttribute('content') || defaultValue || '').trim();
    if (isStudentDevServer) {
        const devOverride = (metaElement?.dataset.dev || '').trim();
        if (devOverride) {
            return devOverride;
        }
    }
    return baseValue;
}

const ROLE_ROUTES = {
    student: 'index.html',
    teacher: resolveRoleRoute(teacherHomeMeta, '../web-teacher/index.html'),
    admin: resolveRoleRoute(adminHomeMeta, '../web-admin/index.html')
};

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

const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('loginUsername');
const passwordInput = document.getElementById('loginPassword');
const loginFormHint = document.getElementById('loginFormHint');
const urlParams = new URLSearchParams(window.location.search);
const requestedNext = urlParams.get('next');

bootstrapSession();

function bootstrapSession() {
    const token = getAccessToken();
    const profile = getStoredProfile();
    if (token && profile?.role) {
        redirectToRole(profile.role);
    }
}

function getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY) || getSharedCookie(ACCESS_TOKEN_KEY) || '';
}

function getStoredProfile() {
    try {
        const stored = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || getSharedCookie(USER_PROFILE_KEY) || '{}');
        return stored && stored.username ? stored : null;
    } catch {
        return null;
    }
}

function persistSession(access, refresh, profile) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh || '');
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    localStorage.setItem(IS_LOGGED_IN_KEY, 'true');
    localStorage.setItem(USER_ROLE_KEY, profile.role || 'student');
    const packedProfile = JSON.stringify({
        username: profile.username,
        nickname: profile.username,
        studentId: profile.student_id || '',
        role: profile.role
    });
    localStorage.setItem(USER_DATA_KEY, packedProfile);
    setSharedCookie(ACCESS_TOKEN_KEY, access);
    setSharedCookie(REFRESH_TOKEN_KEY, refresh || '');
    setSharedCookie(USER_PROFILE_KEY, JSON.stringify(profile));
    setSharedCookie(USER_DATA_KEY, packedProfile);
    setSharedCookie(USER_ROLE_KEY, profile.role || 'student');
    setSharedCookie(IS_LOGGED_IN_KEY, 'true');
}

function redirectToRole(role) {
    const normalizedRole = ROLE_ROUTES[role] ? role : 'student';
    const requestedRole = requestedNext && ROLE_ROUTES[requestedNext] ? requestedNext : null;
    const targetRole = requestedRole === normalizedRole ? requestedRole : normalizedRole;
    window.location.replace(ROLE_ROUTES[targetRole]);
}

async function attemptLogin(username, password) {
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
    return response.json();
}

function setFormLoading(isLoading) {
    loginForm.classList.toggle('is-loading', isLoading);
}

loginForm.addEventListener('submit', async event => {
    event.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    if (!username || !password) {
        loginFormHint.textContent = '请输入完整的用户名和密码';
        loginFormHint.classList.add('error');
        return;
    }
    loginFormHint.textContent = '';
    loginFormHint.classList.remove('error');
    setFormLoading(true);
    try {
        const data = await attemptLogin(username, password);
        persistSession(data.access, data.refresh, data.user);
        redirectToRole(data.user.role || 'student');
    } catch (error) {
        loginFormHint.textContent = error.message || '登录失败，请稍后再试';
        loginFormHint.classList.add('error');
    } finally {
        setFormLoading(false);
    }
});
