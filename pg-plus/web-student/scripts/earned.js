// 筛选功能实现
    document.addEventListener('DOMContentLoaded', function() {
        const searchInput = document.querySelector('.search-input');
        const levelFilter = document.getElementById('levelFilter');
        const yearFilter = document.getElementById('yearFilter');
        const itemsList = document.getElementById('itemsList');
        const itemCards = document.querySelectorAll('.item-card');
        const itemsCount = document.querySelector('.items-count');

        // 筛选函数
        function filterItems() {
            const searchTerm = searchInput.value.toLowerCase();
            const levelValue = levelFilter.value;
            const yearValue = yearFilter.value;

            let visibleCount = 0;

            itemCards.forEach(card => {
                const title = card.querySelector('.item-title').textContent.toLowerCase();
                const level = card.querySelector('.item-level').classList.contains('level-' + levelValue);
                const dateText = card.querySelector('.item-date').textContent;
                const yearMatch = yearValue === 'all' || dateText.includes(yearValue);

                const matchesSearch = title.includes(searchTerm);
                const matchesLevel = levelValue === 'all' || level;
                const matchesYear = yearMatch;

                if (matchesSearch && matchesLevel && matchesYear) {
                    card.style.display = 'flex';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            // 更新项目计数
            itemsCount.textContent = `共${visibleCount}个项目`;

            // 如果没有匹配的项目，显示空状态
            if (visibleCount === 0) {
                if (!document.querySelector('.empty-state')) {
                    const emptyState = document.createElement('div');
                    emptyState.className = 'empty-state';
                    emptyState.innerHTML = `
                        <div class="empty-icon">
                            <i class="far fa-folder-open"></i>
                        </div>
                        <div class="empty-text">没有找到匹配的加分项</div>
                        <div class="empty-subtext">尝试调整筛选条件或搜索关键词</div>
                    `;
                    itemsList.appendChild(emptyState);
                }
            } else {
                const emptyState = document.querySelector('.empty-state');
                if (emptyState) {
                    emptyState.remove();
                }
            }
        }

        // 添加事件监听器
        searchInput.addEventListener('input', filterItems);
        levelFilter.addEventListener('change', filterItems);
        yearFilter.addEventListener('change', filterItems);

        // 添加项目卡片悬停效果
        itemCards.forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateX(5px)';
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateX(0)';
            });
        });
    });
