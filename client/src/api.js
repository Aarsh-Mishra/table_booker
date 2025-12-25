import axios from 'axios';

const apiTv = axios.create({
  baseURL: 'http://localhost:5000/api',
});

export default apiTv;