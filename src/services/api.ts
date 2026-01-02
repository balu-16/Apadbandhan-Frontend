import axios from 'axios';

// Pagination types
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Type definitions
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'user' | 'admin' | 'superadmin' | 'police' | 'hospital';
  profilePhoto?: string;
  hospitalPreference?: 'government' | 'private' | 'both';
  hospitalType?: 'government' | 'private'; // For hospital role users
  accidentAlerts?: boolean;
  smsNotifications?: boolean;
  locationTracking?: boolean;
  bloodGroup?: string;
  address?: string;
  medicalConditions?: string[];
  emergencyContacts?: Array<{
    name: string;
    relation: string;
    phone: string;
  }>;
  onDuty?: boolean; // For police/hospital role users
  specialization?: string; // For hospital role users
}

export interface DeviceData {
  name?: string;
  code?: string;
  type?: string;
  status?: 'online' | 'offline' | 'maintenance';
  emergencyContacts?: Array<{
    name: string;
    relation: string;
    phone: string;
    isActive?: boolean;
  }>;
  insurance?: Record<string, string>;
}

export interface AlertData {
  deviceId: string;
  type: string;
  severity?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

export interface DeviceLocationData {
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
  isSOS?: boolean;
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
  updateProfile: (id: string, data: Partial<UserProfile>) => api.patch(`/users/${id}`, data),
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
  create: (data: DeviceData) => api.post('/devices', data),
  update: (id: string, data: Partial<DeviceData>) => api.patch(`/devices/${id}`, data),
  delete: (id: string) => api.delete(`/devices/${id}`),
  updateLocation: (id: string, data: { latitude: number; longitude: number; address?: string }) =>
    api.patch(`/devices/${id}/location`, data),
  updateStatus: (id: string, status: 'online' | 'offline' | 'maintenance') =>
    api.patch(`/devices/${id}/status/${status}`),
};

// Alerts API
export const alertsAPI = {
  getAll: (params?: { status?: string; limit?: number; skip?: number }) =>
    api.get('/alerts', { params }),
  // Combined alerts and SOS events with optional filter and pagination
  getCombined: (source: 'all' | 'alert' | 'sos' = 'all', params?: PaginationParams) =>
    api.get('/alerts/combined', { params: { source, ...params } }),
  getStats: () => api.get('/alerts/stats'),
  getCombinedStats: () => api.get('/alerts/stats/combined'),
  getByDevice: (deviceId: string) => api.get(`/alerts/device/${deviceId}`),
  getById: (id: string) => api.get(`/alerts/${id}`),
  create: (data: AlertData) => api.post('/alerts', data),
  updateStatus: (id: string, data: { status: string; notes?: string }) =>
    api.patch(`/alerts/${id}/status`, data),
  delete: (id: string, source: 'alert' | 'sos' = 'alert') =>
    api.delete(`/alerts/${id}`, { params: { source } }),
};

// Device Locations API
export const deviceLocationsAPI = {
  // Record a new location from browser (JWT protected)
  create: (data: DeviceLocationData) => api.post('/device-locations/browser', data),

  // Record multiple locations in batch
  createBatch: (locations: DeviceLocationData[]) => api.post('/device-locations/batch', locations),

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

  // Backfill addresses for locations without address data
  backfillAddresses: (deviceId: string, limit?: number) =>
    api.post(`/device-locations/device/${deviceId}/backfill-addresses`, null, { params: { limit } }),
};

// Admin API
export const adminAPI = {
  // User management (Admin/SuperAdmin)
  getAllUsers: (role?: string, params?: PaginationParams) => 
    api.get('/admin/users', { params: { role, ...params } }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  createUser: (data: {
    fullName: string;
    email: string;
    phone: string;
    role?: string;
    bloodGroup?: string;
    address?: string;
    medicalConditions?: string[];
    emergencyContacts?: { name: string; phone: string; relation: string }[];
  }) => api.post('/admin/users', data),
  updateUser: (id: string, data: Partial<UserProfile>) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),

  // Admin management (SuperAdmin only)
  getAllAdmins: (params?: PaginationParams) => 
    api.get('/admin/admins', { params }),
  createAdmin: (data: { fullName: string; email: string; phone: string }) =>
    api.post('/admin/admins', data),
  deleteAdmin: (id: string) => api.delete(`/admin/admins/${id}`),

  // Police user management (SuperAdmin only)
  getAllPoliceUsers: (params?: PaginationParams) => 
    api.get('/admin/police-users', { params }),
  createPoliceUser: (data: {
    fullName: string;
    email: string;
    phone: string;
    stationName?: string;
    badgeNumber?: string;
    jurisdiction?: string;
    address?: string;
  }) => api.post('/admin/police-users', data),
  deletePoliceUser: (id: string) => api.delete(`/admin/police-users/${id}`),
  updatePoliceUser: (id: string, data: {
    fullName?: string;
    email?: string;
    stationName?: string;
    badgeNumber?: string;
    jurisdiction?: string;
    address?: string;
  }) => api.patch(`/admin/police-users/${id}`, data),

  // Hospital user management (SuperAdmin only)
  getAllHospitalUsers: (params?: PaginationParams) => 
    api.get('/admin/hospital-users', { params }),
  createHospitalUser: (data: {
    fullName: string;
    email: string;
    phone: string;
    hospitalPreference?: string;
    specialization?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => api.post('/admin/hospital-users', data),
  deleteHospitalUser: (id: string) => api.delete(`/admin/hospital-users/${id}`),
  updateHospitalUser: (id: string, data: {
    fullName?: string;
    email?: string;
    hospitalPreference?: string;
    specialization?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }) => api.patch(`/admin/hospital-users/${id}`, data),

  // Device management (Admin/SuperAdmin)
  getAllDevices: (userId?: string, params?: PaginationParams) => 
    api.get('/admin/devices', { params: { userId, ...params } }),
  getDeviceById: (id: string) => api.get(`/admin/devices/${id}`),

  // Device generation (Admin/SuperAdmin)
  generateDevices: (count: number) => api.post('/admin/devices/generate', { count }),
  getAllQrCodes: (params?: PaginationParams & { status?: string }) => 
    api.get('/admin/devices/qrcodes', { params }),
  getQrCodesStats: () => api.get('/admin/devices/qrcodes/stats'),

  // Statistics
  getStats: () => api.get('/admin/stats'),

  // Login logs
  getUserLoginLogs: (userId: string, limit?: number) =>
    api.get(`/admin/users/${userId}/login-logs`, { params: { limit } }),
  getAdminLoginLogs: (userId: string, limit?: number) =>
    api.get(`/admin/admins/${userId}/login-logs`, { params: { limit } }),
  getAllUserLoginLogs: (limit?: number) =>
    api.get('/admin/login-logs/users', { params: { limit } }),
  getAllAdminLoginLogs: (limit?: number) =>
    api.get('/admin/login-logs/admins', { params: { limit } }),

  // QR code lookup
  getQrCodeByDeviceCode: (deviceCode: string) => api.get(`/admin/qrcode/${deviceCode}`),
};

// Police API
export const policeAPI = {
  // Update profile (onDuty, etc)
  updateProfile: (data: { isActive?: boolean; onDuty?: boolean; fullName?: string }) =>
    api.patch('/police/profile', data),

  // Get all users (read-only)
  getAllUsers: () => api.get('/police/users'),

  // Get all alerts
  getAllAlerts: () => api.get('/police/alerts'),

  // Get alerts with params
  getAlerts: (params?: { status?: string; limit?: number }) =>
    api.get('/police/alerts', { params }),

  // Get alert details with user info
  getAlertDetails: (alertId: string) => api.get(`/police/alerts/${alertId}`),

  // Update alert status
  updateAlertStatus: (alertId: string, status: string, notes?: string) =>
    api.patch(`/police/alerts/${alertId}`, { status, notes }),

  // Get dashboard stats
  getStats: () => api.get('/police/stats'),

  // Location tracking
  updateLocation: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  }) => api.post('/police/location', data),

  getLocationHistory: () => api.get('/police/location/history'),
  getLastLocation: () => api.get('/police/location/last'),

  uploadProfilePhoto: (file: File) => {
    const formData = new FormData();
    formData.append('photo', file);
    return api.post('/police/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getProfilePhotoUrl: () => `${api.defaults.baseURL}/police/profile-photo`,
};

// Hospital API
export const hospitalAPI = {
  // Update profile (onDuty, etc)
  updateProfile: (data: { isActive?: boolean; onDuty?: boolean; fullName?: string }) =>
    api.patch('/hospital/profile', data),

  // Get all users (read-only)
  getAllUsers: () => api.get('/hospital/users'),

  // Get all alerts
  getAllAlerts: () => api.get('/hospital/alerts'),

  // Get alerts with params
  getAlerts: (params?: { status?: string; limit?: number }) =>
    api.get('/hospital/alerts', { params }),

  // Get alert details with user info
  getAlertDetails: (alertId: string) => api.get(`/hospital/alerts/${alertId}`),

  // Update alert status
  updateAlertStatus: (alertId: string, status: string, notes?: string) =>
    api.patch(`/hospital/alerts/${alertId}`, { status, notes }),

  // Get dashboard stats
  getStats: () => api.get('/hospital/stats'),

  // Location tracking
  updateLocation: (data: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  }) => api.post('/hospital/location', data),

  getLocationHistory: () => api.get('/hospital/location/history'),
  getLastLocation: () => api.get('/hospital/location/last'),
};

// Health API (for monitoring)
export const healthAPI = {
  check: () => api.get('/health'),
  checkMqtt: () => api.get('/health/mqtt'),
  checkDetailed: () => api.get('/health/detailed'),
};

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

  // Upload QR image by ID
  uploadImage: (deviceId: string, file: File) => {
    const formData = new FormData();
    formData.append('deviceId', deviceId);
    formData.append('qrImage', file);
    return api.post('/qrcodes/upload-qr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Upload QR image by device code
  uploadImageByCode: (code: string, file: File) => {
    const formData = new FormData();
    formData.append('qrImage', file);
    return api.post(`/qrcodes/upload-qr/${code}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Partners API
export const partnersAPI = {
  // Public - Submit partner request (no auth required)
  submitRequest: (data: {
    partnerType: 'hospital' | 'police' | 'ranger';
    organizationName: string;
    contactPerson: string;
    email: string;
    phone: string;
    registrationNumber?: string;
    specialization?: string;
    hospitalType?: string;
    jurisdiction?: string;
    coverageArea?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
    additionalInfo?: string;
  }) => api.post('/partners/request', data),

  // Admin - Get all partner requests
  getAll: (status?: string, params?: PaginationParams) => 
    api.get('/partners', { params: { status, ...params } }),

  // Admin - Get partner request stats
  getStats: () => api.get('/partners/stats'),

  // Admin - Get single partner request
  getById: (id: string) => api.get(`/partners/${id}`),

  // Admin - Update partner request status
  update: (id: string, data: { status?: string; reviewNotes?: string }) =>
    api.patch(`/partners/${id}`, data),

  // SuperAdmin - Delete partner request
  delete: (id: string) => api.delete(`/partners/${id}`),
};

// SOS API
export const sosAPI = {
  // Trigger SOS emergency
  trigger: (data: { lat: number; lng: number }) =>
    api.post('/sos/trigger', data),

  // Get SOS results by ID
  getResults: (sosId: string) =>
    api.get(`/sos/results/${sosId}`),

  // Resolve SOS event
  resolve: (sosId: string, notes?: string) =>
    api.post(`/sos/resolve/${sosId}`, { notes }),

  // Get user's SOS history
  getHistory: () =>
    api.get('/sos/history'),

  // Get all active SOS events (admin/responder)
  getActive: () =>
    api.get('/sos/active'),

  // Respond to an SOS event (police/hospital only)
  respond: (sosId: string) =>
    api.post(`/sos/respond/${sosId}`),

  // Get responders info for an SOS event
  getResponders: (sosId: string) =>
    api.get(`/sos/responders/${sosId}`),
};

// On-Duty API (for police/hospital)
export const onDutyAPI = {
  // Update responder location when on duty
  updateLocation: (data: {
    lat: number;
    lng: number;
    accuracy?: number;
    altitude?: number;
    speed?: number;
    heading?: number;
  }) => api.post('/on-duty/location', data),

  // Toggle on-duty status
  toggle: (data: { onDuty: boolean; lat?: number; lng?: number }) =>
    api.post('/on-duty/toggle', data),

  // Get current on-duty status
  getStatus: () =>
    api.get('/on-duty/status'),
};

// System Config API (superadmin only)
export interface SystemConfig {
  id: string;
  configKey: string;
  maxPoliceAlertRecipients: number;
  maxHospitalAlertRecipients: number;
  defaultSearchRadiusMeters: number;
  maxSearchRadiusMeters: number;
  lastUpdatedBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const systemConfigAPI = {
  // Get system configuration
  getConfig: () => api.get<SystemConfig>('/system-config'),

  // Get alert recipient limits
  getAlertLimits: () => api.get<{ maxPolice: number; maxHospital: number }>('/system-config/alert-limits'),

  // Update system configuration (superadmin only)
  updateConfig: (data: {
    maxPoliceAlertRecipients?: number;
    maxHospitalAlertRecipients?: number;
    defaultSearchRadiusMeters?: number;
    maxSearchRadiusMeters?: number;
  }) => api.patch<SystemConfig>('/system-config', data),
};

export default api;
