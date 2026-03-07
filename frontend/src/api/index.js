import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

let _getToken = null;

export function setGetToken(fn) {
  _getToken = fn;
}

api.interceptors.request.use(async (config) => {
  if (_getToken) {
    try {
      const token = await _getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      /* no token */
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message || err.message || 'Something went wrong';
    const status = err.response?.status;
    const enrichedError = new Error(message);
    enrichedError.status = status;
    enrichedError.originalError = err;
    return Promise.reject(enrichedError);
  }
);

// ── Course (public) ──────────────────────────
export const fetchCourses = (params) => api.get('/course/all', { params });
export const fetchCourseById = (id) => api.get(`/course/${id}`);

// ── User ─────────────────────────────────────
export const syncUser = (clerkUser) =>
  api.post('/user/sync', { clerkUser });
export const fetchUserData = () => api.get('/user/data');
export const fetchEnrolledCourses = () => api.get('/user/enrolled-courses');
export const fetchEnrolledCourseContent = (courseId) =>
  api.get(`/user/enrolled-courses/${courseId}/content`);
export const purchaseCourse = (courseId) =>
  api.post('/user/purchase', { courseId });
export const updateCourseProgress = (courseId, lectureId) =>
  api.post('/user/update-course-progress', { courseId, lectureId });
export const fetchCourseProgress = (courseId) =>
  api.get(`/user/course-progress/${courseId}`);
export const submitRating = (courseId, rating) =>
  api.put('/user/ratings', { courseId, rating });

// ── Educator ─────────────────────────────────
export const addCourse = (formData) =>
  api.post('/educator/add-course', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const updateCourse = (courseId, formData) =>
  api.put(`/educator/courses/${courseId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const deleteCourse = (courseId) =>
  api.delete(`/educator/courses/${courseId}`);
export const togglePublish = (courseId, isPublished) =>
  api.patch(`/educator/courses/${courseId}/publish`, { isPublished });
export const fetchEducatorCourses = (params) =>
  api.get('/educator/courses', { params });
export const fetchEducatorDashboard = () => api.get('/educator/dashboard');
export const fetchEducatorStudents = (params) =>
  api.get('/educator/enrolled-students', { params });
export const fetchEducatorCourse = (courseId) =>
  api.get(`/educator/courses/${courseId}`);

// ── Admin ────────────────────────────────────
export const fetchAdminDashboard = () => api.get('/admin/dashboard');
export const fetchAdminUsers = (params) =>
  api.get('/admin/users', { params });
export const updateUserRole = (userId, role) =>
  api.put(`/admin/users/${userId}/role`, { role });
export const deleteUser = (userId) => api.delete(`/admin/users/${userId}`);

export default api;