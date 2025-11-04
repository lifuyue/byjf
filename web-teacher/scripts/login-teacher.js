// 获取DOM元素
const loginContainer = document.getElementById('loginContainer');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

// 切换登录/注册表单
showRegister.addEventListener('click', function() {
    loginContainer.classList.add('active');
});

showLogin.addEventListener('click', function() {
    loginContainer.classList.remove('active');
});

// 登录表单验证
loginForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username) {
        alert('请输入用户名或邮箱');
        return;
    }

    if (!password) {
        alert('请输入密码');
        return;
    }

    // 模拟登录成功
    const userData = {
        username: username,
        nickname: username,
        loginTime: new Date().toISOString()
    };

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userData', JSON.stringify(userData));

    alert('登录成功！');

    // 跳转回主页面
   window.location.href = 'Untitled-1.html';
});

// 注册表单验证
registerForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const username = document.getElementById('regUsername').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // 验证用户名
    if (!username) {
        alert('请输入用户名');
        return;
    }

    if (username.length < 3) {
        alert('用户名长度至少3位');
        return;
    }

    // 验证密码
    if (!password) {
        alert('请输入密码');
        return;
    }

    if (password.length < 8) {
        alert('密码长度至少8位');
        return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
        alert('密码必须包含字母和数字');
        return;
    }

    // 验证确认密码
    if (password !== confirmPassword) {
        alert('两次输入的密码不一致');
        return;
    }

    // 模拟注册成功
    const userData = {
        username: username,
        nickname: username,
        registerTime: new Date().toISOString()
    };

    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userData', JSON.stringify(userData));

    alert('注册成功！已自动登录。');

    // 跳转回主页面
   window.location.href = 'Untitled-1.html';
});

// 密码强度实时验证
const regPassword = document.getElementById('regPassword');
const confirmPassword = document.getElementById('confirmPassword');

regPassword.addEventListener('input', function() {
    const password = this.value;
    const requirements = document.querySelector('.password-requirements');

    if (password.length >= 8 && /^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
        requirements.style.color = '#4CAF50';
    } else {
        requirements.style.color = '#666';
    }
});

confirmPassword.addEventListener('input', function() {
    const password = regPassword.value;
    const confirm = this.value;

    if (confirm && password !== confirm) {
        this.style.borderColor = '#f44336';
    } else {
        this.style.borderColor = '#ddd';
    }
});

// 假设教师账号为 teacher 密码为 123456
const TEACHER_USERNAME = "teacher";
const TEACHER_PASSWORD = "123456";

document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (username === TEACHER_USERNAME && password === TEACHER_PASSWORD) {
        // 登录成功，保存状态到 localStorage
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userData', JSON.stringify({
            username: username,
            nickname: "张三" // 可自定义
        }));
        // 跳转到主页面
        window.location.href = "Untitled-1.html";
    } else {
        // 登录失败
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('loginError').innerText = '用户名或密码错误';
    }
});

// 隐藏右侧内容，显示登录提示
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
