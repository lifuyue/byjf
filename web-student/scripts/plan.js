document.addEventListener('DOMContentLoaded', function() {
        const planTableBody = document.getElementById('planTableBody');
        const addPlanBtn = document.getElementById('addPlanBtn');

        // 初始示例数据
        let plans = [
            { id: 1, goal: "完成GPA提升至3.8", date: "2024-06-30", status: "in-progress" },
            { id: 2, goal: "参加全国大学生数学建模竞赛", date: "2024-05-15", status: "completed" },
            { id: 3, goal: "准备英语六级考试", date: "2024-09-01", status: "not-started" },
            { id: 4, goal: "完成科研项目论文", date: "2024-07-31", status: "in-progress" }
        ];

        // 渲染计划表格
        function renderPlans() {
            planTableBody.innerHTML = '';

            if (plans.length === 0) {
                planTableBody.innerHTML = `
                    <tr>
                        <td colspan="4" style="text-align: center; padding: 30px; color: #666;">
                            <i class="fas fa-clipboard-list" style="font-size: 48px; margin-bottom: 15px; display: block; opacity: 0.5;"></i>
                            暂无计划，点击"添加新计划"开始制定您的保研计划
                        </td>
                    </tr>
                `;
                return;
            }

            plans.forEach(plan => {
                const statusText = getStatusText(plan.status);
                const statusClass = getStatusClass(plan.status);

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>
                        <input type="text" class="goal-input" value="${plan.goal}" data-id="${plan.id}">
                    </td>
                    <td>
                        <input type="date" class="date-input" value="${plan.date}" data-id="${plan.id}">
                    </td>
                    <td>
                        <select class="status-select" data-id="${plan.id}">
                            <option value="not-started" ${plan.status === 'not-started' ? 'selected' : ''}>未开始</option>
                            <option value="in-progress" ${plan.status === 'in-progress' ? 'selected' : ''}>进行中</option>
                            <option value="completed" ${plan.status === 'completed' ? 'selected' : ''}>已完成</option>
                        </select>
                        <span class="${statusClass}" style="margin-left: 8px;">${statusText}</span>
                    </td>
                    <td>
                        <div class="actions">
                            <button class="action-btn save-btn" data-id="${plan.id}">
                                <i class="fas fa-save"></i> 保存
                            </button>
                            <button class="action-btn delete-btn" data-id="${plan.id}">
                                <i class="fas fa-trash"></i> 删除
                            </button>
                        </div>
                    </td>
                `;
                planTableBody.appendChild(row);
            });

            // 添加事件监听
            addEventListeners();
        }

        // 获取状态文本
        function getStatusText(status) {
            switch(status) {
                case 'completed': return '已完成';
                case 'in-progress': return '进行中';
                case 'not-started': return '未开始';
                default: return '未开始';
            }
        }

        // 获取状态类名
        function getStatusClass(status) {
            switch(status) {
                case 'completed': return 'status-completed';
                case 'in-progress': return 'status-in-progress';
                case 'not-started': return 'status-not-started';
                default: return 'status-not-started';
            }
        }

        // 添加事件监听
        function addEventListeners() {
            // 保存按钮点击事件
            document.querySelectorAll('.save-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    savePlan(id);
                });
            });

            // 删除按钮点击事件
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    deletePlan(id);
                });
            });

            // 状态选择变化事件
            document.querySelectorAll('.status-select').forEach(select => {
                select.addEventListener('change', function() {
                    const id = parseInt(this.getAttribute('data-id'));
                    const row = this.closest('tr');
                    const statusSpan = row.querySelector('span');
                    const statusClass = getStatusClass(this.value);
                    const statusText = getStatusText(this.value);

                    statusSpan.className = statusClass;
                    statusSpan.textContent = statusText;
                });
            });
        }

        // 保存计划
        function savePlan(id) {
            const goalInput = document.querySelector(`.goal-input[data-id="${id}"]`);
            const dateInput = document.querySelector(`.date-input[data-id="${id}"]`);
            const statusSelect = document.querySelector(`.status-select[data-id="${id}"]`);

            const goal = goalInput.value.trim();
            const date = dateInput.value;
            const status = statusSelect.value;

            if (!goal) {
                alert('请输入计划目标');
                goalInput.focus();
                return;
            }

            if (!date) {
                alert('请选择预计完成时间');
                dateInput.focus();
                return;
            }

            // 更新计划数据
            const planIndex = plans.findIndex(p => p.id === id);
            if (planIndex !== -1) {
                plans[planIndex] = {
                    ...plans[planIndex],
                    goal,
                    date,
                    status
                };
            }

            alert('计划保存成功！');
        }

        // 删除计划
        function deletePlan(id) {
            if (confirm('确定要删除这个计划吗？')) {
                plans = plans.filter(p => p.id !== id);
                renderPlans();
                alert('计划删除成功！');
            }
        }

        // 添加新计划
        addPlanBtn.addEventListener('click', function() {
            const newId = plans.length > 0 ? Math.max(...plans.map(p => p.id)) + 1 : 1;

            plans.unshift({
                id: newId,
                goal: '',
                date: '',
                status: 'not-started'
            });

            renderPlans();

            // 聚焦到新添加的输入框
            setTimeout(() => {
                const newGoalInput = document.querySelector(`.goal-input[data-id="${newId}"]`);
                if (newGoalInput) {
                    newGoalInput.focus();
                }
            }, 100);
        });

        // 初始渲染
        renderPlans();
    });
