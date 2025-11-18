// 用户管理页面功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('用户管理页面开始加载');
    
    // 初始化页面
    initUsersPage();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 加载用户数据
    loadUsers();
});

// 初始化用户管理页面
function initUsersPage() {
    console.log('初始化用户管理页面');
    
    // 更新统计数据
    updateStatistics();
    
    // 初始化分页
    initPagination();
}

// 更新统计数据
function updateStatistics() {
    // 模拟统计数据
    const totalStudents = document.getElementById('totalStudents');
    const totalPoints = document.getElementById('totalPoints');
    const avgPoints = document.getElementById('avgPoints');
    const activeUsers = document.getElementById('activeUsers');
    
    if (totalStudents) totalStudents.textContent = '156';
    if (totalPoints) totalPoints.textContent = '324.5';
    if (avgPoints) avgPoints.textContent = '2.08';
    if (activeUsers) activeUsers.textContent = '142';
}

// 初始化分页
function initPagination() {
    const pageNumbers = document.getElementById('pageNumbers');
    if (!pageNumbers) return;
    
    let pagesHtml = '';
    
    // 显示前5页
    for (let i = 1; i <= 5; i++) {
        pagesHtml += `<span class="page-number ${i === 1 ? 'active' : ''}" data-page="${i}">${i}</span>`;
    }
    
    // 添加省略号
    pagesHtml += '<span class="page-dots">...</span>';
    
    // 显示最后2页
    for (let i = 19; i <= 20; i++) {
        pagesHtml += `<span class="page-number" data-page="${i}">${i}</span>`;
    }
    
    pageNumbers.innerHTML = pagesHtml;
    
    // 添加页码点击事件
    const pageNumbersElements = pageNumbers.querySelectorAll('.page-number');
    pageNumbersElements.forEach(page => {
        page.addEventListener('click', function() {
            if (!this.classList.contains('page-dots')) {
                const pageNum = parseInt(this.dataset.page);
                goToPage(pageNum);
            }
        });
    });
}

// 设置事件监听器
function setupEventListeners() {
    // 搜索和筛选控件
    const searchInput = document.getElementById('searchInput');
    const collegeFilter = document.getElementById('collegeFilter');
    const gradeFilter = document.getElementById('gradeFilter');
    
    if (searchInput) searchInput.addEventListener('input', loadUsers);
    if (collegeFilter) collegeFilter.addEventListener('change', loadUsers);
    if (gradeFilter) gradeFilter.addEventListener('change', loadUsers);
    
    // 分页按钮
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (prevBtn) prevBtn.addEventListener('click', goToPrevPage);
    if (nextBtn) nextBtn.addEventListener('click', goToNextPage);
    
    // 模态框控制
    setupModalControls();
}

// 设置模态框控制
function setupModalControls() {
    const studentModal = document.getElementById('studentModal');
    const addPointsModal = document.getElementById('addPointsModal');
    const resetPwdModal = document.getElementById('resetPwdModal');
    const deletePointsModal = document.getElementById('deletePointsModal');
    
    const closeStudentModal = document.getElementById('closeStudentModal');
    const closePointsModal = document.getElementById('closePointsModal');
    const closeDetailBtn = document.getElementById('closeDetailBtn');
    const cancelPointsBtn = document.getElementById('cancelPointsBtn');
    
    const addPointsBtn = document.getElementById('addPointsBtn');
    const resetPwdBtn = document.getElementById('resetPwdBtn');
    const submitPointsBtn = document.getElementById('submitPointsBtn');
    
    const cancelResetPwd = document.getElementById('cancelResetPwd');
    const confirmResetPwd = document.getElementById('confirmResetPwd');
    const cancelDeletePoints = document.getElementById('cancelDeletePoints');
    const confirmDeletePoints = document.getElementById('confirmDeletePoints');
    
    // 关闭学生详情模态框
    if (closeStudentModal) {
        closeStudentModal.addEventListener('click', function() {
            if (studentModal) studentModal.style.display = 'none';
        });
    }
    
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', function() {
            if (studentModal) studentModal.style.display = 'none';
        });
    }
    
    // 关闭添加加分项模态框
    if (closePointsModal) {
        closePointsModal.addEventListener('click', function() {
            if (addPointsModal) addPointsModal.style.display = 'none';
        });
    }
    
    if (cancelPointsBtn) {
        cancelPointsBtn.addEventListener('click', function() {
            if (addPointsModal) addPointsModal.style.display = 'none';
        });
    }
    
    // 添加加分项按钮
    if (addPointsBtn) {
        addPointsBtn.addEventListener('click', function() {
            if (addPointsModal) addPointsModal.style.display = 'flex';
        });
    }
    
    // 重置密码按钮
    if (resetPwdBtn) {
        resetPwdBtn.addEventListener('click', function() {
            showResetPwdModal();
        });
    }
    
    // 提交加分项
    if (submitPointsBtn) {
        submitPointsBtn.addEventListener('click', function() {
            submitPoints();
        });
    }
    
    // 重置密码确认
    if (cancelResetPwd) {
        cancelResetPwd.addEventListener('click', function() {
            if (resetPwdModal) resetPwdModal.style.display = 'none';
        });
    }
    
    if (confirmResetPwd) {
        confirmResetPwd.addEventListener('click', function() {
            performResetPassword();
        });
    }
    
    // 删除加分项确认
    if (cancelDeletePoints) {
        cancelDeletePoints.addEventListener('click', function() {
            if (deletePointsModal) deletePointsModal.style.display = 'none';
        });
    }
    
    if (confirmDeletePoints) {
        confirmDeletePoints.addEventListener('click', function() {
            performDeletePoints();
        });
    }
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === studentModal) {
            studentModal.style.display = 'none';
        }
        if (e.target === addPointsModal) {
            addPointsModal.style.display = 'none';
        }
        if (e.target === resetPwdModal) {
            resetPwdModal.style.display = 'none';
        }
        if (e.target === deletePointsModal) {
            deletePointsModal.style.display = 'none';
        }
    });
}

// 当前页码
let currentPage = 1;
const pageSize = 10; // 每页显示10条数据
const totalPages = 20; // 总共20页

// 加载用户数据
function loadUsers() {
    const usersTableBody = document.getElementById('usersTableBody');
    const studentsCount = document.getElementById('studentsCount');
    
    if (!usersTableBody) return;
    
    // 获取或初始化用户数据
    let users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    
    // 如果没有数据，初始化模拟数据
    if (users.length === 0) {
        users = getMockUsers();
        localStorage.setItem('adminUsers', JSON.stringify(users));
    }
    
    // 应用搜索和筛选条件
    const searchInput = document.getElementById('searchInput');
    const collegeFilter = document.getElementById('collegeFilter');
    const gradeFilter = document.getElementById('gradeFilter');
    
    let filteredUsers = users;
    
    // 搜索过滤
    if (searchInput && searchInput.value.trim() !== '') {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filteredUsers = filteredUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.studentId.includes(searchTerm) ||
            user.college.toLowerCase().includes(searchTerm)
        );
    }
    
    // 学院过滤
    if (collegeFilter && collegeFilter.value !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.collegeCode === collegeFilter.value);
    }
    
    // 年级过滤
    if (gradeFilter && gradeFilter.value !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.grade === gradeFilter.value);
    }
    
    // 计算分页
    const totalFilteredUsers = filteredUsers.length;
    const totalPagesFiltered = Math.ceil(totalFilteredUsers / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalFilteredUsers);
    const pagedUsers = filteredUsers.slice(startIndex, endIndex);
    
    // 清空现有列表
    usersTableBody.innerHTML = '';
    
    if (pagedUsers.length === 0) {
        usersTableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div class="no-data">
                        <i class="fas fa-users"></i>
                        <p>暂无学生数据</p>
                    </div>
                </td>
            </tr>
        `;
    } else {
        // 生成用户行
        pagedUsers.forEach(user => {
            const userRow = createUserRow(user);
            usersTableBody.appendChild(userRow);
        });
        
        // 如果当前页数据不足，添加空行
        const emptyRows = pageSize - pagedUsers.length;
        for (let i = 0; i < emptyRows; i++) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="7" style="height: 60px; background: #fafafa;"></td>
            `;
            usersTableBody.appendChild(emptyRow);
        }
    }
    
    // 更新学生数量
    if (studentsCount) {
        studentsCount.textContent = totalFilteredUsers;
    }
    
    // 更新分页状态
    updatePaginationState(totalFilteredUsers);
    
    console.log(`显示第 ${currentPage} 页，共 ${totalPagesFiltered} 页，${pagedUsers.length} 名学生数据`);
}

// 更新分页状态
function updatePaginationState(totalUsers) {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageNumbers = document.querySelectorAll('.page-number');
    
    // 更新按钮状态
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }
    
    if (nextBtn) {
        const totalPagesFiltered = Math.ceil(totalUsers / pageSize);
        nextBtn.disabled = currentPage === totalPagesFiltered;
    }
    
    // 更新页码激活状态
    pageNumbers.forEach(page => {
        if (!page.classList.contains('page-dots')) {
            const pageNum = parseInt(page.dataset.page);
            page.classList.toggle('active', pageNum === currentPage);
        }
    });
}

// 获取模拟用户数据
function getMockUsers() {
    return [
        {
            id: 1,
            studentId: '2021001001',
            name: '张三',
            college: '计算机科学学院',
            collegeCode: 'computer',
            major: '计算机科学与技术',
            grade: '2021',
            class: '计算机2101班',
            phone: '13800138001',
            email: 'zhangsan@edu.cn',
            totalPoints: 3.5,
            points: [
                {
                    id: 1,
                    type: 'competition',
                    typeText: '竞赛获奖',
                    project: '全国大学生数学建模竞赛',
                    level: '国家级一等奖',
                    points: 2.0,
                    description: '参加了2023年全国大学生数学建模竞赛，获得国家级一等奖',
                    time: '2024-01-15'
                },
                {
                    id: 2,
                    type: 'paper',
                    typeText: '论文发表',
                    project: '基于深度学习的图像识别研究',
                    level: 'SCI二区',
                    points: 1.5,
                    description: '在IEEE Transactions期刊发表论文一篇',
                    time: '2024-01-10'
                }
            ]
        },
        {
            id: 2,
            studentId: '2021001002',
            name: '李四',
            college: '软件工程学院',
            collegeCode: 'software',
            major: '软件工程',
            grade: '2021',
            class: '软件2102班',
            phone: '13800138002',
            email: 'lisi@edu.cn',
            totalPoints: 2.0,
            points: [
                {
                    id: 1,
                    type: 'research',
                    typeText: '科研项目',
                    project: '基于AI的代码审查系统',
                    level: '省级重点项目',
                    points: 2.0,
                    description: '参与导师的省级重点科研项目',
                    time: '2024-01-12'
                }
            ]
        },
        {
            id: 3,
            studentId: '2021001003',
            name: '王五',
            college: '电子信息学院',
            collegeCode: 'electronic',
            major: '电子信息工程',
            grade: '2021',
            class: '电子2101班',
            phone: '13800138003',
            email: 'wangwu@edu.cn',
            totalPoints: 4.0,
            points: [
                {
                    id: 1,
                    type: 'patent',
                    typeText: '专利成果',
                    project: '一种新型智能传感器',
                    level: '发明专利',
                    points: 2.5,
                    description: '获得国家发明专利授权',
                    time: '2024-01-08'
                },
                {
                    id: 2,
                    type: 'competition',
                    typeText: '竞赛获奖',
                    project: '全国电子设计大赛',
                    level: '国家级二等奖',
                    points: 1.5,
                    description: '参加全国大学生电子设计竞赛',
                    time: '2024-01-05'
                }
            ]
        }
    ];
}

// 创建用户表格行
function createUserRow(user) {
    const row = document.createElement('tr');
    row.dataset.id = user.id;
    
    row.innerHTML = `
        <td>${user.studentId}</td>
        <td>
            <div class="user-info">
                <div class="user-avatar">${user.name.charAt(0)}</div>
                <div class="user-details">
                    <div class="user-name">${user.name}</div>
                    <div class="user-id">${user.studentId}</div>
                </div>
            </div>
        </td>
        <td>${user.college}</td>
        <td>${user.major}</td>
        <td>${user.grade}级</td>
        <td><span class="points-value">${user.totalPoints}分</span></td>
        <td>
            <div class="actions">
                <button class="action-icon view-btn" title="查看详情">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-icon delete-btn" title="删除用户">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </td>
    `;
    
    // 查看详情按钮点击事件
    const viewBtn = row.querySelector('.view-btn');
    if (viewBtn) {
        viewBtn.addEventListener('click', function() {
            showStudentDetail(user);
        });
    }
    
    // 删除按钮点击事件
    const deleteBtn = row.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function() {
            deleteStudent(user);
        });
    }
    
    return row;
}

// 显示学生详情
function showStudentDetail(student) {
    const modal = document.getElementById('studentModal');
    if (!modal) return;
    
    // 填充基本信息
    document.getElementById('detailStudentId').textContent = student.studentId;
    document.getElementById('detailName').textContent = student.name;
    document.getElementById('detailCollege').textContent = student.college;
    document.getElementById('detailMajor').textContent = student.major;
    document.getElementById('detailGrade').textContent = student.grade + '级';
    document.getElementById('detailClass').textContent = student.class;
    document.getElementById('detailPhone').textContent = student.phone;
    document.getElementById('detailEmail').textContent = student.email;
    
    // 更新加分项列表
    updatePointsList(student.points);
    
    modal.style.display = 'flex';
    modal.dataset.currentStudentId = student.id;
}

// 更新加分项列表
function updatePointsList(points) {
    const pointsList = document.getElementById('pointsList');
    if (!pointsList) return;
    
    pointsList.innerHTML = '';
    
    if (points.length === 0) {
        pointsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-inbox"></i>
                <p>暂无加分项记录</p>
            </div>
        `;
    } else {
        points.forEach(point => {
            const pointsItem = createPointsItem(point);
            pointsList.appendChild(pointsItem);
        });
    }
}

// 创建加分项项目
function createPointsItem(point) {
    const item = document.createElement('div');
    item.className = 'points-item';
    item.dataset.pointId = point.id;
    
    item.innerHTML = `
        <div class="points-content">
            <div class="points-header">
                <span class="points-type">${point.typeText}</span>
                <span class="points-project">${point.project}</span>
            </div>
            <div class="points-meta">
                <span>${point.level}</span>
                <span>${point.time}</span>
            </div>
            <div class="points-description">${point.description}</div>
        </div>
        <div class="points-actions">
            <span class="points-value">+${point.points}分</span>
            <button class="action-icon delete-btn" title="删除加分项">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    
    // 删除按钮点击事件
    const deleteBtn = item.querySelector('.delete-btn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showDeletePointsModal(point);
        });
    }
    
    return item;
}

// 显示重置密码确认模态框
function showResetPwdModal() {
    const modal = document.getElementById('resetPwdModal');
    const resetPwdText = document.getElementById('resetPwdText');
    const studentModal = document.getElementById('studentModal');
    const studentName = document.getElementById('detailName').textContent;
    
    if (!modal || !resetPwdText) return;
    
    resetPwdText.textContent = `您确定要重置${studentName}的密码吗？重置后密码将恢复为默认密码。`;
    modal.style.display = 'flex';
}

// 显示删除加分项确认模态框
function showDeletePointsModal(point) {
    const modal = document.getElementById('deletePointsModal');
    const deletePointsText = document.getElementById('deletePointsText');
    
    if (!modal || !deletePointsText) return;
    
    deletePointsText.textContent = `您确定要删除"${point.project}"这个加分项吗？此操作不可恢复。`;
    modal.style.display = 'flex';
    modal.dataset.pointId = point.id;
}

// 执行重置密码
function performResetPassword() {
    const modal = document.getElementById('resetPwdModal');
    const studentModal = document.getElementById('studentModal');
    const studentId = studentModal.dataset.currentStudentId;
    
    console.log(`重置密码 - 学生ID: ${studentId}`);
    
    // 模拟重置密码成功
    setTimeout(function() {
        if (modal) modal.style.display = 'none';
        
        // 显示成功消息
        showSuccessMessage('密码重置成功！默认密码已发送到学生邮箱。');
    }, 1000);
}

// 执行删除加分项
function performDeletePoints() {
    const modal = document.getElementById('deletePointsModal');
    const studentModal = document.getElementById('studentModal');
    const pointId = modal.dataset.pointId;
    const studentId = studentModal.dataset.currentStudentId;
    
    console.log(`删除加分项 - 学生ID: ${studentId}, 加分项ID: ${pointId}`);
    
    // 从localStorage中删除加分项
    let users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    users = users.map(user => {
        if (user.id == studentId) {
            return {
                ...user,
                points: user.points.filter(point => point.id != pointId),
                totalPoints: user.points.reduce((total, point) => {
                    if (point.id != pointId) {
                        return total + point.points;
                    }
                    return total;
                }, 0)
            };
        }
        return user;
    });
    
    localStorage.setItem('adminUsers', JSON.stringify(users));
    
    // 模拟删除成功
    setTimeout(function() {
        if (modal) modal.style.display = 'none';
        
        // 刷新学生详情
        const currentStudent = users.find(user => user.id == studentId);
        if (currentStudent) {
            showStudentDetail(currentStudent);
        }
        
        // 刷新用户列表
        loadUsers();
        
        // 显示成功消息
        showSuccessMessage('加分项删除成功！');
    }, 1000);
}

// 提交加分项
function submitPoints() {
    const form = document.getElementById('pointsForm');
    const modal = document.getElementById('addPointsModal');
    const studentModal = document.getElementById('studentModal');
    const studentId = studentModal.dataset.currentStudentId;
    
    if (!form.checkValidity()) {
        alert('请填写完整的加分项信息！');
        return;
    }
    
    const pointsType = document.getElementById('pointsType').value;
    const pointsProject = document.getElementById('pointsProject').value;
    const pointsLevel = document.getElementById('pointsLevel').value;
    const pointsValue = parseFloat(document.getElementById('pointsValue').value);
    const pointsDescription = document.getElementById('pointsDescription').value;
    
    const newPoint = {
        id: Date.now(),
        type: pointsType,
        typeText: getPointsTypeText(pointsType),
        project: pointsProject,
        level: pointsLevel,
        points: pointsValue,
        description: pointsDescription,
        time: new Date().toLocaleDateString('zh-CN')
    };
    
    console.log('添加加分项:', newPoint);
    
    // 保存到localStorage
    let users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    users = users.map(user => {
        if (user.id == studentId) {
            const updatedPoints = [...user.points, newPoint];
            const totalPoints = updatedPoints.reduce((total, point) => total + point.points, 0);
            return {
                ...user,
                points: updatedPoints,
                totalPoints: totalPoints
            };
        }
        return user;
    });
    
    localStorage.setItem('adminUsers', JSON.stringify(users));
    
    // 模拟提交成功
    setTimeout(function() {
        if (modal) modal.style.display = 'none';
        
        // 刷新学生详情
        const currentStudent = users.find(user => user.id == studentId);
        if (currentStudent) {
            showStudentDetail(currentStudent);
        }
        
        // 刷新用户列表
        loadUsers();
        
        // 重置表单
        form.reset();
        
        // 显示成功消息
        showSuccessMessage('加分项添加成功！');
    }, 1000);
}

// 获取加分项类型文本
function getPointsTypeText(type) {
    const typeMap = {
        'competition': '竞赛获奖',
        'research': '科研项目',
        'paper': '论文发表',
        'patent': '专利成果',
        'volunteer': '志愿服务',
        'internship': '实习实践'
    };
    return typeMap[type] || '其他';
}

// 显示成功消息
function showSuccessMessage(message) {
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
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

// 删除学生
function deleteStudent(student) {
    if (confirm(`确定要删除学生"${student.name}"吗？此操作不可恢复。`)) {
        console.log('删除学生:', student);
        
        // 从localStorage中删除
        let users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
        users = users.filter(user => user.id !== student.id);
        localStorage.setItem('adminUsers', JSON.stringify(users));
        
        // 刷新列表
        loadUsers();
        showSuccessMessage('学生删除成功！');
    }
}

// 翻页功能
function goToPage(pageNum) {
    currentPage = pageNum;
    loadUsers();
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        loadUsers();
    }
}

function goToNextPage() {
    const users = JSON.parse(localStorage.getItem('adminUsers') || '[]');
    const totalPagesFiltered = Math.ceil(users.length / pageSize);
    
    if (currentPage < totalPagesFiltered) {
        currentPage++;
        loadUsers();
    }
}

console.log('用户管理页面脚本加载完成');