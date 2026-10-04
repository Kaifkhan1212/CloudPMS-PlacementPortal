import api from './axiosInstance';

export const studentApi = {
  upsertProfile:   (data)    => api.post('/students/profile', data),
  getProfile:      ()        => api.get('/students/profile'),
  uploadResume:    (formData) => api.post('/students/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getEligibleDrives: (params) => api.get('/students/drives', { params }),
  applyToDrive:    (driveId) => api.post(`/students/drives/${driveId}/apply`),
  getMyApplications: ()      => api.get('/students/applications'),
  getMyResumeView:   ()      => api.get('/students/resume-view'),
};
