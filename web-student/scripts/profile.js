document.addEventListener('DOMContentLoaded', function() {
        // 从localStorage获取用户数据
        const userData = JSON.parse(localStorage.getItem('userData') || '{}');
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

        // 如果未登录，跳转到登录页面
        if (!isLoggedIn) {
            alert('请先登录！');
            window.location.href = 'login.html';
            return;
        }

        // 设置用户数据
        document.getElementById('userName').textContent = userData.nickname || userData.username || '张三';
        document.getElementById('userAvatar').textContent = (userData.nickname || userData.username || '张三').charAt(0);
        document.getElementById('userEmail').textContent = userData.username || 'zhangsan@example.com';

        // 模拟其他用户数据
        const mockUserData = {
            gender: '男',
            studentId: '20210005',
            college: '信息科学与技术学院',
            major: '计算机科学与技术',
            gpa: '3.78',
            points: '+6分',
            rank: '第5名',
            phone: '138****5678'
        };

        // 设置模拟数据
        document.getElementById('userGender').textContent = mockUserData.gender;
        document.getElementById('userStudentId').textContent = mockUserData.studentId;
        document.getElementById('userCollege').textContent = mockUserData.college;
        document.getElementById('userMajor').textContent = mockUserData.major;
        document.getElementById('userGPA').textContent = mockUserData.gpa;
        document.getElementById('userPoints').textContent = mockUserData.points;
        document.getElementById('userRank').textContent = mockUserData.rank;
        document.getElementById('userPhone').textContent = mockUserData.phone;

        // 更换头像按钮点击事件
        document.querySelector('.change-avatar-btn').addEventListener('click', function() {
            alert('头像更换功能开发中...');
        });

        // 编辑信息按钮点击事件
        document.querySelectorAll('.action-btn')[0].addEventListener('click', function() {
            alert('信息编辑功能开发中...');
        });

        // 修改密码按钮点击事件
        document.querySelectorAll('.action-btn')[1].addEventListener('click', function() {
            alert('密码修改功能开发中...');
        });

        // 导出个人信息按钮点击事件
        document.querySelectorAll('.action-btn')[2].addEventListener('click', function() {
            alert('个人信息导出功能开发中...');
        });
    });
