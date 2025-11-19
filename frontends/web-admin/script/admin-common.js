// admin-common.js - 管理员公共功能
const ADMIN_ACCESS_TOKEN_KEY = 'pg_plus_access_token';

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
        }
        if (payload.profile) {
            localStorage.setItem('userData', JSON.stringify({
                username: payload.profile.username,
                nickname: payload.profile.username,
                role: payload.profile.role
            }));
            localStorage.setItem('userRole', payload.profile.role || 'admin');
            localStorage.setItem('isLoggedIn', 'true');
        }
    } else if (payload.type === 'pg-plus-auth-clear') {
        localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        localStorage.removeItem('isLoggedIn');
    }
});

// 管理员权限检查
function checkAdminPermission() {
    const userRole = localStorage.getItem('userRole');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn || userRole !== 'admin') {
        showMessage('无管理员访问权限', 'error');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
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
