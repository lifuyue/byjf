<template>
  <section class="page">
    <header class="page__hero">
      <div>
        <p class="eyebrow">PG-Plus Admin Console</p>
        <h1>保研管理后台</h1>
        <p class="subtitle">掌握全局进度，统筹学生与教师端数据。</p>
      </div>
      <div class="hero__actions">
        <button type="button">发布公告</button>
        <button type="button" class="ghost">导出报表</button>
      </div>
    </header>

    <div class="grid grid--stats">
      <article class="stat">
        <p>待审核学生</p>
        <strong>128</strong>
        <span>较昨日 +6 名</span>
      </article>
      <article class="stat">
        <p>新提交材料</p>
        <strong>56</strong>
        <span>今日 09:30 最后一次提交</span>
      </article>
      <article class="stat">
        <p>平均处理耗时</p>
        <strong>4.7 小时</strong>
        <span>目标 3 小时</span>
      </article>
    </div>

    <div class="grid grid--cards">
      <article class="card highlight">
        <h3>审核任务</h3>
        <p>分配审核人、批量处理待办。</p>
        <button type="button">进入教师端</button>
      </article>
      <article class="card">
        <h3>学生端概况</h3>
        <p>跟踪提交趋势，快速定位异常。</p>
        <button type="button" class="ghost">打开学生端</button>
      </article>
      <article class="card">
        <h3>政策 & 权限</h3>
        <p>维护保研政策与管理员权限。</p>
        <button type="button" class="ghost">管理配置</button>
      </article>
    </div>
  </section>
</template>

<script setup lang="ts">
// Room for future admin logic.
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.page__hero h1 {
  margin: 0.25rem 0;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 0.85rem;
  color: #2563eb;
  margin: 0;
}

.subtitle {
  color: #4b5563;
  margin: 0;
}

.hero__actions {
  display: flex;
  gap: 0.75rem;
}

button {
  border: none;
  background: #2563eb;
  color: #fff;
  border-radius: 999px;
  padding: 0.6rem 1.4rem;
  cursor: pointer;
  font-weight: 600;
}

button.ghost {
  background: transparent;
  border: 1px solid #cbd5f5;
  color: #1f2937;
}

.grid {
  display: grid;
  gap: 1rem;
}

.grid--stats {
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

.grid--cards {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.stat,
.card {
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(15, 23, 42, 0.08);
  background: #fff;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.06);
}

.stat strong {
  font-size: 2rem;
  display: block;
  margin: 0.4rem 0;
}

.stat span {
  color: #6b7280;
}

.card h3 {
  margin: 0 0 0.4rem;
}

.card p {
  color: #4b5563;
  min-height: 2.5rem;
}

.card button {
  margin-top: 0.75rem;
}

.card.highlight {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  color: #f8fafc;
}

.card.highlight button {
  background: rgba(255, 255, 255, 0.2);
}
</style>
