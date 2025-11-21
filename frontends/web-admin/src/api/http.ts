import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE || '/gsapp/api/v1';

export const httpClient = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json'
  }
});


// 请求拦截器，添加JWT token
httpClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器，处理认证错误
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理401错误，清除token并重定向到登录页
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
    }
    return Promise.reject(error);
  }
);

export default httpClient;
