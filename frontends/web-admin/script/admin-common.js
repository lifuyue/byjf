// admin-common.js - 管理员公共功能
const ADMIN_ACCESS_TOKEN_KEY = 'pg_plus_access_token';
const loginMeta = document.querySelector('meta[name="pg-plus-login-base"]');
const urlParams = new URLSearchParams(window.location.search);
const isEmbedded = urlParams.has('embedded') || window.top !== window.self;
const ADMIN_DEV_PORT = '5174';
const LOGIN_BASE = resolveLoginBase(loginMeta, ADMIN_DEV_PORT, '../');
const LOGIN_PAGE_URL = `${LOGIN_BASE.replace(/\/$/, '')}/login.html?next=admin`;
window.ADMIN_LOGIN_PAGE = LOGIN_PAGE_URL;
const ADMIN_REFRESH_TOKEN_KEY = 'pg_plus_refresh_token';
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
        window.parent.postMessage({ type: 'pg-plus-frame-ready', source: 'admin' }, '*');
    }
} catch (error) {
    console.warn('管理员 iframe 初始化失败', error);
}

window.addEventListener('message', event => {
    const payload = event?.data || {};
    if (payload.type === 'pg-plus-auth-sync') {
        if (payload.access) {
            localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, payload.access);
            setSharedCookie(ADMIN_ACCESS_TOKEN_KEY, payload.access);
        }
        if (payload.refresh) {
            localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, payload.refresh);
            setSharedCookie(ADMIN_REFRESH_TOKEN_KEY, payload.refresh);
        }
        if (payload.profile) {
            const packed = JSON.stringify({
                username: payload.profile.username,
                nickname: payload.profile.username,
                role: payload.profile.role
            });
            localStorage.setItem(USER_DATA_KEY, packed);
            localStorage.setItem(USER_ROLE_KEY, payload.profile.role || 'admin');
            localStorage.setItem(IS_LOGGED_IN_KEY, 'true');
            setSharedCookie(USER_DATA_KEY, packed);
            setSharedCookie(USER_ROLE_KEY, payload.profile.role || 'admin');
            setSharedCookie(IS_LOGGED_IN_KEY, 'true');
            setSharedCookie(USER_PROFILE_KEY, JSON.stringify(payload.profile));
        }
    } else if (payload.type === 'pg-plus-auth-clear') {
        clearAdminSession();
    }
});

ensureAdminSession();

function ensureAdminSession() {
    if (isEmbedded) {
        return;
    }
    const token = getAccessTokenFromStorage();
    const userData = getStoredUserData();
    const role = userData.role || getSharedCookie(USER_ROLE_KEY);
    if (!token || role !== 'admin') {
        clearAdminSession();
        redirectToLogin();
    }
}

function getAccessTokenFromStorage() {
    const token = localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
    if (token) {
        return token;
    }
    const cookieToken = getSharedCookie(ADMIN_ACCESS_TOKEN_KEY);
    if (cookieToken) {
        localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, cookieToken);
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

function redirectToLogin() {
    window.location.replace(LOGIN_PAGE_URL);
}

function clearAdminSession() {
    localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem(IS_LOGGED_IN_KEY);
    localStorage.removeItem(USER_PROFILE_KEY);
    clearSharedCookie(ADMIN_ACCESS_TOKEN_KEY);
    clearSharedCookie(ADMIN_REFRESH_TOKEN_KEY);
    clearSharedCookie(USER_DATA_KEY);
    clearSharedCookie(USER_ROLE_KEY);
    clearSharedCookie(IS_LOGGED_IN_KEY);
    clearSharedCookie(USER_PROFILE_KEY);
}

// 管理员权限检查
function checkAdminPermission() {
    const userRole = localStorage.getItem(USER_ROLE_KEY) || getSharedCookie(USER_ROLE_KEY);
    const isLoggedIn = (localStorage.getItem(IS_LOGGED_IN_KEY) || getSharedCookie(IS_LOGGED_IN_KEY)) === 'true';
    
    if (!isLoggedIn || userRole !== 'admin') {
        showMessage('无管理员访问权限', 'error');
        setTimeout(() => {
            clearAdminSession();
            redirectToLogin();
        }, 1200);
        return false;
    }
    return true;
}

// 管理员API调用
class AdminAPI {
    static async getDashboardData() {
        // 模拟API调用
        return new Promise(resolve => {
            setTimeout(() => {
                resolve({
                    pendingCount: 12,
                    todayApplications: 8,
                    totalUsers: 156,
                    avgPoints: 87.5
                });
            }, 500);
        });
    }

    static async getRecentApplications() {
        // 模拟获取最新申请
        return new Promise(resolve => {
            setTimeout(() => {
                resolve([
                    { student: '张三', competition: '全国大学生英语竞赛', points: 10, time: '10:30' },
                    { student: '李四', competition: '数学建模竞赛', points: 15, time: '09:45' }
                ]);
            }, 300);
        });
    }
}

// 管理员工具函数
const AdminUtils = {
    // 格式化数字
    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    },

    // 时间格式化
    formatTime(date) {
        return new Date(date).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // 日期格式化
    formatDate(date) {
        return new Date(date).toLocaleDateString('zh-CN');
    }
};
