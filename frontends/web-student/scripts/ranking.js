document.addEventListener('DOMContentLoaded', async function() {
    const rankingTableBody = document.getElementById('rankingTableBody');
    const exportExcelBtn = document.getElementById('exportExcel');
    const exportWordBtn = document.getElementById('exportWord');
    const apiMeta = document.querySelector('meta[name="pg-plus-api-base"]');
    const API_BASE = (apiMeta?.getAttribute('content') || 'http://localhost:8000/api/v1').replace(/\/$/, '');
    const STUDENTS_API = `${API_BASE}/scoring/students/`;
    const ACCESS_TOKEN_KEY = 'pg_plus_access_token';
    const USER_PROFILE_KEY = 'pg_plus_user_profile';
    const USER_DATA_KEY = 'userData';
    const USER_ROLE_KEY = 'userRole';

    const DEFAULT_STUDENTS = [
        { id: 1, name: "张三", studentId: "20210001", gpa: 3.92, points: 15, totalScore: 3.92 * 25 + 15 },
        { id: 2, name: "李四", studentId: "20210002", gpa: 3.88, points: 12, totalScore: 3.88 * 25 + 12 },
        { id: 3, name: "王五", studentId: "20210003", gpa: 3.85, points: 10, totalScore: 3.85 * 25 + 10 },
        { id: 4, name: "赵六", studentId: "20210004", gpa: 3.82, points: 8, totalScore: 3.82 * 25 + 8 },
        { id: 5, name: "钱七", studentId: "20210005", gpa: 3.78, points: 6, totalScore: 3.78 * 25 + 6 },
        { id: 6, name: "孙八", studentId: "20210006", gpa: 3.75, points: 5, totalScore: 3.75 * 25 + 5 },
        { id: 7, name: "周九", studentId: "20210007", gpa: 3.72, points: 4, totalScore: 3.72 * 25 + 4 },
        { id: 8, name: "吴十", studentId: "20210008", gpa: 3.68, points: 3, totalScore: 3.68 * 25 + 3 },
        { id: 9, name: "郑十一", studentId: "20210009", gpa: 3.65, points: 2, totalScore: 3.65 * 25 + 2 },
        { id: 10, name: "王十二", studentId: "20210010", gpa: 3.62, points: 1, totalScore: 3.62 * 25 + 1 }
    ];

    let students = [];

    function getAccessToken() {
        return localStorage.getItem(ACCESS_TOKEN_KEY) || '';
    }

    function getCurrentUsername() {
        try {
            const profile = JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || '{}');
            if (profile?.username) return profile.username;
            const userData = JSON.parse(localStorage.getItem(USER_DATA_KEY) || '{}');
            if (userData?.username) return userData.username;
        } catch (err) {
            console.warn('解析用户信息失败', err);
        }
        return '';
    }

    function normalizeStudents(raw, currentUsername) {
        return raw
            .filter(item => (item.role || '') === 'student')
            .map(item => {
                const totalScore = Number(item.total_score || 0);
                const gpa = Number(item.subject_score?.gpa || 0);
                const subjectScore = Number(item.subject_score?.calculated_score || 0);
                const bonus = Math.max(0, Number((totalScore - subjectScore).toFixed(1)));
                return {
                    id: item.id,
                    name: item.username || item.student_name || '学生',
                    studentId: item.student_id || '',
                    gpa,
                    points: bonus,
                    totalScore: totalScore || gpa * 25 + bonus,
                    isCurrentUser: currentUsername && (item.username === currentUsername)
                };
            })
            .sort((a, b) => {
                const rankA = typeof a.ranking === 'number' ? a.ranking : 0;
                const rankB = typeof b.ranking === 'number' ? b.ranking : 0;
                if (rankA && rankB) return rankA - rankB;
                return b.totalScore - a.totalScore;
            });
    }

    async function fetchRanking() {
        const token = getAccessToken();
        if (!token) {
            throw new Error('未登录');
        }
        const response = await fetch(STUDENTS_API, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const detail = await response.json().catch(() => ({}));
            throw new Error(detail.detail || `加载失败(${response.status})`);
        }
        return response.json();
    }

    function renderRankingTable() {
        rankingTableBody.innerHTML = '';
        students.forEach((student, index) => {
            const rank = index + 1;
            const row = document.createElement('tr');
            if (student.isCurrentUser) {
                row.className = 'current-user';
            }

            let rankCell = '';
            if (rank === 1) {
                rankCell = `<span class="medal gold">1</span>`;
            } else if (rank === 2) {
                rankCell = `<span class="medal silver">2</span>`;
            } else if (rank === 3) {
                rankCell = `<span class="medal bronze">3</span>`;
            } else {
                rankCell = rank;
            }

            row.innerHTML = `
                <td class="rank-cell rank-${rank}">${rankCell}</td>
                <td>${student.name} ${student.isCurrentUser ? '<i class="fas fa-user" style="color: #4a6fa5; margin-left: 5px;"></i>' : ''}</td>
                <td>${student.studentId}</td>
                <td>${student.gpa.toFixed(2)}</td>
                <td class="points-cell">+${student.points}</td>
                <td class="points-cell">${student.totalScore.toFixed(1)}</td>
            `;
            rankingTableBody.appendChild(row);
        });

        updateStatistics();
    }

    function updateStatistics() {
        if (!students.length) {
            document.getElementById('totalStudents').textContent = '0';
            document.getElementById('avgGPA').textContent = '-';
            document.getElementById('avgPoints').textContent = '-';
            document.getElementById('currentUserRank').textContent = '-';
            return;
        }
        document.getElementById('totalStudents').textContent = students.length;

        const avgGPA = students.reduce((sum, student) => sum + student.gpa, 0) / students.length;
        document.getElementById('avgGPA').textContent = avgGPA.toFixed(2);

        const avgPoints = students.reduce((sum, student) => sum + student.points, 0) / students.length;
        document.getElementById('avgPoints').textContent = avgPoints.toFixed(1);

        const currentUserIndex = students.findIndex(student => student.isCurrentUser);
        const currentUserRank = currentUserIndex >= 0 ? currentUserIndex + 1 : '-';
        document.getElementById('currentUserRank').textContent = currentUserRank;
    }

    function buildExportData() {
        const data = [
            ['排名', '姓名', '学号', 'GPA', '竞赛加分', '总分']
        ];
        students.forEach((student, index) => {
            data.push([
                index + 1,
                student.name,
                student.studentId,
                student.gpa.toFixed(2),
                student.points,
                student.totalScore.toFixed(1)
            ]);
        });
        return data;
    }

    exportExcelBtn.addEventListener('click', function() {
        const data = buildExportData();
        const ws = XLSX.utils.aoa_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "专业排名");
        XLSX.writeFile(wb, "信息科学与技术专业排名.xlsx");
        alert('Excel文件导出成功！');
    });

    exportWordBtn.addEventListener('click', function() {
        const dataRows = buildExportData().slice(1); // skip header
        let content = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset="utf-8">
                <title>信息科学与技术专业排名</title>
                <style>
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #000; padding: 8px; text-align: center; }
                    th { background-color: #f2f2f2; }
                </style>
            </head>
            <body>
                <h1>信息科学与技术专业排名</h1>
                <table>
                    <tr>
                        <th>排名</th>
                        <th>姓名</th>
                        <th>学号</th>
                        <th>GPA</th>
                        <th>竞赛加分</th>
                        <th>总分</th>
                    </tr>
        `;

        dataRows.forEach(row => {
            content += `
                <tr>
                    <td>${row[0]}</td>
                    <td>${row[1]}</td>
                    <td>${row[2]}</td>
                    <td>${row[3]}</td>
                    <td>${row[4]}</td>
                    <td>${row[5]}</td>
                </tr>
            `;
        });

        content += `
                </table>
                <p>导出时间: ${new Date().toLocaleString()}</p>
            </body>
            </html>
        `;

        const blob = new Blob([content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '信息科学与技术专业排名.doc';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        alert('Word文件导出成功！');
    });

    async function init() {
        const currentUsername = getCurrentUsername();
        try {
            const data = await fetchRanking();
            const normalized = normalizeStudents(Array.isArray(data) ? data : data.results || [], currentUsername);
            students = normalized.length ? normalized : DEFAULT_STUDENTS;
            // 如果是当前用户，标记
            students = students.map(s => ({ ...s, isCurrentUser: s.isCurrentUser || (currentUsername && s.name === currentUsername) }));
        } catch (err) {
            console.warn('加载排名失败，使用示例数据', err);
            students = DEFAULT_STUDENTS.map(s => ({
                ...s,
                isCurrentUser: currentUsername && s.name === currentUsername
            }));
        }
        // 统一排序
        students.sort((a, b) => b.totalScore - a.totalScore);
        renderRankingTable();
    }

    init();
});
