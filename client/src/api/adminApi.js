import api from './axiosInstance';

export const adminApi = {
  getDashboard:     ()             => api.get('/admin/dashboard'),
  getUsers:         (params)       => api.get('/admin/users', { params }),
  toggleUser:       (id)           => api.patch(`/admin/users/${id}/toggle`),
  getDriveReport:   ()             => api.get('/admin/reports/drives'),
};
