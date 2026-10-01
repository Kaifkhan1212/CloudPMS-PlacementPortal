import api from './axiosInstance';

export const emailApi = {
  sendEmail: (data) => api.post('/placement-cell/emails/send', data),
  getEmailLogs: (params) => api.get('/placement-cell/emails', { params }),
  getEmailLogDetails: (id) => api.get(`/placement-cell/emails/${id}`),
};
