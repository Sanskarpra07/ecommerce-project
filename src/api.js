import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost/ecommerce-project/backend/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
