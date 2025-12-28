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

const apiMeta = document.querySelector('meta[name="pg-plus-api-base"]');
const API_BASE = (apiMeta?.getAttribute('content') || 'http://localhost:8000/api/v1').replace(/\/$/, '');
const SCORE_RULES_ENDPOINT = `${API_BASE}/rules/score-category-rules/`;

const rulesBody = document.getElementById('rulesBody');
const addRuleBtn = document.getElementById('addRuleBtn');
const rulesHint = document.getElementById('rulesHint');
const rulesRatioTotal = document.getElementById('rulesRatioTotal');
const rulesRatioStatus = document.getElementById('rulesRatioStatus');

const DEFAULT_SCORE_RULES = [
    { name: '竞赛', cap: 20, ratio: 40 },
    { name: '证书', cap: 10, ratio: 20 },
    { name: '科研', cap: 20, ratio: 25 },
    { name: '志愿', cap: 10, ratio: 15 }
];

let scoreRules = [];

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

    if (addRuleBtn) {
        addRuleBtn.addEventListener('click', addScoreRuleRow);
    }

    if (rulesBody) {
        rulesBody.addEventListener('input', handleRuleInputChange);
        rulesBody.addEventListener('click', handleRuleActionClick);
    }
    
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
    loadScoreRules();
}

function getAdminToken() {
    if (typeof getAccessTokenFromStorage === 'function') {
        return getAccessTokenFromStorage();
    }
    return localStorage.getItem('pg_plus_access_token') || '';
}

async function adminRequest(url, options = {}) {
    const token = getAdminToken();
    if (!token) {
        alert('未检测到管理员登录状态，请重新登录。');
        throw new Error('未登录');
    }
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        }
    });
    if (response.status === 401) {
        alert('登录已过期，请重新登录。');
        throw new Error('登录过期');
    }
    if (!response.ok) {
        const detail = await response.json().catch(() => ({}));
        const message = detail.detail || detail.message || `请求失败（${response.status}）`;
        throw new Error(message);
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

async function loadScoreRules() {
    if (!rulesBody) {
        return;
    }
    try {
        const data = await adminRequest(SCORE_RULES_ENDPOINT);
        scoreRules = Array.isArray(data) && data.length ? data.map(normalizeRule) : [...DEFAULT_SCORE_RULES];
        renderScoreRules();
        if (!data || !data.length) {
            showRulesHint('当前暂无规则，请补全后点击“保存所有设置”生效。', 'error');
        } else {
            showRulesHint('');
        }
    } catch (error) {
        console.error('加载加分规则失败', error);
        scoreRules = [...DEFAULT_SCORE_RULES];
        renderScoreRules();
        showRulesHint(error.message || '加载失败，请稍后重试', 'error');
    }
}

function normalizeRule(rule = {}) {
    return {
        name: String(rule.name || '').trim(),
        cap: Number.isFinite(Number(rule.cap)) ? Number(rule.cap) : 0,
        ratio: Number.isFinite(Number(rule.ratio)) ? Number(rule.ratio) : 0
    };
}

function renderScoreRules() {
    if (!rulesBody) {
        return;
    }
    if (!scoreRules.length) {
        rulesBody.innerHTML = `
            <div class="rules-row">
                <div>暂无规则，请新增分类</div>
                <div>--</div>
                <div>--</div>
                <div>--</div>
            </div>
        `;
        updateRatioSummary(0);
        return;
    }

    rulesBody.innerHTML = scoreRules.map((rule, index) => `
        <div class="rules-row" data-index="${index}">
            <input type="text" data-field="name" value="${rule.name}" placeholder="例如：竞赛">
            <input type="number" data-field="cap" value="${rule.cap}" min="0" step="0.1">
            <input type="number" data-field="ratio" value="${rule.ratio}" min="0" max="100" step="1">
            <button class="rule-delete-btn" data-action="delete-rule">删除</button>
        </div>
    `).join('');

    updateRatioSummary(getRatioTotal());
}

function updateRatioSummary(total) {
    if (rulesRatioTotal) {
        rulesRatioTotal.textContent = `${total}%`;
    }
    if (rulesRatioStatus) {
        const isOk = total === 100;
        rulesRatioStatus.textContent = isOk ? '已达标' : '未达标';
        rulesRatioStatus.classList.toggle('ok', isOk);
    }
}

function getRatioTotal() {
    return scoreRules.reduce((sum, rule) => sum + Number(rule.ratio || 0), 0);
}

function handleRuleInputChange(event) {
    const row = event.target.closest('.rules-row[data-index]');
    if (!row) {
        return;
    }
    const index = Number(row.dataset.index);
    const field = event.target.dataset.field;
    if (!Number.isInteger(index) || !field) {
        return;
    }
    if (field === 'name') {
        scoreRules[index].name = event.target.value.trim();
    } else if (field === 'cap') {
        scoreRules[index].cap = Number(event.target.value || 0);
    } else if (field === 'ratio') {
        scoreRules[index].ratio = Number(event.target.value || 0);
    }
    updateRatioSummary(getRatioTotal());
}

function handleRuleActionClick(event) {
    const actionBtn = event.target.closest('[data-action]');
    if (!actionBtn) {
        return;
    }
    const row = actionBtn.closest('.rules-row[data-index]');
    if (!row) {
        return;
    }
    const index = Number(row.dataset.index);
    if (!Number.isInteger(index)) {
        return;
    }
    scoreRules.splice(index, 1);
    renderScoreRules();
}

function addScoreRuleRow() {
    scoreRules.push({ name: '', cap: 0, ratio: 0 });
    renderScoreRules();
}

function validateScoreRules() {
    if (!scoreRules.length) {
        return { ok: false, message: '请至少配置一个加分分类。' };
    }
    const nameSet = new Set();
    for (const rule of scoreRules) {
        if (!rule.name) {
            return { ok: false, message: '分类名称不能为空。' };
        }
        if (nameSet.has(rule.name)) {
            return { ok: false, message: `分类名称重复：${rule.name}` };
        }
        nameSet.add(rule.name);
        if (!Number.isFinite(rule.cap) || rule.cap < 0) {
            return { ok: false, message: `${rule.name} 的上限需为非负数。` };
        }
        if (!Number.isInteger(rule.ratio) || rule.ratio < 0 || rule.ratio > 100) {
            return { ok: false, message: `${rule.name} 的比例需为 0-100 的整数。` };
        }
    }
    const total = getRatioTotal();
    if (total !== 100) {
        return { ok: false, message: '所有加分比例之和必须为 100%。' };
    }
    return { ok: true };
}

async function saveScoreRules() {
    const validation = validateScoreRules();
    if (!validation.ok) {
        showRulesHint(validation.message, 'error');
        return false;
    }
    try {
        const payload = scoreRules.map(rule => ({
            name: rule.name,
            cap: rule.cap,
            ratio: rule.ratio
        }));
        const data = await adminRequest(SCORE_RULES_ENDPOINT, {
            method: 'PUT',
            body: JSON.stringify(payload)
        });
        scoreRules = Array.isArray(data) ? data.map(normalizeRule) : scoreRules;
        renderScoreRules();
        showRulesHint('加分规则已保存', 'success');
        return true;
    } catch (error) {
        showRulesHint(error.message || '保存失败，请稍后重试', 'error');
        return false;
    }
}

function showRulesHint(message = '', type = '') {
    if (!rulesHint) {
        return;
    }
    rulesHint.textContent = message;
    rulesHint.classList.remove('success');
    if (type === 'success') {
        rulesHint.classList.add('success');
    }
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
    saveScoreRules().then(saved => {
        if (saved) {
            showSuccessMessage('所有设置保存成功！');
        }
    });
}

// 恢复默认设置
function resetSettings() {
    if (confirm('确定要恢复默认设置吗？这将重置所有系的保研政策与加分规则为默认值。')) {
        // 清除设置
        localStorage.removeItem('collegePolicies');
        scoreRules = [...DEFAULT_SCORE_RULES];
        renderScoreRules();
        saveScoreRules();
        
        // 重新加载设置
        loadSettings();
        
        // 显示成功消息
        showSuccessMessage('所有设置已恢复默认值！');
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
