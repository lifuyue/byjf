// 系统设置页面功能
document.addEventListener('DOMContentLoaded', function() {
    console.log('系部保研政策设置页面开始加载');
    
    // 初始化页面
    initSettingsPage();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 加载设置数据
    loadSettings();
});

// 初始化设置页面
function initSettingsPage() {
    console.log('初始化系部保研政策设置页面');
}

// 设置事件监听器
function setupEventListeners() {
    // 操作按钮
    const saveBtn = document.getElementById('saveSettings');
    const resetBtn = document.getElementById('resetSettings');
    
    if (saveBtn) saveBtn.addEventListener('click', saveSettings);
    if (resetBtn) resetBtn.addEventListener('click', resetSettings);
    
    // 模态框控制
    setupModalControls();
}

// 设置模态框控制
function setupModalControls() {
    const editPolicyModal = document.getElementById('editPolicyModal');
    const successModal = document.getElementById('successModal');
    
    const closePolicyModal = document.getElementById('closePolicyModal');
    const cancelPolicyBtn = document.getElementById('cancelPolicyBtn');
    const savePolicyBtn = document.getElementById('savePolicyBtn');
    const confirmSuccess = document.getElementById('confirmSuccess');
    
    // 关闭编辑政策模态框
    if (closePolicyModal) {
        closePolicyModal.addEventListener('click', function() {
            if (editPolicyModal) editPolicyModal.style.display = 'none';
        });
    }
    
    if (cancelPolicyBtn) {
        cancelPolicyBtn.addEventListener('click', function() {
            if (editPolicyModal) editPolicyModal.style.display = 'none';
        });
    }
    
    // 保存政策
    if (savePolicyBtn) {
        savePolicyBtn.addEventListener('click', function() {
            savePolicy();
        });
    }
    
    // 关闭成功提示
    if (confirmSuccess) {
        confirmSuccess.addEventListener('click', function() {
            if (successModal) successModal.style.display = 'none';
        });
    }
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === editPolicyModal) {
            editPolicyModal.style.display = 'none';
        }
        if (e.target === successModal) {
            successModal.style.display = 'none';
        }
    });
}

// 加载设置数据
function loadSettings() {
    // 加载系部政策
    loadCollegePolicies();
}

// 加载系部政策
function loadCollegePolicies() {
    const policiesList = document.getElementById('policiesList');
    if (!policiesList) return;
    
    // 从localStorage加载政策数据
    let policies = JSON.parse(localStorage.getItem('collegePolicies') || '[]');
    
    // 如果没有数据，初始化四个系的数据
    if (policies.length === 0) {
        policies = getMockPolicies();
        localStorage.setItem('collegePolicies', JSON.stringify(policies));
    }
    
    // 清空现有列表
    policiesList.innerHTML = '';
    
    if (policies.length === 0) {
        policiesList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-university"></i>
                <p>暂无系部政策数据</p>
            </div>
        `;
    } else {
        // 生成政策项
        policies.forEach(policy => {
            const policyItem = createPolicyItem(policy);
            policiesList.appendChild(policyItem);
        });
    }
}

// 获取模拟政策数据 - 四个系
function getMockPolicies() {
    return [
        {
            id: 1,
            college: '计算机科学与技术系',
            content: '计算机科学与技术系保研政策要求学生在专业排名前30%，获得至少2.0分的竞赛加分。优先考虑在ACM程序设计大赛、数学建模竞赛等高水平竞赛中获奖的学生。',
            minGPA: 3.2,
            minPoints: 2.0
        },
        {
            id: 2,
            college: '软件工程系',
            content: '软件工程系保研政策注重学生的实践能力和项目经验。要求GPA不低于3.0，获得至少1.5分的竞赛加分，并提交个人作品集进行评审。',
            minGPA: 3.0,
            minPoints: 1.5
        },
        {
            id: 3,
            college: '人工智能系',
            content: '人工智能系保研政策要求学生专业排名前25%，获得至少2.5分的竞赛或科研加分。特别重视学生在机器学习、深度学习等领域的项目经验。',
            minGPA: 3.3,
            minPoints: 2.5
        },
        {
            id: 4,
            college: '网络安全系',
            content: '网络安全系保研政策要求学生在专业排名前35%，获得至少2.0分的竞赛加分。重点考察学生在CTF竞赛、安全攻防等专业竞赛中的表现。',
            minGPA: 3.1,
            minPoints: 2.0
        }
    ];
}

// 创建政策项
function createPolicyItem(policy) {
    const item = document.createElement('div');
    item.className = 'policy-item';
    item.dataset.id = policy.id;
    
    item.innerHTML = `
        <div class="policy-header">
            <div class="policy-college">${policy.college}</div>
            <div class="policy-actions">
                <button class="action-btn edit-btn" title="编辑政策">
                    <i class="fas fa-edit"></i>
                    编辑政策
                </button>
            </div>
        </div>
        <div class="policy-requirements">
            <div class="requirement">
                <i class="fas fa-chart-line"></i>
                最低GPA: ${policy.minGPA}
            </div>
            <div class="requirement">
                <i class="fas fa-star"></i>
                最低加分: ${policy.minPoints}分
            </div>
        </div>
        <div class="policy-content">${policy.content}</div>
    `;
    
    // 编辑按钮点击事件
    const editBtn = item.querySelector('.edit-btn');
    if (editBtn) {
        editBtn.addEventListener('click', function() {
            editPolicy(policy);
        });
    }
    
    return item;
}

// 编辑政策
function editPolicy(policy) {
    const modal = document.getElementById('editPolicyModal');
    if (!modal) return;
    
    // 设置模态框标题
    document.getElementById('modalTitle').textContent = `编辑${policy.college}保研政策`;
    
    // 填充政策数据
    document.getElementById('policyCollege').value = policy.college;
    document.getElementById('policyContent').value = policy.content;
    document.getElementById('policyGPA').value = policy.minGPA;
    document.getElementById('policyPoints').value = policy.minPoints;
    
    modal.style.display = 'flex';
    modal.dataset.currentPolicyId = policy.id;
}

// 保存政策
function savePolicy() {
    const modal = document.getElementById('editPolicyModal');
    const policyId = modal.dataset.currentPolicyId;
    const content = document.getElementById('policyContent').value.trim();
    const gpa = parseFloat(document.getElementById('policyGPA').value);
    const points = parseFloat(document.getElementById('policyPoints').value);
    
    if (!content) {
        alert('请填写政策内容！');
        return;
    }
    
    if (isNaN(gpa) || gpa < 0 || gpa > 4) {
        alert('请输入有效的GPA（0-4之间）！');
        return;
    }
    
    if (isNaN(points) || points < 0) {
        alert('请输入有效的加分要求！');
        return;
    }
    
    // 更新localStorage中的政策数据
    let policies = JSON.parse(localStorage.getItem('collegePolicies') || '[]');
    policies = policies.map(policy => {
        if (policy.id == policyId) {
            return {
                ...policy,
                content: content,
                minGPA: gpa,
                minPoints: points
            };
        }
        return policy;
    });
    
    localStorage.setItem('collegePolicies', JSON.stringify(policies));
    
    // 关闭模态框
    modal.style.display = 'none';
    
    // 刷新政策列表
    loadCollegePolicies();
    
    // 显示成功消息
    showSuccessMessage(`${document.getElementById('policyCollege').value}保研政策更新成功！`);
}

// 保存设置
function saveSettings() {
    // 显示成功消息
    showSuccessMessage('所有系部政策设置保存成功！');
}

// 恢复默认设置
function resetSettings() {
    if (confirm('确定要恢复默认设置吗？这将重置所有系的保研政策为默认值。')) {
        // 清除设置
        localStorage.removeItem('collegePolicies');
        
        // 重新加载设置
        loadSettings();
        
        // 显示成功消息
        showSuccessMessage('所有系部政策已恢复默认值！');
    }
}

// 显示成功消息
function showSuccessMessage(message) {
    const modal = document.getElementById('successModal');
    const successText = document.getElementById('successText');
    
    if (!modal || !successText) return;
    
    successText.textContent = message;
    modal.style.display = 'flex';
}

console.log('系部保研政策设置页面脚本加载完成');