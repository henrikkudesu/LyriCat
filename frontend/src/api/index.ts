import axios from 'axios';

const api = axios.create({
  baseURL: 'https://lyrycatapi.vercel.app',
});

export default api;
