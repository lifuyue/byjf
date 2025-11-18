// 加分审核页面功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('加分审核页面开始加载');
    
    // 初始化页面
    initAuditPage();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 加载申请数据
    loadApplications();
});

// 初始化审核页面
function initAuditPage() {
    console.log('初始化审核页面');
    
    // 设置筛选器默认值为待审核
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.value = 'pending';
    }
    
    // 更新统计数据
    updateStatistics();
}

// 更新统计数据
function updateStatistics() {
    // 模拟统计数据
    const totalCount = document.getElementById('totalCount');
    const pendingCount = document.getElementById('pendingCount');
    const approvedCount = document.getElementById('approvedCount');
    const rejectedCount = document.getElementById('rejectedCount');
    
    if (totalCount) totalCount.textContent = '156';
    if (pendingCount) pendingCount.textContent = '12';
    if (approvedCount) approvedCount.textContent = '120';
    if (rejectedCount) rejectedCount.textContent = '24';
}

// 设置事件监听器
function setupEventListeners() {
    // 筛选控件
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');
    const timeFilter = document.getElementById('timeFilter');
    
    if (statusFilter) statusFilter.addEventListener('change', loadApplications);
    if (typeFilter) typeFilter.addEventListener('change', loadApplications);
    if (timeFilter) timeFilter.addEventListener('change', loadApplications);
    
    // 分页按钮
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (prevBtn) prevBtn.addEventListener('click', goToPrevPage);
    if (nextBtn) nextBtn.addEventListener('click', goToNextPage);
    
    // 模态框控制
    setupModalControls();
}

// 设置模态框控制
function setupModalControls() {
    const auditModal = document.getElementById('auditModal');
    const confirmModal = document.getElementById('confirmModal');
    const closeAuditModal = document.getElementById('closeAuditModal');
    const rejectBtn = document.getElementById('rejectBtn');
    const approveBtn = document.getElementById('approveBtn');
    const cancelConfirm = document.getElementById('cancelConfirm');
    const submitConfirm = document.getElementById('submitConfirm');
    
    // 关闭审核详情模态框
    if (closeAuditModal) {
        closeAuditModal.addEventListener('click', function() {
            if (auditModal) auditModal.style.display = 'none';
        });
    }
    
    // 审核按钮点击
    if (rejectBtn) {
        rejectBtn.addEventListener('click', function() {
            showConfirmModal('reject');
        });
    }
    
    if (approveBtn) {
        approveBtn.addEventListener('click', function() {
            showConfirmModal('approve');
        });
    }
    
    // 确认模态框控制
    if (cancelConfirm) {
        cancelConfirm.addEventListener('click', function() {
            if (confirmModal) confirmModal.style.display = 'none';
        });
    }
    
    if (submitConfirm) {
        submitConfirm.addEventListener('click', function() {
            submitAuditResult();
        });
    }
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === auditModal) {
            auditModal.style.display = 'none';
        }
        if (e.target === confirmModal) {
            confirmModal.style.display = 'none';
        }
    });
}

// 显示确认模态框
function showConfirmModal(action) {
    const confirmModal = document.getElementById('confirmModal');
    const confirmIcon = document.getElementById('confirmIcon');
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmText = document.getElementById('confirmText');
    const studentName = document.getElementById('detailStudent').textContent;
    const projectName = document.getElementById('detailProject').textContent;
    
    if (!confirmModal || !confirmIcon || !confirmTitle || !confirmText) return;
    
    if (action === 'approve') {
        confirmIcon.className = 'fas fa-check-circle approve';
        confirmTitle.textContent = '确认通过申请';
        confirmText.textContent = `您确定要通过${studentName}的${projectName}申请吗？`;
    } else {
        confirmIcon.className = 'fas fa-times-circle reject';
        confirmTitle.textContent = '确认不通过申请';
        confirmText.textContent = `您确定要不通过${studentName}的${projectName}申请吗？`;
    }
    
    confirmModal.style.display = 'flex';
    confirmModal.dataset.action = action;
}

// 提交审核结果
function submitAuditResult() {
    const confirmModal = document.getElementById('confirmModal');
    const auditModal = document.getElementById('auditModal');
    const action = confirmModal.dataset.action;
    const reason = document.getElementById('auditReason').value.trim();
    const currentAppId = auditModal.dataset.currentAppId;
    
    if (!reason) {
        alert('请填写审核意见！');
        return;
    }
    
    console.log(`提交审核结果: ${action}, 申请ID: ${currentAppId}, 理由: ${reason}`);
    
    // 更新申请状态
    updateApplicationStatus(currentAppId, action, reason);
    
    // 模拟提交成功
    setTimeout(function() {
        if (confirmModal) confirmModal.style.display = 'none';
        if (auditModal) auditModal.style.display = 'none';
        
        // 显示成功消息
        showSuccessMessage(action === 'approve' ? '申请已通过' : '申请未通过');
        
        // 刷新申请列表和统计数据
        loadApplications();
        updateStatistics();
    }, 1000);
}

// 更新申请状态
function updateApplicationStatus(appId, action, reason) {
    // 从localStorage获取申请数据
    let applications = JSON.parse(localStorage.getItem('auditApplications') || '[]');
    
    // 找到对应的申请并更新状态
    applications = applications.map(app => {
        if (app.id == appId) {
            return {
                ...app,
                status: action === 'approve' ? 'approved' : 'rejected',
                auditReason: reason,
                auditTime: new Date().toLocaleString('zh-CN'),
                auditor: '管理员'
            };
        }
        return app;
    });
    
    // 保存更新后的数据
    localStorage.setItem('auditApplications', JSON.stringify(applications));
}

// 显示成功消息
function showSuccessMessage(message) {
    // 创建临时提示消息
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        font-weight: 500;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // 3秒后自动移除
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// 加载申请数据
function loadApplications() {
    const applicationsList = document.getElementById('applicationsList');
    if (!applicationsList) return;
    
    // 获取或初始化申请数据
    let applications = JSON.parse(localStorage.getItem('auditApplications') || '[]');
    
    // 如果没有数据，初始化模拟数据
    if (applications.length === 0) {
        applications = getMockApplications();
        localStorage.setItem('auditApplications', JSON.stringify(applications));
    }
    
    // 应用筛选条件
    const statusFilter = document.getElementById('statusFilter');
    const typeFilter = document.getElementById('typeFilter');
    
    let filteredApplications = applications;
    
    if (statusFilter && statusFilter.value !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.status === statusFilter.value);
    }
    
    if (typeFilter && typeFilter.value !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.type === typeFilter.value);
    }
    
    // 清空现有列表
    applicationsList.innerHTML = '';
    
    if (filteredApplications.length === 0) {
        applicationsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p>暂无申请数据</p>
            </div>
        `;
    } else {
        // 生成申请项
        filteredApplications.forEach(app => {
            const applicationItem = createApplicationItem(app);
            applicationsList.appendChild(applicationItem);
        });
    }
    
    console.log(`显示 ${filteredApplications.length} 条申请数据，筛选条件: status=${statusFilter?.value}, type=${typeFilter?.value}`);
}

// 获取模拟申请数据
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
            time: '2024-01-15 14:30',
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
            time: '2024-01-15 13:45',
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
            time: '2024-01-14 16:20',
            auditReason: '论文质量较高，符合加分标准',
            auditTime: '2024-01-14 17:30',
            auditor: '管理员',
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
            time: '2024-01-13 10:15',
            auditReason: '专利证明材料不完整，缺少专利证书扫描件',
            auditTime: '2024-01-13 14:20',
            auditor: '管理员',
            proofFiles: [
                { name: '专利申请受理书.pdf', type: 'pdf' }
            ]
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
            time: '2024-01-12 09:30',
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
            time: '2024-01-11 15:45',
            proofFiles: [
                { name: '论文全文.pdf', type: 'pdf' },
                { name: '期刊封面.jpg', type: 'image' }
            ]
        }
    ];
}

// 创建申请项
function createApplicationItem(application) {
    const item = document.createElement('div');
    item.className = `application-item ${application.status}`;
    item.dataset.id = application.id;
    
    const statusText = {
        'pending': '待审核',
        'approved': '已通过',
        'rejected': '未通过'
    };
    
    const statusClass = {
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected'
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
            <div class="application-status ${statusClass[application.status]}">
                ${statusText[application.status]}
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
    
    // 点击查看详情
    item.addEventListener('click', function() {
        showApplicationDetail(application);
    });
    
    return item;
}

// 显示申请详情
function showApplicationDetail(application) {
    const modal = document.getElementById('auditModal');
    if (!modal) return;
    
    // 填充详情数据
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
    if (detailPoints) detailPoints.textContent = application.points + '分';
    if (detailDescription) detailDescription.textContent = application.description;
    
    // 更新证明材料
    const proofFiles = document.querySelector('.proof-files');
    if (proofFiles) {
        proofFiles.innerHTML = '';
        application.proofFiles.forEach(file => {
            const fileIcon = file.type === 'pdf' ? 'fa-file-pdf' : 
                           file.type === 'image' ? 'fa-file-image' : 'fa-file';
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
    
    // 清空审核意见
    const auditReason = document.getElementById('auditReason');
    if (auditReason) {
        if (application.status === 'pending') {
            auditReason.value = '';
            auditReason.disabled = false;
            auditReason.placeholder = '请输入审核意见（必填）...';
        } else {
            auditReason.value = application.auditReason || '无审核意见';
            auditReason.disabled = true;
            auditReason.placeholder = '';
        }
    }
    
    // 根据状态禁用/启用审核按钮
    const rejectBtn = document.getElementById('rejectBtn');
    const approveBtn = document.getElementById('approveBtn');
    
    if (rejectBtn && approveBtn) {
        if (application.status !== 'pending') {
            rejectBtn.disabled = true;
            approveBtn.disabled = true;
            rejectBtn.style.opacity = '0.5';
            approveBtn.style.opacity = '0.5';
            rejectBtn.textContent = '不通过（已审核）';
            approveBtn.textContent = '通过（已审核）';
        } else {
            rejectBtn.disabled = false;
            approveBtn.disabled = false;
            rejectBtn.style.opacity = '1';
            approveBtn.style.opacity = '1';
            rejectBtn.innerHTML = '<i class="fas fa-times"></i> 不通过';
            approveBtn.innerHTML = '<i class="fas fa-check"></i> 通过';
        }
    }
    
    modal.style.display = 'flex';
    modal.dataset.currentAppId = application.id;
}

// 上一页
function goToPrevPage() {
    console.log('上一页');
}

// 下一页
function goToNextPage() {
    console.log('下一页');
}

console.log('加分审核页面脚本加载完成');