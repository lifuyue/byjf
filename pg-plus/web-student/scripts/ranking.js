document.addEventListener('DOMContentLoaded', function() {
        const rankingTableBody = document.getElementById('rankingTableBody');
        const exportExcelBtn = document.getElementById('exportExcel');
        const exportWordBtn = document.getElementById('exportWord');

        // 虚拟学生数据
        const students = [
            { id: 1, name: "张三", studentId: "20210001", gpa: 3.92, points: 15, isCurrentUser: false },
            { id: 2, name: "李四", studentId: "20210002", gpa: 3.88, points: 12, isCurrentUser: false },
            { id: 3, name: "王五", studentId: "20210003", gpa: 3.85, points: 10, isCurrentUser: false },
            { id: 4, name: "赵六", studentId: "20210004", gpa: 3.82, points: 8, isCurrentUser: false },
            { id: 5, name: "钱七", studentId: "20210005", gpa: 3.78, points: 6, isCurrentUser: true },
            { id: 6, name: "孙八", studentId: "20210006", gpa: 3.75, points: 5, isCurrentUser: false },
            { id: 7, name: "周九", studentId: "20210007", gpa: 3.72, points: 4, isCurrentUser: false },
            { id: 8, name: "吴十", studentId: "20210008", gpa: 3.68, points: 3, isCurrentUser: false },
            { id: 9, name: "郑十一", studentId: "20210009", gpa: 3.65, points: 2, isCurrentUser: false },
            { id: 10, name: "王十二", studentId: "20210010", gpa: 3.62, points: 1, isCurrentUser: false },
            { id: 11, name: "李十三", studentId: "20210011", gpa: 3.58, points: 0, isCurrentUser: false },
            { id: 12, name: "张十四", studentId: "20210012", gpa: 3.55, points: 0, isCurrentUser: false },
            { id: 13, name: "刘十五", studentId: "20210013", gpa: 3.52, points: 0, isCurrentUser: false },
            { id: 14, name: "陈十六", studentId: "20210014", gpa: 3.48, points: 0, isCurrentUser: false },
            { id: 15, name: "杨十七", studentId: "20210015", gpa: 3.45, points: 0, isCurrentUser: false }
        ];

        // 计算总分并排序
        students.forEach(student => {
            student.totalScore = student.gpa * 25 + student.points; // GPA换算为百分制
        });

        students.sort((a, b) => b.totalScore - a.totalScore);

        // 渲染排名表格
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

            // 更新统计数据
            updateStatistics();
        }

        // 更新统计数据
        function updateStatistics() {
            document.getElementById('totalStudents').textContent = students.length;

            const avgGPA = students.reduce((sum, student) => sum + student.gpa, 0) / students.length;
            document.getElementById('avgGPA').textContent = avgGPA.toFixed(2);

            const avgPoints = students.reduce((sum, student) => sum + student.points, 0) / students.length;
            document.getElementById('avgPoints').textContent = avgPoints.toFixed(1);

            const currentUser = students.find(student => student.isCurrentUser);
            const currentUserRank = students.findIndex(student => student.isCurrentUser) + 1;
            document.getElementById('currentUserRank').textContent = currentUserRank;
        }

        // 导出为Excel
        exportExcelBtn.addEventListener('click', function() {
            // 准备数据
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

            // 创建工作簿
            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "专业排名");

            // 导出文件
            XLSX.writeFile(wb, "信息科学与技术专业排名.xlsx");

            alert('Excel文件导出成功！');
        });

        // 导出为Word
        exportWordBtn.addEventListener('click', function() {
            // 创建Word文档内容
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

            students.forEach((student, index) => {
                content += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${student.name}</td>
                        <td>${student.studentId}</td>
                        <td>${student.gpa.toFixed(2)}</td>
                        <td>${student.points}</td>
                        <td>${student.totalScore.toFixed(1)}</td>
                    </tr>
                `;
            });

            content += `
                    </table>
                    <p>导出时间: ${new Date().toLocaleString()}</p>
                </body>
                </html>
            `;

            // 创建Blob并下载
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

        // 初始渲染
        renderRankingTable();
    });
