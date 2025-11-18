// 添加简单的交互效果
document.addEventListener('DOMContentLoaded', function() {
    const policyContent = document.querySelector('.policy-content');

    policyContent.addEventListener('click', function() {
        this.style.backgroundColor = '#f0f2f5';
        this.style.transition = 'background-color 0.3s ease';

        setTimeout(() => {
            this.style.backgroundColor = '#f8f9fa';
        }, 500);
    });
});
