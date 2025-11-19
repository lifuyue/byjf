import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';

import sirv from 'sirv';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

const pages = {
  main: resolve(__dirname, 'index.html'),
  login: resolve(__dirname, 'login.html'),
  profile: resolve(__dirname, '个人主页.html'),
  policy: resolve(__dirname, '学校保研政策.html'),
  ranking: resolve(__dirname, '专业排名.html'),
  earned: resolve(__dirname, '已经获得的加分项.html'),
  plan: resolve(__dirname, '我的保研计划.html'),
  competition: resolve(__dirname, '新增竞赛成绩.html')
};

const teacherStaticRoot = resolve(__dirname, '../web-teacher');
const adminStaticRoot = resolve(__dirname, '../web-admin');

function legacyStaticPlugin() {
  return {
    name: 'pg-plus-legacy-static',
    configureServer(server) {
      server.middlewares.use('/gsapp/teacher', sirv(teacherStaticRoot, { dev: true }));
      server.middlewares.use('/gsapp/admin', sirv(adminStaticRoot, { dev: true }));
    }
  };
}

export default defineConfig({
  base: '/gsapp/',
  plugins: [vue(), legacyStaticPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [__dirname, teacherStaticRoot, adminStaticRoot]
    }
  },
  build: {
    rollupOptions: {
      input: pages
    }
  }
});
