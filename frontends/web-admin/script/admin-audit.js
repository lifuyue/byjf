// 加分审核列表（管理员只读 + 复核操作）
document.addEventListener('DOMContentLoaded', () => {
    initAuditPage();
    setupEventListeners();
    loadApplications();
});

function initAuditPage() {
    const params = new URLSearchParams(window.location.search);
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.value = params.get('status') || 'pending';
    }

    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        const next = params.get('type');
        if (next) typeFilter.value = next;
    }

    const timeFilter = document.getElementById('timeFilter');
    if (timeFilter) {
        const next = params.get('time');
        if (next) timeFilter.value = next;
    }
}

// 根据实际数据更新统计
function updateStatistics(applications = []) {
    const totalCount = document.getElementById('totalCount');
    const pendingCount = document.getElementById('pendingCount');
    const approvedCount = document.getElementById('approvedCount');
    const rejectedCount = document.getElementById('rejectedCount');

    const stats = applications.reduce(
        (acc, app) => {
            acc.total += 1;
            if (app.status === 'pending') acc.pending += 1;
            if (app.status === 'approved') acc.approved += 1;
            if (app.status === 'rejected') acc.rejected += 1;
            return acc;
        },
        { total: 0, pending: 0, approved: 0, rejected: 0 }
    );

    if (totalCount) totalCount.textContent = String(stats.total);
    if (pendingCount) pendingCount.textContent = String(stats.pending);
    if (approvedCount) approvedCount.textContent = String(stats.approved);
    if (rejectedCount) rejectedCount.textContent = String(stats.rejected);
}

function setupEventListeners() {
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');
    const timeFilter = document.getElementById('timeFilter');

    if (statusFilter) statusFilter.addEventListener('change', loadApplications);
    if (typeFilter) typeFilter.addEventListener('change', loadApplications);
    if (timeFilter) timeFilter.addEventListener('change', loadApplications);

    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    if (prevBtn) prevBtn.addEventListener('click', () => console.log('上一页'));
    if (nextBtn) nextBtn.addEventListener('click', () => console.log('下一页'));

    setupModalControls();
}

function setupModalControls() {
    const auditModal = document.getElementById('auditModal');
    const closeAuditModal = document.getElementById('closeAuditModal');
    const reopenBtn = document.getElementById('reopenBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    if (closeAuditModal) {
        closeAuditModal.addEventListener('click', () => {
            if (auditModal) auditModal.style.display = 'none';
        });
    }

    if (reopenBtn) {
        reopenBtn.addEventListener('click', () => handleOverride('reopen'));
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => handleOverride('cancel'));
    }

    window.addEventListener('click', e => {
        if (e.target === auditModal) {
            auditModal.style.display = 'none';
        }
    });
}

function handleOverride(action) {
    const auditModal = document.getElementById('auditModal');
    if (!auditModal) return;
    const currentAppId = auditModal.dataset.currentAppId;
    const noteField = document.getElementById('auditReason');
    const note = (noteField?.value || '').trim();

    if (!currentAppId) return;
    if (!note) {
        alert('请填写复核说明后再提交。');
        return;
    }

    let applications = getStoredApplications();
    const now = new Date().toLocaleString('zh-CN');
    let found = false;

    applications = applications.map(app => {
        if (String(app.id) === String(currentAppId)) {
            found = true;
            const corrections = Array.isArray(app.corrections) ? app.corrections : [];
            const updated = { ...app };
            if (action === 'reopen') {
                updated.status = 'pending';
                updated.review_stage = 'stage1';
            } else {
                updated.status = 'cancelled';
            }
            updated.corrections = [
                {
                    action,
                    note,
                    actor: '管理员',
                    time: now
                },
                ...corrections
            ];
            return updated;
        }
        return app;
    });

    if (!found) return;

    saveApplications(applications);
    if (auditModal) auditModal.style.display = 'none';
    if (noteField) noteField.value = '';
    showSuccessMessage(action === 'reopen' ? '已发起复核，教师将重新审核' : '记录已作废');
    loadApplications();
}

function loadApplications() {
    const applicationsList = document.getElementById('applicationsList');
    if (!applicationsList) return;

    const applications = getStoredApplications();
    updateStatistics(applications);

    let filteredApplications = [...applications];
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');

    if (statusFilter && statusFilter.value !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.status === statusFilter.value);
    }

    if (typeFilter && typeFilter.value !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.type === typeFilter.value);
    }

    applicationsList.innerHTML = '';

    if (filteredApplications.length === 0) {
        applicationsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p>暂无申请数据</p>
            </div>
        `;
    } else {
        filteredApplications.forEach(app => {
            const applicationItem = createApplicationItem(app);
            applicationsList.appendChild(applicationItem);
        });
    }

    console.log(
        `显示 ${filteredApplications.length} 条申请数据，筛选条件: status=${statusFilter?.value}, type=${typeFilter?.value}`
    );
}

function getStoredApplications() {
    let applications = JSON.parse(localStorage.getItem('auditApplications') || '[]');
    if (applications.length === 0) {
        applications = getMockApplications();
        saveApplications(applications);
    }
    return applications;
}

function saveApplications(applications) {
    localStorage.setItem('auditApplications', JSON.stringify(applications));
}

function getMockApplications() {
    return [
        {
            id: 1,
            student: '张三',
            studentId: '2021001001',
            college: '计算机科学学院',
            major: '计算机科学与技术',
            type: 'competition',
            typeText: '竞赛获奖',
            project: '全国大学生数学建模竞赛',
            level: '国家级一等奖',
            points: 2.0,
            description: '参加了2023年全国大学生数学建模竞赛，获得国家级一等奖。团队成员包括我、李四、王五。',
            status: 'pending',
            review_stage: 'stage1',
            time: '2024-01-15 14:30',
            reviewTrail: [],
            corrections: [],
            proofFiles: [
                { name: '获奖证书.pdf', type: 'pdf' },
                { name: '比赛照片.jpg', type: 'image' }
            ]
        },
        {
            id: 2,
            student: '李四',
            studentId: '2021001002',
            college: '软件工程学院',
            major: '软件工程',
            type: 'research',
            typeText: '科研项目',
            project: '基于AI的代码审查系统',
            level: '省级重点项目',
            points: 1.5,
            description: '参与导师的省级重点科研项目，负责核心模块开发，项目周期6个月。',
            status: 'pending',
            review_stage: 'stage1',
            time: '2024-01-15 13:45',
            reviewTrail: [],
            corrections: [],
            proofFiles: [
                { name: '项目结题报告.pdf', type: 'pdf' },
                { name: '项目成果展示.pptx', type: 'file' }
            ]
        },
        {
            id: 3,
            student: '王五',
            studentId: '2021001003',
            college: '电子信息学院',
            major: '电子信息工程',
            type: 'paper',
            typeText: '论文发表',
            project: '基于深度学习的图像识别研究',
            level: 'SCI二区',
            points: 3.0,
            description: '在IEEE Transactions期刊发表论文一篇，第一作者。',
            status: 'approved',
            review_stage: 'completed',
            time: '2024-01-14 16:20',
            auditReason: '论文质量较高，符合加分标准',
            reviewTrail: [
                { stage: 'stage1', reviewer: '李老师', note: '资料齐全', timestamp: '2024-01-13 15:00' },
                { stage: 'stage3', reviewer: '张教授', note: '通过终审', timestamp: '2024-01-14 17:30' }
            ],
            corrections: [],
            proofFiles: [
                { name: '论文录用通知.pdf', type: 'pdf' },
                { name: '论文全文.pdf', type: 'pdf' }
            ]
        },
        {
            id: 4,
            student: '赵六',
            studentId: '2021001004',
            college: '机械工程学院',
            major: '机械设计制造',
            type: 'patent',
            typeText: '专利成果',
            project: '一种新型智能机械臂',
            level: '发明专利',
            points: 2.5,
            description: '获得国家发明专利授权，专利号：ZL202310123456.7',
            status: 'rejected',
            review_stage: 'stage2',
            time: '2024-01-13 10:15',
            auditReason: '专利证明材料不完整，缺少专利证书扫描件',
            reviewTrail: [{ stage: 'stage2', reviewer: '审核老师', note: '材料不完整', timestamp: '2024-01-13 14:20' }],
            corrections: [],
            proofFiles: [{ name: '专利申请受理书.pdf', type: 'pdf' }]
        },
        {
            id: 5,
            student: '钱七',
            studentId: '2021001005',
            college: '材料科学与工程学院',
            major: '材料科学与工程',
            type: 'competition',
            typeText: '竞赛获奖',
            project: '全国大学生创新创业大赛',
            level: '国家级银奖',
            points: 1.8,
            description: '参加全国大学生创新创业大赛，获得国家级银奖。',
            status: 'pending',
            review_stage: 'stage1',
            time: '2024-01-12 09:30',
            reviewTrail: [],
            corrections: [],
            proofFiles: [
                { name: '获奖证书.pdf', type: 'pdf' },
                { name: '项目计划书.docx', type: 'file' }
            ]
        },
        {
            id: 6,
            student: '孙八',
            studentId: '2021001006',
            college: '化学化工学院',
            major: '化学工程',
            type: 'paper',
            typeText: '论文发表',
            project: '新型催化剂在有机合成中的应用',
            level: 'SCI一区',
            points: 3.5,
            description: '在Nature Communications期刊发表论文一篇。',
            status: 'pending',
            review_stage: 'stage1',
            time: '2024-01-11 15:45',
            reviewTrail: [],
            corrections: [],
            proofFiles: [
                { name: '论文全文.pdf', type: 'pdf' },
                { name: '期刊封面.jpg', type: 'image' }
            ]
        }
    ];
}

function createApplicationItem(application) {
    const item = document.createElement('div');
    item.className = `application-item ${application.status}`;
    item.dataset.id = application.id;

    const statusText = {
        pending: '待审核',
        approved: '已通过',
        rejected: '未通过',
        cancelled: '已作废'
    };

    const statusClass = {
        pending: 'status-pending',
        approved: 'status-approved',
        rejected: 'status-rejected',
        cancelled: 'status-cancelled'
    };

    item.innerHTML = `
        <div class="application-header">
            <div class="student-info">
                <div class="student-avatar">${application.student.charAt(0)}</div>
                <div class="student-details">
                    <h3>${application.student}</h3>
                    <div class="student-meta">${application.studentId} | ${application.college}</div>
                </div>
            </div>
            <div class="application-status ${statusClass[application.status] || ''}">
                ${statusText[application.status] || '未知状态'}
            </div>
        </div>
        <div class="application-content">
            <div class="application-type">${application.typeText}</div>
            <div class="application-project">${application.project}</div>
            <div class="application-points">${application.points}分</div>
        </div>
        <div class="application-meta">
            <div class="application-time">
                <i class="far fa-clock"></i>
                ${application.time}
            </div>
            <div class="application-level">${application.level}</div>
        </div>
    `;

    item.addEventListener('click', () => showApplicationDetail(application));
    return item;
}

function showApplicationDetail(application) {
    const modal = document.getElementById('auditModal');
    if (!modal) return;

    const detailStudent = document.getElementById('detailStudent');
    const detailStudentId = document.getElementById('detailStudentId');
    const detailCollege = document.getElementById('detailCollege');
    const detailMajor = document.getElementById('detailMajor');
    const detailType = document.getElementById('detailType');
    const detailProject = document.getElementById('detailProject');
    const detailLevel = document.getElementById('detailLevel');
    const detailPoints = document.getElementById('detailPoints');
    const detailDescription = document.getElementById('detailDescription');

    if (detailStudent) detailStudent.textContent = application.student;
    if (detailStudentId) detailStudentId.textContent = application.studentId;
    if (detailCollege) detailCollege.textContent = application.college;
    if (detailMajor) detailMajor.textContent = application.major;
    if (detailType) detailType.textContent = application.typeText;
    if (detailProject) detailProject.textContent = application.project;
    if (detailLevel) detailLevel.textContent = application.level;
    if (detailPoints) detailPoints.textContent = `${application.points}分`;
    if (detailDescription) detailDescription.textContent = application.description;

    const proofFiles = document.querySelector('.proof-files');
    if (proofFiles) {
        proofFiles.innerHTML = '';
        (application.proofFiles || []).forEach(file => {
            const fileIcon =
                file.type === 'pdf' ? 'fa-file-pdf' : file.type === 'image' ? 'fa-file-image' : 'fa-file';
            const fileElement = document.createElement('a');
            fileElement.href = '#';
            fileElement.className = 'proof-file';
            fileElement.innerHTML = `
                <i class="fas ${fileIcon}"></i>
                ${file.name}
            `;
            proofFiles.appendChild(fileElement);
        });
    }

    renderAuditHistory(application);
    renderCorrectionLogs(application);
    setActionState(application);

    modal.style.display = 'flex';
    modal.dataset.currentAppId = application.id;
}

function renderAuditHistory(application) {
    const historyContainer = document.getElementById('auditHistory');
    if (!historyContainer) return;
    const history = Array.isArray(application.reviewTrail) ? application.reviewTrail : [];
    const parts = [];

    history.forEach(log => {
        parts.push(`
            <div class="history-item">
                <div class="history-meta">
                    <span class="history-reviewer">${log.reviewer || '审核人'}</span>
                    <span class="history-stage">${log.stage || ''}</span>
                    <span class="history-time">${log.timestamp || ''}</span>
                </div>
                <div class="history-note">${log.note || '无备注'}</div>
            </div>
        `);
    });

    if (application.auditReason) {
        parts.push(`
            <div class="history-item teacher-latest">
                <div class="history-meta">
                    <span class="history-reviewer">教师审核</span>
                    <span class="history-time">${application.auditTime || ''}</span>
                </div>
                <div class="history-note">${application.auditReason}</div>
            </div>
        `);
    }

    historyContainer.innerHTML = parts.length ? parts.join('') : '<p class="muted">暂无审核记录</p>';
}

function renderCorrectionLogs(application) {
    const correctionList = document.getElementById('correctionList');
    if (!correctionList) return;
    const corrections = Array.isArray(application.corrections) ? application.corrections : [];

    if (!corrections.length) {
        correctionList.innerHTML = '<p class="muted">暂无复核记录</p>';
        return;
    }

    correctionList.innerHTML = corrections
        .map(
            log => `
            <div class="history-item correction-item">
                <div class="history-meta">
                    <span class="history-reviewer">${log.actor || '管理员'}</span>
                    <span class="history-time">${log.time || ''}</span>
                </div>
                <div class="history-note">
                    ${log.action === 'reopen' ? '发起复核' : '作废记录'} ${log.note ? `：${log.note}` : ''}
                </div>
            </div>
        `
        )
        .join('');
}

function setActionState(application) {
    const noteField = document.getElementById('auditReason');
    const reopenBtn = document.getElementById('reopenBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    if (!noteField || !reopenBtn || !cancelBtn) return;

    const canOverride = application.status === 'approved' || application.status === 'rejected';
    const isCancelled = application.status === 'cancelled';

    if (canOverride) {
        noteField.disabled = false;
        noteField.placeholder = '填写复核说明后，可发起复核或作废';
        reopenBtn.disabled = false;
        cancelBtn.disabled = false;
    } else {
        noteField.value = '';
        noteField.disabled = true;
        noteField.placeholder = isCancelled ? '记录已作废' : '教师审核中，管理员仅查看';
        reopenBtn.disabled = true;
        cancelBtn.disabled = true;
    }
}

// 轻量提示
function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #2563eb;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        font-weight: 500;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

console.log('管理员审核总览脚本加载完成');
