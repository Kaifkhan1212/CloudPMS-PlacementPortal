import api from './axiosInstance';

export const placementApi = {
  createDrive:           (data)            => api.post('/placement/drives', data),
  getMyDrives:           ()               => api.get('/placement/drives'),
  updateDrive:           (id, data)       => api.put(`/placement/drives/${id}`, data),
  closeDrive:            (id)             => api.patch(`/placement/drives/${id}/close`),
  getDriveApplicants:    (id, params)     => api.get(`/placement/drives/${id}/applicants`, { params }),
  updateAppStatus:       (appId, data)    => api.patch(`/placement/applications/${appId}/status`, data),
};
