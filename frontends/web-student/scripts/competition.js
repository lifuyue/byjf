document.addEventListener('DOMContentLoaded', function() {
        const form = document.getElementById('competitionForm');
        const fileInput = document.getElementById('proofFile');
        const fileName = document.getElementById('fileName');
        const pendingRecords = document.getElementById('pendingRecords');

        // 模拟已有的审核中记录
        const initialRecords = [
            { id: 1, name: "全国大学生程序设计大赛", points: "5分", date: "2024-03-15", status: "pending" },
            { id: 2, name: "数学建模竞赛", points: "3分", date: "2024-03-10", status: "pending" }
        ];

        // 初始化显示已有的审核中记录
        renderPendingRecords();

        // 文件上传显示文件名
        fileInput.addEventListener('change', function() {
            if (this.files.length > 0) {
                fileName.textContent = `已选择文件: ${this.files[0].name}`;
            } else {
                fileName.textContent = '';
            }
        });

        // 表单提交处理
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const competitionName = document.getElementById('competitionName').value;
            const expectedPoints = document.getElementById('expectedPoints').value;
            const proofFile = fileInput.files[0];

            // 简单验证
            if (!competitionName || !expectedPoints || !proofFile) {
                alert('请填写所有必填字段并上传证明文件');
                return;
            }

            // 在实际应用中，这里应该发送数据到服务器
            // 这里模拟提交成功
            const newRecord = {
                id: Date.now(), // 使用时间戳作为ID
                name: competitionName,
                points: expectedPoints + '分',
                date: new Date().toISOString().split('T')[0],
                status: 'pending'
            };

            // 添加到审核中记录列表
            initialRecords.unshift(newRecord);
            renderPendingRecords();

            // 显示成功消息
            alert('竞赛成绩提交成功！已进入审核流程。');

            // 重置表单
            form.reset();
            fileName.textContent = '';
        });

        // 渲染审核中的记录
        function renderPendingRecords() {
            if (initialRecords.length === 0) {
                pendingRecords.innerHTML = '<div class="empty-records">暂无审核中的竞赛成绩</div>';
                return;
            }

            pendingRecords.innerHTML = '';
            initialRecords.forEach(record => {
                const recordElement = document.createElement('div');
                recordElement.className = 'record-item';
                recordElement.innerHTML = `
                    <div class="record-info">
                        <div class="record-name">${record.name}</div>
                        <div class="record-details">
                            <span>预期加分: ${record.points}</span>
                            <span>提交日期: ${record.date}</span>
                        </div>
                    </div>
                    <div class="record-status status-pending">审核中</div>
                `;
                pendingRecords.appendChild(recordElement);
            });
        }
    });
