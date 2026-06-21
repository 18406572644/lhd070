import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cybercraft_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('cybercraft_token')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    } else if (!error.config?.silent) {
      const message = error.response?.data?.error || error.message || '请求失败'
      ElMessage.error(message)
    }
    return Promise.reject(error)
  },
)

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

export function get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  return api
    .get<ApiResponse<T>>(url, { params })
    .then((res) => {
      if (res.data.success) {
        return res.data.data
      }
      return Promise.reject(new Error(res.data.error || '请求失败'))
    })
}

export function post<T>(url: string, data?: unknown): Promise<T> {
  return api
    .post<ApiResponse<T>>(url, data)
    .then((res) => {
      if (res.data.success) {
        return res.data.data
      }
      return Promise.reject(new Error(res.data.error || '请求失败'))
    })
}

export function put<T>(url: string, data?: unknown): Promise<T> {
  return api
    .put<ApiResponse<T>>(url, data)
    .then((res) => {
      if (res.data.success) {
        return res.data.data
      }
      return Promise.reject(new Error(res.data.error || '请求失败'))
    })
}

export function del<T>(url: string): Promise<T> {
  return api
    .delete<ApiResponse<T>>(url)
    .then((res) => {
      if (res.data.success) {
        return res.data.data
      }
      return Promise.reject(new Error(res.data.error || '请求失败'))
    })
}

export default api
