import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'https://apadbandhav-backend.vercel.app/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  sendOtp: (phone: string) => api.post('/auth/send-otp', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/verify-otp', { phone, otp }),
  signup: (data: { phone: string; otp: string; fullName: string; email: string }) =>
    api.post('/auth/signup', data),
  getProfile: () => api.get('/auth/me'),
};

// Users API
export const usersAPI = {
  getProfile: (id: string) => api.get(`/users/${id}`),
  updateProfile: (id: string, data: any) => api.patch(`/users/${id}`, data),
  deleteAccount: (id: string) => api.delete(`/users/${id}`),
  uploadProfilePhoto: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post(`/users/${id}/profile-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getProfilePhotoUrl: (id: string) => `${api.defaults.baseURL}/users/${id}/profile-photo`,
};

// Devices API
export const devicesAPI = {
  getAll: () => api.get('/devices'),
  getOne: (id: string) => api.get(`/devices/${id}`),
  create: (data: any) => api.post('/devices', data),
  update: (id: string, data: any) => api.patch(`/devices/${id}`, data),
  delete: (id: string) => api.delete(`/devices/${id}`),
  updateLocation: (id: string, data: { latitude: number; longitude: number; address?: string }) =>
    api.patch(`/devices/${id}/location`, data),
};

// Alerts API
export const alertsAPI = {
  getAll: () => api.get('/alerts'),
  getStats: () => api.get('/alerts/stats'),
  getByDevice: (deviceId: string) => api.get(`/alerts/device/${deviceId}`),
  create: (data: any) => api.post('/alerts', data),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch(`/alerts/${id}/status`, data),
};

// Device Locations API
export const deviceLocationsAPI = {
  // Record a new location
  create: (data: {
    deviceId: string;
    latitude: number;
    longitude: number;
    altitude?: number;
    speed?: number;
    heading?: number;
    accuracy?: number;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    source?: string;
  }) => api.post('/device-locations', data),
  
  // Record multiple locations in batch
  createBatch: (locations: any[]) => api.post('/device-locations/batch', locations),
  
  // Get all locations for a device
  getByDevice: (deviceId: string, params?: {
    startDate?: string;
    endDate?: string;
    limit?: number;
    skip?: number;
  }) => api.get(`/device-locations/device/${deviceId}`, { params }),
  
  // Get the latest location for a device
  getLatest: (deviceId: string) => api.get(`/device-locations/device/${deviceId}/latest`),
  
  // Get location statistics for a device
  getStats: (deviceId: string) => api.get(`/device-locations/device/${deviceId}/stats`),
  
  // Get a specific location by ID
  getById: (id: string) => api.get(`/device-locations/${id}`),
  
  // Delete all locations for a device
  deleteByDevice: (deviceId: string) => api.delete(`/device-locations/device/${deviceId}`),
};

// Admin API
export const adminAPI = {
  // User management (Admin/SuperAdmin)
  getAllUsers: (role?: string) => api.get('/admin/users', { params: { role } }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  createUser: (data: { fullName: string; email: string; phone: string; role?: string }) =>
    api.post('/admin/users', data),
  updateUser: (id: string, data: any) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Admin management (SuperAdmin only)
  getAllAdmins: () => api.get('/admin/admins'),
  createAdmin: (data: { fullName: string; email: string; phone: string }) =>
    api.post('/admin/admins', data),
  deleteAdmin: (id: string) => api.delete(`/admin/admins/${id}`),

  // Device management (Admin/SuperAdmin)
  getAllDevices: (userId?: string) => api.get('/admin/devices', { params: { userId } }),
  getDeviceById: (id: string) => api.get(`/admin/devices/${id}`),

  // Device generation (Admin/SuperAdmin)
  generateDevices: (count: number) => api.post('/admin/devices/generate', { count }),
  getAllQrCodes: () => api.get('/admin/devices/qrcodes'),
  getQrCodesStats: () => api.get('/admin/devices/qrcodes/stats'),

  // Statistics
  getStats: () => api.get('/admin/stats'),
};

// QR Codes API
export const qrCodesAPI = {
  // Get all QR codes
  getAll: () => api.get('/qrcodes'),
  
  // Get available QR codes
  getAvailable: () => api.get('/qrcodes/available'),
  
  // Get QR code statistics
  getStats: () => api.get('/qrcodes/stats'),
  
  // Validate a device code (public - no auth required)
  validateCode: (code: string) => api.get(`/qrcodes/validate/${code}`),
  
  // Get QR code details by ID
  getById: (id: string) => api.get(`/qrcodes/${id}`),
  
  // Get QR code image URL by device code
  getImageUrl: (code: string) => `${API_BASE_URL}/qrcodes/image/${code}`,
  
  // Get QR code image URL by ID
  getImageUrlById: (id: string) => `${API_BASE_URL}/qrcodes/${id}/qr`,
  
  // Create a new QR code
  create: (data: { deviceCode: string; deviceName?: string }) => 
    api.post('/qrcodes/create', data),
  
  // Generate random QR codes
  generateRandom: (count: number = 10) => 
    api.post('/qrcodes/generate', { count }),
  
  // Assign QR code to user
  assign: (deviceCode: string, userId: string) => 
    api.post('/qrcodes/assign', { deviceCode, userId }),
  
  // Unassign QR code
  unassign: (code: string) => api.post(`/qrcodes/unassign/${code}`),
  
  // Delete QR code
  delete: (id: string) => api.delete(`/qrcodes/${id}`),
  
  // Upload QR image
  uploadImage: (deviceId: string, file: File) => {
    const formData = new FormData();
    formData.append('deviceId', deviceId);
    formData.append('qrImage', file);
    return api.post('/qrcodes/upload-qr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default api;
