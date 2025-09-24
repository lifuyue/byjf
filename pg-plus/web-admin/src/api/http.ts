import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE || '/gsapp/api/v1';

export const httpClient = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json'
  }
});

// TODO: Attach admin credentials once RBAC is defined.

export default httpClient;
