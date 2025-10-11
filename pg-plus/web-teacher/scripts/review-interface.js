tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: '#165DFF',
        secondary: '#36CFC9',
        success: '#52C41A',
        warning: '#FAAD14',
        danger: '#FF4D4F',
        neutral: {
          100: '#F5F7FA',
          200: '#E4E6EB',
          300: '#C9CDD4',
          400: '#86909C',
          500: '#4E5969',
          600: '#272E3B',
          700: '#1D2129',
        }
      },
      fontFamily: {
        inter: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.12)',
      }
    },
  }
}

// 初始化成绩图表
document.addEventListener('DOMContentLoaded', function() {
  const ctx = document.getElementById('gradeChart').getContext('2d');

  const gradeChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['大一上', '大一下', '大二上', '大二下', '大三上', '大三下'],
      datasets: [{
        label: '学期GPA',
        data: [3.6, 3.75, 3.82, 3.9, 3.85, 3.92],
        borderColor: '#165DFF',
        backgroundColor: 'rgba(22, 93, 255, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          min: 3.0,
          max: 4.0,
          ticks: {
            stepSize: 0.2
          }
        }
      }
    }
  });
});

// 模拟材料预览功能
document.querySelectorAll('.fa-eye').forEach(icon => {
  icon.parentElement.addEventListener('click', function() {
    alert('此处将打开材料预览窗口');
  });
});

// 模拟材料下载功能
document.querySelectorAll('.fa-download').forEach(icon => {
  icon.parentElement.addEventListener('click', function() {
    alert('开始下载材料...');
  });
});

// 退出登录跳转
document.querySelectorAll('.text-danger').forEach(item => {
  item.addEventListener('click', function(e) {
    e.preventDefault();
    window.location.href = 'login教师端.html';
  });
});
