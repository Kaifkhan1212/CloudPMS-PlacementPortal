import api from './axiosInstance';

export const authApi = {
  register:    (data)  => api.post('/auth/register', data),
  login:       (data)  => api.post('/auth/login', data),
  googleLogin: (data)  => api.post('/auth/google', data),
  logout:      ()      => api.post('/auth/logout'),
  refresh:     ()      => api.post('/auth/refresh'),
  getMe:       ()      => api.get('/auth/me'),
};
