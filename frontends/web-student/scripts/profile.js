document.addEventListener('DOMContentLoaded', async function() {
    const ACCESS_TOKEN_KEY = 'pg_plus_access_token';
    const USER_PROFILE_KEY = 'pg_plus_user_profile';
    const USER_DATA_KEY = 'userData';
    const apiMeta = document.querySelector('meta[name="pg-plus-api-base"]');
    const API_BASE = (apiMeta?.getAttribute('content') || 'http://localhost:8000/api/v1').replace(/\/$/, '');
    const AUTH_ME = `${API_BASE}/auth/me/`;
    const STUDENTS_API = `${API_BASE}/scoring/students/`;

    function getAccessToken() {
        return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
    }

    function saveProfile(profile) {
        localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
    }

    async function fetchProfile() {
        const token = getAccessToken();
        if (!token) throw new Error('未登录');
        const res = await fetch(AUTH_ME, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
            throw new Error('登录已过期，请重新登录');
        }
        return res.json();
    }

    async function fetchStudentDetail(id) {
        const token = getAccessToken();
        const res = await fetch(`${STUDENTS_API}${id}/`, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) {
            const detail = await res.json().catch(() => ({}));
            const msg = detail.detail || `加载失败(${res.status})`;
            throw new Error(msg);
        }
        return res.json();
    }

    function fallbackUser(userData) {
        return {
            username: userData.username || '学生',
            student_id: userData.student_id || '未知',
            role: userData.role || 'student',
            gender: '保密',
            college: '信息科学与技术学院',
            major: '计算机科学与技术',
            gpa: 0,
            bonus: 0,
            ranking: '-',
            phone: '未填写'
        };
    }

    async function init() {
        try {
            const profile = await fetchProfile();
            saveProfile(profile);
            const detail = await fetchStudentDetail(profile.id);
            renderProfile(profile, detail);
        } catch (err) {
            console.warn('加载真实数据失败，使用本地信息', err);
            const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
            renderProfile(fallbackUser(userData));
        }
    }

    function renderProfile(profile, detail) {
        const name = profile.username || detail?.username || '学生';
        const avatarText = name.charAt(0);
        document.getElementById('userName').textContent = name;
        document.getElementById('userAvatar').textContent = avatarText;
        document.getElementById('userEmail').textContent = profile.username || detail?.username || '-';

        const subjectScore = detail?.subject_score || {};
        const gpa = subjectScore.gpa || 0;
        const totalScore = detail?.total_score || 0;
        const ranking = detail?.ranking || '-';
        const college = detail?.college || '信息科学与技术学院';
        const major = detail?.major || '计算机科学与技术';

        document.getElementById('userGender').textContent = detail?.gender || '保密';
        document.getElementById('userStudentId').textContent = profile.student_id || detail?.student_id || '-';
        document.getElementById('userCollege').textContent = college;
        document.getElementById('userMajor').textContent = major;
        document.getElementById('userGPA').textContent = gpa ? gpa.toFixed(2) : '0.00';
        document.getElementById('userPoints').textContent = `+${Math.max(0, (totalScore - (gpa * 25 || 0)).toFixed(1))}`;
        document.getElementById('userRank').textContent = ranking === 0 ? '-' : ranking;
        document.getElementById('userPhone').textContent = detail?.phone || '未填写';
    }

    // 按钮提示（功能占位）
    document.querySelector('.change-avatar-btn').addEventListener('click', function() {
        alert('头像更换功能开发中...');
    });

    document.querySelectorAll('.action-btn')[0].addEventListener('click', function() {
        alert('信息编辑功能开发中...');
    });

    document.querySelectorAll('.action-btn')[1].addEventListener('click', function() {
        alert('密码修改功能开发中...');
    });

    document.querySelectorAll('.action-btn')[2].addEventListener('click', function() {
        alert('个人信息导出功能开发中...');
    });

    if (!getAccessToken()) {
        alert('请先登录！');
        window.location.href = 'login.html';
        return;
    }

    init();
});
